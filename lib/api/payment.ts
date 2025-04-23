import { ApiResponse } from '@/models/api';
import { post, get } from './base';
import { Payment, TransactionStatus } from '@/models/payment';

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
export async function checkPaymentStatus(requestId: string, orderId: string): Promise<ApiResponse<TransactionStatus>> {

    const queryParams = new URLSearchParams();
    queryParams.append('requestId', requestId);
    queryParams.append('orderId', orderId);
  
    return await get<TransactionStatus>(`/transaction/check-status?${queryParams.toString()}`);
  
} 