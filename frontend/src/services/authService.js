import api from './api';
import { TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY } from '@/utils/constants';

export const authService = {
  // Login with username/password
  login: async (username, password) => {
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);

    const response = await api.post('/auth/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    if (response.data.access_token) {
      localStorage.setItem(TOKEN_KEY, response.data.access_token);
      localStorage.setItem(REFRESH_TOKEN_KEY, response.data.refresh_token);

      // Get user data
      const userData = await authService.getCurrentUser();
      // Add doctor_id or patient_id from token response
      if (response.data.doctor_id) {
        userData.doctor_id = response.data.doctor_id; // Display ID like "D1024"
        userData.doctor_internal_id = response.data.doctor_internal_id; // FK ID like 11
      }
      if (response.data.patient_id) {
        userData.patient_id = response.data.patient_id;
        userData.patient_internal_id = response.data.patient_internal_id;
      }
      localStorage.setItem(USER_KEY, JSON.stringify(userData));
    }

    return response.data;
  },

  // JSON Login
  loginJSON: async (username, password) => {
    const response = await api.post('/auth/login-json', {
      username,
      password,
    });

    if (response.data.access_token) {
      localStorage.setItem(TOKEN_KEY, response.data.access_token);
      localStorage.setItem(REFRESH_TOKEN_KEY, response.data.refresh_token);

      const userData = await authService.getCurrentUser();
      // Add doctor_id or patient_id from token response
      if (response.data.doctor_id) {
        userData.doctor_id = response.data.doctor_id; // Display ID like "D1024"
        userData.doctor_internal_id = response.data.doctor_internal_id; // FK ID like 11
      }
      if (response.data.patient_id) {
        userData.patient_id = response.data.patient_id;
        userData.patient_internal_id = response.data.patient_internal_id;
      }
      localStorage.setItem(USER_KEY, JSON.stringify(userData));
    }

    return response.data;
  },

  // Signup
  signup: async (userData) => {
    const response = await api.post('/auth/signup', userData);
    return response.data;
  },

  // Google OAuth Login
  googleLogin: async (credential, mode, role) => {
    const response = await api.post('/auth/google/callback', {
      token: credential,
      mode: mode,  // 'login' or 'signup'
      role: role   // 'admin', 'doctor', 'patient'
    });

    if (response.data.access_token) {
      localStorage.setItem(TOKEN_KEY, response.data.access_token);
      localStorage.setItem(REFRESH_TOKEN_KEY, response.data.refresh_token);

      const userData = await authService.getCurrentUser();
      localStorage.setItem(USER_KEY, JSON.stringify(userData));
    }

    return response.data;
  },

  // Get current user
  getCurrentUser: async () => {
    const response = await api.get('/users/me');
    return response.data;
  },

  // Logout
  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    window.location.href = '/auth';
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem(TOKEN_KEY);
  },

  // Get stored user data
  getStoredUser: () => {
    const userData = localStorage.getItem(USER_KEY);
    return userData ? JSON.parse(userData) : null;
  },

  // Refresh token
  refreshToken: async () => {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    const response = await api.post('/auth/refresh', {
      refresh_token: refreshToken,
    });

    if (response.data.access_token) {
      localStorage.setItem(TOKEN_KEY, response.data.access_token);
      localStorage.setItem(REFRESH_TOKEN_KEY, response.data.refresh_token);
    }

    return response.data;
  },
};