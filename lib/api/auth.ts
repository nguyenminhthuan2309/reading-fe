import { LoginCredentials, SigninResponse, SignupCredentials, User, VerifyEmailResponse } from '@/models';
import { get, patch, post } from '../api';
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
export async function getCurrentUser(token?: string): Promise<ApiResponse<User>> {
  return get<User>('/user/me', { token });
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
export async function updateUserPreferences(genres: string[]): Promise<ApiResponse<User>> {
  return post<User, { genres: string[] }>('/user/preferences', { genres });
}

/**
 * Update user profile
 */
export async function updateUserProfile(id: string, data: Partial<User>): Promise<ApiResponse<User>> {
  return patch<User>(`/user`, data);
}

/**
 * Verify email with token
 */
export async function verifyEmail(token: string): Promise<ApiResponse<VerifyEmailResponse>> {
  return get<VerifyEmailResponse>(`/user/verify?token=${encodeURIComponent(token)}`);
}

/**
 * Request password reset (forgot password)
 * This will trigger the backend to send an OTP code to the user's email
 */
export async function forgotPassword(email: string): Promise<ApiResponse<{ success: boolean }>> {
  return post<{ success: boolean }, { email: string }>('/user/reset-password', { email });
}

/**
 * Verify OTP code for password reset
 */
export async function verifyResetPassword(email: string, otp: string): Promise<ApiResponse<{ success: boolean }>> {
  return post<{ success: boolean }, { email: string, otp: string }>(
    '/user/verify-reset-password',
    { email, otp }
  );
}

/**
 * Reset password with OTP verification
 */
export async function resetPasswordWithOtp(
  email: string,
  otp: string,
  password: string
): Promise<ApiResponse<{ success: boolean }>> {
  return post<{ success: boolean }, { email: string, otp: string, password: string }>(
    '/user/reset-password-confirm',
    { email, otp, password }
  );
}

/**
 * Verify OTP and reset password
 */
export async function verifyOtpAndResetPassword(
  email: string, 
  otp: string, 
  newPassword: string
): Promise<ApiResponse<{ success: boolean }>> {
  return post<{ success: boolean }, { email: string, otp: string, password: string }>(
    '/user/verify-reset-password', 
    { email, otp, password: newPassword }
  );
}

/**
 * Update user password
 */
export async function updatePassword(
  oldPassword: string,
  newPassword: string,
): Promise<ApiResponse<{ success: boolean }>> {
  return patch<{ success: boolean }>(
    '/user/update-password',
    { oldPassword, newPassword }
  );
}
