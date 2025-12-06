import api from './api';

export const departmentService = {
  // Get all departments
  getAllDepartments: async (params = {}) => {
    const response = await api.get('/departments', { params });
    return response.data;
  },

  // Get department by ID
  getDepartmentById: async (departmentId) => {
    const response = await api.get(`/departments/${departmentId}`);
    return response.data;
  },

  // Create department
  createDepartment: async (departmentData) => {
    const response = await api.post('/departments', departmentData);
    return response.data;
  },

  // Update department
  updateDepartment: async (departmentId, departmentData) => {
    const response = await api.put(`/departments/${departmentId}`, departmentData);
    return response.data;
  },

  // Delete department
  deleteDepartment: async (departmentId) => {
    const response = await api.delete(`/departments/${departmentId}`);
    return response.data;
  },

  // Get department doctors
  getDepartmentDoctors: async (departmentId) => {
    const response = await api.get(`/departments/${departmentId}/doctors`);
    return response.data;
  },

  // Assign doctor to department
  assignDoctor: async (departmentId, doctorId, isHead = false) => {
    const response = await api.post(`/departments/${departmentId}/assign-doctor`, null, {
      params: { doctor_id: doctorId, is_head: isHead }
    });
    return response.data;
  },

  // Remove doctor from department
  removeDoctor: async (departmentId, doctorId) => {
    const response = await api.delete(`/departments/${departmentId}/remove-doctor/${doctorId}`);
    return response.data;
  },

  // Get department stats
  getDepartmentStats: async () => {
    const response = await api.get('/departments/stats/overview');
    return response.data;
  }
};