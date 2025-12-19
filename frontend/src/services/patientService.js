import api from './api';

export const patientService = {
  // Get current patient's profile
  getMyProfile: async () => {
    const response = await api.get('/patients/me/profile/');
    return response.data;
  },



  // Get all patients
  getAllPatients: async (params = {}) => {
    const response = await api.get('/patients/', { params });
    return response.data;
  },

  // Get patient by ID
  getPatientById: async (patientId) => {
    const response = await api.get(`/patients/${patientId}`);
    return response.data;
  },

  // Create patient
  createPatient: async (patientData) => {
    const response = await api.post('/patients/', patientData);
    return response.data;
  },

  // Update patient
  updatePatient: async (patientId, patientData) => {
    const response = await api.put(`/patients/${patientId}`, patientData);
    return response.data;
  },

  // Delete patient
  deletePatient: async (patientId) => {
    const response = await api.delete(`/patients/${patientId}`);
    return response.data;
  },

  // Get BMI distribution
  getBMIDistribution: async () => {
    const response = await api.get('/patients/analytics/bmi-distribution/');
    return response.data;
  },

  // Get age distribution
  getAgeDistribution: async () => {
    const response = await api.get('/patients/analytics/age-distribution/');
    return response.data;
  },
};