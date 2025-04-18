// User type definition
import { Genre } from './genre';

export type User = {
  id: string;
  name: string;
  email: string;
  username?: string;
  avatar?: string;
  role: UserRole;
  createdAt: string; // ISO date string
  updatedAt?: string; // ISO date string
  preferences?: UserPreferences;
  points: number;
  status: UserStatus;
  joinedDate: string;
  bio: string;
  location: string;
  birthday?: string; // ISO date string
  readingStats: {
    booksRead: number;
    chaptersRead: number;
    hoursRead: number;
    avgRating: number;
  };
  authoredBooks?: any[]; // Books created by the user
  socialLinks?: SocialLinks; // Social media links
};

export interface SocialLinks {
  facebook?: string;
  twitter?: string;
  instagram?: string;
}

export interface UserStatus {
  id: number;
  name: string;
}

// User roles
export interface UserRole {
  id: number;
  name: string;
}

// User preferences
export type UserPreferences = {
  theme?: 'light' | 'dark' | 'system';
  language?: string;
  favoriteGenres?: Genre[];
  readingSpeed?: string;
  notifications?: {
    email: boolean;
    push: boolean;
  };
};

// Reading history item
export interface ReadingHistoryItem {
  bookId: string;
  bookTitle: string;
  coverImage?: string;
  lastReadChapter: number;
  progress: number;
  lastReadAt: string;
}

export type SigninResponse = {
  accessToken: string;
  expiresIn: number;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials {
  name: string;
  email: string;
  password: string;
}
