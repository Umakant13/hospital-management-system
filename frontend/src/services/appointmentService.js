import api from './api';

export const appointmentService = {
  // Get all appointments
  getAllAppointments: async (params = {}) => {
    const response = await api.get('/appointments', { params });
    return response.data;
  },

  // Get appointment by ID
  getAppointmentById: async (appointmentId) => {
    const response = await api.get(`/appointments/${appointmentId}`);
    return response.data;
  },

  // Create appointment
  createAppointment: async (appointmentData) => {
    const response = await api.post('/appointments', appointmentData);
    return response.data;
  },

  // Update appointment
  updateAppointment: async (appointmentId, appointmentData) => {
    const response = await api.put(`/appointments/${appointmentId}`, appointmentData);
    return response.data;
  },

  // Cancel appointment
  cancelAppointment: async (appointmentId, reason) => {
    const response = await api.post(`/appointments/${appointmentId}/cancel`, {
      cancelled_reason: reason,
    });
    return response.data;
  },

  // Delete appointment
  deleteAppointment: async (appointmentId) => {
    const response = await api.delete(`/appointments/${appointmentId}`);
    return response.data;
  },

  // Get upcoming appointments
  getUpcomingAppointments: async (days = 7) => {
    const response = await api.get('/appointments/upcoming', { params: { days } });
    return response.data;
  },

  // Get appointment status distribution
  getStatusDistribution: async (params = {}) => {
    const response = await api.get('/appointments/analytics/status-distribution', { params });
    return response.data;
  },
};