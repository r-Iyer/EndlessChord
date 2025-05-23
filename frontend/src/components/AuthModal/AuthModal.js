// components/AuthModal/AuthModal.js
import { useState } from 'react';
import authService from '../../services/authService';
import './AuthModal.css';

const AuthModal = ({ isOpen, onClose, onAuthSuccess }) => {
  const [mode, setMode] = useState('login'); // 'login' or 'register'
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError(''); // Clear error when user types
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let result;
      
      if (mode === 'register') {
        if (!formData.name || !formData.email || !formData.password) {
          setError('All fields are required');
          setLoading(false);
          return;
        }
        result = await authService.register({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        });
      } else {
        if (!formData.email || !formData.password) {
          setError('Email and password are required');
          setLoading(false);
          return;
        }
        result = await authService.login({
          email: formData.email,
          password: formData.password,
        });
      }

      if (result.success) {
        onAuthSuccess(result.user);
        onClose();
        resetForm();
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestMode = () => {
    const result = authService.continueAsGuest();
    onAuthSuccess(result.user);
    onClose();
    resetForm();
  };

  const resetForm = () => {
    setFormData({ name: '', email: '', password: '' });
    setError('');
    setMode('login');
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError('');
  };

  if (!isOpen) return null;

  return (
    <div className="auth-modal-overlay">
      <div className="auth-modal-container">
        <div className="auth-modal-header">
          <h2 className="auth-modal-title">
            {mode === 'login' ? 'Login' : 'Sign Up'}
          </h2>
          <button
            onClick={onClose}
            className="auth-modal-close"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-modal-form">
          {mode === 'register' && (
            <div className="auth-modal-field">
              <label className="auth-modal-label">
                Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter your name"
                className="auth-modal-input"
                disabled={loading}
              />
            </div>
          )}

          <div className="auth-modal-field">
            <label className="auth-modal-label">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Enter your email"
              className="auth-modal-input"
              disabled={loading}
            />
          </div>

          <div className="auth-modal-field">
            <label className="auth-modal-label">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Enter your password"
              className="auth-modal-input"
              disabled={loading}
            />
          </div>

          {error && (
            <div className="auth-modal-error">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="auth-modal-submit"
          >
            {loading ? 'Please wait...' : (mode === 'login' ? 'Login' : 'Sign Up')}
          </button>
        </form>

        <div className="auth-modal-switch-container">
          <button
            onClick={switchMode}
            className="auth-modal-switch"
            disabled={loading}
          >
            {mode === 'login' 
              ? "Don't have an account? Sign up" 
              : "Already have an account? Login"
            }
          </button>
        </div>

        <div className="auth-modal-divider">
          <button
            onClick={handleGuestMode}
            disabled={loading}
            className="auth-modal-guest"
          >
            Continue as Guest
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;