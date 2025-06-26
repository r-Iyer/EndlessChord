import { useState, useRef, useEffect } from 'react';
import authService from '../../services/authService';
import './UserProfile.css';

/**
 * UserProfile component displays user avatar, name, and a dropdown menu
 * with login/logout and user actions.
 */
const UserProfile = ({ user, onLogout, onShowAuth, onPlayFavorites }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const dropdownRef = useRef(null);
  const triggerRef = useRef(null);

  // Determine if user is guest (not logged in)
  const isGuest = !user?.id || authService.isGuest;

  // Handlers
  const handleLogout = () => {
    try {
      authService.logout();
      onLogout();
    } catch (err) {
      console.error('Logout failed:', err);
    } finally {
      setShowDropdown(false);
      triggerRef.current?.focus();
    }
  };

  const handleLogin = () => {
    onShowAuth();
    setShowDropdown(false);
    triggerRef.current?.focus();
  };

  // Build menu items
  const menuItems = isGuest
    ? [{ label: 'Login / Sign Up', action: handleLogin }]
    : [
        { label: 'Play Favorites', action: () => { onPlayFavorites(); setShowDropdown(false); triggerRef.current?.focus(); } },
        { label: 'Logout', action: handleLogout }
      ];
  const itemRefs = useRef([]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus first item when opening
  useEffect(() => {
    if (showDropdown) {
      setFocusedIndex(0);
      setTimeout(() => {
        itemRefs.current[0]?.focus();
      }, 20);
    } else {
      setFocusedIndex(-1);
    }
  }, [showDropdown]);

  // Handle key navigation per item
  const handleKeyNav = (e, idx) => {
    if (!showDropdown) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      setShowDropdown(false);
      triggerRef.current?.focus();
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      e.stopPropagation();
      if (idx <= 0) {
        setShowDropdown(false);
        triggerRef.current?.focus();
      } else {
        const prev = idx - 1;
        setFocusedIndex(prev);
        itemRefs.current[prev]?.focus();
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      e.stopPropagation();
      // Move to next item only if exists; no wrapping
      if (idx + 1 < menuItems.length) {
        const next = idx + 1;
        setFocusedIndex(next);
        itemRefs.current[next]?.focus();
      }
    }
  };

  const toggleDropdown = () => setShowDropdown(o => !o);
  const onTriggerKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      toggleDropdown();
    }
  };

  return (
    <div className="user-profile" ref={dropdownRef}>
      <button
        ref={triggerRef}
        onClick={toggleDropdown}
        onKeyDown={onTriggerKeyDown}
        className="user-profile__button"
        aria-haspopup="true"
        aria-expanded={showDropdown}
        aria-label={showDropdown ? 'Close user menu' : 'Open user menu'}
        type="button"
      >
        <div className="user-profile__avatar" aria-hidden="true">
          {user?.name ? user.name.charAt(0).toUpperCase() : 'G'}
        </div>
        <span className="user-profile__name">{user?.name || 'Guest'}</span>
        <svg
          className="user-profile__chevron"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
          focusable="false"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d={showDropdown ? 'M19 15l-7-7-7 7' : 'M19 9l-7 7-7-7'}
          />
        </svg>
      </button>

      {showDropdown && (
        <div className="user-profile__dropdown" role="menu" aria-label="User menu">
          <div className="user-profile__dropdown-content">
            <div className="user-profile__user-info">
              <div className="user-profile__user-name">{user?.name || 'Guest'}</div>
              {user?.email && <div className="user-profile__user-email">{user.email}</div>}
              {isGuest && <div className="user-profile__guest-mode" aria-live="polite">Guest Mode</div>}
            </div>
            {menuItems.map((item, idx) => (
              <button
                key={item.label}
                ref={el => itemRefs.current[idx] = el}
                tabIndex={focusedIndex === idx ? 0 : -1}
                onKeyDown={e => handleKeyNav(e, idx)}
                onClick={item.action}
                className={`user-profile__menu-item${item.label === 'Logout' ? ' user-profile__menu-item--logout' : ''}`}
                role="menuitem"
                type="button"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;
