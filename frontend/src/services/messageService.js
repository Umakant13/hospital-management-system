import api from './api';

export const messageService = {
  // Get all messages (both sent and received)
  getAllMessages: async () => {
    const response = await api.get('/messages/');
    return response.data;
  },

  // Get inbox messages (received by current user)
  getInbox: async () => {
    const response = await api.get('/messages/');
    return response.data;
  },

  // Get sent messages (sent by current user)
  getSent: async () => {
    const response = await api.get('/messages/');
    return response.data;
  },

  // Get message by ID
  getMessageById: async (messageId) => {
    const response = await api.get(`/messages/${messageId}`);
    return response.data;
  },

  // Send message
  sendMessage: async (messageData) => {
    const response = await api.post('/messages/', messageData);
    return response.data;
  },

  // Reply to message
  replyToMessage: async (messageId, replyData) => {
    const response = await api.post(`/messages/${messageId}/reply`, replyData);
    return response.data;
  },

  // Get unread count
  getUnreadCount: async () => {
    const response = await api.get('/messages/inbox/unread-count');
    return response.data;
  },

  // Archive message
  archiveMessage: async (messageId) => {
    const response = await api.put(`/messages/${messageId}/archive`);
    return response.data;
  },

  // Delete message
  deleteMessage: async (messageId) => {
    const response = await api.delete(`/messages/${messageId}`);
    return response.data;
  },

  // Mark message as read
  markMessageAsRead: async (messageId) => {
    const response = await api.post(`/messages/${messageId}/mark-read`);
    return response.data;
  },
};
