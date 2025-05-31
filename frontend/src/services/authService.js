import { API_URL } from '../constants/constants';

/**
 * Service class to handle user authentication-related operations.
 * It manages registration, login, guest sessions, logout, and
 * authenticated API requests with token handling and localStorage persistence.
 */
class AuthService {
  constructor() {
    /**
     * JWT token for authenticated requests.
     * Loaded from localStorage on service initialization.
     * @type {string|null}
     */
    this.token = localStorage.getItem('authToken');

    /**
     * Current authenticated user object.
     * Loaded from localStorage as JSON on initialization.
     * @type {Object|null}
     */
    this.user = JSON.parse(localStorage.getItem('user') || 'null');

    /**
     * Boolean flag indicating guest user mode.
     * Loaded from localStorage on initialization.
     * @type {boolean}
     */
    this.isGuest = localStorage.getItem('isGuest') === 'true';
  }

  /**
   * Registers a new user by sending a POST request with user data.
   * On success, stores the token and user info in localStorage and service state.
   *
   * @param {Object} userData - The registration data (e.g., name, email, password).
   * @returns {Promise<Object>} - Resolves with { success: true, user } or { success: false, error }.
   */
  async register(userData) {
    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      // Update service state with new auth info
      this.token = data.token;
      this.user = data.user;
      this.isGuest = false;

      // Persist auth info in localStorage
      localStorage.setItem('authToken', this.token);
      localStorage.setItem('user', JSON.stringify(this.user));
      localStorage.removeItem('isGuest');

      return { success: true, user: this.user };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Logs in an existing user by sending credentials to the API.
   * On success, stores the token and user info in localStorage and service state.
   *
   * @param {Object} credentials - The login credentials (e.g., email, password).
   * @returns {Promise<Object>} - Resolves with { success: true, user } or { success: false, error }.
   */
  async login(credentials) {
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Update service state with new auth info
      this.token = data.token;
      this.user = data.user;
      this.isGuest = false;

      // Persist auth info in localStorage
      localStorage.setItem('authToken', this.token);
      localStorage.setItem('user', JSON.stringify(this.user));
      localStorage.removeItem('isGuest');

      return { success: true, user: this.user };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Starts a guest session without authentication.
   * Sets guest flag and user info accordingly.
   * Stores state in localStorage.
   *
   * @returns {Object} - { success: true, user } for the guest session.
   */
  continueAsGuest() {
    this.isGuest = true;
    this.user = { name: 'Guest', email: null };
    this.token = null;

    localStorage.setItem('isGuest', 'true');
    localStorage.setItem('user', JSON.stringify(this.user));
    localStorage.removeItem('authToken');

    return { success: true, user: this.user };
  }

  /**
   * Logs out the current user (authenticated or guest).
   * Clears all authentication-related state and localStorage entries.
   */
  logout() {
    this.token = null;
    this.user = null;
    this.isGuest = false;

    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('isGuest');
  }

  /**
   * Checks whether the user is authenticated.
   * Returns true if logged in with a token or in guest mode.
   *
   * @returns {boolean} - Authentication status.
   */
  isAuthenticated() {
    return this.token !== null || this.isGuest;
  }

  /**
   * Returns the current user object.
   *
   * @returns {Object|null} - The logged-in user or guest user, or null if none.
   */
  getCurrentUser() {
    return this.user;
  }

  /**
   * Returns headers to use for authenticated API requests.
   * Includes the Authorization header if logged in,
   * and a custom header if in guest mode.
   *
   * @returns {Object} - Headers object with necessary auth headers.
   */
  getAuthHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    if (this.isGuest) {
      headers['X-Guest-Mode'] = 'true';
    }

    return headers;
  }

  /**
   * Performs a fetch request with authentication headers.
   * Automatically includes the token or guest headers.
   * Handles 401 Unauthorized by logging out and forcing a reload.
   *
   * @param {string} url - The URL to fetch.
   * @param {Object} [options={}] - Fetch options (method, headers, body, etc).
   * @returns {Promise<Response>} - The fetch response promise.
   */
  async authenticatedFetch(url, options = {}) {
    const config = {
      ...options,
      headers: {
        ...this.getAuthHeaders(),
        ...options.headers,
      },
    };

    const response = await fetch(url, config);

    // Handle token expiration or invalid auth by logging out
    if (response.status === 401 && this.token) {
      this.logout();
      window.location.reload(); // Reload app to force login
    }

    return response;
  }
}

// Export singleton instance of AuthService
// eslint-disable-next-line import/no-anonymous-default-export
export default new AuthService();
