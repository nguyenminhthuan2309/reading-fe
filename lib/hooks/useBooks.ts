'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
  addChapter,
  updateChapter,
  deleteChapter,
  uploadCoverImage,
  uploadChapterImage,
  type Book,
  type Chapter,
  type BookFilters
} from '@/lib/api/books';
import { getAuthToken } from '@/lib/api/auth';

// Query keys
export const BOOKS_QUERY_KEY = 'books';
export const BOOK_DETAIL_QUERY_KEY = 'bookDetail';

/**
 * Custom hook for fetching and managing books
 */
export function useBooks(filters: BookFilters = {}) {
  const queryClient = useQueryClient();
  const token = getAuthToken();
  
  // Fetch books list with filters
  const {
    data: booksData,
    isLoading: isLoadingBooks,
    error: booksError,
  } = useQuery({
    queryKey: [BOOKS_QUERY_KEY, filters],
    queryFn: async () => {
      const response = await getBooks(filters);
      return response.data;
    },
  });
  
  // Create book mutation
  const {
    mutate: createBookMutation,
    isPending: isCreatingBook,
  } = useMutation({
    mutationFn: async (bookData: Partial<Book>) => {
      if (!token) throw new Error('Authentication required');
      const response = await createBook(bookData, token);
      if (response.error) throw new Error(response.error);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BOOKS_QUERY_KEY] });
    },
  });
  
  // Delete book mutation
  const {
    mutate: deleteBookMutation,
    isPending: isDeletingBook,
  } = useMutation({
    mutationFn: async (bookId: string) => {
      if (!token) throw new Error('Authentication required');
      const response = await deleteBook(bookId, token);
      if (response.error) throw new Error(response.error);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BOOKS_QUERY_KEY] });
    },
  });
  
  return {
    books: booksData?.books || [],
    totalBooks: booksData?.total || 0,
    isLoadingBooks,
    booksError,
    createBook: createBookMutation,
    isCreatingBook,
    deleteBook: deleteBookMutation,
    isDeletingBook,
  };
}

/**
 * Custom hook for fetching and managing a single book
 */
export function useBook(bookId: string) {
  const queryClient = useQueryClient();
  const token = getAuthToken();
  
  // Fetch book details
  const {
    data: book,
    isLoading: isLoadingBook,
    error: bookError,
  } = useQuery({
    queryKey: [BOOK_DETAIL_QUERY_KEY, bookId],
    queryFn: async () => {
      const response = await getBookById(bookId);
      return response.data;
    },
    enabled: !!bookId,
  });
  
  // Update book mutation
  const {
    mutate: updateBookMutation,
    isPending: isUpdatingBook,
  } = useMutation({
    mutationFn: async (bookData: Partial<Book>) => {
      if (!token) throw new Error('Authentication required');
      const response = await updateBook(bookId, bookData, token);
      if (response.error) throw new Error(response.error);
      return response.data;
    },
    onSuccess: (updatedBook) => {
      queryClient.setQueryData([BOOK_DETAIL_QUERY_KEY, bookId], updatedBook);
    },
  });
  
  // Add chapter mutation
  const {
    mutate: addChapterMutation,
    isPending: isAddingChapter,
  } = useMutation({
    mutationFn: async (chapterData: Partial<Chapter>) => {
      if (!token) throw new Error('Authentication required');
      const response = await addChapter(bookId, chapterData, token);
      if (response.error) throw new Error(response.error);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BOOK_DETAIL_QUERY_KEY, bookId] });
    },
  });
  
  // Update chapter mutation
  const {
    mutate: updateChapterMutation,
    isPending: isUpdatingChapter,
  } = useMutation({
    mutationFn: async ({ chapterId, data }: { chapterId: string; data: Partial<Chapter> }) => {
      if (!token) throw new Error('Authentication required');
      const response = await updateChapter(bookId, chapterId, data, token);
      if (response.error) throw new Error(response.error);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BOOK_DETAIL_QUERY_KEY, bookId] });
    },
  });
  
  // Delete chapter mutation
  const {
    mutate: deleteChapterMutation,
    isPending: isDeletingChapter,
  } = useMutation({
    mutationFn: async (chapterId: string) => {
      if (!token) throw new Error('Authentication required');
      const response = await deleteChapter(bookId, chapterId, token);
      if (response.error) throw new Error(response.error);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BOOK_DETAIL_QUERY_KEY, bookId] });
    },
  });
  
  // Upload cover image mutation
  const {
    mutate: uploadCoverMutation,
    isPending: isUploadingCover,
  } = useMutation({
    mutationFn: async (file: File) => {
      if (!token) throw new Error('Authentication required');
      const response = await uploadCoverImage(bookId, file, token);
      if (response.error) throw new Error(response.error);
      return response.data;
    },
    onSuccess: (data) => {
      // Update the book with the new cover URL
      if (book && data?.url) {
        queryClient.setQueryData(
          [BOOK_DETAIL_QUERY_KEY, bookId],
          { ...book, coverImage: data.url }
        );
      }
    },
  });
  
  // Upload chapter image mutation
  const {
    mutate: uploadChapterImageMutation,
    isPending: isUploadingChapterImage,
  } = useMutation({
    mutationFn: async ({ chapterId, file }: { chapterId: string; file: File }) => {
      if (!token) throw new Error('Authentication required');
      const response = await uploadChapterImage(bookId, chapterId, file, token);
      if (response.error) throw new Error(response.error);
      return { url: response.data?.url, chapterId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BOOK_DETAIL_QUERY_KEY, bookId] });
    },
  });
  
  return {
    book,
    isLoadingBook,
    bookError,
    updateBook: updateBookMutation,
    isUpdatingBook,
    addChapter: addChapterMutation,
    isAddingChapter,
    updateChapter: updateChapterMutation,
    isUpdatingChapter,
    deleteChapter: deleteChapterMutation,
    isDeletingChapter,
    uploadCover: uploadCoverMutation,
    isUploadingCover,
    uploadChapterImage: uploadChapterImageMutation,
    isUploadingChapterImage,
  };
} 