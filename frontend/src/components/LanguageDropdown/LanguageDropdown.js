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
 * Hook to create and manage refs for all dropdown items
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
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const windowWidth = useWindowWidth();

  const itemCount = languages.length + 1; // 1 for "All Languages"
  const itemRefs = useItemRefs(itemCount); // Store all item refs

  // Placeholder text
  const displayPlaceholder = windowWidth < 640 ? "All" : placeholder;

  // ⛔ Prevent arrow key escape from dropdown
  const trapNavigation = (e) => {
    const activeIndex = itemRefs.current.findIndex(el => el === document.activeElement);

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = (activeIndex + 1) % itemCount;
      itemRefs.current[next]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prev = (activeIndex - 1 + itemCount) % itemCount;
      itemRefs.current[prev]?.focus();
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault(); // ⛔ Block exiting dropdown left/right
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    }
  };

  // 🔒 Close dropdown when clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ✅ Auto-focus first item on open
  useEffect(() => {
    if (isOpen && itemRefs.current[0]) {
      requestAnimationFrame(() => {
        itemRefs.current[0].focus();
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // 🟩 On selection
  const handleSelect = (value) => {
    onSelect(value);
    setIsOpen(false);
  };

  // 🔄 Selected label
  const selectedLabel = selectedValue
    ? languages.find(l => l.value === selectedValue)?.label
    : displayPlaceholder;

  return (
    <div className="language-dropdown" ref={dropdownRef}>
      <button
        tabIndex={0}
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
        <div
          className="dropdown-content"
          role="listbox"
          onKeyDown={trapNavigation} // 🧠 trap Arrow navigation
        >
          {/* 🔹 First item: 'All Languages' */}
          <button
            tabIndex={0}
            ref={el => itemRefs.current[0] = el}
            onClick={() => handleSelect('')}
            className={`dropdown-item ${selectedValue === '' ? 'selected' : ''}`}
            role="option"
            aria-selected={selectedValue === ''}
          >
            <span className="item-label">{displayPlaceholder}</span>
            {selectedValue === '' && <CheckIcon />}
          </button>

          {/* 🔹 Other language options */}
          {languages.map(({ value, label }, index) => (
            <button
              key={value}
              tabIndex={0}
              ref={el => itemRefs.current[index + 1] = el}
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

// ✅ Check icon for selected item
const CheckIcon = () => (
  <svg className="check-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default LanguageDropdown;
