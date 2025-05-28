/**
 * Query Keys for React Query
 * 
 * This file centralizes all the query keys used throughout the application
 * to ensure consistency and avoid typos.
 */

// Auth related query keys
export const AUTH_KEYS = {
  ME: ['me'] as const,
} as const;

// User related query keys
export const USER_KEYS = {
  ALL: ['users'] as const,
  LIST: (params: any) => ['users', 'list', params] as const,
  DETAIL: (userId: string | number) => ['user', userId] as const,
  BALANCE: (userId:  number) => ['user', 'balance', userId] as const,
} as const;

// Book related query keys
export const BOOK_KEYS = {
  ALL: ['books'] as const,
  LIST: (filters: any) => ['books', 'list', filters] as const,
  DETAIL: (bookId: string ) => ['books', 'detail', bookId] as const,
  EDIT: (bookId: string | number) => ['books', 'edit', bookId] as const,
  NEW_RELEASES: ['books', 'newReleases'] as const,
  RECENTLY_UPDATED: ['books', 'recentlyUpdated'] as const,
  RECENTLY_READ: ['books', 'recentlyRead'] as const,
  TRENDING: ['books', 'trending'] as const,
  RECOMMENDED: ['books', 'recommend'] as const,
  RELATED: (bookId: string | number, page?: number, limit?: number) => 
    ['books', 'related', bookId, page, limit] as const,
  FOLLOWED: (page?: number, limit?: number) => 
    ['books', 'followed', page, limit] as const,
  USER_BOOKS: (userId: string | number, page?: number, limit?: number, filter?: string, accessStatusId?: number, progressStatusId?: number) => 
    ['books', 'user', userId, page, limit, filter, accessStatusId, progressStatusId] as const,
} as const;

// Chapter related query keys
export const CHAPTER_KEYS = {
  LIST: (bookId: string | number) => ['chapters', 'list', bookId] as const,
  DETAIL: (chapterId: string | number, chapterNumber?: number) => 
    ['chapters', 'detail', chapterId, chapterNumber] as const,
  BOOK_CHAPTERS: (bookId: string | number) => [ 'chapters', bookId] as const,
} as const;

// Comment related query keys
export const COMMENT_KEYS = {
  CHAPTER_COMMENTS: (chapterId: string | number, limit?: number) => 
    ['comments', 'chapter', chapterId, limit] as const,
  COMMENT_REPLIES: (commentId: string | number) => 
    ['comments', 'replies', commentId] as const,
  BOOK_REVIEWS: (bookId: string | number, page?: number, limit?: number) => 
    ['reviews', bookId, page, limit] as const,
} as const;

// Category/Genre related query keys
export const CATEGORY_KEYS = {
  ALL: ['genres'] as const,
  CATEGORIES: ['categories'] as const,
} as const;

// Payment related query keys
export const PAYMENT_KEYS = {
  TRANSACTION: (orderId: string | number, requestId: string | number) => 
    ['payment', 'transaction', orderId, requestId] as const,
} as const; 

// OpenAI related query keys
export const OPENAI_KEYS = {
  MODERATION: ['openai', 'moderation'] as const,
} as const;

// Notification related query keys
export const NOTIFICATION_KEYS = {
  NOTIFICATIONS: (query: string) => ['notifications', query] as const,
  NOTIFICATION_COUNT: ['notification', 'count'] as const,
  NOTIFICATION_READ: ['notification', 'read'] as const,
  NOTIFICATION_UNREAD: ['notification', 'unread'] as const,
} as const;

// Admin related query keys
export const ADMIN_KEYS = {
  BOOKS: {
    ALL: ['admin', 'books'] as const,
    LIST: (status: string, page: number, search?: string) => 
      ['admin', 'books', 'list', status, page, search] as const,
    PENDING: (page: number, search?: string) => 
      ['admin', 'books', 'pending', page, search] as const,
    PUBLISHED: (page: number, search?: string) => 
      ['admin', 'books', 'published', page, search] as const,
    BLOCKED: (page: number, search?: string) => 
      ['admin', 'books', 'blocked', page, search] as const,
  }
} as const;

// Activity/Missions related query keys
export const ACTIVITY_KEYS = {
  AVAILABLE: ['activities', 'available'] as const,
  ALL: ['activities'] as const,
  USER_ACTIVITIES: (userId: string | number) => ['activities', 'user', userId] as const,
  USER_ACTIVITY_FILTERED: (userId: string | number, params: any) => 
    ['activities',  'filtered', params] as const,
} as const;

// Analytics related query keys
export const ANALYTICS_KEYS = {
  VISITS: {
    ALL: ['analytics', 'visits'] as const,
    BY_VISITOR: (visitorId: string) => ['analytics', 'visits', 'visitor', visitorId] as const,
    BY_USER: ['analytics', 'visits', 'user'] as const,
    BY_TIME_RANGE: (params: any) => ['analytics', 'visits', 'range', params] as const,
    STATS: (params: any) => ['analytics', 'visits', 'stats', params] as const,
    DETAIL: (visitId: string) => ['analytics', 'visits', 'detail', visitId] as const,
  },
  PAGE_VIEWS: {
    ALL: ['analytics', 'pageViews'] as const,
    BY_VISIT: (visitId: string) => ['analytics', 'pageViews', 'visit', visitId] as const,
    BY_TIME_RANGE: (params: any) => ['analytics', 'pageViews', 'range', params] as const,
    STATS: (params: any) => ['analytics', 'pageViews', 'stats', params] as const,
  },
  BOUNCE_RATE: (params: any) => ['analytics', 'bounceRate', params] as const,
} as const;


