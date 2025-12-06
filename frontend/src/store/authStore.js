import { create } from 'zustand';
import { authService } from '@/services/authService';

export const useAuthStore = create((set) => ({
  user: authService.getStoredUser(),
  isAuthenticated: authService.isAuthenticated(),
  isLoading: false,
  error: null,

  login: async (username, password) => {
    set({ isLoading: true, error: null });
    try {
      await authService.loginJSON(username, password);
      const user = authService.getStoredUser();
      set({ user, isAuthenticated: true, isLoading: false });
      return user;
    } catch (error) {
      let errorMessage = 'Login failed';
      
      if (error.code === 'ERR_NETWORK') {
        errorMessage = 'Cannot connect to server. Please ensure the backend is running at http://localhost:8000';
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      set({ 
        error: errorMessage,
        isLoading: false 
      });
      throw error;
    }
  },

  signup: async (userData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.signup(userData);
      set({ isLoading: false });
      return response;
    } catch (error) {
      set({ 
        error: error.response?.data?.detail || 'Signup failed', 
        isLoading: false 
      });
      throw error;
    }
  },

  googleLogin: async (credential, mode, role) => {
    set({ isLoading: true, error: null });
    try {
      await authService.googleLogin(credential, mode, role);
      const user = authService.getStoredUser();
      set({ user, isAuthenticated: true, isLoading: false });
      return user;
    } catch (error) {
      set({ 
        error: error.response?.data?.detail || 'Google login failed', 
        isLoading: false 
      });
      throw error;
    }
  },

  logout: () => {
    authService.logout();
    set({ user: null, isAuthenticated: false });
  },

  updateUser: (userData) => {
    set({ user: userData });
    localStorage.setItem('user_data', JSON.stringify(userData));
  },

  clearError: () => set({ error: null }),
}));