// Configuration constants
const CONFIDENCE_THRESHOLD = 0.1; // Minimum confidence score to include a song
const FIELD_WEIGHTS = {
  title: 1.0,
  artist: 1.0,
  composer: 1.0,
  album: 1.0,
  genre: 1.0,
  language: 1.0,
  description: 1.0,
  tags: 1.0
};

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
    if (!text) return '';
    return text.toLowerCase()
      .replace(/[^\w\s]/g, ' ') // Replace special chars with spaces
      .replace(/\s+/g, ' ')     // Normalize whitespace
      .trim();
  };
  
  // Helper function to calculate term matches in a field
  const getFieldScore = (fieldValue, fieldWeight) => {
    if (!fieldValue) return 0;
    
    const normalizedField = normalizeText(fieldValue);
    if (!normalizedField) return 0;
    
    let fieldScore = 0;
    
    // Exact phrase match (highest score)
    if (normalizedField.includes(normalizedQuery)) {
      fieldScore = fieldWeight * 1.0;
      return fieldScore; // Return immediately for exact match
    }
    
    // Individual term matches
    const matchedTerms = normalizedTerms.filter(term => 
      normalizedField.includes(term)
    );
    
    if (matchedTerms.length > 0) {
      // Score based on percentage of terms matched
      const termMatchRatio = matchedTerms.length / normalizedTerms.length;
      fieldScore = fieldWeight * termMatchRatio;
      
      // Bonus for consecutive term matches
      if (matchedTerms.length > 1) {
        const consecutiveBonus = checkConsecutiveTerms(normalizedField, matchedTerms);
        fieldScore += fieldWeight * consecutiveBonus * 0.2;
      }
      
      return Math.min(fieldScore, fieldWeight);
    }
    
    // Partial word matches (fuzzy matching)
    const partialMatches = normalizedTerms.filter(term => {
      return normalizedField.split(' ').some(word => 
        word.includes(term) || term.includes(word)
      );
    });
    
    if (partialMatches.length > 0) {
      const partialRatio = partialMatches.length / normalizedTerms.length;
      fieldScore = fieldWeight * partialRatio * 0.3;
    }
    
    return Math.min(fieldScore, fieldWeight);
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
  
  // Calculate scores for each field that exists
  let fieldsProcessed = 0;
  Object.entries(FIELD_WEIGHTS).forEach(([field, weight]) => {
    // Handle both plain objects and Mongoose documents
    const fieldValue = song._doc ? song._doc[field] : song[field];
    if (fieldValue) { // Only process fields that exist and have values
      const fieldScore = getFieldScore(fieldValue, weight);
      totalScore += fieldScore;
      maxPossibleScore += weight;
      fieldsProcessed++;
    }
  });
  
  // If no fields were processed, return 0
  if (fieldsProcessed === 0) return 0;
  

  
  // Calculate final confidence score
  const confidenceScore = maxPossibleScore > 0 ? totalScore / maxPossibleScore : 0;
  return Math.min(Math.max(confidenceScore, 0), 1); // Ensure between 0 and 1
};

/**
 * Enhanced sort function with confidence scoring
 * @param {Array} songs - Array of song objects
 * @param {string} searchQuery - The original search query
 * @returns {Array} Sorted and filtered songs with confidence scores
 */
const sortByRelevance = (songs, searchQuery) => {
  if (!songs || songs.length === 0) return [];
  
  // Parse search terms
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
  
  // Sort by confidence score (descending) and then by play count (ascending for less played songs)
  const sortedSongs = filteredSongs.sort((a, b) => {
    // Primary sort: confidence score (higher is better)
    if (a.confidenceScore !== b.confidenceScore) {
      return b.confidenceScore - a.confidenceScore;
    }
    
    // Secondary sort: play count (lower is better for discovery)
    return (a.playCount || 0) - (b.playCount || 0);
  });
  
  return sortedSongs;
};

/**
 * Helper function to get statistics about the filtering process
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
    highConfidenceCount: 0, // > 0.7
    mediumConfidenceCount: 0, // 0.4 - 0.7
    lowConfidenceCount: 0, // 0.3 - 0.4
    searchQuery
  };
  
  if (filteredSongs.length > 0) {
    stats.averageConfidence = filteredSongs.reduce((sum, song) => 
      sum + (song.confidenceScore || 0), 0) / filteredSongs.length;
    
    stats.highConfidenceCount = filteredSongs.filter(s => s.confidenceScore > 0.7).length;
    stats.mediumConfidenceCount = filteredSongs.filter(s => s.confidenceScore >= 0.4 && s.confidenceScore <= 0.7).length;
    stats.lowConfidenceCount = filteredSongs.filter(s => s.confidenceScore >= 0.3 && s.confidenceScore < 0.4).length;
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