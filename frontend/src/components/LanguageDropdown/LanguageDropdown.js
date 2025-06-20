import React, { useState, useRef, useEffect } from 'react';
import './LanguageDropdown.css';

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

const LanguageDropdown = ({ 
  languages, 
  selectedValue, 
  onSelect,
  placeholder = "All Languages"
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const windowWidth = useWindowWidth();
  
  // Determine placeholder based on screen size
  const displayPlaceholder = windowWidth < 640 ? "All" : placeholder;
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  
  const handleSelect = (value) => {
    onSelect(value);
    setIsOpen(false);
  };
  
  const selectedLabel = selectedValue 
    ? languages.find(l => l.value === selectedValue)?.label 
    : displayPlaceholder;

  return (
    <div className="language-dropdown" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="dropdown-trigger"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="dropdown-label">{selectedLabel}</span>
        <svg 
          className={`dropdown-chevron ${isOpen ? 'open' : ''}`} 
          viewBox="0 0 24 24" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      
      {isOpen && (
        <div className="dropdown-content" role="listbox">
          <button
            onClick={() => handleSelect('')}
            className={`dropdown-item ${selectedValue === '' ? 'selected' : ''}`}
            role="option"
            aria-selected={selectedValue === ''}
          >
            <span className="item-label">{displayPlaceholder}</span>
            {selectedValue === '' && <CheckIcon />}
          </button>
          
          {languages.map(({value, label}) => (
            <button
              key={value}
              onClick={() => handleSelect(value)}
              className={`dropdown-item ${selectedValue === value ? 'selected' : ''}`}
              role="option"
              aria-selected={selectedValue === value}
            >
              <span className="item-label">{label}</span>
              {selectedValue === value && <CheckIcon />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Check icon component for selected items
const CheckIcon = () => (
  <svg className="check-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default LanguageDropdown;
