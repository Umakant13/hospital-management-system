import { useState, useEffect } from 'react';
import { websocketService } from '@/services/websocketService';
import { useAuthStore } from '@/store/authStore';
import api from '@/services/api';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuthStore();

  useEffect(() => {
    if (user) {
      console.log('useNotifications: Connecting WebSocket for user', user.id);
      // Connect WebSocket
      websocketService.connect(user.id);

      // Fetch initial notifications
      fetchNotifications();
      fetchUnreadCount();

      // Listen for new notifications
      const handleNotification = (data) => {
        console.log('useNotifications: Received notification', data);
        setNotifications((prev) => [data, ...prev]);
        setUnreadCount((prev) => prev + 1);
      };

      websocketService.on('notification', handleNotification);

      return () => {
        console.log('useNotifications: Disconnecting WebSocket');
        websocketService.off('notification', handleNotification);
        websocketService.disconnect();
      };
    } else {
      console.log('useNotifications: No user found, skipping connection');
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/notifications');
      setNotifications(response.data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await api.get('/notifications/unread-count');
      setUnreadCount(response.data.unread_count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await api.put(`/notifications/${notificationId}/read`);
      // Remove the notification from state (it's deleted on backend)
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/mark-all-read');
      // Remove all unread notifications from state (they're deleted on backend)
      setNotifications((prev) => prev.filter((n) => n.is_read));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await api.delete(`/notifications/${notificationId}`);
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh: fetchNotifications,
  };
};