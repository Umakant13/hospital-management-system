import api from './api';

const staffService = {
    // Get all staff with filters
    getAllStaff: async (params = {}) => {
        const queryParams = new URLSearchParams();

        if (params.skip !== undefined) queryParams.append('skip', params.skip);
        if (params.limit !== undefined) queryParams.append('limit', params.limit);
        if (params.category) queryParams.append('category', params.category);
        if (params.department_id) queryParams.append('department_id', params.department_id);
        if (params.search) queryParams.append('search', params.search);
        if (params.employment_type) queryParams.append('employment_type', params.employment_type);
        if (params.is_active !== undefined) queryParams.append('is_active', params.is_active);

        const response = await api.get(`/staff?${queryParams.toString()}`);
        return response.data;
    },

    // Get staff by ID
    getStaffById: async (staffId) => {
        const response = await api.get(`/staff/${staffId}`);
        return response.data;
    },

    // Create new staff
    createStaff: async (staffData) => {
        const response = await api.post('/staff', staffData);
        return response.data;
    },

    // Update staff
    updateStaff: async (staffId, staffData) => {
        const response = await api.put(`/staff/${staffId}`, staffData);
        return response.data;
    },

    // Delete staff
    deleteStaff: async (staffId) => {
        const response = await api.delete(`/staff/${staffId}`);
        return response.data;
    },

    // Get staff analytics
    getStaffAnalytics: async () => {
        const response = await api.get('/staff/analytics/performance');
        return response.data;
    },
};

export default staffService;
