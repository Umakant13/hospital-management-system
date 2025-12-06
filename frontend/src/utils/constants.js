export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
export const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID;

// Currency Configuration
export const CURRENCY = {
  CODE: 'INR',
  SYMBOL: '₹',
  NAME: 'Indian Rupee',
};

// Format currency for display
export const formatCurrency = (amount) => {
  return `${CURRENCY.SYMBOL}${Number(amount).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export const USER_ROLES = {
  ADMIN: 'admin',
  DOCTOR: 'doctor',
  PATIENT: 'patient',
};

export const ROUTES = {
  HOME: '/',
  AUTH: '/auth',
  ADMIN_DASHBOARD: '/admin/dashboard',
  DOCTOR_DASHBOARD: '/doctor/dashboard',
  PATIENT_DASHBOARD: '/patient/dashboard',
  PROFILE: '/profile',
};

export const TOKEN_KEY = 'access_token';
export const REFRESH_TOKEN_KEY = 'refresh_token';
export const USER_KEY = 'user_data';