import { get, post, put, del, delWithBody, uploadFile, patch } from '../api';
import { ApiResponse, PaginatedData } from '@/models/api';
import { Book, Chapter, BookFilters,  ReadingHistoryItem, ReadingHistoryFilters, BookUpdatePayload, BookCreatePayload, BookReview, BookReviewFilters, Category, ChaptersBatchPayload, ChapterAccessStatus } from '@/models/book';
import { ModerationResultsPayload } from '@/models/openai';
import { ModerationResultsResponse } from '@/models/openai';
import { BookStatisticsResponse, AnalyticsTimeRangeParams } from '@/models/analytics';

/**
 * Get a list of books with optional filters
 */
export async function getBooks(filters: BookFilters): Promise<ApiResponse<PaginatedData<Book>>> {
  const queryParams = new URLSearchParams();
  
  // Required parameters
  queryParams.append('page', filters.page.toString());
  queryParams.append('limit', filters.limit.toString());
  
  // Optional parameters
  if (filters.categoryId) {
    // Handle both single categoryId and array of categoryIds
    if (Array.isArray(filters.categoryId)) {
      filters.categoryId.forEach(id => queryParams.append('categoryId', id.toString()));
    } else {
      queryParams.append('categoryId', filters.categoryId.toString());
    }
  }
  if (filters.search) queryParams.append('search', filters.search);
  if (filters.sortBy) queryParams.append('sortBy', filters.sortBy);
  if (filters.userId) queryParams.append('userId', filters.userId.toString());
  if (filters.bookTypeId) queryParams.append('bookTypeId', filters.bookTypeId.toString());
  if (filters.progressStatusId) queryParams.append('progressStatusId', filters.progressStatusId.toString());
  
  // Add accessStatusId only if provided
  if (filters.accessStatusId !== undefined) {
    queryParams.append('accessStatusId', filters.accessStatusId.toString());
  }
  
  if (filters.hasChapter !== undefined) queryParams.append('hasChapter', filters.hasChapter.toString());
  if (filters.sortType) queryParams.append('sortType', filters.sortType);
  if (filters.ageRating) queryParams.append('ageRating', filters.ageRating.toString());
  
  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
  
  return get<PaginatedData<Book>>(`/book${queryString}`);
}

/**
 * Get user's reading history
 */
export async function getUserReadingHistory(filters: ReadingHistoryFilters): Promise<ApiResponse<PaginatedData<ReadingHistoryItem>>> {
  const queryParams = new URLSearchParams();
  
  // Required parameters
  queryParams.append('page', filters.page.toString());
  queryParams.append('limit', filters.limit.toString());
  
  // Optional parameters
  if (filters.userId) queryParams.append('userId', filters.userId);
  
  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
  
  return get<PaginatedData<ReadingHistoryItem>>(`book/reading-history${queryString}`);
}

/**
 * Get a book by its ID
 */
export async function getBookById(bookId: number): Promise<ApiResponse<PaginatedData<Book>>> {
  return get<PaginatedData<Book>>(`/book/${bookId}`);
}


/**
 * Create a new book
 */
export async function createBook(bookData: BookCreatePayload): Promise<ApiResponse<number>> {
  return post<number>('/book', bookData);
}


/**
 * Update an existing book
 */
export async function updateBook(bookId: number, bookData: BookUpdatePayload): Promise<ApiResponse<Book>> {
  return put<Book>(`/book/${bookId}`, bookData);
}

/**
 * Update an existing book
 */
export async function updateBookPatch(bookId: number, bookData: BookUpdatePayload): Promise<ApiResponse<Book>> {
  return patch<Book>(`/book/${bookId}`, bookData);
}

/**
 * Update an existing book status
 */
export async function updateBookStatus(bookId: number, bookData: {accessStatusId?: number, progressStatusId?: number}): Promise<ApiResponse<Book>> {
  return patch<Book>(`/book/${bookId}/status`, bookData);
}

/**
 * Reject a book with a detailed reason
 */
export async function rejectBook(bookId: number, reason: string): Promise<ApiResponse<Book>> {
  return post<Book>(`/book/${bookId}/reject`, { reason });
}

/**
 * Delete a book
 */
export async function deleteBook(bookId: number): Promise<ApiResponse<{ success: boolean }>> {
  return del<{ success: boolean }>(`/book/${bookId}`);
}

/**
 * Add a chapter to a book
 */
