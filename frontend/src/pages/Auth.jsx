import React, { useState } from 'react';
import {
  Container,
  Paper,
  Box,
  Typography,
  Divider,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import { GoogleOAuthProvider } from '@react-oauth/google';
import TabSelector from '@/components/auth/TabSelector';
import LoginForm from '@/components/auth/LoginForm';
import SignupForm from '@/components/auth/SignupForm';
import GoogleAuthButton from '@/components/auth/GoogleAuthButton';
import { GOOGLE_CLIENT_ID } from '@/utils/constants';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';

const Auth = () => {
  const [mode, setMode] = useState('login'); // 'login' or 'signup'
  const [role, setRole] = useState('admin'); // 'admin', 'doctor', 'patient'

  const handleModeChange = (event, newMode) => {
    if (newMode !== null) {
      setMode(newMode);
    }
  };

  const handleRoleChange = (event, newRole) => {
    setRole(newRole);
  };

  const handleSignupSuccess = () => {
    setMode('login');
  };

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <Box
        sx={{
          minHeight: '100vh',
          background: '#f8f9fa',
          backgroundImage: `
            url('/hospital_login_bg.png'),
            radial-gradient(circle at 20% 50%, rgba(102, 126, 234, 0.08) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(118, 75, 162, 0.08) 0%, transparent 50%)
          `,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: 4,
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(248, 249, 250, 0.85)',
            backdropFilter: 'blur(8px)',
            pointerEvents: 'none',
          }
        }}
      >
        <Container maxWidth="sm">
          <Paper
            elevation={0}
            sx={{
              p: { xs: 3, md: 4 }, // Reduced padding
              borderRadius: 4,
              backgroundColor: 'rgba(255, 255, 255, 0.95)', // Slightly more opaque
              backdropFilter: 'blur(20px)',
              border: '1px solid',
              borderColor: 'rgba(102, 126, 234, 0.1)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)', // Softer shadow
              position: 'relative',
              zIndex: 1,
            }}
          >
            {/* Header */}
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: '20px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                  boxShadow: '0 10px 30px rgba(102, 126, 234, 0.3)',
                }}
              >
                <LocalHospitalIcon
                  sx={{ fontSize: 45, color: 'white' }}
                />
              </Box>
              <Typography
                variant="h4"
                fontWeight="700"
                gutterBottom
                sx={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: 1
                }}
              >
                Hospital Management
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
                {mode === 'login'
                  ? 'Welcome back! Sign in to continue'
                  : 'Create your account to get started'}
              </Typography>
            </Box>

            {/* Login/Signup Toggle */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
              <ToggleButtonGroup
                value={mode}
                exclusive
                onChange={handleModeChange}
                aria-label="auth mode"
                sx={{
                  backgroundColor: '#f5f5f5',
                  borderRadius: 3,
                  p: 0.5,
                  '& .MuiToggleButton-root': {
                    px: 5,
                    py: 1.2,
                    textTransform: 'none',
                    fontSize: '1rem',
                    fontWeight: 600,
                    border: 'none',
                    borderRadius: 2.5,
                    color: 'text.secondary',
                    '&.Mui-selected': {
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      }
                    },
                    '&:hover': {
                      backgroundColor: 'rgba(102, 126, 234, 0.08)',
                    }
                  },
                }}
              >
                <ToggleButton value="login" aria-label="login">
                  Sign In
                </ToggleButton>
                <ToggleButton value="signup" aria-label="signup">
                  Sign Up
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>

            {/* Role Selector */}
            <TabSelector value={role} onChange={handleRoleChange} />

            {/* Forms */}
            {mode === 'login' ? (
              <LoginForm role={role} />
            ) : (
              <SignupForm role={role} onSuccess={handleSignupSuccess} />
            )}

            {/* Divider */}
            <Divider sx={{ my: 3 }}>
              <Typography variant="body2" color="text.secondary" fontWeight="500">
                OR
              </Typography>
            </Divider>

            {/* Google Sign In */}
            <GoogleAuthButton mode={mode} role={role} />

            {/* Footer */}
            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                {mode === 'login' ? (
                  <>
                    Don't have an account?{' '}
                    <Box
                      component="span"
                      sx={{
                        color: 'primary.main',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        '&:hover': {
                          textDecoration: 'underline'
                        }
                      }}
                      onClick={() => setMode('signup')}
                    >
                      Sign up
                    </Box>
                  </>
                ) : (
                  <>
                    Already have an account?{' '}
                    <Box
                      component="span"
                      sx={{
                        color: 'primary.main',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        '&:hover': {
                          textDecoration: 'underline'
                        }
                      }}
                      onClick={() => setMode('login')}
                    >
                      Sign in
                    </Box>
                  </>
                )}
              </Typography>
            </Box>
          </Paper>


        </Container>
      </Box>
    </GoogleOAuthProvider>
  );
};

export default Auth;