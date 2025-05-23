// services/authService.js
const API_BASE_URL = process.env.REACT_APP_API_URL || '';

class AuthService {
  constructor() {
    this.token = localStorage.getItem('authToken');
    this.user = JSON.parse(localStorage.getItem('user') || 'null');
    this.isGuest = localStorage.getItem('isGuest') === 'true';
  }

  // Register new user
  async register(userData) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
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

      // Store auth data
      this.token = data.token;
      this.user = data.user;
      this.isGuest = false;

      localStorage.setItem('authToken', this.token);
      localStorage.setItem('user', JSON.stringify(this.user));
      localStorage.removeItem('isGuest');

      return { success: true, user: this.user };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: error.message };
    }
  }

  // Login existing user
  async login(credentials) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
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

      // Store auth data
      this.token = data.token;
      this.user = data.user;
      this.isGuest = false;

      localStorage.setItem('authToken', this.token);
      localStorage.setItem('user', JSON.stringify(this.user));
      localStorage.removeItem('isGuest');

      return { success: true, user: this.user };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    }
  }

  // Continue as guest
  continueAsGuest() {
    this.isGuest = true;
    this.user = { name: 'Guest', email: null };
    this.token = null;

    localStorage.setItem('isGuest', 'true');
    localStorage.setItem('user', JSON.stringify(this.user));
    localStorage.removeItem('authToken');

    return { success: true, user: this.user };
  }

  // Logout
  logout() {
    this.token = null;
    this.user = null;
    this.isGuest = false;

    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('isGuest');
  }

  // Check if user is authenticated (either logged in or guest)
  isAuthenticated() {
    return this.token !== null || this.isGuest;
  }

  // Get current user
  getCurrentUser() {
    return this.user;
  }

  // Get auth headers for API requests
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

  // Make authenticated API request
  async authenticatedFetch(url, options = {}) {
    const config = {
      ...options,
      headers: {
        ...this.getAuthHeaders(),
        ...options.headers,
      },
    };

    const response = await fetch(url, config);

    // Handle token expiration
    if (response.status === 401 && this.token) {
      this.logout();
      window.location.reload(); // Redirect to login
    }

    return response;
  }
}
// eslint-disable-next-line import/no-anonymous-default-export
export default new AuthService();