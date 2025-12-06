import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { CircularProgress, Box } from '@mui/material';
import { USER_ROLES } from '@/utils/constants';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    console.log('ProtectedRoute:', {
      path: location.pathname,
      isAuthenticated,
      userRole: user?.role,
      allowedRoles,
      hasAccess: allowedRoles.length === 0 || allowedRoles.includes(user?.role)
    });
  }, [location.pathname, isAuthenticated, user?.role, allowedRoles]);

  if (!isAuthenticated) {
    console.log('ProtectedRoute: Not authenticated, redirecting to /auth');
    return <Navigate to="/auth" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    console.log('ProtectedRoute: Role mismatch, redirecting to correct dashboard');
    // Redirect to the user's correct dashboard instead of /unauthorized
    const correctDashboard = user?.role === USER_ROLES.ADMIN ? '/admin/dashboard'
      : user?.role === USER_ROLES.DOCTOR ? '/doctor/dashboard'
        : user?.role === USER_ROLES.PATIENT ? '/patient/dashboard'
          : '/auth';
    return <Navigate to={correctDashboard} replace />;
  }

  return children;
};

export default ProtectedRoute;