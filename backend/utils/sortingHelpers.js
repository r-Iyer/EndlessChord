const { CONFIDENCE_THRESHOLD, FIELD_WEIGHTS } = require('../config/constants');

/**
* Calculate confidence score for a song based on search query
* @param {Object} song - The song object
* @param {string} searchQuery - The search query
* @param {Array} searchTerms - Array of individual search terms
* @returns {number} Confidence score between 0 and 1
*/
const calculateConfidenceScore = (song, searchQuery, searchTerms) => {
    let totalScore = 0;
    let maxPossibleScore = 0;
    
    // Normalize search query and terms
    const normalizedQuery = searchQuery.toLowerCase().trim();
    const normalizedTerms = searchTerms.map(term => term.toLowerCase().trim());
    
    // Helper function to normalize text for comparison
    const normalizeText = (text) => {
        if (Array.isArray(text)) {
            return text.map(normalizeText).join(' ');
        }
        if (!text) return '';
        
        return text.toLowerCase()
            .replace(/[^\w\s]/g, ' ') // Replace special chars with spaces
            .replace(/\s+/g, ' ')     // Normalize whitespace
            .trim();
    };
    
    // Enhanced field scoring with proper exact match prioritization
    const getFieldScore = (fieldValue, fieldWeight, fieldName) => {
        if (!fieldValue) return 0;
        
        const normalizedField = normalizeText(fieldValue);
        if (!normalizedField) return 0;
        
        let fieldScore = 0;
        let matchType = 'none';
        
        // 1. EXACT FULL QUERY MATCH (highest priority)
        if (normalizedField === normalizedQuery || normalizedField.includes(normalizedQuery)) {
            const isExactMatch = normalizedField === normalizedQuery;
            fieldScore = fieldWeight * (isExactMatch ? 1.0 : 0.95);
            matchType = 'exact_query';
            return { score: fieldScore, type: matchType, exactTerms: normalizedTerms.length };
        }
        
        // 2. EXACT TERM MATCHES (prioritized over partial matches)
        const exactMatches = [];
        const partialMatches = [];
        const fieldWords = normalizedField.split(' ');
        
        normalizedTerms.forEach(term => {
            // Check for exact word boundary matches first
            const exactWordMatch = fieldWords.some(word => word === term);
            const exactInclusion = normalizedField.includes(term);
            
            if (exactWordMatch) {
                exactMatches.push(term);
            } else if (exactInclusion) {
                exactMatches.push(term);
            } else {
                // Check for partial matches only if no exact match
                const hasPartialMatch = fieldWords.some(word => 
                    (word.includes(term) && word !== term) || 
                    (term.includes(word) && term !== word)
                );
                if (hasPartialMatch) {
                    partialMatches.push(term);
                }
            }
        });
        
        // Calculate score based on exact matches first
        if (exactMatches.length > 0) {
            const exactRatio = exactMatches.length / normalizedTerms.length;
            fieldScore = fieldWeight * exactRatio;
            matchType = 'exact_terms';
            
            // Bonus for multiple exact matches
            if (exactMatches.length > 1) {
                const consecutiveBonus = checkConsecutiveTerms(normalizedField, exactMatches);
                fieldScore += fieldWeight * consecutiveBonus * 0.3;
            }
            
            // Additional bonus for complete exact match of all terms
            if (exactMatches.length === normalizedTerms.length) {
                fieldScore *= 1.2; // 20% bonus for matching all terms exactly
            }
            
            return { 
                score: Math.min(fieldScore, fieldWeight * 1.2), 
                type: matchType, 
                exactTerms: exactMatches.length 
            };
        }
        
        // 3. PARTIAL MATCHES (much lower score)
        if (partialMatches.length > 0) {
            const partialRatio = partialMatches.length / normalizedTerms.length;
            fieldScore = fieldWeight * partialRatio * 0.2; // Significantly reduced weight
            matchType = 'partial';
            
            return { 
                score: Math.min(fieldScore, fieldWeight * 0.3), 
                type: matchType, 
                exactTerms: 0 
            };
        }
        
        return { score: 0, type: 'none', exactTerms: 0 };
    };
    
    // Helper function to check for consecutive term matches
    const checkConsecutiveTerms = (text, matchedTerms) => {
        const words = text.split(' ');
        let maxConsecutive = 0;
        
        for (let i = 0; i < words.length - matchedTerms.length + 1; i++) {
            const slice = words.slice(i, i + matchedTerms.length).join(' ');
            const consecutiveCount = matchedTerms.filter(term => slice.includes(term)).length;
            maxConsecutive = Math.max(maxConsecutive, consecutiveCount);
        }
        
        return maxConsecutive / matchedTerms.length;
    };
    
    // Calculate scores for each field with enhanced matching
    let fieldsProcessed = 0;
    let hasExactMatch = false;
    let totalExactTerms = 0;
    const fieldResults = [];
    
    Object.entries(FIELD_WEIGHTS).forEach(([field, weight]) => {
        const fieldValue = song._doc ? song._doc[field] : song[field];
        if (fieldValue) {
            const result = getFieldScore(fieldValue, weight, field);
            fieldResults.push({ field, ...result });
            
            totalScore += result.score;
            maxPossibleScore += weight;
            fieldsProcessed++;
            
            if (result.type === 'exact_query' || result.type === 'exact_terms') {
                hasExactMatch = true;
                totalExactTerms += result.exactTerms;
            }
        }
    });
    
    // If no fields were processed, return 0
    if (fieldsProcessed === 0) return 0;
    
    // Calculate base confidence score
    let confidenceScore = maxPossibleScore > 0 ? totalScore / maxPossibleScore : 0;
    
    // Apply bonuses for high-quality matches
    if (hasExactMatch) {
        // Bonus for having exact matches
        const exactMatchBonus = Math.min(totalExactTerms / normalizedTerms.length * 0.1, 0.1);
        confidenceScore += exactMatchBonus;
        
        // Additional bonus if exact matches are in high-priority fields (like artist, title)
        const highPriorityExactMatch = fieldResults.some(r => 
            (r.field === 'artist' || r.field === 'title') && 
            (r.type === 'exact_query' || r.type === 'exact_terms')
        );
        
        if (highPriorityExactMatch) {
            confidenceScore += 0.05; // 5% bonus for exact match in important fields
        }
    }
    
    // Penalty for songs that only have partial matches across multiple fields
    const onlyPartialMatches = fieldResults.every(r => r.type === 'partial' || r.type === 'none');
    const multiplePartialFields = fieldResults.filter(r => r.type === 'partial').length > 1;
    
    if (onlyPartialMatches && multiplePartialFields) {
        confidenceScore *= 0.7; // 30% penalty for scattered partial matches
    }
    
    return Math.min(Math.max(confidenceScore, 0), 1);
};

