import { LoginCredentials, SigninResponse, SignupCredentials, User } from '@/models';
import { get, post, put } from '../api';
import { ApiResponse } from '@/models/api';



/**
 * Login a user with email and password
 */
export async function login(credentials: LoginCredentials): Promise<ApiResponse<SigninResponse>> {
  return post<SigninResponse>('/auth/login', credentials);
}

/**
 * Register a new user
 */
export async function signup(credentials: SignupCredentials): Promise<ApiResponse<User>> {
  return post<User>('/user/register', credentials);
}

/**
 * Get the current user's profile
 */
export async function getCurrentUser(token: string | undefined): Promise<ApiResponse<User>> {
  return get<User>('/user/detail', { token, isProtectedRoute: true });
}

/**
 * Get the current user's profile
 */
export async function getUserById(id: string): Promise<ApiResponse<User>> {
  return get<User>(`/user/${id}`);
}

/**
 * Update user preferences
 */
export async function updateUserPreferences(genres: string[], token: string): Promise<ApiResponse<User>> {
  return post<User, { genres: string[] }>('/user/preferences', { genres }, { token, isProtectedRoute: true });
}

/**
 * Update user profile
 */
export async function updateUserProfile(id: string, data: Partial<User>, token: string | undefined): Promise<ApiResponse<User>> {
  return put<User>(`/user/${id}`, data, { token, isProtectedRoute: true });
}

/**
 * Resend verification email
 */
export async function resendVerificationEmail(email: string): Promise<ApiResponse<{ success: boolean }>> {
  return post<{ success: boolean }>('/user/resend-verification', { email });
}

/**
 * Verify email with token
 */
export async function verifyEmail(token: string): Promise<ApiResponse<{ success: boolean }>> {
  return get<{ success: boolean }>(`/user/verify?token=${encodeURIComponent(token)}`);
}
