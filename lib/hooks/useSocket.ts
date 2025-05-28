'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { 
  disconnectSocket, 
  initSocket, 
  subscribeToNotifications, 
} from '@/lib/api/socket';
import { useUserStore } from '@/lib/store';
import { Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { NOTIFICATION_QUERY_KEYS } from './useNotifications';
import { toast } from 'sonner';
import { AUTH_KEYS, USER_KEYS } from '../constants/query-keys';

interface UseSocketOptions {
  autoConnect?: boolean;
  namespace?: string;
  enableNotifications?: boolean;
}

interface UseSocketReturn {
  socket: Socket | null;
  connected: boolean;
  connect: () => void;
  disconnect: () => void;
}

export function useSocket(options: UseSocketOptions = {}): UseSocketReturn {
  const { 
    autoConnect = true, 
    namespace = '', 
    enableNotifications = true 
  } = options;
  
  const [connected, setConnected] = useState(false);
  const socket = useRef<Socket | null>(null);
  const user = useUserStore((state) => state.user);
  const isLoggedIn = useUserStore((state) => state.isLoggedIn);
  const queryClient = useQueryClient();
  
  // Connect to socket
  const connect = useCallback(() => {
    if (!socket.current && isLoggedIn) {
      socket.current = initSocket(namespace);
      
      // Update connected state based on socket status
      socket.current.on('connect', () => {
        setConnected(true);
        console.log(`Socket connected to ${namespace || 'default'} namespace`);
      });
      
      socket.current.on('disconnect', () => {
        setConnected(false);
        console.log(`Socket disconnected from ${namespace || 'default'} namespace`);
      });
    }
  }, [isLoggedIn, namespace]);
  
  // Disconnect from socket
  const disconnect = useCallback(() => {
    disconnectSocket(namespace);
    socket.current = null;
    setConnected(false);
  }, [namespace]);
  
  // Auto connect on mount if enabled
  useEffect(() => {
    if (autoConnect && isLoggedIn) {
      connect();
    }
    
    // Clean up on unmount
    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect, isLoggedIn]);
  
  // Handle notifications subscription
  useEffect(() => {
    if (!connected || !socket.current || !enableNotifications) return;
    
    // Subscribe to notifications and invalidate queries when new notifications arrive
    const unsubscribeNotifications = subscribeToNotifications((notification) => {


      // Check for browser notification permission
      if (Notification.permission === 'granted') {
        console.log('Notification permission granted');
        new Notification(notification.title, {
          body: notification.message,
        });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then((permission) => {
          if (permission === 'granted') {
            new Notification(notification.title, {
              body: notification.message,
            });
            
          }
        });
      }

      // If points earned, update the points in the query cache
      if (notification.type === 'POINTS_EARNED') {
        console.log('Invalidating user balance', user?.id);
        queryClient.invalidateQueries({ queryKey: USER_KEYS.BALANCE(Number(user?.id)) });
      }
      
      // Invalidate notification queries to refresh data
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_QUERY_KEYS.all });
      
    }, 'notification');
    
    // Clean up subscriptions
    return () => {
      unsubscribeNotifications();
    };
  }, [connected, enableNotifications, queryClient]);
  
  return {
    socket: socket.current,
    connected,
    connect,
    disconnect,
  };
} 