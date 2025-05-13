"use client";

import { Button } from "@/components/ui/button";
import { ArrowUpCircle, ArrowDownCircle, Loader2 } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import useTransactions from "@/lib/hooks/useTransactions";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface RecentTransactionsProps {
  limit?: number;
  showViewAll?: boolean;
}

export function RecentTransactions({ limit = 3, showViewAll = true }: RecentTransactionsProps) {
  const router = useRouter();
  const { transactions, isLoading, isError } = useTransactions(limit);

  // Navigate to transactions page (if implemented)
  const viewAllTransactions = () => {
    router.push('/me?section=transactions');
  };

  // Helper to format transaction date
  const formatTransactionDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      
      // If it's within the last 7 days, show relative time
      const now = new Date();
      const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffInDays < 7) {
        return formatDistanceToNow(date, { addSuffix: true });
      } 
      
      // Otherwise show formatted date
      return format(date, 'MMM d, yyyy');
    } catch (e) {
      return 'Invalid date';
    }
  };

  if (isLoading) {
    return (
      <div className="py-6 flex justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="py-4 text-center text-muted-foreground">
        <p>Failed to load transaction history</p>
      </div>
    );
  }

  if (!transactions || transactions.length === 0) {
    return (
      <div className="py-4 text-center text-muted-foreground">
        <p>No transaction history</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium">Recent Transactions</p>
        {showViewAll && transactions.length > 0 && (
          <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={viewAllTransactions}>
            View All
          </Button>
        )}
      </div>

      <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
        {transactions.map((transaction) => (
          <div 
            key={`${transaction.type}-${transaction.id}`} 
            className="flex items-center justify-between text-sm py-2 border-b border-secondary/80"
          >
            <div className="flex items-center gap-2">
              {transaction.type === 'deposit' ? (
                <ArrowUpCircle size={16} className="text-green-500" />
              ) : (
                <ArrowDownCircle size={16} className="text-amber-500" />
              )}
              <div>
                <p className="font-medium">{transaction.type === 'deposit' ? 'Deposit' : 'Purchase'}</p>
               
              </div>
            </div>
            <p className={cn(
              "font-medium",
              Number(transaction.amount) > 0 ? "text-green-500" : "text-amber-500"
            )}>
              {Number(transaction.amount) > 0 ? '+' : ''}{transaction.type === 'deposit' ? +transaction.amount / 1000 : transaction.amount}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
} 