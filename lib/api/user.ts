import { ApiResponse, ApiResponseStatus } from '@/models/api';
import axios from 'axios';
import { useUserStore } from '@/lib/store';

// API base URL from environment variables
const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';

/**
 * Maximum allowed file size for avatar upload (1MB)
 */
export const MAX_AVATAR_SIZE = 1 * 1024 * 1024; // 1MB in bytes

/**
 * Error thrown when file size exceeds the limit
 */
export class FileSizeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FileSizeError';
  }
}

/**
 * Upload user avatar
 * @param file The image file to upload
 * @returns ApiResponse with the uploaded file URL
 * @throws FileSizeError if file size exceeds the limit
 */
export async function uploadAvatar(file: File): Promise<ApiResponse<{data: string}>> {
  // Check file size before uploading
  if (file.size > MAX_AVATAR_SIZE) {
    throw new FileSizeError('Avatar image size must be less than 1MB');
  }

  // Create FormData to send the file
  const formData = new FormData();
  formData.append('file', file);

  // Get token from the store
  const token = useUserStore.getState().token;

  try {
    // Make direct POST request to the upload endpoint
    const response = await axios.post(`${API_BASE_URL}/upload/image`, formData, {
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        // Don't set Content-Type here - let the browser set it with the correct boundary
      }
    });

    // Transform the Axios response to our ApiResponse format
    return {
      data: {
        code: response.status,
        data: response.data,
        msg: 'Avatar uploaded successfully',
        status: true
      },
      status: response.status as ApiResponseStatus
    };
  } catch (error) {
    // Handle errors
    if (axios.isAxiosError(error) && error.response) {
      // Transform Axios error response to our ApiResponse format
      return {
        data: {
          code: error.response.status,
          data: { data: '' }, // Provide default empty url to match the expected type
          msg: error.response.data?.message || 'Upload failed',
          status: false
        },
        status: error.response.status as ApiResponseStatus
      };
    }

    // For network errors or other issues
    return {
      data: {
        code: 500,
        data: { data: '' }, // Provide default empty url to match the expected type
        msg: error instanceof Error ? error.message : 'Unknown error occurred',
        status: false,
      },
      status: 500 as ApiResponseStatus
    };
  }
} 