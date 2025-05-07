// User type definition
import { Genre } from './genre';

// User role enum
export enum UserRoleEnum {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  MEMBER = 'MEMBER'
}

// User roles with their IDs
export const USER_ROLES = [
  { id: 1, name: UserRoleEnum.ADMIN },
  { id: 2, name: UserRoleEnum.MANAGER },
  { id: 3, name: UserRoleEnum.MEMBER }
];

// User role enum
export enum UserStatusEnum {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  BANNED = 'BANNED'
}

// User roles with their IDs
export const USER_STATUSES = [
  { id: 1, name: UserStatusEnum.ACTIVE },
  { id: 2, name: UserStatusEnum.INACTIVE },
  { id: 3, name: UserStatusEnum.BANNED }
];

export type User = {
  id: number;
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
  gender?: string; // Added gender field
  readingStats: {
    booksRead: number;
    chaptersRead: number;
    hoursRead: number;
    avgRating: number;
  };
  tokenBalance
  :
  number
  tokenEarned
  :
  number
  tokenPurchased
  :
  number
  tokenReceived
  :
  number
  tokenSpent
  :
  number
  tokenWithdrawn
  :
  number
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
  name: UserRoleEnum | string;
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

export type SigninResponse = {
  accessToken: string;
  expiresIn: number;
  user: User;
}

export type VerifyEmailResponse = {
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
  gender?: string; // Added gender field
}

export interface Author {
  id: number;
  name: string;
  avatar?: string;
  email: string;
}
