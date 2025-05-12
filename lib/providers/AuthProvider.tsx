'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useUserStore } from '@/lib/store';
import { getCurrentUser } from '@/lib/api/auth';
import Cookies from 'js-cookie';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { user, token, setUser, setToken } = useUserStore();
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const initAuth = async () => {
      // Check for cookie token
      const cookieToken = Cookies.get('auth_token');
      
      // If no token in cookie, user is a guest - render immediately
      if (!cookieToken && !token) {
        setIsLoading(false);
        return;
      }
      
      // If we have a cookie token, ensure we fetch user data before rendering
      setIsLoading(true);
      
      // If token exists but doesn't match store, sync it
      if (cookieToken !== token) {
        setToken(cookieToken);
      }

      console.log('AuthProvider: user', user);
      
      // Try to get the user data with the token if we don't have user data yet
      if (!user) {
        try {
          const response = await getCurrentUser();
          if (response.data) {
            setUser(response.data);
          }
        } catch (error) {
          console.error('Failed to get user data:', error);
          // If getting user fails, clear the token as it might be invalid
          setToken(null);
          setUser(null);
        }
      }
      
      setIsLoading(false);
    };
    
    initAuth();
  }, [token, user, setToken, setUser]);
  
  // If we're trying to authenticate a user with a token, show nothing
  if (isLoading) {
    return null
  }
  
  // Once we know the auth status (guest or authenticated), render the children
  return <>{children}</>;
} 