import { io, Socket } from 'socket.io-client';
import { 
  NotificationPayload, 
  SocketEvent, 
} from '@/models/socket';
import { useUserStore } from '@/lib/store';

// Socket instances by namespace
const socketInstances: Record<string, Socket> = {};

// API base URL from environment variables
const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_SOCKET_URL || 'http://localhost:3002';

/**
 * Initialize and connect to the Socket.io server with a specific namespace
 */
export function initSocket(namespace: string = ''): Socket {
  // Check if this namespace already has a socket instance
  if (socketInstances[namespace]) return socketInstances[namespace];
  
  // Get auth token and user ID from user store
  const { user } = useUserStore.getState();
  const userId = user?.id;

  // Form the full namespace URL path
  const namespacePath = namespace ? `${API_BASE_URL}/${namespace}` : API_BASE_URL;
  
  console.log(`Initializing socket connection to ${namespacePath}`);
  
  // Initialize socket with auth token for the given namespace
  const socket = io(namespacePath, {
    auth: {
      userId
    },
    transports: ['websocket', 'polling'],
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    timeout: 10000,
  });
  
  // Set up event listeners for connection events
  socket.on(SocketEvent.CONNECT, () => {
    console.log(`Socket connected to ${namespace || 'default'} namespace`);
  });
  
  socket.on(SocketEvent.DISCONNECT, (reason) => {
    console.log(`Socket disconnected from ${namespace || 'default'} namespace: ${reason}`);
  });
  
  socket.on(SocketEvent.CONNECT_ERROR, (error) => {
    console.error(`Socket connection error for ${namespace || 'default'} namespace:`, error);
  });
  
  socket.on(SocketEvent.RECONNECT_ATTEMPT, (attemptNumber) => {
    console.log(`Socket reconnection attempt #${attemptNumber} for ${namespace || 'default'} namespace`);
  });
  
  // Store the socket instance by namespace
  socketInstances[namespace] = socket;
  
  return socket;
}

/**
 * Get the socket instance, initializing it if necessary
 */
export function getSocket(namespace: string = ''): Socket {
  if (!socketInstances[namespace]) {
    return initSocket(namespace);
  }
  return socketInstances[namespace];
}

/**
 * Disconnect a specific namespace socket
 */
export function disconnectSocket(namespace: string = ''): void {
  if (socketInstances[namespace]) {
    console.log(`Disconnecting socket from ${namespace || 'default'} namespace`);
    socketInstances[namespace].disconnect();
    delete socketInstances[namespace];
  }
}

/**
 * Disconnect all socket connections
 */
export function disconnectAllSockets(): void {
  Object.keys(socketInstances).forEach(namespace => {
    console.log(`Disconnecting socket from ${namespace || 'default'} namespace`);
    socketInstances[namespace].disconnect();
    delete socketInstances[namespace];
  });
}

/**
 * Subscribe to notifications
 */
export function subscribeToNotifications(
  callback: (notification: NotificationPayload) => void, 
  namespace: string = 'notification'
): () => void {
  const socket = getSocket(namespace);

  socket.on(SocketEvent.NOTIFICATION_DEPOSIT, (data) => {
    console.log(`Received notification on ${namespace || 'default'} namespace:`, data);
    callback(data);
  });

  socket.on(SocketEvent.NOTIFICATION_PURCHASE, (data) => {
    console.log(`Received notification on ${namespace || 'default'} namespace:`, data);
    callback(data);
  });

  socket.on(SocketEvent.NOTIFICATION_NEW_CHAPTER, (data) => {
    console.log(`Received notification on ${namespace || 'default'} namespace:`, data);
    callback(data);
  });

  socket.on(SocketEvent.NOTIFICATION_BOOK_UPDATE, (data) => {
    console.log(`Received notification on ${namespace || 'default'} namespace:`, data);
    callback(data);
  });

  socket.on(SocketEvent.NOTIFICATION_BOOK_RATING, (data) => {
    console.log(`Received notification on ${namespace || 'default'} namespace:`, data);
    callback(data);
  });

  socket.on(SocketEvent.NOTIFICATION_BOOK_FOLLOW, (data) => {
    console.log(`Received notification on ${namespace || 'default'} namespace:`, data);
    callback(data);
  });

  socket.on(SocketEvent.NOTIFICATION_BOOK_PENDING_APPROVAL, (data) => {
    console.log(`Received notification on ${namespace || 'default'} namespace:`, data);
    callback(data);
  });

  socket.on(SocketEvent.NOTIFICATION_COMMENT, (data) => {
    console.log(`Received notification on ${namespace || 'default'} namespace:`, data);
    callback(data);
  });

  socket.on(SocketEvent.NOTIFICATION_COMMENT_REPLY, (data) => {
    console.log(`Received notification on ${namespace || 'default'} namespace:`, data);
    callback(data);
  });

  socket.on(SocketEvent.NOTIFICATION_POINTS_EARNED, (data) => {
    console.log(`Received notification on ${namespace || 'default'} namespace:`, data);
    callback(data);
  });
  
  
  return () => {
    console.log(`Unsubscribing from notifications on ${namespace || 'default'} namespace`);
    socket.off(SocketEvent.NOTIFICATION, callback);
  };
}
