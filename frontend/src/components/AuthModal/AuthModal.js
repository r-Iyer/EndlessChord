import { useState } from 'react';
import authService from '../../services/authService';
import './AuthModal.css';

/**
 * AuthModal component handles user authentication UI for login, registration,
 * and guest mode. It supports switching between login and register forms,
 * form validation, error display, and communicates success/failure via props.
 *
 * @param {boolean} isOpen - Controls modal visibility.
 * @param {function} onClose - Callback to close the modal.
 * @param {function} onAuthSuccess - Callback when authentication succeeds, receives user data.
 */
const AuthModal = ({ isOpen, onClose, onAuthSuccess }) => {
  // State to toggle between 'login' and 'register' modes
  const [mode, setMode] = useState('login');
  
  // Form data state: name, email, password fields
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  
  // Holds any error messages to display in the form
  const [error, setError] = useState('');
  
  // Loading flag to disable inputs and show spinner/text during async calls
  const [loading, setLoading] = useState(false);

  // Handle input changes and clear error messages on user typing
  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError(''); // Clear error when user types
  };

  // Reset form fields and error messages to initial state
  const resetForm = () => {
    setFormData({ name: '', email: '', password: '' });
    setError('');
    setMode('login');
  };

  // Handle form submission for login or register
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let result;

      if (mode === 'register') {
        // Basic validation: all fields required for registration
        if (!formData.name || !formData.email || !formData.password) {
          setError('All fields are required');
          setLoading(false);
          return;
        }

        // Call register method from authService
        result = await authService.register({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        });
      } else {
        // Basic validation: email and password required for login
        if (!formData.email || !formData.password) {
          setError('Email and password are required');
          setLoading(false);
          return;
        }

        // Call login method from authService
        result = await authService.login({
          email: formData.email,
          password: formData.password,
        });
      }

      // On successful authentication
      if (result.success) {
        onAuthSuccess(result.user); // Pass user to parent
        onClose();                  // Close modal
        resetForm();                // Reset form state
      } else {
        setError(result.error);     // Show error from authService
      }
    } catch (error) {
      setError('An unexpected error occurred'); // Generic fallback error
    } finally {
      setLoading(false); // Reset loading state
    }
  };

  // Handle "Continue as Guest" button click
  const handleGuestMode = () => {
    const result = authService.continueAsGuest();
    onAuthSuccess(result.user); // Inform parent of guest user
    onClose();
    resetForm();
  };

  // Toggle between login and register modes and clear errors
  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError('');
  };

  // If modal is not open, render nothing
  if (!isOpen) return null;

  return (
    <div className="auth-modal-overlay">
      <div className="auth-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="auth-modal-header">
          <h2 className="auth-modal-title">
            {mode === 'login' ? 'Login' : 'Sign Up'}
          </h2>
          {/* Now continues as guest when clicked */}
          <button
            onClick={handleGuestMode}
            className="auth-modal-close"
            aria-label="Continue as guest"
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

          {/* Display error messages */}
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

        {/* Button to switch between login and register modes */}
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

        {/* Guest mode button */}
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
