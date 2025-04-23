export interface Payment {
  /**
   * The unique order identifier returned by the payment gateway
   */
  orderId: string;
  /**
   * The request identifier associated with this payment
   */
  requestId: string;
  /**
   * The URL to redirect the user to complete the payment
   */
  url: string;
} 

export interface TransactionStatus {
    amount: number;
    extraData: string;
    lastUpdated: number;
    message: string;
    orderId: string;
    partnerCode: string;
    payType: string;
    refundTrans: any[];
    requestId: string;
    responseTime: number;
    resultCode: number;
    signature: string | null;
    transId: number;
}