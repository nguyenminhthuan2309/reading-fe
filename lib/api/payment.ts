import { ApiResponse, PaginatedData } from '@/models/api';
import { post, get } from './base';
import { Payment, TransactionStatus } from '@/models/payment';
import { User } from '@/models/user';
import { Chapter } from '@/models/book';
import { TransactionStatisticsResponse, AnalyticsTimeRangeParams } from '@/models/analytics';

export interface MomoResponse {
    message: string;
    resultCode: number;
}

export interface CheckPaymentStatusResponse {
    momoResponse: MomoResponse;
    orderId: string;
    transactionId: string;
}

export interface DepositHistoryParams {
    page: number;
    limit: number;
    id?: number;
    status?: 'PENDING' | 'SUCCESS' | 'FAILED';
    startDate?: string;
    endDate?: string;
}

export interface PurchaseChapterHistoryParams {
    page: number;
    limit: number;
    id?: number;
    startDate?: string;
    endDate?: string;
    bookId?: number;
    chapterId?: number;
}

export interface DepositHistoryResponse {
    amount: string;
    createdAt: string;
    id: string;
    status: string;
    updatedAt: string;
    user: Pick<User, 'id' | 'email'>;
}

export interface PurchaseChapterHistoryResponse {
    createdAt: string;
    id: number;
    price: number;
    updatedAt: string;
    chapter: Pick<Chapter, 'id' | 'title'>;
    user: Pick<User, 'id' | 'email' | 'avatar' | 'id'>;
}

/**
 * Initiates a payment transaction with MoMo
 * @param amount - The amount to deposit in the payment
 * @returns Promise with payment orderId, requestId, and redirect URL
 */
export async function initPayment(amount: number): Promise<ApiResponse<Payment>> {
    return await post<Payment>('/transaction/momo', { amount });
}

/**
 * Makes a payment with MoMo
 * @param amount - The amount to pay
 * @returns Promise with payment information
 */
export async function makePaymentWithMoMo(amount: number): Promise<ApiResponse<Payment>> {
  return await post<Payment>('/transaction/momo', { amount });
}

/**
 * Gets the status of a payment transaction
 * @param requestId - The request ID to check
 * @param orderId - The order ID to check
 * @returns Promise with transaction status
 */
    export async function checkPaymentStatus(requestId: string, orderId: string): Promise<ApiResponse<CheckPaymentStatusResponse>> {

    const queryParams = new URLSearchParams();
    queryParams.append('requestId', requestId);
    queryParams.append('orderId', orderId);
  
    return await get<CheckPaymentStatusResponse>(`/transaction/check-status?${queryParams.toString()}`);
  
} 

/**
 * Purchases a chapter
 * @param chapterId - The ID of the chapter to purchase
 * @returns Promise with purchase information
 */
export async function purchaseChapter(chapterId: number): Promise<ApiResponse<any>> {
    return await post<any>('/transaction/chapter', { chapterId });
}

/**
 * Gets the deposit history
 * @returns Promise with deposit history
 */
export async function getDepositHistory(params: DepositHistoryParams): Promise<ApiResponse<PaginatedData<DepositHistoryResponse>>> {

    const queryParams = new URLSearchParams();
    queryParams.append('page', params.page.toString());
    queryParams.append('limit', params.limit.toString());
    if(params.id) queryParams.append('id', params.id?.toString() || '');
    if(params.status) queryParams.append('status', params.status || '');
    if(params.startDate) queryParams.append('startDate', params.startDate || '');
    if(params.endDate) queryParams.append('endDate', params.endDate || '');

    return await get<PaginatedData<DepositHistoryResponse>>(`/transaction/momo?${queryParams.toString()}`);
}

/**
 * Gets the buy chapter history
 * @returns Promise with buy chapter history
 */
export async function getPurchaseChapterHistory(params: PurchaseChapterHistoryParams): Promise<ApiResponse<PaginatedData<PurchaseChapterHistoryResponse>>> {
    const queryParams = new URLSearchParams();
    queryParams.append('page', params.page.toString());
    queryParams.append('limit', params.limit.toString());
    if(params.id) queryParams.append('id', params.id?.toString() || '');
    if(params.startDate) queryParams.append('startDate', params.startDate || '');
    if(params.endDate) queryParams.append('endDate', params.endDate || '');
    if(params.bookId) queryParams.append('bookId', params.bookId?.toString() || '');
    if(params.chapterId) queryParams.append('chapterId', params.chapterId?.toString() || '');

    return await get<PaginatedData<PurchaseChapterHistoryResponse>>(`/transaction/chapter?${queryParams.toString()}`);
}

/**
 * Gets transaction statistics
 * @param params - Time range parameters for the statistics
 * @returns Promise with transaction statistics
 */
export async function getTransactionStatistics(params: AnalyticsTimeRangeParams): Promise<ApiResponse<TransactionStatisticsResponse>> {
    const queryParams = new URLSearchParams();
    
    if (params.period) {
        queryParams.append('period', params.period);
    }
    if (params.startDate) {
        queryParams.append('startDate', params.startDate);
    }
    if (params.endDate) {
        queryParams.append('endDate', params.endDate);
    }

    return await get<TransactionStatisticsResponse>(`/transaction/statistics?${queryParams.toString()}`);
}
