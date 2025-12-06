import React, { useState } from 'react';
import {
  TextField,
  Button,
  Box,
  Alert,
  InputAdornment,
  IconButton,
  Grid,
  CircularProgress,
} from '@mui/material';
import { Visibility, VisibilityOff, PersonAdd } from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '@/store/authStore';

const SignupForm = ({ role, onSuccess }) => {
  const { signup, isLoading, error, clearError } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm();

  const password = watch('password');

  const onSubmit = async (data) => {
    clearError();
    setSuccessMessage('');

    try {
      await signup({
        ...data,
        role: role,
      });

      setSuccessMessage('Account created successfully! Please sign in.');

      // Switch to login tab after 2 seconds
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (err) {
      console.error('Signup error:', err);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {successMessage}
        </Alert>
      )}

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            required
            fullWidth
            label="Full Name"
            size="small" // Smaller input height
            {...register('full_name', {
              required: 'Full name is required',
              minLength: {
                value: 3,
                message: 'Name must be at least 3 characters',
              },
            })}
            error={!!errors.full_name}
            helperText={errors.full_name?.message}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            required
            fullWidth
            label="Phone Number"
            size="small"
            {...register('phone', {
              pattern: {
                value: /^\+?[1-9]\d{1,14}$/,
                message: 'Invalid phone number',
              },
            })}
            error={!!errors.phone}
            helperText={errors.phone?.message}
            placeholder="+1234567890"
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            required
            fullWidth
            label="Username"
            size="small"
            {...register('username', {
              required: 'Username is required',
              minLength: {
                value: 3,
                message: 'Min 3 chars',
              },
              pattern: {
                value: /^[a-zA-Z0-9_]+$/,
                message: 'Letters, numbers, _ only',
              },
            })}
            error={!!errors.username}
            helperText={errors.username?.message}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            required
            fullWidth
            label="Email"
            type="email"
            size="small"
            {...register('email', {
              required: 'Email is required',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Invalid email',
              },
            })}
            error={!!errors.email}
            helperText={errors.email?.message}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            required
            fullWidth
            label="Password"
            type={showPassword ? 'text' : 'password'}
            size="small"
            {...register('password', {
              required: 'Required',
              minLength: {
                value: 6,
                message: 'Min 6 chars',
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
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            required
            fullWidth
            label="Confirm Password"
            type={showPassword ? 'text' : 'password'}
            size="small"
            {...register('confirmPassword', {
              required: 'Required',
              validate: (value) =>
                value === password || 'Passwords do not match',
            })}
            error={!!errors.confirmPassword}
            helperText={errors.confirmPassword?.message}
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Address"
            size="small"
            {...register('address')}
          />
        </Grid>
      </Grid>

      <Button
        type="submit"
        fullWidth
        variant="contained"
        sx={{ mt: 3, mb: 2, py: 1.5 }}
        disabled={isLoading}
        startIcon={isLoading ? <CircularProgress size={20} /> : <PersonAdd />}
      >
        {isLoading ? 'Creating Account...' : 'Sign Up'}
      </Button>
    </Box>
  );
};

export default SignupForm;