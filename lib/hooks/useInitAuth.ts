'use client';

import { useEffect } from 'react';
import { useUserStore } from '@/lib/store';
import Cookies from 'js-cookie';
import { getCurrentUser } from '@/lib/api/auth';

/**
 * Hook to initialize authentication state from cookies
 * This ensures the client-side state is in sync with the server-side cookies
 */
export function useInitAuth() {
  const { user, token, setUser, setToken } = useUserStore();
  
  useEffect(() => {
    const init = async () => {
      // Check for cookie token
      const cookieToken = Cookies.get('auth_token');
      
      // If we have a cookie token but no store token, sync them
      if (cookieToken && !token) {
        setToken(cookieToken);
        
        // Try to get the user data with the token
        try {
          const response = await getCurrentUser(cookieToken);
          if (response.data?.data) {
            setUser(response.data.data);
          }
        } catch (error) {
          console.error('Failed to get user data:', error);
          // If getting user fails, clear the token as it might be invalid
          setToken(null);
          setUser(null);
        }
      } 
      // If we have a store token but no cookie, sync them
      else if (token && !cookieToken) {
        Cookies.set('auth_token', token, { 
          expires: 7, 
          secure: process.env.NODE_ENV === 'production' 
        });
      }
    };
    
    init();
  }, [token, setToken, setUser]);
  
  return { isAuthenticated: !!user };
} 