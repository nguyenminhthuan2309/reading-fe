import { get, patch, del } from './base';
import { ApiResponse, PaginatedApiResponse, PaginatedData } from '@/models/api';

export type NotificationType = 
  | 'BOOK_UPDATED' 
  | 'BOOK_CHAPTER_ADDED' 
  | 'BOOK_FOLLOWED' 
  | 'BOOK_RATING' 
  | 'COMMENT_REPLY' 
  | 'CHAPTER_COMMENT' 
  | 'TX_SUCCESS' 
  | 'TX_FAILED'
  | 'POINTS_EARNED';

export interface NotificationQueryParams {
  limit?: number;
  page?: number;
  type?: NotificationType;
  isRead?: boolean;
  sortBy?: 'createdAt' | 'readAt';
  sortDirection?: 'ASC' | 'DESC';
}

export interface NotificationResponse {
  
}

export interface Notification<T> {
    createdAt: string;
    data: T;
    expiresAt: string;
    id: string;
    isRead: boolean;
    message: string;
    readAt: string | null;
    title: string;
    type: string;
}

/**
 * Get notifications with optional filtering
 */
export async function getNotifications(params: NotificationQueryParams = {}): Promise<ApiResponse<PaginatedData<Notification<any>>>> {
  const {
    limit = 10,
    page = 1,
    type,
    isRead,
    sortBy = 'createdAt',
    sortDirection = 'DESC'
  } = params;

  const queryParams = new URLSearchParams();
  queryParams.append('limit', String(limit));
  queryParams.append('page', String(page));
  
  if (type) {
    queryParams.append('type', type);
  }
  
  if (isRead !== undefined) {
    queryParams.append('isRead', String(isRead));
  }
  
  queryParams.append('sortBy', sortBy);
  queryParams.append('sortDirection', sortDirection);

  return get<PaginatedData<Notification<any>>>(`/notification?${queryParams.toString()}`);

}

/**
 * Get unread notification count
 */
export async function getNotificationCount(): Promise<ApiResponse<number>> {
 return get<number>(`/notification/count`);
}

/**
 * Mark a notification as read
 */
export async function markNotificationAsRead(notificationId: string): Promise<ApiResponse<{ success: boolean }>> {
  return patch<{ success: boolean }, {}>(`/notification/${notificationId}/read`, {});
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsAsRead(): Promise<ApiResponse<{ success: boolean }>> {
  return patch<{ success: boolean }, {}>('/notification/read-all', {});
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: string): Promise<ApiResponse<{ success: boolean }>> {
  return del<{ success: boolean }>(`/notification/${notificationId}`);
}

/**
 * Delete all notifications
 */
export async function deleteAllNotifications(): Promise<ApiResponse<{ success: boolean }>> {
  return del<{ success: boolean }>('/notification');
} 