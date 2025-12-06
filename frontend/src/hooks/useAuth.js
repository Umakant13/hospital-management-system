import { useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useNavigate } from 'react-router-dom';

/**
 * Custom hook for authentication operations
 * Provides convenient methods for login, signup, logout and auth state
 */
export const useAuth = () => {
  const navigate = useNavigate();
  const {
    user,
    isAuthenticated,
    isLoading,
    error,
    login: storeLogin,
    signup: storeSignup,
    googleLogin: storeGoogleLogin,
    logout: storeLogout,
    updateUser,
    clearError,
  } = useAuthStore();

  /**
   * Login with username and password
   */
  const login = useCallback(async (username, password) => {
    try {
      const user = await storeLogin(username, password);
      
      // Navigate based on user role
      switch (user.role) {
        case 'admin':
          navigate('/admin/dashboard');
          break;
        case 'doctor':
          navigate('/doctor/dashboard');
          break;
        case 'patient':
          navigate('/patient/dashboard');
          break;
        default:
          navigate('/');
      }
      
      return { success: true, user };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Login failed' 
      };
    }
  }, [storeLogin, navigate]);

  /**
   * Signup new user
   */
  const signup = useCallback(async (userData) => {
    try {
      const response = await storeSignup(userData);
      return { success: true, data: response };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Signup failed' 
      };
    }
  }, [storeSignup]);

  /**
   * Login with Google OAuth
   */
  const googleLogin = useCallback(async (credential) => {
    try {
      const user = await storeGoogleLogin(credential);
      
      // Navigate based on user role
      switch (user.role) {
        case 'admin':
          navigate('/admin/dashboard');
          break;
        case 'doctor':
          navigate('/doctor/dashboard');
          break;
        case 'patient':
          navigate('/patient/dashboard');
          break;
        default:
          navigate('/');
      }
      
      return { success: true, user };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Google login failed' 
      };
    }
  }, [storeGoogleLogin, navigate]);

  /**
   * Logout current user
   */
  const logout = useCallback(() => {
    storeLogout();
    navigate('/auth');
  }, [storeLogout, navigate]);

  /**
   * Check if user has specific role
   */
  const hasRole = useCallback((role) => {
    return user?.role === role;
  }, [user]);

  /**
   * Check if user has any of the specified roles
   */
  const hasAnyRole = useCallback((roles) => {
    return roles.includes(user?.role);
  }, [user]);

  return {
    // State
    user,
    isAuthenticated,
    isLoading,
    error,
    
    // Actions
    login,
    signup,
    googleLogin,
    logout,
    updateUser,
    clearError,
    
    // Utils
    hasRole,
    hasAnyRole,
  };
};
