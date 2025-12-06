import api from './api';

export const prescriptionService = {
  // Get all prescriptions
  getAllPrescriptions: async (params = {}) => {
    const response = await api.get('/prescriptions/', { params });
    return response.data;
  },

  // Get prescription by ID
  getPrescriptionById: async (prescriptionId) => {
    const response = await api.get(`/prescriptions/${prescriptionId}`);
    return response.data;
  },

  // Create prescription
  createPrescription: async (prescriptionData) => {
    const response = await api.post('/prescriptions/', prescriptionData);
    return response.data;
  },

  // Update prescription
  updatePrescription: async (prescriptionId, prescriptionData) => {
    const response = await api.put(`/prescriptions/${prescriptionId}`, prescriptionData);
    return response.data;
  },

  // Delete prescription
  deletePrescription: async (prescriptionId) => {
    const response = await api.delete(`/prescriptions/${prescriptionId}`);
    return response.data;
  },
};
