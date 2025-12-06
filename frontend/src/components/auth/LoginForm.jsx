import React, { useState } from 'react';
import {
  TextField,
  Button,
  Box,
  Alert,
  InputAdornment,
  IconButton,
  CircularProgress,
} from '@mui/material';
import { Visibility, VisibilityOff, Login } from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '@/store/authStore';
import { useNavigate } from 'react-router-dom';
import { USER_ROLES, ROUTES } from '@/utils/constants';

// eslint-disable-next-line no-unused-vars
const LoginForm = ({ role }) => {
  const navigate = useNavigate();
  const { login, isLoading, error, clearError } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    clearError();
    try {
      const user = await login(data.username, data.password);

      // Redirect based on role
      if (user.role === USER_ROLES.ADMIN) {
        navigate(ROUTES.ADMIN_DASHBOARD);
      } else if (user.role === USER_ROLES.DOCTOR) {
        navigate(ROUTES.DOCTOR_DASHBOARD);
      } else {
        navigate(ROUTES.PATIENT_DASHBOARD);
      }
    } catch (err) {
      console.error('Login error:', err);
      // Error is already set in the store by the login function
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TextField
        margin="dense" // Tighter margin
        required
        fullWidth
        id="username"
        label="Username"
        name="username"
        autoComplete="username"
        autoFocus
        size="small" // Smaller input
        {...register('username', {
          required: 'Username is required',
          minLength: {
            value: 3,
            message: 'Username must be at least 3 characters',
          },
        })}
        error={!!errors.username}
        helperText={errors.username?.message}
      />

      <TextField
        margin="dense"
        required
        fullWidth
        name="password"
        label="Password"
        type={showPassword ? 'text' : 'password'}
        id="password"
        autoComplete="current-password"
        size="small"
        {...register('password', {
          required: 'Password is required',
          minLength: {
            value: 6,
            message: 'Password must be at least 6 characters',
          },
        })}
        error={!!errors.password}
        helperText={errors.password?.message}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                onClick={() => setShowPassword(!showPassword)}
                edge="end"
                size="small"
              >
                {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
              </IconButton>
            </InputAdornment>
          ),
        }}
      />

      <Button
        type="submit"
        fullWidth
        variant="contained"
        sx={{ mt: 3, mb: 2, py: 1.5 }}
        disabled={isLoading}
        startIcon={isLoading ? <CircularProgress size={20} /> : <Login />}
      >
        {isLoading ? 'Signing in...' : 'Sign In'}
      </Button>
    </Box>
  );
};

export default LoginForm;