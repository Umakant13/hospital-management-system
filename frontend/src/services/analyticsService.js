import api from './api';

export const analyticsService = {
    // Get overall system analytics
    getOverview: async () => {
        const response = await api.get('/analytics/overview');
        return response.data;
    },

    // Get patient demographics
    getPatientDemographics: async () => {
        const response = await api.get('/analytics/patient-demographics');
        return response.data;
    },

    // Get appointment trends
    getAppointmentTrends: async (days = 30) => {
        const response = await api.get(`/analytics/appointment-trends?days=${days}`);
        return response.data;
    },

    // Get doctor performance
    getDoctorPerformance: async () => {
        const response = await api.get('/analytics/doctor-performance');
        return response.data;
    },

    // Get revenue analytics
    getRevenueAnalytics: async (startDate, endDate) => {
        const params = {};
        if (startDate) params.start_date = startDate;
        if (endDate) params.end_date = endDate;

        const response = await api.get('/analytics/revenue-analytics', { params });
        return response.data;
    },
};
