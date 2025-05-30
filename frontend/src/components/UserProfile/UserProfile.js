import { useState, useRef, useEffect } from 'react';
import authService from '../../services/authService';
import './UserProfile.css';

const UserProfile = ({ user, onLogout, onShowAuth, onPlayFavorites }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const handleLogout = () => {
    authService.logout();
    onLogout();
    setShowDropdown(false);
  };

  const handleLogin = () => {
    onShowAuth();
    setShowDropdown(false);
  };

  const isGuest = !user || !user.id || authService.isGuest;

  // Close dropdown on outside click
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
      >
        <div className="user-profile__avatar">
          {user?.name ? user.name.charAt(0).toUpperCase() : 'G'}
        </div>
        <span className="user-profile__name">
          {user?.name || 'Guest'}
        </span>
        <svg className="user-profile__chevron" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d={showDropdown ? 'M19 15l-7-7-7 7' : 'M19 9l-7 7-7-7'}
          />
        </svg>
      </button>

      {showDropdown && (
        <div className="user-profile__dropdown">
          <div className="user-profile__dropdown-content">
            <div className="user-profile__user-info">
              <div className="user-profile__user-name">{user?.name || 'Guest'}</div>
              {user?.email && (
                <div className="user-profile__user-email">{user.email}</div>
              )}
              {isGuest && (
                <div className="user-profile__guest-mode">Guest Mode</div>
              )}
            </div>

            {isGuest ? (
              <button
                onClick={handleLogin}
                className="user-profile__menu-item"
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
                >
                  Play Favorites
                </button>
                <div className="user-profile__divider">
                  <button
                    onClick={handleLogout}
                    className="user-profile__menu-item user-profile__menu-item--logout"
                  >
                    Logout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;
