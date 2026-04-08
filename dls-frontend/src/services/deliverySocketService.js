import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || 'http://localhost:3014';

export const DELIVERY_SOCKET_EVENTS = {
  CREATED: 'delivery.created',
  UPDATED: 'delivery.updated',
  DELETED: 'delivery.deleted',
  PING: 'delivery.ping',
  PONG: 'delivery.pong',
};

class DeliverySocketService {
  socket = null;

  connect() {
    if (this.socket) {
      return this.socket;
    }

    this.socket = io(`${SOCKET_URL}/deliveries`, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 8000,
      timeout: 10000,
      withCredentials: true,
      autoConnect: true,
    });

    return this.socket;
  }

  disconnect() {
    if (!this.socket) return;
    this.socket.removeAllListeners();
    this.socket.disconnect();
    this.socket = null;
  }

  on(event, handler) {
    const socket = this.connect();
    socket.on(event, handler);
    return () => {
      socket.off(event, handler);
    };
  }

  emit(event, payload) {
    const socket = this.connect();
    socket.emit(event, payload);
  }

  getSocket() {
    return this.connect();
  }
}

const deliverySocketService = new DeliverySocketService();

export default deliverySocketService;
