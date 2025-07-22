import { useState, useEffect, useRef } from 'react';
import './SearchBar.css';

// Hook to get current window width
const useWindowWidth = () => {
  const [width, setWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return width;
};

export default function SearchBar({ onSearch, searchQuery = '', onQueryChange, className = '' }) {
  const [query, setQuery] = useState(searchQuery);
  const inputRef = useRef(null);
  const windowWidth = useWindowWidth();

  // Decide placeholder based on screen width
  const placeholderText = windowWidth < 640 ? 'Search...' : 'Search Anything...';

  // Sync internal query with external searchQuery prop
  useEffect(() => {
    setQuery(searchQuery);
  }, [searchQuery]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query);
    }
  };

  const handleQueryChange = (newQuery) => {
    setQuery(newQuery);
    if (onQueryChange) {
      onQueryChange(newQuery);
    }
  };

  const handleKeyDown = (e) => {
    // Prevent the event from bubbling up to parent elements
    e.stopPropagation();
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
            onKeyDown={handleKeyDown} // 💡 stop propagation here
            placeholder={placeholderText}
            className="search-input"
          />
        </div>
        <button type="submit" className="search-button" aria-label="Search">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="search-icon"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
      </form>
    </div>
  );
}
