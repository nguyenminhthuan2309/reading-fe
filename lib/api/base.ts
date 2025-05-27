import { ApiResponse, ApiResponseStatus } from "@/models/api";
import { useUserStore } from '@/lib/store';
import { toast } from 'sonner';
import axios, { AxiosInstance, AxiosResponse, AxiosError, AxiosRequestConfig } from 'axios';
import { useRouter } from 'next/navigation';
import { useQueryClient } from "@tanstack/react-query";
import { ANALYTICS_STORAGE_KEYS } from "../utils/analytics";
// API base URL from environment variables
const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';

// Create an Axios instance with default configuration
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  // We'll handle Content-Type in configureRequest instead
});

// API request options
interface RequestOptions {
  headers?: Record<string, string>;
  token?: string; // Now optional in all cases as we will get from store if not provided
  skipContentType?: boolean; // Flag to skip setting default Content-Type
}

// Handle 401 unauthorized responses
const handle401Error = () => {
  // Get the logout function from Zustand store
  const logout = useUserStore.getState().logout;
  const token = useUserStore.getState().token;

  
  // Show error and redirect to login for all 401 errors
  if (token) {
    toast.error("Your session has expired. Please log in again.");
    
    // Clear the token and user from the store
    useUserStore.getState().setToken(null);
    useUserStore.getState().setUser(null);

    // Clear visits from the store
    localStorage.removeItem(ANALYTICS_STORAGE_KEYS.VISITOR_ID);
    sessionStorage.removeItem(ANALYTICS_STORAGE_KEYS.CURRENT_VISIT_ID);
    sessionStorage.removeItem(ANALYTICS_STORAGE_KEYS.SESSION_START_TIME);

    window.location.href = '/signin';

  }
  // Logout and redirect to login page
  logout();
};

// Add response interceptor for global error handling
apiClient.interceptors.response.use(
  (response) => response, // Return successful responses as-is
  (error: AxiosError) => {
    // Handle 401 unauthorized errors
    if (error.status === 401) {
      handle401Error();
    }

    // Continue to throw the error so we can handle it in the caller
    return Promise.reject(error);
  }
);

/**
 * Configure request with authentication token and other options
 */
const configureRequest = (options: RequestOptions = {}): AxiosRequestConfig => {
  const config: AxiosRequestConfig = {
    headers: {
      // Only set Content-Type if not explicitly skipped
      ...(!options.skipContentType && { 'Content-Type': 'application/json' }),
      ...options.headers,
    },
  };
  
  // For protected routes, get token from store if not provided
  const token = options.token || useUserStore.getState().token;
    
  if (token) {
    config.headers = {
      ...config.headers,
      'Authorization': `Bearer ${token}`,
    };
  }
  
  // For non-protected routes, only add token if explicitly provided
  else if (options.token) {
    config.headers = {
      ...config.headers,
      'Authorization': `Bearer ${options.token}`,
    };
  }
  
  return config;
};

/**
 * Transform Axios response to our ApiResponse format
 */
const transformResponse = <T>(response: AxiosResponse): ApiResponse<T> => {
  return {
    ...response.data,
    status: response.status as ApiResponseStatus,
  };
};

/**
 * Handle any API errors and transform them to our standard format
 */
const handleApiError = <T>(error: any): ApiResponse<T> => {
  // If we have a response from the server with an error status
  if (error.response?.data) return { ...error.response.data, status: error.response.status as ApiResponseStatus};
  
  // For network errors or other issues
  return {
      code: 500,
      data: null as T,
      msg: error.message || 'Unknown error occurred',
      status: 500,
      success: false,
  };
};

/**
 * Make a GET request to the API
 */
export async function get<T>(endpoint: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
  try {
    const response: AxiosResponse<T> = await apiClient.get<T>(endpoint, configureRequest(options));
    return transformResponse<T>(response);
  } catch (error) {
    return handleApiError<T>(error);
  }
}

/**
 * Make a POST request to the API
 */
export async function post<T, D = any>(endpoint: string, body: D, options: RequestOptions = {}): Promise<ApiResponse<T>> {
  try {
    const response = await apiClient.post<T>(endpoint, body, configureRequest(options));
    return transformResponse<T>(response);
  } catch (error) {
    return handleApiError<T>(error);
  }
}

/**
 * Make a PUT request to the API
 */
export async function put<T, D = any>(endpoint: string, body: D, options: RequestOptions = {}): Promise<ApiResponse<T>> {
  try {
    const response = await apiClient.put<T>(endpoint, body, configureRequest(options));
    return transformResponse<T>(response);
  } catch (error) {
    return handleApiError<T>(error);
  }
}

/**
 * Make a DELETE request to the API
 */
export async function del<T>(endpoint: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
  try {
    const response = await apiClient.delete<T>(endpoint, configureRequest(options));
    return transformResponse<T>(response);
  } catch (error) {
    return handleApiError<T>(error);
  }
}

/**
 * Make a DELETE request to the API with a request body
 */
export async function delWithBody<T, D = any>(endpoint: string, body: D, options: RequestOptions = {}): Promise<ApiResponse<T>> {
  try {
    const config = {
      ...configureRequest(options),
      data: body // This is how axios expects the body for delete requests
    };
    const response = await apiClient.delete<T>(endpoint, config);
    return transformResponse<T>(response);
  } catch (error) {
    return handleApiError<T>(error);
  }
}

/**
 * Make a PATCH request to the API
 */
export async function patch<T, D = any>(endpoint: string, body: D, options: RequestOptions = {}): Promise<ApiResponse<T>> {
  try {
    const response = await apiClient.patch<T>(endpoint, body, configureRequest(options));
    return transformResponse<T>(response);
  } catch (error) {
    return handleApiError<T>(error);
  }
}

/**
 * Upload a file to the API
 */
export async function uploadFile<T>(endpoint: string, file: File, options: RequestOptions = {}): Promise<ApiResponse<T>> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    // Configure the request with skipContentType for FormData
    const config = configureRequest({ 
      ...options, 
      skipContentType: true 
    });
    
    const response = await apiClient.post<T>(endpoint, formData, config);
    return transformResponse<T>(response);
  } catch (error) {
    return handleApiError<T>(error);
  }
}

/**
 * Update an existing image with a new file
 * @param endpoint The API endpoint
 * @param file The new image file to upload
 * @param options Request options
 */
export async function updateImage<T>(
  endpoint: string, 
  file: File, 
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    // Configure the request with skipContentType for FormData
    const config = configureRequest({ 
      ...options, 
      skipContentType: true 
    });
    
    // Use POST method for updating image
    const response = await apiClient.post<T>(endpoint, formData, config);
    return transformResponse<T>(response);
  } catch (error) {
    return handleApiError<T>(error);
  }
} 