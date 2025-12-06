import api from './api';

export const billingService = {
  // Get all bills
  getAllBills: async (params = {}) => {
    const response = await api.get('/billing', { params });
    return response.data;
  },

  // Get bill by ID
  getBillById: async (billId) => {
    const response = await api.get(`/billing/${billId}`);
    return response.data;
  },

  // Create bill
  createBill: async (billData) => {
    const response = await api.post('/billing', billData);
    return response.data;
  },

  // Update bill
  updateBill: async (billId, billData) => {
    const response = await api.put(`/billing/${billId}`, billData);
    return response.data;
  },

  // Add payment
  addPayment: async (billId, paymentData) => {
    const response = await api.post(`/billing/${billId}/payment`, paymentData);
    return response.data;
  },

  // Delete bill
  deleteBill: async (billId) => {
    const response = await api.delete(`/billing/${billId}`);
    return response.data;
  },

  // Get revenue analytics
  getRevenueAnalytics: async (params = {}) => {
    const response = await api.get('/billing/analytics/revenue', { params });
    return response.data;
  },
};