export async function addChapter(bookId: number, chapterData: Partial<Chapter>): Promise<ApiResponse<Chapter>> {
  return post<Chapter>(`/book/${bookId}/chapters`, chapterData);
}

/**
 * Update a chapter
 */
export async function updateChapter(chapterId: number, chapterData: Partial<Chapter>): Promise<ApiResponse<Chapter>> {
  return put<Chapter>(`/book/chapter/${chapterId}`, chapterData);
}

/**
 * Delete a chapter
 */
export async function deleteChapter(chapterId: number): Promise<ApiResponse<{ success: boolean }>> {
  return delWithBody<{ success: boolean }>(`/book/chapter/${chapterId}`, {chapterId});
}

/**
 * Upload a book cover image
 */
export async function uploadCoverImage(bookId: number, file: File): Promise<ApiResponse<{ url: string }>> {
  return uploadFile<{ url: string }>(`/book/${bookId}/cover`, file);
}

/**
 * Upload a chapter image
 */
export async function uploadChapterImage(bookId: number, chapterId: number, file: File): Promise<ApiResponse<{ url: string }>> {
  return uploadFile<{ url: string }>(`/book/${bookId}/chapters/${chapterId}/image`, file);
}

/**
 * Get trending books
 */
export async function getTrendingBooks(params: { page: number; limit: number }): Promise<ApiResponse<PaginatedData<Book>>> {
  const queryParams = new URLSearchParams();
  
  // Required parameters
  queryParams.append('page', params.page.toString());
  queryParams.append('limit', params.limit.toString());
  
  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
  
  return get<PaginatedData<Book>>(`/book/trending${queryString}`);
}

/**
 * Get recommended books for the current user
 */
export async function getRecommendedBooks(params: { limit: number  }): Promise<ApiResponse<Book[]>> {
  const queryParams = new URLSearchParams();
  
  // Required parameters
  queryParams.append('limit', params.limit.toString() || '10');
  
  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
  
  return get<Book[]>(`/book/recommend${queryString}`);
}

/**
 * Get reviews/comments for a book with pagination
 */
export async function getBookReviews(params: BookReviewFilters): Promise<ApiResponse<PaginatedData<BookReview>>> {
  const { bookId, page, limit } = params;
  
  const queryParams = new URLSearchParams();
  queryParams.append('bookId', bookId.toString());
  queryParams.append('page', page.toString());
  queryParams.append('limit', limit.toString());
  
  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
  
  return get<PaginatedData<BookReview>>(`/book/book-review${queryString}`);
}

/**
 * Post a new review for a book
 */
export async function postBookReview(bookId: number, data: { comment: string; rating: number }): Promise<ApiResponse<BookReview>> {
  return post<BookReview>(`/book/book-review/${bookId}`, data);
}

/**
 * Get related books for a specific book with pagination
 */
export async function getRelatedBooks({ 
  bookId, 
  page = 1, 
  limit = 5 
}: { 
  bookId: number; 
  page?: number; 
  limit?: number; 
}): Promise<ApiResponse<PaginatedData<Book>>> {
  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('limit', limit.toString());
  
  return get<PaginatedData<Book>>(`/book/related/${bookId}?${params.toString()}`);
}

/**
 * Get all available book categories/genres
 */
export async function getGenres(): Promise<ApiResponse<Category[]>> {
  return get<Category[]>('/book/category');
}

export async function createChapters(bookId: number, chaptersData: ChaptersBatchPayload): Promise<ApiResponse<Chapter[]>> {
  return post<Chapter[]>(`/book/chapter/${bookId}`, chaptersData);
}

/**
 * Get user's followed/bookmarked books
 */
export async function getFollowedBooks(params: { page: number; limit: number }): Promise<ApiResponse<PaginatedData<Book>>> {
  const { page, limit } = params;
  
  const queryParams = new URLSearchParams();
  queryParams.append('page', page.toString());
  queryParams.append('limit', limit.toString());
  
  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
  
  return get<PaginatedData<Book>>(`/book/follow${queryString}`);
}

/**
 * Follow/bookmark a book
 */
export async function followBook(bookId: number): Promise<ApiResponse<{ success: boolean }>> {
  return post<{ success: boolean }>('/book/follow', { bookId });
}

/**
 * Unfollow/remove bookmark for a book
 */
