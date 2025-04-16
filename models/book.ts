// Define chapter type
export type Chapter = {
  id: string;
  title: string;
  content: string;
  images?: Array<ImageObject | string>; // For picture books, supports both string URLs and object format
  wordContent?: string; // For word books
  documentUrl?: string; // For uploaded .doc files
};

// Image object type definition
export type ImageObject = {
  url: string;
  fileName: string;
};

// Book types constants
export const BOOK_TYPES = {
  PICTURE_BOOK: "picture_book",
  WORD_BOOK: "word_book"
} as const;

export type BookType = typeof BOOK_TYPES[keyof typeof BOOK_TYPES];

// Book type
export type Book = {
  id: string;
  title: string;
  author: string;
  genres: string[];
  description: string;
  chapters: Chapter[];
  rating: number;
  progress: number;
  coverImage: string;
  status: "published" | "draft";
  authorId: string;
  bookType: BookType;
}; 