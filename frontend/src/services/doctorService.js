import api from './api';

export const doctorService = {
  // Get all doctors
  getAllDoctors: async (params = {}) => {
    const response = await api.get('/doctors', { params });
    return response.data;
  },

  // Get current doctor profile
  getProfile: async () => {
    const response = await api.get('/doctors/me/profile');
    return response.data;
  },

  // Get doctor by ID
  getDoctorById: async (doctorId) => {
    const response = await api.get(`/doctors/${doctorId}`);
    return response.data;
  },

  // Create doctor
  createDoctor: async (doctorData) => {
    const response = await api.post('/doctors', doctorData);
    return response.data;
  },

  // Update doctor
  updateDoctor: async (doctorId, doctorData) => {
    const response = await api.put(`/doctors/${doctorId}`, doctorData);
    return response.data;
  },

  // Delete doctor
  deleteDoctor: async (doctorId) => {
    const response = await api.delete(`/doctors/${doctorId}`);
    return response.data;
  },

  // Get doctor schedule
  getDoctorSchedule: async (doctorId, date) => {
    const response = await api.get(`/doctors/${doctorId}/schedule`, {
      params: { date },
    });
    return response.data;
  },

  // Get doctor patients
  getDoctorPatients: async (doctorId) => {
    const response = await api.get('/patients', {
      params: { doctor_id: doctorId }
    });
    return response.data;
  },

  // Get doctor performance
  getDoctorPerformance: async (params = {}) => {
    const response = await api.get('/doctors/analytics/performance', { params });
    return response.data;
  },
  // Rate doctor
  rateDoctor: async (doctorId, rating) => {
    const response = await api.post(`/doctors/${doctorId}/rate`, null, {
      params: { rating },
    });
    return response.data;
  },

  // Get doctor reviews
  getDoctorReviews: async (doctorId) => {
    const response = await api.get(`/doctors/${doctorId}/reviews`);
    return response.data;
  },
};