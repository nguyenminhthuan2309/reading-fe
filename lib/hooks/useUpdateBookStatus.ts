import { useMutation, useQueryClient } from "@tanstack/react-query";
import {  updateBookStatus } from "@/lib/api/books";
import { AccessStatusEnum } from "@/models/book";
import { BOOK_KEYS } from "@/lib/constants/query-keys";
import { toast } from "sonner";

type BookStatusUpdatePayload = {
  bookId: number;
  newStatus: AccessStatusEnum;
  onSuccess?: () => void;
};

export function useUpdateBookStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ bookId, newStatus }: BookStatusUpdatePayload) => {
      const response = await updateBookStatus(bookId, {
        accessStatusId: newStatus,
      });

      if (response.status !== 200) {
        throw new Error(response.msg || "Failed to update book status");
      }

      return response.data;
    },
    onSuccess: (_, { bookId, newStatus, onSuccess }) => {
      // Get the status text for toast message
      let statusText = "updated";
      switch (newStatus) {
        case AccessStatusEnum.PUBLISHED:
          statusText = "published";
          break;
        case AccessStatusEnum.BLOCKED:
          statusText = "rejected";
          break;
        case AccessStatusEnum.PENDING:
          statusText = "marked as pending";
          break;
        case AccessStatusEnum.PRIVATE:
          statusText = "made private";
          break;
      }

      // Show success toast
      toast.success(`Book ${statusText} successfully`);

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: BOOK_KEYS.ALL });
      queryClient.invalidateQueries({ queryKey: BOOK_KEYS.DETAIL(bookId) });
      
      // Call the optional onSuccess callback
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update book status");
    },
  });
}

// Helper hook specifically for approving a book
export function useApproveBook() {
  const updateBookStatus = useUpdateBookStatus();
  
  return {
    ...updateBookStatus,
    approveBook: (bookId: number, onSuccess?: () => void) => {
      updateBookStatus.mutate({
        bookId,
        newStatus: AccessStatusEnum.PUBLISHED,
        onSuccess,
      });
    }
  };
}

// Helper hook specifically for rejecting a book
export function useRejectBook() {
  const updateBookStatus = useUpdateBookStatus();
  
  return {
    ...updateBookStatus,
    rejectBook: (bookId: number, onSuccess?: () => void) => {
      updateBookStatus.mutate({
        bookId,
        newStatus: AccessStatusEnum.BLOCKED,
        onSuccess,
      });
    }
  };
}

// Helper hook for bulk operations
export function useBulkUpdateBookStatus() {
  const updateBookStatus = useUpdateBookStatus();
  const queryClient = useQueryClient();
  
  const bulkUpdateStatus = async (bookIds: number[], newStatus: AccessStatusEnum) => {
    const results = await Promise.allSettled(
      bookIds.map(bookId => 
        updateBookStatus.mutateAsync({ bookId, newStatus })
      )
    );
    
    const succeeded = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    
    if (failed === 0) {
      // All succeeded
      let statusText = "updated";
      switch (newStatus) {
        case AccessStatusEnum.PUBLISHED:
          statusText = "approved";
          break;
        case AccessStatusEnum.BLOCKED:
          statusText = "rejected";
          break;
      }
      toast.success(`All ${succeeded} books ${statusText} successfully`);
    } else if (succeeded === 0) {
      // All failed
      toast.error(`Failed to update all ${failed} books`);
    } else {
      // Mixed results
      toast.warning(`Updated ${succeeded} books, but failed to update ${failed} books`);
    }
    
    // Invalidate all book queries to refresh data
    queryClient.invalidateQueries({ queryKey: BOOK_KEYS.ALL });
    
    return { succeeded, failed };
  };
  
  return {
    ...updateBookStatus,
    bulkApproveBooks: (bookIds: number[]) => 
      bulkUpdateStatus(bookIds, AccessStatusEnum.PUBLISHED),
    bulkRejectBooks: (bookIds: number[]) => 
      bulkUpdateStatus(bookIds, AccessStatusEnum.BLOCKED),
    bulkUpdateStatus
  };
} 