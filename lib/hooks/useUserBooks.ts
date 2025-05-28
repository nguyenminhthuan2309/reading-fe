import { useQuery } from "@tanstack/react-query";
import { getBooks } from "@/lib/api/books";
import { Book } from "@/models/book";
import { PaginatedData } from "@/models/api";
import { BOOK_KEYS } from "@/lib/constants/query-keys";
type BookFilter = "all" | "inProgress" | "created" | "completed";

export function useUserBooks(
  userId: number, 
  page: number = 1, 
  limit: number = 10,
  filter: BookFilter = "all",
  accessStatusId?: number,
  progressStatusId?: number
) {
  return useQuery({
    queryKey: BOOK_KEYS.USER_BOOKS(userId, page, limit, filter, accessStatusId, progressStatusId),
    queryFn: async () => {
      const response = await getBooks({
        userId: userId,
        page,
        limit,
        // Add additional filters based on the selected filter type
        ...(filter === "inProgress" && { progressStatusId: 1 }), // In Progress status ID
        ...(filter === "completed" && { progressStatusId: 2 }), // Completed status ID
        ...(filter === "created" && { authorId: userId }), // Books created by the user
        ...(accessStatusId && { accessStatusId }), // Add access status filter if provided
        ...(progressStatusId && { progressStatusId }), // Add progress status filter if provided
      });
      
      if (response.status !== 200) {
        throw new Error(response.msg || 'Failed to fetch user books');
      }
      
      return response.data as PaginatedData<Book>;
    },
    enabled: !!userId,
  });
} 