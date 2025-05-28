import { NotificationType } from "@/lib/api/notification";

// Socket.io Event Types
export enum SocketEvent {
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  CONNECT_ERROR = 'connect_error',
  RECONNECT = 'reconnect',
  RECONNECT_ATTEMPT = 'reconnect_attempt',
  
  // Custom events
  NOTIFICATION = 'notification',
  USER_STATUS = 'user_status',

  // Notification events
  NOTIFICATION_DEPOSIT = 'tx_deposit',
  NOTIFICATION_PURCHASE = 'tx_purchase',
  NOTIFICATION_TRANSFER = 'tx_transfer',
  
  NOTIFICATION_BOOK_UPDATE = 'book_status',
  NOTIFICATION_BOOK_RATING = 'book_rating',
  NOTIFICATION_BOOK_FOLLOW = 'book_followed',
  NOTIFICATION_BOOK_PENDING_APPROVAL = 'book_pending_approval',

  NOTIFICATION_NEW_CHAPTER = 'chapter_added',
  NOTIFICATION_COMMENT = 'chapter_comment',
  NOTIFICATION_COMMENT_REPLY = 'chapter_comment_reply',

  NOTIFICATION_POINTS_EARNED = 'points_earned',
}


// Notification payload
export interface NotificationPayload {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: number;
  data?: any;
  read?: boolean;
}

