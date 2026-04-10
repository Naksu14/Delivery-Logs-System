import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import deliverySocketService, { DELIVERY_SOCKET_EVENTS } from '../../../services/deliverySocketService';
import {
  getDeliveryNotificationState,
  markDeliveryNotificationStateSeen,
} from '../../../services/deliveriesServices';

const AdminRealtimeContext = createContext(null);

function updateDeliveryListCache(data, eventType, payload) {
  if (!data || !Array.isArray(data.items)) return data;

  if (eventType === DELIVERY_SOCKET_EVENTS.CREATED && payload?.delivery) {
    const incoming = payload.delivery;
    const exists = data.items.some((item) => item?.id === incoming?.id);
    const nextItems = exists
      ? data.items.map((item) => (item?.id === incoming?.id ? incoming : item))
      : [incoming, ...data.items];

    const nextTotalItems = Number(data?.meta?.totalItems || 0) + (exists ? 0 : 1);

    return {
      ...data,
      items: nextItems,
      meta: {
        ...data.meta,
        totalItems: nextTotalItems,
      },
    };
  }

  if (eventType === DELIVERY_SOCKET_EVENTS.UPDATED && payload?.delivery) {
    const incoming = payload.delivery;
    return {
      ...data,
      items: data.items.map((item) => (item?.id === incoming?.id ? incoming : item)),
    };
  }

  if (eventType === DELIVERY_SOCKET_EVENTS.DELETED && payload?.id) {
    const hadItem = data.items.some((item) => item?.id === payload.id);
    const nextTotalItems = Math.max(0, Number(data?.meta?.totalItems || 0) - (hadItem ? 1 : 0));

    return {
      ...data,
      items: data.items.filter((item) => item?.id !== payload.id),
      meta: {
        ...data.meta,
        totalItems: nextTotalItems,
      },
    };
  }

  return data;
}

export function AdminRealtimeProvider({ children }) {
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'info') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 4500);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const clearUnread = async () => {
    try {
      const nextState = await markDeliveryNotificationStateSeen();
      setUnreadCount(Number(nextState?.unread_count) || 0);
    } catch {
      setUnreadCount(0);
    }
  };

  useEffect(() => {
    let mounted = true;

    const syncNotificationState = async () => {
      try {
        const state = await getDeliveryNotificationState();
        if (!mounted) {
          return;
        }

        setUnreadCount(Number(state?.unread_count) || 0);
      } catch {
        if (mounted) {
          setUnreadCount(0);
        }
      }
    };

    syncNotificationState();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const socket = deliverySocketService.retain();
    let disposed = false;

    setIsConnected(socket.connected);

    const handleConnect = () => {
      setIsConnected(true);
    };

    const handleDisconnect = () => {
      if (disposed) return;
      setIsConnected(false);
      addToast('Realtime disconnected. Attempting to reconnect...', 'warning');
    };

    const handleReconnect = () => {
      setIsConnected(true);
      addToast('Realtime reconnected.', 'success');
      queryClient.invalidateQueries({ queryKey: ['deliveries'], refetchType: 'active' });
    };

    const handleRealtimeEvent = (eventType, payload, messageBuilder) => {
      queryClient.setQueriesData({ queryKey: ['deliveries'] }, (current) =>
        updateDeliveryListCache(current, eventType, payload)
      );

      queryClient.invalidateQueries({ queryKey: ['deliveries'], refetchType: 'active' });
      setUnreadCount((prev) => prev + 1);
      addToast(messageBuilder(payload), 'info');
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.io.on('reconnect', handleReconnect);

    const offCreated = deliverySocketService.on(DELIVERY_SOCKET_EVENTS.CREATED, (payload) => {
      handleRealtimeEvent(
        DELIVERY_SOCKET_EVENTS.CREATED,
        payload,
        (eventPayload) => `New delivery logged: ${eventPayload?.delivery?.company_name || 'Unknown company'}`
      );
    });

    const offUpdated = deliverySocketService.on(DELIVERY_SOCKET_EVENTS.UPDATED, (payload) => {
      handleRealtimeEvent(
        DELIVERY_SOCKET_EVENTS.UPDATED,
        payload,
        (eventPayload) => `Delivery updated ${eventPayload?.delivery?.company_name || '-'}`
      );
    });

    const offDeleted = deliverySocketService.on(DELIVERY_SOCKET_EVENTS.DELETED, (payload) => {
      handleRealtimeEvent(
        DELIVERY_SOCKET_EVENTS.DELETED,
        payload,
        (eventPayload) => `Delivery deleted ${eventPayload?.company_name || '-'}`
      );
    });

    return () => {
      disposed = true;
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.io.off('reconnect', handleReconnect);
      offCreated();
      offUpdated();
      offDeleted();
      deliverySocketService.release();
    };
  }, [queryClient]);

  const value = useMemo(
    () => ({
      isConnected,
      unreadCount,
      clearUnread,
      toasts,
      removeToast,
    }),
    [isConnected, unreadCount, toasts]
  );

  return <AdminRealtimeContext.Provider value={value}>{children}</AdminRealtimeContext.Provider>;
}

export function useAdminRealtime() {
  const context = useContext(AdminRealtimeContext);
  if (!context) {
    throw new Error('useAdminRealtime must be used within AdminRealtimeProvider');
  }
  return context;
}
