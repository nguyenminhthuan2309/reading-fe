import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User } from '@/models';
import Cookies from 'js-cookie';

interface UserState {
  user: User | null;
  token: string | null;
  isLoggedIn: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string | undefined | null) => void;
  logout: () => void;
}

// Helper to manage cookies alongside store
const setCookie = (token: string | undefined | null) => {
  if (token) {
    // Set cookie with expiration (7 days) and HTTP only for security
    Cookies.set('auth_token', token, { expires: 7, secure: process.env.NODE_ENV === 'production' });
  } else {
    // Remove cookie when token is null
    Cookies.remove('auth_token');
  }
};

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isLoggedIn: false,
      setUser: (user) => set({ 
        user, 
        isLoggedIn: !!user 
      }),
      setToken: (token) => {
        // Set or remove cookie when token changes
        setCookie(token);
        set({ token });
      },
      logout: () => {
        // Clear cookie on logout
        setCookie(null);
        set({ 
          user: null, 
          token: null, 
          isLoggedIn: false 
        });
      },
    }),
    {
      name: 'user',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ 
        user: state.user, 
        token: state.token,
        isLoggedIn: state.isLoggedIn
      }),
    }
  )
); 