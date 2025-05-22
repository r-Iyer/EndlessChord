import { useState, useEffect, useRef, useCallback } from 'react';
import './SearchBar.css';

export default function SearchBar({ onSearch, searchQuery = '', onQueryChange, className = '' }) {
  const [query, setQuery] = useState(searchQuery);
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);
  const skipNextFetch = useRef(false);
  
  // Sync internal query with external searchQuery prop
  useEffect(() => {
    setQuery(searchQuery);
  }, [searchQuery]);
  
  // Handle clicks outside the suggestions dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target) &&
        !inputRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  const generateMusicSuggestions = useCallback((query) => {
    // Generate music-specific suggestions based on query patterns
    const suggestions = [];
    
    // Check if query looks like an artist name (two words with capitals)
    if (/^[A-Z][a-z]+ [A-Z][a-z]+$/.test(query)) {
      suggestions.push(
        `${query} songs`,
        `${query} albums`,
        `${query} latest`,
        `${query} greatest hits`,
        `${query} live`,
        `${query} acoustic`
      );
    }
    // Check if query contains music-related keywords
    else if (query.includes('song') || query.includes('music') || query.includes('album')) {
      suggestions.push(
        `${query}`,
        `${query} lyrics`,
        `${query} remix`,
        `${query} cover`,
        `${query} instrumental`,
        `${query} karaoke`
      );
    }
    // Check for genre-related queries
    else if (['rock', 'pop', 'jazz', 'hip hop', 'rap', 'country', 'blues', 'classical', 'electronic', 'reggae'].some(genre => query.toLowerCase().includes(genre))) {
      suggestions.push(
        `${query} songs`,
        `${query} playlist`,
        `${query} best`,
        `${query} 2024`,
        `${query} hits`,
        `${query} artists`
      );
    }
    // General music suggestions
    else {
      suggestions.push(
        `${query} song`,
        `${query} music`,
        `${query} lyrics`,
        `${query} official video`,
        `${query} live performance`,
        `${query} acoustic version`
      );
    }
    
    return suggestions.slice(0, 6);
  }, []);

  const fetchSuggestions = useCallback(async (searchQuery) => {
    setIsLoading(true);
    try {
      // For now, just use music-specific suggestions since CORS blocks Google API
      // You can implement Chrome suggestions later through your backend
      const musicSuggestions = generateMusicSuggestions(searchQuery);
      
      setSuggestions(musicSuggestions);
      setShowSuggestions(true);
      
    } catch (error) {
      console.error('Error generating suggestions:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, [generateMusicSuggestions]);

  // Debounce function for search suggestions
  useEffect(() => {
    const handler = setTimeout(() => {
      // Skip fetching if we just clicked a suggestion
      if (skipNextFetch.current) {
        skipNextFetch.current = false;
        return;
      }
      
      if (query.length >= 2) {
        fetchSuggestions(query);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);
    
    return () => {
      clearTimeout(handler);
    };
  }, [query, fetchSuggestions]);
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query);
      setShowSuggestions(false);
      setSuggestions([]); // Clear suggestions after search
    }
  };
  
  const handleSuggestionClick = (suggestion) => {
    skipNextFetch.current = true; // Skip the next fetch triggered by query change
    setQuery(suggestion);
    onSearch(suggestion);
    setShowSuggestions(false);
    setSuggestions([]); // Clear suggestions immediately
  };

  const handleQueryChange = (newQuery) => {
    setQuery(newQuery);
    if (onQueryChange) {
      onQueryChange(newQuery);
    }
  };
  
  return (
    <div className={`search-container ${className}`}>
      <form onSubmit={handleSubmit} className="search-form">
        <div className="search-input-container">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            onFocus={() => query.length >= 2 && suggestions.length > 0 && setShowSuggestions(true)}
            placeholder="Search Anything..."
            className="search-input"
          />
          {isLoading && (
            <div className="loading-spinner">
              <div className="spinner"></div>
            </div>
          )}
        </div>
        <button type="submit" className="search-button">
          <svg xmlns="http://www.w3.org/2000/svg" className="search-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
      </form>
      
      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div ref={suggestionsRef} className="suggestions-dropdown">
          <ul className="suggestions-list">
            {suggestions.map((suggestion, index) => (
              <li 
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="suggestion-item"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="suggestion-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {suggestion}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}