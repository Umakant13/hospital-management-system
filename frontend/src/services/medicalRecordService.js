import api from './api';

export const medicalRecordService = {
  // Get all medical records
  getAllRecords: async (params = {}) => {
    const response = await api.get('/medical-records', { params });
    return response.data;
  },

  // Get record by ID
  getRecordById: async (recordId) => {
    const response = await api.get(`/medical-records/${recordId}`);
    return response.data;
  },

  // Create medical record
  createRecord: async (recordData) => {
    const response = await api.post('/medical-records/', recordData);
    return response.data;
  },

  // Update medical record
  updateRecord: async (recordId, recordData) => {
    const response = await api.put(`/medical-records/${recordId}`, recordData);
    return response.data;
  },

  // Delete medical record
  deleteRecord: async (recordId) => {
    const response = await api.delete(`/medical-records/${recordId}`);
    return response.data;
  },

  // Get patient medical history
  getPatientHistory: async (patientId) => {
    const response = await api.get(`/medical-records/patient/${patientId}/history`);
    return response.data;
  },
};