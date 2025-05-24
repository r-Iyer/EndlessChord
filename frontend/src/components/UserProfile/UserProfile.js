// components/UserProfile/UserProfile.js
import { useState } from 'react';
import authService from '../../services/authService';
import './UserProfile.css';

const UserProfile = ({ user, onLogout, onShowAuth, onPlayFavorites }) => {
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = () => {
    authService.logout();
    onLogout();
    setShowDropdown(false);
  };

  const handleLogin = () => {
    onShowAuth();
    setShowDropdown(false);
  };

  // Check if user is a guest (no user data or explicitly marked as guest)
  const isGuest = !user || !user.id || authService.isGuest;

  return (
    <div className="user-profile">
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
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
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
              // Guest user - only show login option
              <button
                onClick={handleLogin}
                className="user-profile__menu-item"
              >
                Login / Sign Up
              </button>
            ) : (
              // Authenticated user - show full menu with logout
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