export async function unfollowBook(bookId: number): Promise<ApiResponse<{ success: boolean }>> {
  return delWithBody<{ success: boolean }, { bookId: number }>(
    '/book/follow',
    { bookId }
  );
}

/**
 * Get all chapters for a book
 */
export async function getChaptersByBookId(bookId: number, accessStatus?: ChapterAccessStatus): Promise<ApiResponse<Chapter[]>> {
  const queryParams = new URLSearchParams();
  if (accessStatus) {
    queryParams.append('chapterAccessStatus', accessStatus.toString());
  }
  return get<Chapter[]>(`/book/${bookId}/chapters?${queryParams.toString()}`);
}

/**
 * Get a specific chapter by ID
 */
export async function getChapterById(bookId: number, chapterId: number): Promise<ApiResponse<Chapter>> {
  return get<Chapter>(`/book/${bookId}/chapters/${chapterId}`);
}

/**
 * Get chapter detail by chapter ID
 */
export async function getChapterDetail(chapterId: number): Promise<ApiResponse<Chapter>> {
  return get<Chapter>(`/book/chapter/${chapterId}`);
}

/**
 * Get comments for a specific chapter with pagination
 */
export async function getChapterComments({
  chapterId,
  page = 1,
  limit = 10,
  commentId
}: {
  chapterId: number;
  page?: number;
  limit?: number;
  commentId?: number;
}): Promise<ApiResponse<PaginatedData<any>>> {
  const queryParams = new URLSearchParams();
  queryParams.append('chapterId', chapterId.toString());
  queryParams.append('page', page.toString());
  queryParams.append('limit', limit.toString());
  
  if (commentId) {
    queryParams.append('commentId', commentId.toString());
  }
  
  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
  
  return get<PaginatedData<any>>(`/book/chapter-comment${queryString}`);
}

/**
 * Add a comment to a chapter
 */
export async function addChapterComment(
  chapterId: number,
  comment: string,
  parentId?: number
): Promise<ApiResponse<any>> {
  return post<any>(
    `/book/chapter-comment/${chapterId}`,
    {  comment, chapterId,parentId }
  );
}

/**
 * Update an existing comment
 */
export async function updateChapterComment(
  commentId: number,
  comment: string
): Promise<ApiResponse<any>> {
  return put<any>(
    `/book/chapter-comment/${commentId}`,
    {  comment, commentId }
  );
}

/**
 * Delete a comment
 */
export async function deleteChapterComment(
  commentId: number
): Promise<ApiResponse<any>> {
  return del<any>(
    `/book/chapter-comment/${commentId}`
  );
}

/**
 * Update reading history when a user reads a chapter
 * @param bookId The ID of the book being read
 * @param chapterId The ID of the chapter being read
 * @returns ApiResponse with success status
 */
export async function updateReadingHistory(bookId: number, chapterId: number): Promise<ApiResponse<{ success: boolean }>> {
  return post<{ success: boolean }>(
    `/book/reading-history`,
    { bookId, chapterId }
  );
}

/**
 * Get moderation results for a book
 */

export async function getModerationResults(bookId: number): Promise<ApiResponse<ModerationResultsResponse[]>> {
  return get<ModerationResultsResponse[]>(`/book/${bookId}/moderation`);
}

/**
 * Create moderation results for a book
 */
export async function createModerationResults(bookId: number, moderationData: ModerationResultsPayload): Promise<ApiResponse<ModerationResultsResponse>> {
  return post<ModerationResultsResponse>(`/book/${bookId}/moderation`, moderationData);
}

/**
 * Update moderation results for a book
 */
export async function updateModerationResults(bookId: number, moderationData: ModerationResultsPayload): Promise<ApiResponse<ModerationResultsResponse>> {
  return patch<ModerationResultsResponse>(`/book/${bookId}/moderation`, moderationData);
}

/**
 * Get book statistics (overview + chart data)
 */
export async function getBookStatistics(params: AnalyticsTimeRangeParams): Promise<ApiResponse<BookStatisticsResponse>> {
  const queryParams = new URLSearchParams();
  
  // Add period parameter
  if (params.period) {
    queryParams.append('period', params.period);
  }
  
  // Add date range parameters
  if (params.startDate) {
    queryParams.append('startDate', params.startDate);
  }
  if (params.endDate) {
    queryParams.append('endDate', params.endDate);
  }
  
  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
  
  return get<BookStatisticsResponse>(`/book/statistics${queryString}`);
} 