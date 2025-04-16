import { ApiResponse, ApiResponseData, ApiResponseStatus } from "@/models/api";

// API base URL from environment variables
const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';

// Default request headers
const defaultHeaders = {
  'Content-Type': 'application/json',
};

// API request options
interface RequestOptions {
  headers?: Record<string, string>;
  token?: string;
}

/**
 * Make a GET request to the API
 */
export async function get<T>(endpoint: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
  try {
    const headers = {
      ...defaultHeaders,
      ...options.headers,
      ...(options.token && { 'Authorization': `Bearer ${options.token}` }),
    };
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, { 
      method: 'GET',
      headers,
    });
    
    const data = await response.json();
    
    return {
      data,
      status: response.status as ApiResponseStatus,
    };
  } catch (error) {
    console.error('API GET Error:', error);
    return {
      data: {
        code: 500,
        data: null as T,
        msg: 'Unknown error occurred',
        status: false,
      },
      status: 500 as ApiResponseStatus,
    };
  }
}

/**
 * Make a POST request to the API
 */
export async function post<T, D = any>(endpoint: string, body: D, options: RequestOptions = {}): Promise<ApiResponse<T>> {
  try {
    const headers = {
      ...defaultHeaders,
      ...options.headers,
      ...(options.token && { 'Authorization': `Bearer ${options.token}` }),
    };
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    
    const data = await response.json();
    
    return {
      data,
      status: response.status as ApiResponseStatus,
    };
  } catch (error) {
    console.error('API POST Error:', error);
    return {
      data: {
        code: 500,
        data: null as T,
        msg: 'Unknown error occurred',
        status: false,
      },
      status: 500 as ApiResponseStatus,
    };
  }
}

/**
 * Make a PUT request to the API
 */
export async function put<T, D = any>(endpoint: string, body: D, options: RequestOptions = {}): Promise<ApiResponse<T>> {
  try {
    const headers = {
      ...defaultHeaders,
      ...options.headers,
      ...(options.token && { 'Authorization': `Bearer ${options.token}` }),
    };
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body),
    });
    
    const data = await response.json();
    
    return {
      data,
      status: response.status as ApiResponseStatus,
    };
  } catch (error) {
    console.error('API PUT Error:', error);
    return {
      data: {
        code: 500,
        data: null as T,
        msg: 'Unknown error occurred',
        status: false,
      },
      status: 500 as ApiResponseStatus,
    };
  }
}

/**
 * Make a DELETE request to the API
 */
export async function del<T>(endpoint: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
  try {
    const headers = {
      ...defaultHeaders,
      ...options.headers,
      ...(options.token && { 'Authorization': `Bearer ${options.token}` }),
    };
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers,
    });
    
    const data = await response.json();
    
    return {
      data,
      status: response.status as ApiResponseStatus,
    };
  } catch (error) {
    console.error('API DELETE Error:', error);
    return {
      data: {
        code: 500,
        data: null as T,
        msg: 'Unknown error occurred',
        status: false,
      },
      status: 500 as ApiResponseStatus,
    };
  }
}

/**
 * Upload a file to the API
 */
export async function uploadFile<T>(endpoint: string, file: File, options: RequestOptions = {}): Promise<ApiResponse<T>> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const headers = {
      ...options.headers,
      ...(options.token && { 'Authorization': `Bearer ${options.token}` }),
      // Don't set Content-Type header as it will be set automatically with the boundary parameter
    };
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData,
    });
    
    const data = await response.json();
    
    return {
      data,
      status: response.status as ApiResponseStatus,
    };
  } catch (error) {
    console.error('API File Upload Error:', error);
    return {
      data: {
        code: 500,
        data: null as T,
        msg: 'Unknown error occurred',
        status: false,
      },
      status: 500 as ApiResponseStatus,
    };
  }
} 