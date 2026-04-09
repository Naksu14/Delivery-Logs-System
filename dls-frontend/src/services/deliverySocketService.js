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
  retainCount = 0;
  releaseTimer = null;

  connect() {
    if (this.releaseTimer) {
      clearTimeout(this.releaseTimer);
      this.releaseTimer = null;
    }

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

  retain() {
    this.retainCount += 1;
    return this.connect();
  }

  release() {
    this.retainCount = Math.max(0, this.retainCount - 1);

    if (this.retainCount > 0) {
      return;
    }

    if (this.releaseTimer) {
      clearTimeout(this.releaseTimer);
    }

    // Delay disconnect to absorb React StrictMode mount/unmount cycles in dev.
    this.releaseTimer = setTimeout(() => {
      if (this.retainCount > 0 || !this.socket) {
        this.releaseTimer = null;
        return;
      }

      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
      this.releaseTimer = null;
    }, 300);
  }

  disconnect() {
    this.retainCount = 0;

    if (this.releaseTimer) {
      clearTimeout(this.releaseTimer);
      this.releaseTimer = null;
    }

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
