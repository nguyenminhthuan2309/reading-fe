import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User, UserRoleEnum } from '@/models';
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
const setCookie = (token: string | undefined | null, user: User | null) => {
  if (token) {
    // Set auth token cookie with expiration (7 days) and HTTP only for security
    Cookies.set('auth_token', token, { expires: 7, secure: process.env.NODE_ENV === 'production' });
    
    // Set user role cookie if user exists
    if (user?.role?.name) {
      Cookies.set('user_role', user.role.name, { expires: 7, secure: process.env.NODE_ENV === 'production' });
    }
  } else {
    // Remove cookies when token is null
    Cookies.remove('auth_token');
    Cookies.remove('user_role');
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
        const state = useUserStore.getState();
        // Set or remove cookies when token changes
        setCookie(token, state.user);
        set({ token });
      },
      logout: () => {
        // Clear cookies on logout
        setCookie(null, null);
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