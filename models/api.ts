export interface ApiResponse<T> {
    code: number;
    data: T;
    msg: string;
    status: ApiResponseStatus;
    success: boolean;
}

export type ApiResponseStatus = 200 | 201 | 400 | 401 | 403 | 404 | 500;

// Paginated data structure
export interface PaginatedData<T> {
  totalItems: number;
  totalPages: number;
  data: T[];
}

// API response with paginated data
export interface PaginatedApiResponse<T> {
  data: PaginatedApiResponseData<T>;
  status?: ApiResponseStatus;
}

export interface PaginatedApiResponseData<T> {
  code: number;
  data: PaginatedData<T>;
  msg: string;
  status: boolean;
}