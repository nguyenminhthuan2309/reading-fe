"use client";

import { useQuery } from "@tanstack/react-query";
import { getDepositHistory, getPurchaseChapterHistory, getTransactionStatistics } from "../api/payment";
import { AnalyticsTimeRangeParams } from "@/models/analytics";

export interface Transaction {
  id: number;
  type: 'deposit' | 'purchase';
  amount: number;
  date: string;
  status: string;
  description: string;
}

/**
 * Hook to fetch user transactions history combining deposits and purchases
 * @param limit Maximum number of transactions to fetch
 * @returns Object containing transactions and query state
 */
export const useTransactions = (limit: number = 10) => {
  const {
    data: depositsData,
    isLoading: isDepositsLoading,
    isError: isDepositsError,
    error: depositsError,
    refetch: refetchDeposits,
  } = useQuery({
    queryKey: ['transactions', 'deposits', limit],
    queryFn: async () => {
      const response = await getDepositHistory({ page: 1, limit });
      if (!response.status) {
        throw new Error(response.msg || "Failed to fetch deposit history");
      }
      
      return response.data.data.map((deposit) => ({
        ...deposit,
        type: 'deposit' as const,
        amount: deposit.amount,
        date: deposit.createdAt,
        status: deposit.status,
      }));
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const {
    data: purchasesData,
    isLoading: isPurchasesLoading,
    isError: isPurchasesError,
    error: purchasesError,
    refetch: refetchPurchases,
  } = useQuery({
    queryKey: ['transactions', 'purchases', limit],
    queryFn: async () => {
      const response = await getPurchaseChapterHistory({ page: 1, limit });
      if (!response.status) {
        throw new Error(response.msg || "Failed to fetch purchase history");
      }
      
      return response.data.data.map((purchase) => ({
        ...purchase,
        type: 'purchase' as const,
        amount: -Math.abs(purchase.price || 0),
        date: purchase.createdAt,
      }));
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Combine and sort transactions
  const transactions = [...(depositsData || []), ...(purchasesData || [])].sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  }).slice(0, limit);

  return {
    transactions,
    isLoading: isDepositsLoading || isPurchasesLoading,
    isError: isDepositsError || isPurchasesError,
    error: depositsError || purchasesError,
    refetch: () => {
      refetchDeposits();
      refetchPurchases();
    }
  };
};

/**
 * Hook to fetch transaction statistics
 * @param params Time range parameters for the statistics
 * @returns Object containing transaction statistics and query state
 */
export const useTransactionStatistics = (params: AnalyticsTimeRangeParams) => {
  return useQuery({
    queryKey: ['transaction-statistics', params.period, params.startDate, params.endDate],
    queryFn: async () => {
      const response = await getTransactionStatistics(params);
      if (!response.status) {
        throw new Error(response.msg || "Failed to fetch transaction statistics");
      }
      return response.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!params.period || (!!params.startDate && !!params.endDate),
  });
};

export default useTransactions; 