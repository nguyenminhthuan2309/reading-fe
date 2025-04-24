import { useMutation, useQueryClient } from "@tanstack/react-query";
import { followBook, unfollowBook } from "@/lib/api/books";
import { BOOK_KEYS } from "@/lib/constants/query-keys";

export function useFollowBook() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ bookId, isFollowed }: { bookId: number; isFollowed: boolean }) => {
      // Call the appropriate API based on current follow status
      const response = isFollowed
        ? await unfollowBook(bookId)
        : await followBook(bookId);
      
      if (response.status !== 200 && response.status !== 201) {
        throw new Error(response.msg || `Failed to ${isFollowed ? 'unbookmark' : 'bookmark'} book`);
      }
      
      return response.data;
    },
    onSuccess: (_, { bookId }) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: BOOK_KEYS.ALL});
    },
  });
} 