import axios from 'axios';
import AuthService from './authService';
import { API_URL } from '../constants/constants';

/**
 * Create a centralized axios instance configured with the base API URL
 * and JSON content-type headers by default.
 */
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request interceptor to automatically attach authentication headers
 * (e.g., Authorization token or guest mode header) from AuthService
 * to every outgoing request.
 */
api.interceptors.request.use(
  (config) => {
    try {
      // Retrieve current auth headers from AuthService
      const authHeaders = AuthService.getAuthHeaders();

      // Merge auth headers with any existing request headers
      config.headers = {
        ...config.headers,
        ...authHeaders,
      };
    } catch (err) {
      console.error('Failed to attach auth headers:', err);
      // Optional: Could reject the request here to prevent unauthenticated calls
    }

    // Return the modified config to continue with the request
    return config;
  },
  (error) => {
    // Handle errors occurring during request setup
    return Promise.reject(error);
  }
);

/**
 * Response interceptor to handle responses globally,
 * particularly to catch 401 Unauthorized errors.
 * If a 401 is detected and the user has a token, it logs out the user,
 * clears auth data, and reloads the app to force a login.
 */
api.interceptors.response.use(
  (response) => {
    // Simply return successful responses untouched
    return response;
  },
  (error) => {
    // Extract HTTP status code safely
    const status = error?.response?.status;

    if (status === 401 && AuthService.token) {
      try {
        // Perform logout cleanup on 401 Unauthorized
        AuthService.logout();

        // Avoid infinite reload loops by tracking logout in sessionStorage
        if (!window.sessionStorage.getItem('hasLoggedOut')) {
          window.sessionStorage.setItem('hasLoggedOut', 'true');
          window.location.reload(); // Reload page to redirect to login
        }
      } catch (logoutError) {
        console.error('Error during logout on 401:', logoutError);
        // Continue to reject so caller can handle error as well
      }
    }

    // Pass the error down the promise chain for additional handling
    return Promise.reject(error);
  }
);
