import { useState, useRef, useEffect } from 'react';
import './LanguageDropdown.css';

/**
 * Hook to track window width
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
 * Hook to manage refs for dropdown items
 */
const useItemRefs = (count) => {
  const refs = useRef([]);
  useEffect(() => {
    refs.current = Array(count).fill().map((_, i) => refs.current[i] || null);
  }, [count]);
  return refs;
};

const LanguageDropdown = ({
  languages,
  selectedValue,
  onSelect,
  placeholder = "All Languages"
}) => {
  // State to track open/close
  const [isOpen, setIsOpen] = useState(false);
  // State to track which item is focusable
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const dropdownRef = useRef(null);
  const triggerRef = useRef(null); // Ref for main dropdown button
  const windowWidth = useWindowWidth();

  const itemCount = languages.length + 1; // include "All"
  const itemRefs = useItemRefs(itemCount);

  // Determine placeholder text based on window size
  const displayPlaceholder = windowWidth < 640 ? "All" : placeholder;

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Manage global key events (capture phase) while dropdown is open
  useEffect(() => {
    const handleGlobalNav = (e) => {
      // Only trap when dropdown open
      if (!isOpen) return;
      const keys = ['ArrowDown','ArrowUp','ArrowLeft','ArrowRight','Escape'];
      if (keys.includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
      }
      // Handle Escape: close
      if (e.key === 'Escape') {
        setIsOpen(false);
        triggerRef.current?.focus();
        return;
      }
      // If on first item and pressing Up, move focus back to trigger
      if (e.key === 'ArrowUp' && focusedIndex === 0) {
        setIsOpen(false); // optionally keep open? here we close
        triggerRef.current?.focus();
        return;
      }
      let nextIndex = focusedIndex;
      if (e.key === 'ArrowDown') {
        nextIndex = (focusedIndex + 1) % itemCount;
      } else if (e.key === 'ArrowUp') {
        nextIndex = (focusedIndex - 1 + itemCount) % itemCount;
      } else {
        return; // Block left/right
      }
      setFocusedIndex(nextIndex);
      itemRefs.current[nextIndex]?.focus();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleGlobalNav, true);
    }
    return () => {
      document.removeEventListener('keydown', handleGlobalNav, true);
    };
  }, [isOpen, focusedIndex, itemCount, itemRefs]);

  // Open: set focusable index and focus
  useEffect(() => {
    if (isOpen) {
      setFocusedIndex(0);
      requestAnimationFrame(() => {
        itemRefs.current[0]?.focus();
      });
    } else {
      setFocusedIndex(-1);
    }
  }, [isOpen, itemRefs]);

  // Handle selection
  const handleSelect = (value) => {
    onSelect(value);
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  const selectedLabel = selectedValue
    ? languages.find(l => l.value === selectedValue)?.label
    : displayPlaceholder;

  return (
    <div className="language-dropdown" ref={dropdownRef}>
      <button
        ref={triggerRef}
        tabIndex={0}
        onClick={() => setIsOpen(prev => !prev)}
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
          {/* First item: All */}
          <button
            ref={el => itemRefs.current[0] = el}
            tabIndex={focusedIndex === 0 ? 0 : -1}
            onClick={() => handleSelect('')}
            className={`dropdown-item ${selectedValue === '' ? 'selected' : ''}`}
            role="option"
            aria-selected={selectedValue === ''}
          >
            <span className="item-label">{displayPlaceholder}</span>
            {selectedValue === '' && <CheckIcon />}
          </button>

          {/* Language items */}
          {languages.map(({ value, label }, idx) => (
            <button
              key={value}
              ref={el => itemRefs.current[idx + 1] = el}
              tabIndex={focusedIndex === idx + 1 ? 0 : -1}
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

// Check icon for selected items
const CheckIcon = () => (
  <svg className="check-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default LanguageDropdown;
