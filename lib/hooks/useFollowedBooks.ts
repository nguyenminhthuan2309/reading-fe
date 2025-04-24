import { useQuery } from "@tanstack/react-query";
import { getFollowedBooks } from "@/lib/api/books";
import { Book } from "@/models/book";
import { PaginatedData } from "@/models/api";
import { BOOK_KEYS } from "@/lib/constants/query-keys";

export function useFollowedBooks(page: number = 1, limit: number = 10) {
  return useQuery({
    queryKey: BOOK_KEYS.FOLLOWED(page, limit),
    queryFn: async () => {
      const response = await getFollowedBooks({
        page,
        limit,
      });
      
      if (response.status !== 200) {
        throw new Error(response.msg || 'Failed to fetch followed books');
      }
      
      return response.data as PaginatedData<Book>;
    },
  });
} 