import React, { useState } from 'react';
import { Button, Box, Alert } from '@mui/material';
import { GoogleLogin } from '@react-oauth/google';
import { useAuthStore } from '@/store/authStore';
import { useNavigate } from 'react-router-dom';
import { USER_ROLES, ROUTES } from '@/utils/constants';

const GoogleAuthButton = ({ mode, role }) => {
  const navigate = useNavigate();
  const { googleLogin } = useAuthStore();
  const [error, setError] = useState(null);

  const handleSuccess = async (credentialResponse) => {
    try {
      setError(null);
      const user = await googleLogin(credentialResponse.credential, mode, role);
      
      // Redirect based on role
      if (user.role === USER_ROLES.ADMIN) {
        navigate(ROUTES.ADMIN_DASHBOARD);
      } else if (user.role === USER_ROLES.DOCTOR) {
        navigate(ROUTES.DOCTOR_DASHBOARD);
      } else {
        navigate(ROUTES.PATIENT_DASHBOARD);
      }
    } catch (error) {
      console.error('Google login error:', error);
      const errorMsg = error.response?.data?.detail || error.message || 'Google authentication failed';
      setError(errorMsg);
    }
  };

  const handleError = () => {
    console.error('Google login failed');
    setError('Google sign-in was cancelled or failed. This app requires Google OAuth verification for production use.');
  };

  return (
    <Box>
      {error && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
        <GoogleLogin
          onSuccess={handleSuccess}
          onError={handleError}
          theme="outline"
          size="large"
          text="continue_with"
          shape="rectangular"
        />
      </Box>
    </Box>
  );
};

export default GoogleAuthButton;