import { Genre } from './genre';
import { Author } from './user';

// Define chapter type
export type Chapter = {
  id: number;
  chapter: number;
  title: string;
  content: string | string[];
  isLocked: boolean;
  price: string;
  createdAt: string;
  updatedAt: string;
  moderated?: string;
  chapterAccessStatus?: ChapterAccessStatus;
};

// Legacy chapter type for backward compatibility
export type LegacyChapter = {
  id: string;
  title: string;
  content: string;
  images?: Array<ImageObject | string>;
  wordContent?: string;
  documentUrl?: string;
  orderIndex?: number;
};

// Image object type definition
export type ImageObject = {
  url: string;
  fileName: string;
};

// Book Type Definition - UI/API Format
export interface BookType {
  id: number;
  name: string;
}

// Pre-defined Book Types
export const BOOK_TYPES_API: BookType[] = [
  { id: 1, name: 'Novel' },
  { id: 2, name: 'Manga' }
];

export const BOOK_TYPES = {
  NOVEL: "Novel",
  MANGA: "Manga"
} as const;

// Progress Status enum
export enum ProgressStatusEnum {
  ONGOING = 1,
  COMPLETED = 2,
  DROPPED = 3
}

// Progress Status with display names
export const PROGRESS_STATUSES = [
  { id: ProgressStatusEnum.ONGOING, name: 'Ongoing' },
  { id: ProgressStatusEnum.COMPLETED, name: 'Completed' },
  { id: ProgressStatusEnum.DROPPED, name: 'Dropped' }
];

// Access Status enum
export enum AccessStatusEnum {
  PUBLISHED = 1,
  PRIVATE = 2,
  BLOCKED = 3,
  PENDING = 4
}

// Access Status with display names
export const ACCESS_STATUSES = [
  { id: AccessStatusEnum.PUBLISHED, name: 'Published' },
  { id: AccessStatusEnum.PRIVATE, name: 'Private' },
  { id: AccessStatusEnum.BLOCKED, name: 'Blocked' },
  { id: AccessStatusEnum.PENDING, name: 'Pending' }
];

// Age Rating enum
export enum AgeRatingEnum {
  EVERYONE = 1,
  TEEN = 2,
  MATURE = 3,
  ADULT = 4
}

// Age Rating with display names
export const AGE_RATINGS = [
  { id: AgeRatingEnum.EVERYONE, name: 'Everyone' },
  { id: AgeRatingEnum.TEEN, name: 'Teen (13+)' },
  { id: AgeRatingEnum.MATURE, name: 'Mature (16+)' },
  { id: AgeRatingEnum.ADULT, name: 'Adult (18+)' }
];

// Sort direction
export enum SortDirectionEnum {
  ASC = 'ASC',
  DESC = 'DESC'
}

// Sort types for different categories (renaming to match the new requirement)
export enum SortTypeEnum {
  ASC = 'ASC',
  DESC = 'DESC'
}

// Book types constants - Internal format
export const BOOK_TYPES_INTERNAL = {
  PICTURE_BOOK: "picture_book",
  WORD_BOOK: "word_book"
} as const;

export type BookTypeInternal = typeof BOOK_TYPES_INTERNAL[keyof typeof BOOK_TYPES_INTERNAL];

// Status type with description
export interface Status {
  id: number;
  name: string;
  description: string;
}

// Category type
export interface Category {
  id: number;
  name: string;
  totalBooks?: number;
}

// Book type
export type Book = {
  id: number;
  title: string;
  description: string;
  cover: string;
  views: number;
  rating: number;
  totalChapters: number;
  totalPrice: number;
  followsCount: number;
  isFollowed: boolean;
  author: Author;
  bookType: BookType;
  accessStatus: Status;
  progressStatus: Status;
  categories: Category[];
  createdAt: string;
  updatedAt?: string;
  chapters?: Chapter[];
  ageRating?: number;
  totalPurchases?: number;
  moderated?: 'omni-moderation-latest' | 'gpt-4o' | 'o4-mini';
  readingProgress?: ReadingProgress;
  chaptersRead?: ChapterRead[];
};

export type ReadingProgress = {
  lastReadChapterId?: number;
  lastReadChapterNumber?: number;
  totalReadChapters?: number;
}

// For backward compatibility - will be gradually removed
export type LegacyBook = {
  id: string;
  title: string;
  author: string;
  genres: string[] | Genre[];
  description: string;
  chapters: Chapter[];
  rating: number;
  progress: number;
  coverImage: string;
  status: ProgressStatusEnum;
  authorId: string;
  bookType?: BookType;
  wordCount?: number;
  pageCount?: number;
  createdAt?: string;
  updatedAt?: string;
  progressStatusId?: number;
  accessStatusId?: number;
  ageRatingId?: number;
};

// Reading history item
export interface ReadingHistoryItem extends Book {
  chaptersRead: ChapterRead[];
}

export interface ChapterRead {
  id: number;
  title: string;
  lastReadAt: string;
  isLocked: boolean;
  chapter: number;
}

// Filters for getting books
export interface BookFilters {
  categoryId?: number | number[]; // Changed from genre to categoryId
  search?: string;
  page: number; // Required
  limit: number; // Required
  sortBy?: 'createdAt' | 'updatedAt' | 'views' | 'title';
  userId?: number; // User ID is a number
  bookTypeId?: number; // BookType id
  progressStatusId?: number; // ProgressStatus id
  accessStatusId?: number; // AccessStatus id
  hasChapter?: boolean; // Whether book has chapter
  sortType?: SortTypeEnum; // Sort type (ASC or DESC)
  ageRating?: number; // Age rating
}

// Filters for getting reading history
export interface ReadingHistoryFilters {
  page: number; // Required
  limit: number; // Required
  userId?: string; // Optional - if not provided, uses current authenticated user
} 


// Book update request payload type
export interface BookUpdatePayload {
  title?: string;
  description?: string;
  cover?: string;
  ageRating?: number;
  bookTypeId?: number;
  progressStatusId?: number;
  accessStatusId?: number;
  categoryIds?: number[];
  isDraft?: boolean;
}

// Book creation request payload type
export interface BookCreatePayload {
  title: string;
  description: string;
  cover: string;
  ageRating?: number;
  bookTypeId: number;
  progressStatusId: number;
  accessStatusId?: number;
  categoryIds: number[];
  isDraft?: boolean;
}

// Book review/comment model
export interface BookReview {
  id: number;
  comment: string;
  rating: number;
  createdAt: string;
  updatedAt?: string;
  user: {
    id: number;
    name: string;
    avatar?: string;
  };
}

// Book review filters
export interface BookReviewFilters {
  bookId: number;
  page: number;
  limit: number;
}


/**
 * Create multiple chapters for a book
 */
export interface ChapterCreateItem {
  title: string;
  chapter: number;
  content: string;
  chapterAccessStatus?: string;
}

export interface ChaptersBatchPayload {
  chapters: ChapterCreateItem[];
}

  // Comment model
export interface Comment {
  id: number;
  comment: string;
  createdAt: string;
  totalChildComments?: number;
  user: {
    id: string | number;
    name: string;
    email: string;
    avatar?: string;
  };
  parentId?: number | null;
}


export enum ChapterAccessStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  PENDING_REVIEW = 'pending_review',
  REJECTED = 'rejected',
}