import api from './api';

const videoConsultationService = {
    // Get all video consultations
    getAllConsultations: async (statusFilter = null) => {
        const params = statusFilter ? { status_filter: statusFilter } : {};
        const response = await api.get('/video-consultations/', { params });
        return response.data;
    },

    // Get consultation by ID
    getConsultationById: async (id) => {
        const response = await api.get(`/video-consultations/${id}`);
        return response.data;
    },

    // Create new video consultation
    createConsultation: async (data) => {
        const response = await api.post('/video-consultations/', data);
        return response.data;
    },

    // Start consultation
    startConsultation: async (id) => {
        const response = await api.put(`/video-consultations/${id}/start`);
        return response.data;
    },

    // End consultation
    endConsultation: async (id, notes = null) => {
        const response = await api.put(`/video-consultations/${id}/end`, { notes });
        return response.data;
    },

    // Update consultation
    updateConsultation: async (id, data) => {
        const response = await api.put(`/video-consultations/${id}`, data);
        return response.data;
    },

    // Cancel consultation
    cancelConsultation: async (id) => {
        const response = await api.delete(`/video-consultations/${id}`);
        return response.data;
    },
};

export default videoConsultationService;
