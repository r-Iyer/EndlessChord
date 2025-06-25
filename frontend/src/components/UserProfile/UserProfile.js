import { useState, useRef, useEffect } from 'react';
import authService from '../../services/authService';
import './UserProfile.css';

/**
 * UserProfile component displays user avatar, name, and a dropdown menu
 * with login/logout and user actions.
 * 
 * Props:
 * - user: current user object ({ id, name, email, ... }) or null for guest
 * - onLogout: callback fired after logout
 * - onShowAuth: callback to show authentication modal/page
 * - onPlayFavorites: callback to start playing user's favorite songs
 */
const UserProfile = ({ user, onLogout, onShowAuth, onPlayFavorites }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Determine if user is guest (not logged in)
  // Defensive: also check authService.isGuest flag for global guest mode
  const isGuest = !user?.id || authService.isGuest;

  /**
   * Handles logout action:
   * Calls authService.logout(), triggers onLogout prop,
   * and closes dropdown.
   */
  const handleLogout = () => {
    try {
      authService.logout();
      onLogout();
    } catch (err) {
      console.error('Logout failed:', err);
    } finally {
      setShowDropdown(false);
    }
  };

  /**
   * Handles login button click:
   * Calls onShowAuth prop to open login/signup modal,
   * and closes dropdown.
   */
  const handleLogin = () => {
    onShowAuth();
    setShowDropdown(false);
  };

  /**
   * Effect to close dropdown when clicking outside the component.
   * Cleans up event listener on unmount or when dropdown closes.
   */
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  return (
    <div className="user-profile" ref={dropdownRef}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="user-profile__button"
        aria-haspopup="true"
        aria-expanded={showDropdown}
        aria-label={showDropdown ? 'Close user menu' : 'Open user menu'}
        type="button"
      >
        {/* User avatar initial or 'G' for guest */}
        <div className="user-profile__avatar" aria-hidden="true">
          {user?.name ? user.name.charAt(0).toUpperCase() : 'G'}
        </div>

        {/* User name or Guest */}
        <span className="user-profile__name">{user?.name || 'Guest'}</span>

        {/* Chevron icon toggles up/down */}
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

      {/* Dropdown menu */}
      {showDropdown && (
        <div
          className="user-profile__dropdown"
          role="menu"
          aria-label="User menu"
        >
          <div className="user-profile__dropdown-content">
            {/* User info section */}
            <div className="user-profile__user-info">
              <div className="user-profile__user-name">{user?.name || 'Guest'}</div>
              {user?.email && (
                <div className="user-profile__user-email">{user.email}</div>
              )}
              {isGuest && (
                <div className="user-profile__guest-mode" aria-live="polite">
                  Guest Mode
                </div>
              )}
            </div>

            {/* Menu buttons */}
            {isGuest ? (
              <button
                onClick={handleLogin}
                className="user-profile__menu-item"
                role="menuitem"
                type="button"
              >
                Login / Sign Up
              </button>
            ) : (
              <>
                <button
                  onClick={() => {
                    onPlayFavorites();
                    setShowDropdown(false);
                  }}
                  className="user-profile__menu-item"
                  role="menuitem"
                  type="button"
                >
                  Play Favorites
                </button>
                <div className="user-profile__divider" />
                <button
                  onClick={handleLogout}
                  className="user-profile__menu-item user-profile__menu-item--logout"
                  role="menuitem"
                  type="button"
                >
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;