/**
* Enhanced sort function with confidence scoring
* @param {Array} songs - Array of song objects
* @param {string} searchQuery - The original search query
* @returns {Array} Sorted and filtered songs with confidence scores
*/
const sortByRelevance = (songs, searchQuery) => {
    if (!songs || songs.length === 0) return [];
    
    // Parse search terms more intelligently
    const searchTerms = searchQuery
        .split(/\s+/)
        .filter(term => term.length > 1) // Filter out very short terms
        .map(term => term.trim());
    
    if (searchTerms.length === 0) return songs;
    
    // Calculate confidence scores for all songs
    const songsWithConfidence = songs.map(song => {
        const confidence = calculateConfidenceScore(song, searchQuery, searchTerms);
        return {
            ...(song.toObject ? song.toObject() : song),
            confidenceScore: confidence
        };
    });
    
    // Filter songs based on confidence threshold
    const filteredSongs = songsWithConfidence.filter(song => 
        song.confidenceScore >= CONFIDENCE_THRESHOLD
    );
    
    // Enhanced sorting logic
    const sortedSongs = filteredSongs.sort((a, b) => {
        // Primary sort: confidence score (higher is better)
        const confidenceDiff = b.confidenceScore - a.confidenceScore;
        
        // If confidence scores are very close (within 0.05), consider other factors
        if (Math.abs(confidenceDiff) < 0.05) {
            // Secondary sort: prefer songs with higher exact match confidence
            // This ensures "Arijit Singh" exact match beats scattered "Singh" matches
            const aHasHighConfidence = a.confidenceScore > 0.7;
            const bHasHighConfidence = b.confidenceScore > 0.7;
            
            if (aHasHighConfidence && !bHasHighConfidence) return -1;
            if (!aHasHighConfidence && bHasHighConfidence) return 1;
            
            // Tertiary sort: play count (lower is better for discovery)
            return (a.playCount || 0) - (b.playCount || 0);
        }
        
        return confidenceDiff;
    });
    
    return sortedSongs;
};

/**
* Helper function to get enhanced statistics about the filtering process
* @param {Array} originalSongs - Original song array
* @param {Array} filteredSongs - Filtered song array
* @param {string} searchQuery - Search query
* @returns {Object} Statistics object
*/
const getSortingStats = (originalSongs, filteredSongs, searchQuery) => {
    const stats = {
        originalCount: originalSongs.length,
        filteredCount: filteredSongs.length,
        averageConfidence: 0,
        highConfidenceCount: 0,    // > 0.7
        mediumConfidenceCount: 0,  // 0.4 - 0.7
        lowConfidenceCount: 0,     // 0.3 - 0.4
        exactMatchCount: 0,        // Songs with very high confidence (> 0.8)
        partialMatchCount: 0,      // Songs with only partial matches
        searchQuery
    };
    
    if (filteredSongs.length > 0) {
        stats.averageConfidence = filteredSongs.reduce((sum, song) => 
            sum + (song.confidenceScore || 0), 0) / filteredSongs.length;
        
        stats.highConfidenceCount = filteredSongs.filter(s => s.confidenceScore > 0.7).length;
        stats.mediumConfidenceCount = filteredSongs.filter(s => 
            s.confidenceScore >= 0.4 && s.confidenceScore <= 0.7).length;
        stats.lowConfidenceCount = filteredSongs.filter(s => 
            s.confidenceScore >= 0.3 && s.confidenceScore < 0.4).length;
        stats.exactMatchCount = filteredSongs.filter(s => s.confidenceScore > 0.8).length;
        stats.partialMatchCount = filteredSongs.filter(s => 
            s.confidenceScore < 0.4).length;
    }
    
    return stats;
};

module.exports = {
    sortByRelevance,
    calculateConfidenceScore,
    getSortingStats,
    CONFIDENCE_THRESHOLD,
    FIELD_WEIGHTS
};