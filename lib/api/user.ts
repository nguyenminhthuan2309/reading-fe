import { ApiResponse, ApiResponseStatus } from '@/models/api';
import { patch, updateImage } from '@/lib/api/base';
import { post, get } from '@/lib/api/base';
import { Category, User, UserPreferences } from '@/models';

/**
 * Maximum allowed file size for avatar upload (1MB)
 */
export const MAX_AVATAR_SIZE = 1 * 1024 * 1024; // 1MB in bytes

// Query parameters for getting users
export interface GetUsersParams {
  page: number;
  limit: number;
  id?: string;
  email?: string;
  name?: string;
  status?: string;
  role?: string;
}

// Response type for user list
export interface GetUsersResponse {
  data: User[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
}

// Request body for creating a manager
export interface CreateManagerRequest {
  email: string;
  password: string;
  name: string;
}

/**
 * Upload user avatar
 * @param file The image file to upload
 * @returns ApiResponse with the uploaded file URL
 * @throws FileSizeError if file size exceeds the limit
 */
export async function uploadAvatar(file: File): Promise<ApiResponse<string>> {
  // Use the updateImage function with protected route option
  return await updateImage<string>(
    '/upload/image', 
    file
  );
}

/**
 * Get list of users with optional filters
 */
export async function getUsers(params: GetUsersParams): Promise<ApiResponse<GetUsersResponse>> {
  const queryParams = new URLSearchParams();
  
  // Add required params
  queryParams.append('page', params.page.toString());
  queryParams.append('limit', params.limit.toString());
  
  // Add optional params if they exist
  if (params.id) queryParams.append('id', params.id);
  if (params.email) queryParams.append('email', params.email);
  if (params.name) queryParams.append('name', params.name);
  if (params.status) queryParams.append('status', params.status);
  if (params.role) queryParams.append('role', params.role);
  
  return await get<GetUsersResponse>(`/user?${queryParams.toString()}`);
}

/**
 * Create a new manager account
 */
export async function createManager(data: CreateManagerRequest): Promise<ApiResponse<User>> {
  return await post<User>('/user/create-manager', data);
}

/**
 * Get the current user's notifications
 */
export async function getUserNotifications(): Promise<ApiResponse<any>> {
  return await get(
    '/user/notifications'
  );
}

/**
 * Mark a notification as read
 */
export async function markNotificationAsRead(notificationId: string): Promise<ApiResponse<any>> {
  return await post(
    `/user/notifications/${notificationId}/read`,
    {}
  );
}

/**
 * Get the current user status
 * @returns ApiResponse with the user status data
 */
export async function getUserStatus(): Promise<ApiResponse<any>> {
  return await get(
    '/user/status'
  );
}

/**
 * Get the user's favorite categories
 * @returns ApiResponse with the user's favorite categories
 */
export async function getUserFavoriteCategories(): Promise<ApiResponse<any>> {
  return await get(
    '/user/favorite/categories'
  );
}

/**
 * Get the user's settings
 * @returns ApiResponse with the user's settings data
 */
export async function getUserSettings(): Promise<ApiResponse<any>> {
  return await get(
    '/user/settings'
  );
}

/**
 * Update user notification settings
 */
export async function updateNotificationSettings(settings: any): Promise<ApiResponse<any>> {
  return await post(
    '/user/notification-settings',
    settings
  );
}

/**
 * Update the user's settings
 * @returns ApiResponse with the updated user settings
 */
export async function updateUserSettings(settings: any): Promise<ApiResponse<any>> {
  return await post(
    '/user/settings',
    settings
  );
}

/**
 * Get user information by ID
 * @param id User ID to retrieve
 * @returns ApiResponse with the user data
 */
export async function getUserById(id: string): Promise<ApiResponse<any>> {
  return await get(
    `/user/${id}`
  );
}

/**
 * Get the most active users (for leaderboards, etc.)
 * @returns ApiResponse with the most active users data
 */
export async function getMostActiveUsers(): Promise<ApiResponse<any>> {
  return await get(
    '/user/most-active'
  );
}

/**
 * Update user favorite genres
 * @param genres User preferences to update
 * @returns ApiResponse with the updated user preferences
 */
export async function updateUserFavorites(body: {userId?: number, categories: number[]}): Promise<ApiResponse<Category>> {
  return await post(
    '/user/favorite/categories',
    body
  );
}

/**
 * Update user status
 * @param userId User ID to update
 * @param status New status (3 for BANNED)
 * @returns ApiResponse with the updated user data
 */
export async function updateUserStatus(userId: number, statusId: number): Promise<ApiResponse<User>> {
  return await patch<User>(`/user/status/${userId}`, { statusId });
}
