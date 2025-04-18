import { ApiResponse, ApiResponseData, ApiResponseStatus } from "@/models/api";
import { useUserStore } from '@/lib/store';
import { toast } from 'sonner';
import axios, { AxiosInstance, AxiosResponse, AxiosError, AxiosRequestConfig } from 'axios';

// API base URL from environment variables
const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';

// Create an Axios instance with default configuration
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// API request options
interface RequestOptions {
  headers?: Record<string, string>;
  token?: string;
  isProtectedRoute?: boolean; // Flag to identify protected routes
}

// Handle 401 unauthorized responses
const handle401Error = () => {
  // Get the logout function from Zustand store
  const logout = useUserStore.getState().logout;
  
  // Show error and redirect to login for all 401 errors
  toast.error("Your session has expired. Please log in again.");
  
  // Logout and redirect to login page
  logout();
};

// Add response interceptor for global error handling
apiClient.interceptors.response.use(
  (response) => response, // Return successful responses as-is
  (error: AxiosError) => {
    // Handle 401 unauthorized errors
    if (error.response?.status === 401) {
      handle401Error();
    }
    
    // Log error for debugging
    console.error('API Error:', error.message, error.response?.data);
    
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
      ...options.headers,
    },
  };
  
  // Add auth token if provided
  if (options.token) {
    config.headers = {
      ...config.headers,
      'Authorization': `Bearer ${options.token}`,
    };
  }
  
  // Pass the protected route flag to be used in interceptors
  (config as any).isProtectedRoute = options.isProtectedRoute;
  
  return config;
};

/**
 * Transform Axios response to our ApiResponse format
 */
const transformResponse = <T>(response: AxiosResponse): ApiResponse<T> => {
  return {
    data: response.data,
    status: response.status as ApiResponseStatus,
  };
};

/**
 * Handle any API errors and transform them to our standard format
 */
const handleApiError = <T>(error: any): ApiResponse<T> => {
  // If we have a response from the server with an error status
  if (error.response) {
    return {
      data: {
        code: error.response.status,
        data: null as T,
        msg: error.response.data.message || 'An error occurred',
        status: false,
      },
      status: error.response.status as ApiResponseStatus,
    };
  }
  
  // For network errors or other issues
  return {
    data: {
      code: 500,
      data: null as T,
      msg: error.message || 'Unknown error occurred',
      status: false,
    },
    status: 500 as ApiResponseStatus,
  };
};

/**
 * Make a GET request to the API
 */
export async function get<T>(endpoint: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
  try {
    const response = await apiClient.get<T>(endpoint, configureRequest(options));
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
 * Upload a file to the API
 */
export async function uploadFile<T>(endpoint: string, file: File, options: RequestOptions = {}): Promise<ApiResponse<T>> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    // Configure the request with proper content type for form data
    const config = configureRequest(options);
    
    // Remove Content-Type header to let the browser set it with boundary
    delete config.headers?.['Content-Type'];
    
    const response = await apiClient.post<T>(endpoint, formData, config);
    return transformResponse<T>(response);
  } catch (error) {
    return handleApiError<T>(error);
  }
} 