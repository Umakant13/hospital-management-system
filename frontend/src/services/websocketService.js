import { io } from 'socket.io-client';
import { TOKEN_KEY } from '@/utils/constants';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
  }

  connect(userId) {
    const token = localStorage.getItem(TOKEN_KEY);

    console.log('🔌 WebSocketService: Attempting to connect with userId:', userId);
    console.log('🔌 WebSocketService: Token exists:', !!token);

    this.socket = io('https://hospital-management-system-zt8o.onrender.com', {
      path: '/ws/socket.io',
      auth: {
        user_id: userId,
        token: token,
      },
      transports: ['websocket', 'polling'],
    });

    this.socket.on('connect', () => {
      console.log('✅ WebSocketService: Connected successfully!');
      console.log('✅ WebSocketService: Socket ID:', this.socket.id);
      console.log('✅ WebSocketService: User ID:', userId);
    });

    this.socket.on('disconnect', () => {
      console.log('❌ WebSocketService: Disconnected');
    });

    this.socket.on('notification', (data) => {
      console.log('🔔 WebSocketService: Notification received!', data);
      this.notifyListeners('notification', data);
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ WebSocketService: Connection error:', error);
      console.error('❌ WebSocketService: Error message:', error.message);
      console.error('❌ WebSocketService: Error type:', error.type);
    });

    this.socket.on('error', (error) => {
      console.error('❌ WebSocketService: Socket error:', error);
    });
  }

  disconnect() {
    if (this.socket) {
      console.log('🔌 WebSocketService: Disconnecting...');
      this.socket.disconnect();
      this.socket = null;
    }
  }

  on(event, callback) {
    console.log('📝 WebSocketService: Registering listener for event:', event);
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    console.log('📝 WebSocketService: Removing listener for event:', event);
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  notifyListeners(event, data) {
    console.log('📢 WebSocketService: Notifying listeners for event:', event, 'Data:', data);
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      console.log('📢 WebSocketService: Found', callbacks.length, 'listeners');
      this.listeners.get(event).forEach(callback => callback(data));
    } else {
      console.warn('⚠️ WebSocketService: No listeners registered for event:', event);
    }
  }

  isConnected() {
    const connected = this.socket && this.socket.connected;
    console.log('🔍 WebSocketService: Connection status:', connected);
    return connected;
  }
}

export const websocketService = new WebSocketService();
