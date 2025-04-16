import { SigninResponse, User } from '@/models';
import { get, post } from '../api';
import { ApiResponse, ApiResponseData } from '@/models/api';


export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials {
  name: string;
  email: string;
  password: string;
}

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
export async function getCurrentUser(token: string): Promise<ApiResponse<User>> {
  return get<User>('/user/me', { token });
}

/**
 * Update user preferences
 */
export async function updateUserPreferences(genres: string[], token: string): Promise<ApiResponse<User>> {
  return post<User, { genres: string[] }>('/user/preferences', { genres }, { token });
}

/**
 * Store the user's authentication data in localStorage
 */
export function storeAuthData(authData: SigninResponse): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('auth_token', authData.accessToken);
    localStorage.setItem('user', JSON.stringify(authData.user));
  }
}

/**
 * Get the user's authentication token from localStorage
 */
export function getAuthToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('auth_token');
  }
  return null;
}

/**
 * Get the user data from localStorage
 */
export function getStoredUser(): User | null {
  if (typeof window !== 'undefined') {
    const userJson = localStorage.getItem('user');
    if (userJson) {
      try {
        return JSON.parse(userJson);
      } catch (e) {
        return null;
      }
    }
  }
  return null;
}

/**
 * Clear user authentication data from localStorage
 */
export function clearAuthData(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
  }
}

/**
 * Check if the user is authenticated
 */
export function isAuthenticated(): boolean {
  return getAuthToken() !== null;
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