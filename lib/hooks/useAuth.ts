'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  login, 
  signup, 
  getCurrentUser, 
  updateUserPreferences,
  verifyEmail,
  resendVerificationEmail,
} from '@/lib/api/auth';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useUserStore } from '@/lib/store';
import { LoginCredentials, SignupCredentials } from '@/models';

const USER_QUERY_KEY = 'me';
const EMAIL_VERIFICATION_KEY = 'emailVerification';

export function useAuth() {
  const queryClient = useQueryClient();
  const router = useRouter();
  
  // Use Zustand store instead of local storage functions
  const { 
    user, 
    token, 
    isLoggedIn,
    setUser, 
    setToken, 
    logout: logoutStore 
  } = useUserStore();

  // Get current user
  const { isLoading: isLoadingUser } = useQuery({
    queryKey: [USER_QUERY_KEY],
    queryFn: async () => {
      if (!token) return null;
      const response = await getCurrentUser();
      if (response.data?.data) {
        setUser(response.data.data);
        return response.data.data;
      }
      return null;
    },
    enabled: !!token && !user,
  });

  // Signup mutation
  const { mutate: signupMutation, isPending: isSigningUp } = useMutation({
    mutationFn: async (credentials: SignupCredentials) => {
      const response = await signup(credentials);
      
      if (response.status !== 201) {
        toast.error(response.data.msg);
        throw new Error(response.data.msg);
      }
      
      if (response.data) {
        return response.data.data;
      }
      
      throw new Error('Signup failed');
    },
    onSuccess: (userData) => {
      queryClient.setQueryData([USER_QUERY_KEY], userData);
      router.push(`/verify-email?email=${encodeURIComponent(userData.email)}`);
    },
  });

  // Update preferences mutation
  const { mutate: updatePreferencesMutation, isPending: isUpdatingPreferences } = useMutation({
    mutationFn: async (genres: string[]) => {
      if (!token) throw new Error('Not authenticated');
      
      const response = await updateUserPreferences(genres);
      
      if (response.status !== 200) {
        throw new Error(response.data.msg);
      }
      
      return response.data.data ?? null;
    },
    onSuccess: (userData) => {
      if (userData) {
        // Update user in Zustand store
        setUser(userData);
        queryClient.setQueryData([USER_QUERY_KEY], userData);
      }
      router.push('/');
    },
  });

  // Verify email mutation
  const { 
    mutate: verifyEmailMutation, 
    isPending: isVerifyingEmail,
    data: verificationData,
    isSuccess: isVerificationSuccessful,
    isError: isVerificationFailed,
    error: verificationError
  } = useMutation({
    mutationKey: [EMAIL_VERIFICATION_KEY],
    mutationFn: async (verificationToken: string) => {
      const response = await verifyEmail(verificationToken);
      
      if (!response.data.status) {
        toast.error(response.data.msg || 'Verification failed');
        throw new Error(response.data.msg || 'Verification failed');
      }
      
      toast.success('Email verified successfully!');
      return {
        success: true,
        message: 'Your email has been successfully verified. You can now sign in.'
      };
    }
  });

  // Resend verification email mutation
  const { 
    mutate: resendVerificationMutation, 
    isPending: isResendingVerification 
  } = useMutation({
    mutationFn: async (email: string) => {
      if (!email) {
        toast.error('No email address provided');
        throw new Error('No email address provided');
      }
      
      const response = await resendVerificationEmail(email);
      
      if (!response.data.status) {
        toast.error(response.data.msg || 'Failed to resend verification email');
        throw new Error(response.data.msg || 'Failed to resend verification email');
      }
      
      toast.success('Verification email resent successfully');
      return { success: true };
    }
  });

  // Logout function
  const logout = () => {
    // Use Zustand store logout
    logoutStore();
    queryClient.setQueryData([USER_QUERY_KEY], null);
    router.push('/signin');
  };

  return {
    user,
    isLoadingUser,
    isLoggedIn,
    signup: signupMutation,
    isSigningUp,
    updatePreferences: updatePreferencesMutation,
    isUpdatingPreferences,
    verifyEmail: verifyEmailMutation,
    isVerifyingEmail,
    verificationData,
    isVerificationSuccessful,
    isVerificationFailed,
    verificationError,
    resendVerification: resendVerificationMutation,
    isResendingVerification,
    logout,
  };
} 