import { useState, useEffect, useCallback } from 'react';
import authService from '../services/authService';

function useAuth() {
  const [user, setUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [allowGuestAccess, setAllowGuestAccess] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      try {
        const isAuth = await authService.isAuthenticated();
        if (isAuth) {
          const currentUser = await authService.getCurrentUser();
          setUser(currentUser);
          setAllowGuestAccess(true);
        } else {
          setShowAuthModal(true);
        }
      } catch (err) {
        console.error('Error during auth check:', err);
        setShowAuthModal(true);
      } finally {
        setIsAuthChecked(true);
      }
    }

    checkAuth();
  }, []);

  const handleAuthSuccess = useCallback((userData) => {
    setUser(userData);
    setShowAuthModal(false);
    setAllowGuestAccess(true);
  }, []);

  const handleLogout = useCallback(() => {
    authService.clearToken?.();
    setUser(null);
    setAllowGuestAccess(false);
    setShowAuthModal(true);
  }, []);

  const handleGuestAccess = useCallback(() => {
    setShowAuthModal(false);
    setAllowGuestAccess(true);
  }, []);

  return {
    user,
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
