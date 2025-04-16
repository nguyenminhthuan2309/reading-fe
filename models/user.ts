// User type definition
export type User = {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: UserRole;
  createdAt: string; // ISO date string
  updatedAt?: string; // ISO date string
  preferences?: UserPreferences;
  points: number;
  status: UserStatus;
};

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