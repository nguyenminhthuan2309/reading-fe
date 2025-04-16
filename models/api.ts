export interface ApiResponse<T> {
  data: ApiResponseData<T>;
  status?: ApiResponseStatus;
}

export interface ApiResponseData<T> {
    code: number;
    data: T;
    msg: string;
    status: boolean;
}

export type ApiResponseStatus = 200 | 201 | 400 | 401 | 403 | 404 | 500;