import { useQuery } from "@tanstack/react-query";
import { getBooks } from "@/lib/api/books";
import { AccessStatusEnum, Book } from "@/models/book";
import { ADMIN_KEYS } from "@/lib/constants/query-keys";
import { PaginatedData } from "@/models/api";

// Extended book type for admin page
export type ExtendedBook = Book & {
  submittedBy?: string;
  submittedDate?: string;
  status?: string;
  moderated?: string;
  moderationResults?: any;
};

type BookListParams = {
  status: "pending" | "published" | "blocked";
  page: number;
  pageSize: number;
  search?: string;
  enabled?: boolean;
};

// Utility to map status string to AccessStatusEnum
const getAccessStatusIdFromString = (status: string): AccessStatusEnum => {
  switch (status) {
    case "pending":
      return AccessStatusEnum.PENDING;
    case "published":
      return AccessStatusEnum.PUBLISHED;
    case "blocked":
      return AccessStatusEnum.BLOCKED;
    default:
      return AccessStatusEnum.PENDING;
  }
};

export function useAdminBooks({
  status,
  page,
  pageSize,
  search = "",
  enabled = true,
}: BookListParams) {
  return useQuery({
    queryKey: ADMIN_KEYS.BOOKS.LIST(status, page, search),
    queryFn: async () => {
      const accessStatusId = getAccessStatusIdFromString(status);
      
      const response = await getBooks({
        page,
        limit: pageSize,
        accessStatusId,
        search,
      });
      
      if (response.status !== 200) {
        throw new Error(response.msg || "Failed to fetch books");
      }
      
      return {
        books: response.data.data as unknown as ExtendedBook[],
        total: response.data.totalItems,
        pageCount: Math.ceil(response.data.totalItems / pageSize),
      };
    },
    enabled,
    refetchOnWindowFocus: false,
    staleTime: 30 * 1000, // 30 seconds
  });
} 