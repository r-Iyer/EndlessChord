import { useState, useRef, useEffect } from 'react';
import './LanguageDropdown.css';

/**
 * Hook to get current window width
 */
const useWindowWidth = () => {
  const [width, setWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return width;
};

/**
 * Hook to maintain refs for each item in dropdown
 */
const useItemRefs = (length) => {
  const refs = useRef([]);
  useEffect(() => {
    refs.current = refs.current.slice(0, length);
  }, [length]);
  return refs;
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
  const firstItemRef = useRef(null); // 🔹 Ref for first dropdown item

  const itemCount = languages.length + 1; // +1 for "All Languages"
  const itemRefs = useItemRefs(itemCount); // 🔹 Store all refs (All + language options)

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

  // Auto focus first item on open (for TV navigation)
  useEffect(() => {
    if (isOpen && itemRefs.current[0]) {
      requestAnimationFrame(() => {
        itemRefs.current[0].focus(); // 🔹 Focus the first item ("All Languages")
      });
    }
  }, [isOpen]);

  // 🔹 Handles ArrowUp, ArrowDown, Escape key inside dropdown
  const handleKeyDown = (e, index) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = (index + 1) % itemCount; // Wrap to top
      itemRefs.current[next]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prev = (index - 1 + itemCount) % itemCount; // Wrap to bottom
      itemRefs.current[prev]?.focus();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    }
  };

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
        tabIndex={0} // Enable focus
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen(prev => !prev);
          }
        }}
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
          <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {isOpen && (
        <div className="dropdown-content" role="listbox">
          {/* 🔹 First item: 'All Languages' */}
          <button
            tabIndex={0} // 🔹 Enable focus
            ref={el => itemRefs.current[0] = el} // 🔹 Store ref
            onClick={() => handleSelect('')}
            onKeyDown={(e) => handleKeyDown(e, 0)} // 🔹 Navigate with arrow keys
            className={`dropdown-item ${selectedValue === '' ? 'selected' : ''}`}
            role="option"
            aria-selected={selectedValue === ''}
          >
            <span className="item-label">{displayPlaceholder}</span>
            {selectedValue === '' && <CheckIcon />}
          </button>

          {/* 🔹 Language items */}
          {languages.map(({ value, label }, index) => (
            <button
              key={value}
              tabIndex={0}
              ref={el => itemRefs.current[index + 1] = el} // 🔹 Store each item ref
              onClick={() => handleSelect(value)}
              onKeyDown={(e) => handleKeyDown(e, index + 1)} // 🔹 Navigate with arrow keys
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

// 🔹 Check icon component for selected items
const CheckIcon = () => (
  <svg className="check-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default LanguageDropdown;
