import { useState, useEffect } from 'react';
import authService from '../services/authService';

function useAuth() {
  const [user, setUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [allowGuestAccess, setAllowGuestAccess] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      if (authService.isAuthenticated()) {
        setUser(authService.getCurrentUser());
        setAllowGuestAccess(true); // Authenticated users can access everything
      } else {
        setShowAuthModal(true);
      }
      setIsAuthChecked(true);
    };

    checkAuth();
  }, []);

  const handleAuthSuccess = (userData) => {
    setUser(userData);
    setShowAuthModal(false);
    setAllowGuestAccess(true);
  };

  const handleLogout = () => {
    setUser(null);
    setAllowGuestAccess(false);
    setShowAuthModal(true);
  };

  const handleGuestAccess = () => {
    setShowAuthModal(false);
    setAllowGuestAccess(true);
  };

  return {
    user,
    setUser,
    showAuthModal,
    setShowAuthModal,
    isAuthChecked,
    allowGuestAccess,
    handleAuthSuccess,
    handleLogout,
    handleGuestAccess
  };
}

export default useAuth;
