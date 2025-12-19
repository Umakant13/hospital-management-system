import api from './api';

export const userService = {
  // Get all users (Admin only)
  getAllUsers: async (params = {}) => {
    const response = await api.get('/users/', { params });
    return response.data;
  },

  // Get user by ID
  getUserById: async (userId) => {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  },

  // Create user
  createUser: async (userData) => {
    const response = await api.post('/users/', userData);
    return response.data;
  },

  // Update user
  updateUser: async (userId, userData) => {
    const response = await api.put(`/users/${userId}`, userData);
    return response.data;
  },

  // Delete user
  deleteUser: async (userId) => {
    const response = await api.delete(`/users/${userId}`);
    return response.data;
  },

  // Activate user
  activateUser: async (userId) => {
    const response = await api.post(`/users/${userId}/activate`);
    return response.data;
  },

  // Deactivate user
  deactivateUser: async (userId) => {
    const response = await api.post(`/users/${userId}/deactivate`);
    return response.data;
  },

  // Toggle user active status
  toggleUserActive: async (userId) => {
    const response = await api.post(`/users/${userId}/toggle-active`);
    return response.data;
  },

  // Change password
  changePassword: async (currentPassword, newPassword) => {
    const response = await api.post('/users/change-password/', {
      current_password: currentPassword,
      new_password: newPassword,
    });
    return response.data;
  },
};