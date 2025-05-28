import { ApiResponse, ApiResponseStatus, PaginatedData } from '@/models/api';
import { patch, updateImage } from '@/lib/api/base';
import { post, get } from '@/lib/api/base';
import { Category, User, UserPreferences } from '@/models';
import { Activity } from '@/lib/hooks/useActivities';
import { UserStatisticsResponse, AnalyticsTimeRangeParams } from '@/models/analytics';
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

// Query parameters for getting activities
export interface GetActivitiesParams {
  type?: string;
  date?: string;
  startDate?: string;
  endDate?: string;
  earnedPoint?: number;
  isEarnedPoint?: boolean;
  userId?: number;
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

/**
 * Search users by name
 * @param name Name to search for
 * @returns ApiResponse with the users data
 */
export async function searchUsersByName(name: string, page: number = 1, limit: number = 10): Promise<ApiResponse<PaginatedData<User>>> {
  return await get(`/user/search?search=${name}&page=${page}&limit=${limit}`);
}

/**
 * Add a recent search to user's search history
 * @param searchType Type of search (book, author, etc)
 * @param searchValue The search term
 * @returns ApiResponse with success status
 */
export async function addRecentSearch(searchType: string, searchValue: string): Promise<ApiResponse<{ success: boolean }>> {
  return await post('/user/recent-searches', {
    searchType,
    searchValue,
  });
}

/**
 * Get user's recent searches
 * @param limit Maximum number of recent searches to retrieve
 * @returns ApiResponse with recent searches data
 */
export async function getRecentSearches(limit: number = 5): Promise<ApiResponse<Array<{ id: number; searchType: string; searchValue: string; createdAt: string }>>> {
  return await get(`/user/recent-searches?limit=${limit}`);
}

/**
 * Get available activities/missions for the user
 * @returns ApiResponse with the user's available activities/missions
 */
export async function getAvailableActivities(): Promise<ApiResponse<Activity[]>> {
  return await get('activities/available');
}

/**
 * Get user activities with optional filters
 * @param params Optional query parameters for filtering activities
 * @returns ApiResponse with the user's activities
 */
export async function getUserActivities(params?: GetActivitiesParams): Promise<ApiResponse<Activity[]>> {
  const queryParams = new URLSearchParams();
  
  // Add optional params if they exist
  if (params?.type) queryParams.append('type', params.type);
  if (params?.date) queryParams.append('date', params.date);
  if (params?.startDate) queryParams.append('startDate', params.startDate);
  if (params?.endDate) queryParams.append('endDate', params.endDate);
  if (params?.earnedPoint !== undefined) queryParams.append('earnedPoint', params.earnedPoint.toString());
  if (params?.isEarnedPoint !== undefined) queryParams.append('isEarnedPoint', params.isEarnedPoint.toString());
  if (params?.userId !== undefined) queryParams.append('userId', params.userId.toString());
  
  const queryString = queryParams.toString();
  return await get<Activity[]>(`activities${queryString ? `?${queryString}` : ''}`);
}

/**
 * Create a new user activity/mission
 * @param activityType Type of activity (e.g., 'login', 'view', 'rate', etc.)
 * @returns ApiResponse with the created activity data
 */
export async function createNewActivity(activityType: string, relatedEntityId?: number): Promise<ApiResponse<any>> {
  return await post('activities', { activityType, relatedEntityId });
}

/**
 * Get user statistics (overview + chart data)
 */
export async function getUserStatistics(params: AnalyticsTimeRangeParams): Promise<ApiResponse<UserStatisticsResponse>> {
  const queryParams = new URLSearchParams();
  
  // Add period parameter
  if (params.period) {
    queryParams.append('period', params.period);
  }
  
  // Add date range parameters
  if (params.startDate) {
    queryParams.append('startDate', params.startDate);
  }
  if (params.endDate) {
    queryParams.append('endDate', params.endDate);
  }
  
  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
  
  return get<UserStatisticsResponse>(`/user/statistics${queryString}`);
}

// Get user ballance
export async function getUserBallance(): Promise<ApiResponse<Partial<User>>> {
  return get<Partial<User>>(`/user/balance`);
}
