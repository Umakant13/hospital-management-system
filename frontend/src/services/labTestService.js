import api from './api';

export const labTestService = {
  // Get all lab tests
  getAllLabTests: async (params = {}) => {
    const response = await api.get('/lab-tests/', { params });
    return response.data;
  },

  // Get test by ID
  getLabTestById: async (testId) => {
    const response = await api.get(`/lab-tests/${testId}`);
    return response.data;
  },

  // Create lab test
  createLabTest: async (testData) => {
    const response = await api.post('/lab-tests/', testData);
    return response.data;
  },

  // Update lab test
  updateLabTest: async (testId, testData) => {
    const response = await api.put(`/lab-tests/${testId}`, testData);
    return response.data;
  },

  // Delete lab test
  deleteLabTest: async (testId) => {
    const response = await api.delete(`/lab-tests/${testId}`);
    return response.data;
  },

  // Get test status distribution
  getStatusDistribution: async () => {
    const response = await api.get('/lab-tests/analytics/status-distribution/');
    return response.data;
  },
};