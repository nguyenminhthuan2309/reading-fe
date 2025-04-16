'use client';

import { ReactNode } from 'react';
import { useInitAuth } from '@/lib/hooks';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  // Initialize authentication from cookies
  useInitAuth();
  
  return <>{children}</>;
} 