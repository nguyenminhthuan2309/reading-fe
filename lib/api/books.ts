import { get, post, put, del, uploadFile } from '../api';
import { ApiResponse } from '@/models/api';
import { Genre } from '@/models/genre';

// Types
export interface Book {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  author: string;
  genres: Genre[];
  chapters: Chapter[];
  wordCount?: number;
  pageCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Chapter {
  id: string;
  title: string;
  content: string;
  images?: string[];
  orderIndex: number;
}

export interface BookFilters {
  genre?: Genre;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'latest' | 'popular' | 'title';
}

/**
 * Get a list of books with optional filters
 */
export async function getBooks(filters: BookFilters = {}): Promise<ApiResponse<{ books: Book[], total: number }>> {
  const queryParams = new URLSearchParams();
  
  if (filters.genre) queryParams.append('genre', filters.genre);
  if (filters.search) queryParams.append('search', filters.search);
  if (filters.page) queryParams.append('page', filters.page.toString());
  if (filters.limit) queryParams.append('limit', filters.limit.toString());
  if (filters.sortBy) queryParams.append('sortBy', filters.sortBy);
  
  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
  
  return get<{ books: Book[], total: number }>(`/books${queryString}`);
}

/**
 * Get a book by its ID
 */
export async function getBookById(bookId: string): Promise<ApiResponse<Book>> {
  return get<Book>(`/books/${bookId}`);
}

/**
 * Create a new book
 */
export async function createBook(bookData: Partial<Book>): Promise<ApiResponse<Book>> {
  return post<Book>('/books', bookData, { isProtectedRoute: true });
}

/**
 * Update an existing book
 */
export async function updateBook(bookId: string, bookData: Partial<Book>): Promise<ApiResponse<Book>> {
  return put<Book>(`/books/${bookId}`, bookData, { isProtectedRoute: true });
}

/**
 * Delete a book
 */
export async function deleteBook(bookId: string): Promise<ApiResponse<{ success: boolean }>> {
  return del<{ success: boolean }>(`/books/${bookId}`, { isProtectedRoute: true });
}

/**
 * Add a chapter to a book
 */
export async function addChapter(bookId: string, chapterData: Partial<Chapter>): Promise<ApiResponse<Chapter>> {
  return post<Chapter>(`/books/${bookId}/chapters`, chapterData, { isProtectedRoute: true });
}

/**
 * Update a chapter
 */
export async function updateChapter(bookId: string, chapterId: string, chapterData: Partial<Chapter>): Promise<ApiResponse<Chapter>> {
  return put<Chapter>(`/books/${bookId}/chapters/${chapterId}`, chapterData, { isProtectedRoute: true });
}

/**
 * Delete a chapter
 */
export async function deleteChapter(bookId: string, chapterId: string): Promise<ApiResponse<{ success: boolean }>> {
  return del<{ success: boolean }>(`/books/${bookId}/chapters/${chapterId}`, { isProtectedRoute: true });
}

/**
 * Upload a book cover image
 */
export async function uploadCoverImage(bookId: string, file: File): Promise<ApiResponse<{ url: string }>> {
  return uploadFile<{ url: string }>(`/books/${bookId}/cover`, file, { isProtectedRoute: true });
}

/**
 * Upload a chapter image
 */
export async function uploadChapterImage(bookId: string, chapterId: string, file: File): Promise<ApiResponse<{ url: string }>> {
  return uploadFile<{ url: string }>(`/books/${bookId}/chapters/${chapterId}/image`, file, { isProtectedRoute: true });
} 