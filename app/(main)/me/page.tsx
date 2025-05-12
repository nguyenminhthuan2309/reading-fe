"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Book,
  BookOpen,
  Clock,
  Heart,
  LayoutGrid,
  PlusCircle,
  Star,
  User as UserIcon,
  ChevronLeft,
  Settings,
  Shield,
  Bookmark,
  BarChart,
  PenSquare,
  ArrowDownCircle,
  ArrowUpCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  Camera,
  RefreshCw,
  ExternalLink
} from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getCurrentUser, getUserById, updateUserProfile } from "@/lib/api/auth";
import { updatePassword } from "@/lib/api/auth";
import { uploadAvatar } from "@/lib/api/user";
import { useUserStore } from "@/lib/store";
import { User, UserPreferences } from "@/models";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import * as yup from "yup";
import { UserBooks } from "@/components/user/user-books";
import { FollowedBooks } from "@/components/user/followed-books";
import { AUTH_KEYS, USER_KEYS } from "@/lib/constants/query-keys";
import { RecentlyReadBooks } from "@/components/user/recently-read-books";

// Create a complete initial user data with proper types
const defaultPreferences: Required<UserPreferences> = {
  theme: "light",
  language: "EN",
  favoriteGenres: [],
  readingSpeed: "medium",
  notifications: {
    email: false,
    push: false
  }
};

export const MAX_AVATAR_SIZE = 1 * 1024 * 1024; // 1MB in bytes


// Initial user data
const INITIAL_USER_DATA: User = {
  id: 0,
  name: '',
  email: '',
  username: '',
  avatar: '',
  bio: '',
  location: '',
  joinedDate: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  birthday: '',
  points: 0,
  status: { id: 0, name: 'New' },
  role: { id: 0, name: 'User' },
  readingStats: {
    booksRead: 0,
    chaptersRead: 0,
    hoursRead: 0,
    avgRating: 0
  },
  tokenBalance: 0,
  tokenEarned: 0,
  tokenPurchased: 0,
  tokenReceived: 0,
  tokenSpent: 0,
  tokenWithdrawn: 0,
  preferences: defaultPreferences,
  socialLinks: {
    facebook: '',
    twitter: '',
    instagram: '',

  }
};

type ProfilePage = "account" | "balance" | "shelf" | "bookmarks" | "history" | "analytics" | "preferences";

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const userId = params.id as string;
  const { user, token } = useUserStore();

  // Create updatePassword mutation
  const updatePasswordMutation = useMutation({
    mutationFn: async ({ oldPassword, newPassword }: { oldPassword: string; newPassword: string }) => {
      const response = await updatePassword(oldPassword, newPassword);

      if (response.status !== 200 && response.status !== 201) {
        throw new Error(response.msg || 'Failed to update password');
      }

      return { success: true };
    },
    onSuccess: () => {
      toast.success('Password updated successfully');

      // Reset form and close it
      setIsChangingPassword(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    },
    onError: (error: Error) => {
      // Set error message to current password field by default
      setPasswordErrors(prev => ({
        ...prev,
        currentPassword: error.message
      }));

      // If the error message indicates invalid old password
      if (error.message.toLowerCase().includes('old password') ||
        error.message.toLowerCase().includes('current password') ||
        error.message.toLowerCase().includes('incorrect password')) {
        setPasswordErrors(prev => ({
          ...prev,
          currentPassword: error.message
        }));
      }
      // If there's an issue with the new password
      else if (error.message.toLowerCase().includes('new password')) {
        setPasswordErrors(prev => ({
          ...prev,
          newPassword: error.message
        }));
      }
      // For other errors
      else {
        toast.error(error.message || 'Failed to update password');
      }
    }
  });

  // Initialize with the default user data (non-null)
  const [userData, setUserData] = useState<User>(structuredClone(INITIAL_USER_DATA));

  // Get section from URL query parameter, default to "account"
  const sectionParam = searchParams.get('section');
  const [activePage, setActivePage] = useState<ProfilePage>(sectionParam as ProfilePage || "account");

  // Update URL with section=account if it's missing on initial load
  useEffect(() => {
    if (!sectionParam) {
      // If no section parameter, add it with default value "account"
      const newParams = new URLSearchParams(searchParams);
      newParams.set('section', 'account');
      // Update URL without reloading the page
      router.replace(`?${newParams.toString()}`, { scroll: false });
    }
  }, [router, params, searchParams, sectionParam]);

  // Update active page when URL changes
  useEffect(() => {
    if (sectionParam) {
      setActivePage(sectionParam as ProfilePage);
    }
  }, [sectionParam]);

  // Function to update active page and URL query parameter
  const handleNavigate = (page: ProfilePage) => {
    setActivePage(page);
    // Create new URLSearchParams object from current params
    const newParams = new URLSearchParams(searchParams);
    // Set the section parameter
    newParams.set('section', page);
    // Update URL without reloading the page
    router.replace(`?${newParams.toString()}`, { scroll: false });
  };

  // Add state for editing mode and edit form data
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    username: '',
    bio: '',
    birthday: '',
    socialLinks: {
      facebook: '',
      twitter: '',
      instagram: '',

    }
  });

  // Add these new states and functions

  const [preferencesFormData, setPreferencesFormData] = useState({
    readingSpeed: '',
    theme: '',
    language: '',
    emailNotifications: '',
    pushNotifications: ''
  });

  // Add state for password change functionality
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  });

  // Add state to track if preferences have changed
  const [preferencesChanged, setPreferencesChanged] = useState(false);

  // Add state for avatar editing
  const [isEditingAvatar, setIsEditingAvatar] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  // Add state for the active book filter
  const [activeBookFilter, setActiveBookFilter] = useState<string>("all");

  // Add state for password validation errors
  const [passwordErrors, setPasswordErrors] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Password validation schema
  const passwordSchema = yup.object({
    currentPassword: yup.string().required("Current password is required"),
    newPassword: yup.string()
      .required("New password is required")
      .min(6, "New password must be at least 6 characters"),
    confirmPassword: yup.string()
      .required("Please confirm your password")
      .oneOf([yup.ref('newPassword')], "Passwords must match")
  });

  const mergeUserData = (user: User) => {
    const mergedUser: User = {
      ...structuredClone(INITIAL_USER_DATA),
      ...user,
      // Ensure these nested objects are properly merged
      readingStats: {
        ...INITIAL_USER_DATA.readingStats,
        ...(user.readingStats || {})
      },
      // Ensure preferences is never undefined
      preferences: {
        ...defaultPreferences,
        ...(user.preferences || {}),
        // Ensure favoriteGenres is always present
        favoriteGenres: user.preferences?.favoriteGenres || []
      }
    };

    return mergedUser;
  }

  const userQuery = useQuery({
    queryKey: AUTH_KEYS.ME,
    queryFn: async () => {

      const response = await getCurrentUser();
      // Check if user doesn't exist (404 status)
      if (response.status === 404) {
        return null;
      }

      const mergedUser = mergeUserData(response.data);

      setUserData(mergedUser);
      return mergedUser;
    },
    staleTime: 0,
  });

  const updateUserMutation = useMutation({
    mutationFn: async (updatedData: Partial<User>) => {
      return await updateUserProfile(userId, updatedData);
    },
    onSuccess: (response) => {
      // Invalidate the user query to refetch the data
      queryClient.invalidateQueries({ queryKey: USER_KEYS.DETAIL(userId) });

      // If this is the current user's profile, update the global user state as well
      if (response?.data) {
        // Get the updated user data
        const updatedUser = response.data;

        // Update the global user state
        useUserStore.getState().setUser({
          ...user!,  // Keep existing user data
          ...updatedUser // Merge with the updated data
        });

        // Also invalidate the current user query if it exists
        queryClient.invalidateQueries({ queryKey: AUTH_KEYS.ME });
      }
    }
  });

  // When user data is fetched, initialize the preferences form data
  useEffect(() => {
    if (userData && userData.preferences) {
      setPreferencesFormData({
        readingSpeed: userData.preferences.readingSpeed || 'medium',
        theme: userData.preferences.theme || 'light',
        language: userData.preferences.language || 'EN',
        emailNotifications: userData.preferences.notifications?.email ? 'enabled' : 'disabled',
        pushNotifications: userData.preferences.notifications?.push ? 'enabled' : 'disabled'
      });
    }
  }, [userData]);

  // Add a avatarUpload mutation
  const avatarUploadMutation = useMutation({
    mutationFn: async (file: File) => {
      return await uploadAvatar(file);
    },
    onSuccess: (response) => {
      // Check if the API response is successful
      if (response.status) {
        const avatarUrl = response.data;


        // Update the user profile with the new avatar URL
        handleProfileUpdate({ avatar: avatarUrl });

        // If this is the current user's profile, also update the avatar in the global user state
        if (user) {
          useUserStore.getState().setUser({
            ...user,
            avatar: avatarUrl
          });
        }

        toast.success('Avatar uploaded successfully');
      } else {
        toast.error(response.msg || 'Failed to upload avatar');
      }
    },
  });

  if (userQuery.isLoading) {
    return (
      <div className="container mx-auto px-4 py-12 flex flex-col items-center justify-center min-h-[70vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
          <p className="text-lg font-medium">Loading your profile...</p>
        </div>
      </div>
    );
  }

  // Show user not found message if user doesn't exist
  if (userQuery.data === null) {
    return (
      <div className="container mx-auto px-4 py-12 flex flex-col items-center justify-center min-h-[70vh]">
        <h1 className="text-4xl font-bold text-red-600 mb-4">User Not Found</h1>
        <p className="text-lg mb-8">The user you're looking for doesn't exist or has been removed.</p>
        <Link
          href="/"
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back to Homepage
        </Link>
      </div>
    );
  }

  // Handle profile update
  const handleProfileUpdate = (updatedData: Partial<User>) => {
    updateUserMutation.mutate(updatedData);
  };

  // Generate a display username
  const displayUsername = userData.username || userData.name.toLowerCase().replace(/\s+/g, '');

  // Ensure preferences is always accessible
  const preferences = userData.preferences || defaultPreferences;

  // Function to toggle password visibility
  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPassword(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  // Function to start editing
  const startEditing = () => {
    setEditFormData({
      name: userData.name,
      username: displayUsername.replace('@', ''),
      bio: userData.bio || '',
      birthday: userData.birthday || '',
      socialLinks: {
        facebook: userData.socialLinks?.facebook || '',
        twitter: userData.socialLinks?.twitter || '',
        instagram: userData.socialLinks?.instagram || ''
      }
    });
    setIsEditing(true);
  };

  // Function to cancel editing
  const cancelEditing = () => {
    setIsEditing(false);
  };

  // Function to save edits
  const saveEdits = () => {
    const updatedData = {
      name: editFormData.name,
      username: editFormData.username,
      bio: editFormData.bio,
      birthday: editFormData.birthday,
      socialLinks: editFormData.socialLinks
    };

    handleProfileUpdate(updatedData);
    setIsEditing(false);
  };

  // Handle form field changes
  const handleInputChange = (field: string, value: string) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle social link changes
  const handleSocialLinkChange = (platform: string, value: string) => {
    setEditFormData(prev => ({
      ...prev,
      socialLinks: {
        ...prev.socialLinks,
        [platform]: value
      }
    }));
  };

  // Handle preferences form field changes
  const handlePreferencesChange = (field: string, value: string) => {
    setPreferencesFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setPreferencesChanged(true);
  };

  // Function to save preferences edits
  const savePreferencesEdits = () => {
    const updatedData = {
      preferences: {
        ...userData.preferences,
        readingSpeed: preferencesFormData.readingSpeed,
        theme: preferencesFormData.theme as 'light' | 'dark' | 'system',
        language: preferencesFormData.language,
        notifications: {
          email: preferencesFormData.emailNotifications === 'enabled',
          push: preferencesFormData.pushNotifications === 'enabled'
        }
      }
    };

    handleProfileUpdate(updatedData);
    setPreferencesChanged(false);
  };

  // Start password change process
  const startPasswordChange = () => {
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setPasswordErrors({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setIsChangingPassword(true);
  };

  // Cancel password change
  const cancelPasswordChange = () => {
    setIsChangingPassword(false);
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setPasswordErrors({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
  };

  // Handle password field changes
  const handlePasswordChange = (field: string, value: string) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error for the field when user types
    if (passwordErrors[field as keyof typeof passwordErrors]) {
      setPasswordErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  // Save password changes
  const savePasswordChange = async () => {
    // Reset all error messages
    setPasswordErrors({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });

    try {
      // Validate the form using Yup
      await passwordSchema.validate(passwordData, { abortEarly: false });

      // If validation passes, call the API with mutation
      updatePasswordMutation.mutate({
        oldPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      // Form will be closed in the onSuccess callback
    } catch (error) {
      if (error instanceof yup.ValidationError) {
        // Map Yup validation errors to form fields
        const fieldErrors = {
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        };

        error.inner.forEach(err => {
          if (err.path && err.path in fieldErrors) {
            fieldErrors[err.path as keyof typeof fieldErrors] = err.message;
          }
        });

        setPasswordErrors(fieldErrors);
      }
      // API errors are handled in the mutation's onError callback
    }
  };

  // Function to handle avatar upload
  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // File size validation is handled in the uploadAvatar function
    // but we can also provide a nicer UX by checking here
    if (file.size > MAX_AVATAR_SIZE) {
      toast.error(`Avatar image size must be less than ${MAX_AVATAR_SIZE / (1024 * 1024)}MB`);
      return;
    }

    // Save the file for preview
    setAvatarFile(file);

    // Upload the file using our mutation
    avatarUploadMutation.mutate(file);
  };

  // Function to handle book filter changes
  const handleBookFilterChange = (filter: string) => {
    setActiveBookFilter(filter);
  };

  return (
    <div className="container mx-auto px-4 py-8 flex flex-col h-full min-h-[calc(100vh-80px)]">
      {/* Main content with side navigation */}
      <div className="flex flex-col md:flex-row gap-8 border rounded-lg p-6 bg-secondary/5 relative flex-grow bg-white">
        {/* Full-height border for navigation section - shown only on medium screens and up */}
        <div className="hidden md:block absolute top-0 bottom-0 left-[calc(26%-1px)] w-px border-r border-secondary"></div>

        {/* Left side navigation with fixed height container to support sticky positioning */}
        <div className="md:w-1/4 h-fit self-start">
          <div className="space-y-0.5 pr-2 md:pr-4 max-h-[calc(100vh-120px)] overflow-y-auto">
            <div className="flex flex-col items-center mb-5 p-4 bg-white rounded-lg">
              <div className="relative mb-3">
                <Avatar className="w-20 h-20 mx-auto" gender={userData.gender}>
                  {userData.avatar && (
                    <AvatarImage src={userData.avatar} alt={userData.name} />
                  )}
                  {!userData.avatar && avatarFile && (
                    <AvatarImage src={URL.createObjectURL(avatarFile)} alt={userData.name} />
                  )}
                  <AvatarFallback gender={userData.gender}>
                  </AvatarFallback>
                </Avatar>

                {/* Edit avatar overlay */}
                <label
                  htmlFor="avatar-upload"
                  className={`absolute inset-0 bg-black/40 flex items-center justify-center ${avatarUploadMutation.isPending ? 'opacity-100' : 'opacity-0 hover:opacity-100'} transition-opacity cursor-pointer rounded-full`}
                  style={{ top: 0, left: 'calc(50% - 40px)', width: '80px', height: '80px' }}
                >
                  <div className="flex flex-col items-center text-white">
                    {avatarUploadMutation.isPending ? (
                      <>
                        <div className="animate-spin">
                          <RefreshCw size={18} className="mb-1" />
                        </div>
                        <span className="text-xs font-medium">Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Camera size={18} className="mb-1" />
                        <span className="text-xs font-medium">Change Photo</span>
                      </>
                    )}
                  </div>
                </label>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                  disabled={avatarUploadMutation.isPending}
                />
              </div>
              <h1 className="text-lg font-bold text-center">{userData.name || 'User Profile'}</h1>
              <p className="text-xs text-muted-foreground text-center mb-2">@{displayUsername}</p>

              {/* Status badge */}
              <div className="flex items-center gap-1 mb-3 bg-secondary/20 px-2 py-1 rounded-full">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <p className="text-xs font-medium">{userData.status?.name || "Active"}</p>
              </div>

              {/* Bio section */}
              {userData.bio ? (
                <div className="w-full mb-3 text-center">
                  <p className="text-sm text-muted-foreground italic">"{userData.bio}"</p>
                </div>
              ) : (
                <div className="w-full mb-3 text-center">
                  <p className="text-sm text-muted-foreground italic">"Add a bio in your profile settings"</p>
                </div>
              )}

              {/* Social links */}
              <div className="flex items-center justify-center gap-3 mb-3">
                {userData.socialLinks?.facebook && (
                  <Link href={userData.socialLinks.facebook} target="_blank" className="text-blue-600 hover:text-blue-800">
                    <div className="p-1.5 rounded-full bg-blue-100">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M16 8.049c0-4.446-3.582-8.05-8-8.05C3.58 0-.002 3.603-.002 8.05c0 4.017 2.926 7.347 6.75 7.951v-5.625h-2.03V8.05H6.75V6.275c0-2.017 1.195-3.131 3.022-3.131.876 0 1.791.157 1.791.157v1.98h-1.009c-.993 0-1.303.621-1.303 1.258v1.51h2.218l-.354 2.326H9.25V16c3.824-.604 6.75-3.934 6.75-7.951z" />
                      </svg>
                    </div>
                  </Link>
                )}
                {userData.socialLinks?.twitter && (
                  <Link href={userData.socialLinks.twitter} target="_blank" className="text-blue-400 hover:text-blue-600">
                    <div className="p-1.5 rounded-full bg-blue-50">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M5.026 15c6.038 0 9.341-5.003 9.341-9.334 0-.14 0-.282-.006-.422A6.685 6.685 0 0 0 16 3.542a6.658 6.658 0 0 1-1.889.518 3.301 3.301 0 0 0 1.447-1.817 6.533 6.533 0 0 1-2.087.793A3.286 3.286 0 0 0 7.875 6.03a9.325 9.325 0 0 1-6.767-3.429 3.289 3.289 0 0 0 1.018 4.382A3.323 3.323 0 0 1 .64 6.575v.045a3.288 3.288 0 0 0 2.632 3.218 3.203 3.203 0 0 1-.865.115 3.23 3.23 0 0 1-.614-.057 3.283 3.283 0 0 0 3.067 2.277A6.588 6.588 0 0 1 .78 13.58a6.32 6.32 0 0 1-.78-.045A9.344 9.344 0 0 0 5.026 15z" />
                      </svg>
                    </div>
                  </Link>
                )}
                {userData.socialLinks?.instagram && (
                  <Link href={userData.socialLinks.instagram} target="_blank" className="text-pink-600 hover:text-pink-800">
                    <div className="p-1.5 rounded-full bg-pink-50">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M8 0C5.829 0 5.556.01 4.703.048 3.85.088 3.269.222 2.76.42a3.917 3.917 0 0 0-1.417.923A3.927 3.927 0 0 0 .42 2.76C.222 3.268.087 3.85.048 4.7.01 5.555 0 5.827 0 8.001c0 2.172.01 2.444.048 3.297.04.852.174 1.433.372 1.942.205.526.478.972.923 1.417.444.445.89.719 1.416.923.51.198 1.09.333 1.942.372C5.555 15.99 5.827 16 8 16s2.444-.01 3.298-.048c.851-.04 1.434-.174 1.943-.372a3.916 3.916 0 0 0 1.416-.923c.445-.445.718-.891.923-1.417.197-.509.332-1.09.372-1.942C15.99 10.445 16 10.173 16 8s-.01-2.445-.048-3.299c-.04-.851-.175-1.433-.372-1.941a3.926 3.926 0 0 0-.923-1.417A3.911 3.911 0 0 0 13.24.42c-.51-.198-1.092-.333-1.943-.372C10.443.01 10.172 0 7.998 0h.003zm-.717 1.442h.718c2.136 0 2.389.007 3.232.046.78.035 1.204.166 1.486.275.373.145.64.319.92.599.28.28.453.546.598.92.11.281.24.705.275 1.485.039.843.047 1.096.047 3.231s-.008 2.389-.047 3.232c-.035.78-.166 1.203-.275 1.485a2.47 2.47 0 0 1-.599.919c-.28.28-.546.453-.92.598-.28.11-.704.24-1.485.276-.843.038-1.096.047-3.232.047s-2.39-.009-3.233-.047c-.78-.036-1.203-.166-1.485-.276a2.478 2.478 0 0 1-.92-.598 2.48 2.48 0 0 1-.6-.92c-.109-.281-.24-.705-.275-1.485-.038-.843-.046-1.096-.046-3.233 0-2.136.008-2.388.046-3.231.036-.78.166-1.204.276-1.486.145-.373.319-.64.599-.92.28-.28.546-.453.92-.598.282-.11.705-.24 1.485-.276.738-.034 1.024-.044 2.515-.045v.002zm4.988 1.328a.96.96 0 1 0 0 1.92.96.96 0 0 0 0-1.92zm-4.27 1.122a4.109 4.109 0 1 0 0 8.217 4.109 4.109 0 0 0 0-8.217zm0 1.441a2.667 2.667 0 1 1 0 5.334 2.667 2.667 0 0 1 0-5.334z" />
                      </svg>
                    </div>
                  </Link>
                )}
                {!userData.socialLinks?.facebook && !userData.socialLinks?.twitter && !userData.socialLinks?.instagram && (
                  <p className="text-xs text-muted-foreground">No social links added</p>
                )}
              </div>

              <div className="w-full">
                <Button
                  variant="outline"
                  className="w-full flex items-center justify-center gap-2 bg-white/50 hover:bg-white/80 transition-colors h-8 text-sm"
                  onClick={() => {
                    handleNavigate("account");
                    startEditing();
                  }}
                >
                  <PenSquare size={14} />
                  <span>Edit Profile</span>
                </Button>
              </div>
            </div>

            <button
              className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-primary/20 text-sm ${activePage === "account" ? "bg-primary/10 text-primary font-medium" : ""
                }`}
              onClick={() => handleNavigate("account")}
            >
              <UserIcon size={16} className={activePage === "account" ? "text-primary" : ""} />
              <span>Account</span>
            </button>

            <button
              className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-primary/20 text-sm ${activePage === "balance" ? "bg-primary/10 text-primary font-medium" : ""
                }`}
              onClick={() => handleNavigate("balance")}
            >
              <Star size={16} className={activePage === "balance" ? "text-primary" : ""} />
              <span>Balance</span>
            </button>

            {/* Book-related group with divider */}
            <div className="my-1.5 border-t border-secondary/90"></div>
            <p className="text-xs text-muted-foreground px-3 py-0.5">Books & Reading</p>

            <button
              className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-primary/20 text-sm ${activePage === "shelf" ? "bg-primary/10 text-primary font-medium" : ""
                }`}
              onClick={() => handleNavigate("shelf")}
            >
              <LayoutGrid size={16} className={activePage === "shelf" ? "text-primary" : ""} />
              <span>My Books</span>
            </button>
            <button
              className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-primary/20 text-sm ${activePage === "bookmarks" ? "bg-primary/10 text-primary font-medium" : ""
                }`}
              onClick={() => handleNavigate("bookmarks")}
            >
              <Bookmark size={16} className={activePage === "bookmarks" ? "text-primary" : ""} />
              <span>Bookmarked</span>
            </button>
            <button
              className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-primary/20 text-sm ${activePage === "history" ? "bg-primary/10 text-primary font-medium" : ""
                }`}
              onClick={() => handleNavigate("history")}
            >
              <Clock size={16} className={activePage === "history" ? "text-primary" : ""} />
              <span>Recently Read</span>
            </button>

            {/* Stats & Settings group with divider */}
            <div className="my-1.5 border-t border-secondary/90"></div>
            <p className="text-xs text-muted-foreground px-3 py-0.5">Stats & Settings</p>

            <button
              className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-primary/20 text-sm ${activePage === "analytics" ? "bg-primary/10 text-primary font-medium" : ""
                }`}
              onClick={() => handleNavigate("analytics")}
            >
              <BarChart size={16} className={activePage === "analytics" ? "text-primary" : ""} />
              <span>Statistics</span>
            </button>
            <button
              className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-primary/20 text-sm ${activePage === "preferences" ? "bg-primary/10 text-primary font-medium" : ""
                }`}
              onClick={() => handleNavigate("preferences")}
            >
              <Settings size={16} className={activePage === "preferences" ? "text-primary" : ""} />
              <span>Preferences</span>
            </button>
          </div>
        </div>



        {/* Right side content */}
        <div className="md:w-3/4 min-h-full h-full flex flex-col md:pl-6">
          {activePage === "account" && (
            <div className="flex flex-col flex-grow h-full">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-secondary/90">
                <h2 className="text-xl font-bold">Account Information</h2>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => router.push(`/user/${userData.id}`)}
                >
                  <div className="flex items-center gap-1">
                    <ExternalLink size={14} />
                    <span>View Public Profile</span>
                  </div>
                </Button>
              </div>

              <div className="flex flex-col md:flex-row gap-6">
                {/* Account information column - now full width */}
                <div className="w-full space-y-6">
                  {/* Personal Information */}
                  <div className="bg-white rounded-lg border border-secondary/90 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 bg-secondary/30 border-b border-secondary/90 flex items-center justify-between">
                      <h3 className="text-sm font-medium flex items-center gap-2">
                        <UserIcon size={16} className="text-primary" />
                        Personal Information
                      </h3>
                      {!isEditing && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs"
                          onClick={startEditing}
                        >
                          <div className="flex items-center gap-1">
                            <PenSquare size={14} />
                            <span>Edit</span>
                          </div>
                        </Button>
                      )}

                      {isEditing && (
                        <div className="flex gap-2">
                          <Button
                            variant="destructive"
                            size="sm"
                            className="h-8"
                            onClick={cancelEditing}
                          >
                            Cancel
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            className="h-8"
                            onClick={saveEdits}
                          >
                            Save
                          </Button>
                        </div>
                      )}
                    </div>
                    <div className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <p className="text-xs text-muted-foreground">Full Name</p>
                          {isEditing ? (
                            <Input
                              value={editFormData.name}
                              onChange={(e) => handleInputChange('name', e.target.value)}
                              className="mt-1"
                            />
                          ) : (
                            <p className="text-sm font-medium">{userData.name || "-"}</p>
                          )}
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Username</p>
                          {isEditing ? (
                            <div className="flex items-center mt-1">
                              <span className="mr-1">@</span>
                              <Input
                                value={editFormData.username}
                                onChange={(e) => handleInputChange('username', e.target.value)}
                              />
                            </div>
                          ) : (
                            <p className="text-sm font-medium">@{displayUsername}</p>
                          )}
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Email</p>
                          <p className="text-sm font-medium">{userData.email || "-"}</p>
                        </div>

                        <div>
                          <p className="text-xs text-muted-foreground">Birthday</p>
                          {isEditing ? (
                            <DatePicker
                              date={editFormData.birthday ? new Date(editFormData.birthday) : undefined}
                              setDate={(date) => handleInputChange('birthday', date ? date.toISOString() : '')}
                              placeholder="Select your birthday"
                              className="mt-1"
                            />
                          ) : (
                            <p className="text-sm font-medium">
                              {userData.birthday ? new Date(userData.birthday).toLocaleDateString() : "-"}
                            </p>
                          )}
                        </div>

                        <div>
                          <p className="text-xs text-muted-foreground">Status</p>
                          <div className="flex items-center gap-1 mt-1">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            <p className="text-sm font-medium">{userData.status?.name || "Active"}</p>
                          </div>
                        </div>

                        <div className="col-span-1 md:col-span-2">
                          <p className="text-xs text-muted-foreground">Bio</p>
                          {isEditing ? (
                            <Input
                              value={editFormData.bio}
                              onChange={(e) => handleInputChange('bio', e.target.value)}
                              className="mt-1"
                              placeholder="Write a short bio about yourself"
                            />
                          ) : (
                            <p className="text-sm text-muted-foreground">{userData.bio || "No bio provided"}</p>
                          )}
                        </div>
                      </div>

                      <div className="mt-6 border-t border-secondary/90 pt-6">
                        <h4 className="text-sm font-medium mb-4">Social Media</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Facebook</p>
                            {isEditing ? (
                              <Input
                                value={editFormData.socialLinks.facebook}
                                onChange={(e) => handleSocialLinkChange('facebook', e.target.value)}
                                placeholder="Facebook URL"
                              />
                            ) : (
                              <p className="text-sm font-medium">
                                {userData.socialLinks?.facebook ? (
                                  <Link href={userData.socialLinks.facebook} target="_blank" className="text-blue-600 hover:underline">
                                    View Profile
                                  </Link>
                                ) : (
                                  <span className="text-muted-foreground">Not linked</span>
                                )}
                              </p>
                            )}
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Twitter</p>
                            {isEditing ? (
                              <Input
                                value={editFormData.socialLinks.twitter}
                                onChange={(e) => handleSocialLinkChange('twitter', e.target.value)}
                                placeholder="Twitter URL"
                              />
                            ) : (
                              <p className="text-sm font-medium">
                                {userData.socialLinks?.twitter ? (
                                  <Link href={userData.socialLinks.twitter} target="_blank" className="text-blue-600 hover:underline">
                                    View Profile
                                  </Link>
                                ) : (
                                  <span className="text-muted-foreground">Not linked</span>
                                )}
                              </p>
                            )}
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Instagram</p>
                            {isEditing ? (
                              <Input
                                value={editFormData.socialLinks.instagram}
                                onChange={(e) => handleSocialLinkChange('instagram', e.target.value)}
                                placeholder="Instagram URL"
                              />
                            ) : (
                              <p className="text-sm font-medium">
                                {userData.socialLinks?.instagram ? (
                                  <Link href={userData.socialLinks.instagram} target="_blank" className="text-blue-600 hover:underline">
                                    View Profile
                                  </Link>
                                ) : (
                                  <span className="text-muted-foreground">Not linked</span>
                                )}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* ... rest of the account section ... */}
                    </div>
                  </div>

                  {/* Password Security Section - Separate box */}
                  <div className="bg-white rounded-lg border border-secondary/90 shadow-sm overflow-hidden mt-6">
                    <div className="px-6 py-4 bg-secondary/30 border-b border-secondary/90 flex items-center justify-between">
                      <h3 className="text-sm font-medium flex items-center gap-2">
                        <Lock size={16} className="text-primary" />
                        Password Security
                      </h3>
                      {!isChangingPassword && !isEditing && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs"
                          onClick={startPasswordChange}
                        >
                          <div className="flex items-center gap-1">
                            <PenSquare size={14} />
                            <span>Change Password</span>
                          </div>
                        </Button>
                      )}
                    </div>
                    <div className="p-6">
                      {isChangingPassword ? (
                        <div className="space-y-3">
                          <div className="relative">
                            <p className="text-xs text-muted-foreground mb-1">Current Password</p>
                            <div className="flex items-center">
                              <Input
                                type={showPassword.current ? "text" : "password"}
                                value={passwordData.currentPassword}
                                onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                                placeholder="Enter current password"
                                className={`pr-10 ${passwordErrors.currentPassword ? "border-red-500" : ""}`}
                              />
                              <button
                                type="button"
                                onClick={() => togglePasswordVisibility('current')}
                                className="absolute right-0 h-full px-3 flex items-center"
                              >
                                {showPassword.current ? (
                                  <EyeOff size={16} className="text-muted-foreground" />
                                ) : (
                                  <Eye size={16} className="text-muted-foreground" />
                                )}
                              </button>
                            </div>
                            {passwordErrors.currentPassword && (
                              <p className="text-xs text-red-500 mt-1">{passwordErrors.currentPassword}</p>
                            )}
                          </div>

                          <div className="relative">
                            <p className="text-xs text-muted-foreground mb-1">New Password</p>
                            <div className="flex items-center">
                              <Input
                                type={showPassword.new ? "text" : "password"}
                                value={passwordData.newPassword}
                                onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                                placeholder="Enter new password"
                                className={`pr-10 ${passwordErrors.newPassword ? "border-red-500" : ""}`}
                              />
                              <button
                                type="button"
                                onClick={() => togglePasswordVisibility('new')}
                                className="absolute right-0 h-full px-3 flex items-center"
                              >
                                {showPassword.new ? (
                                  <EyeOff size={16} className="text-muted-foreground" />
                                ) : (
                                  <Eye size={16} className="text-muted-foreground" />
                                )}
                              </button>
                            </div>
                            {passwordErrors.newPassword && (
                              <p className="text-xs text-red-500 mt-1">{passwordErrors.newPassword}</p>
                            )}
                          </div>

                          <div className="relative">
                            <p className="text-xs text-muted-foreground mb-1">Confirm New Password</p>
                            <div className="flex items-center">
                              <Input
                                type={showPassword.confirm ? "text" : "password"}
                                value={passwordData.confirmPassword}
                                onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                                placeholder="Confirm new password"
                                className={`pr-10 ${passwordErrors.confirmPassword ? "border-red-500" : ""}`}
                              />
                              <button
                                type="button"
                                onClick={() => togglePasswordVisibility('confirm')}
                                className="absolute right-0 h-full px-3 flex items-center"
                              >
                                {showPassword.confirm ? (
                                  <EyeOff size={16} className="text-muted-foreground" />
                                ) : (
                                  <Eye size={16} className="text-muted-foreground" />
                                )}
                              </button>
                            </div>
                            {passwordErrors.confirmPassword && (
                              <p className="text-xs text-red-500 mt-1">{passwordErrors.confirmPassword}</p>
                            )}
                          </div>

                          <div className="flex justify-end gap-2 mt-3">
                            <Button
                              variant="destructive"
                              size="sm"
                              className="h-8"
                              onClick={cancelPasswordChange}
                            >
                              Cancel
                            </Button>
                            <Button
                              variant="default"
                              size="sm"
                              className="h-8"
                              onClick={savePasswordChange}
                              disabled={updatePasswordMutation.isPending}
                            >
                              {updatePasswordMutation.isPending ? "Updating..." : "Save"}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">••••••••</p>
                            <p className="text-xs text-muted-foreground mt-1">Password last changed: Recently</p>
                          </div>
                          <div className="flex items-center gap-1 bg-green-50 text-green-700 px-2 py-1 rounded">
                            <CheckCircle2 size={14} />
                            <span className="text-xs font-medium">Secure</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              </div>
            </div>
          )}

          {activePage === "balance" && (
            <div className="flex flex-col flex-grow h-full">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-secondary/90">
                <h2 className="text-xl font-bold">Haru Balance</h2>

                <div className="flex gap-2">
                  <>
                    <Link href="/deposit">
                      <Button variant="outline" className="flex items-center gap-2">
                        <ArrowUpCircle size={16} className="text-green-500" />
                        <span className="hidden sm:inline">Deposit Haru</span>
                        <span className="sm:hidden">Deposit</span>
                      </Button>
                    </Link>
                  </>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Haru Balance Card */}
                <div className="lg:col-span-2 bg-secondary/20 rounded-lg border border-secondary/90 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 bg-secondary/30 border-b border-secondary/90 flex items-center justify-between">
                    <h3 className="text-sm font-medium flex items-center gap-2">
                      <Star size={16} className="text-primary" />
                      Haru Balance
                    </h3>
                  </div>
                  <div className="p-6">
                    {/* Improved Current Balance Layout with Actions */}
                    <div className="flex flex-col sm:flex-row items-center justify-between mb-6 pb-6 border-b border-secondary/90">
                      <div className="flex items-center gap-4 mb-4 sm:mb-0">
                        <div className="bg-primary/20 w-16 h-16 rounded-full flex items-center justify-center" title="Haru is used for premium content & purchases">
                          <Star size={28} className="text-primary" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{userData.points || 0}</p>
                          <p className="text-sm text-muted-foreground">Available Haru</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 justify-center">
                        <Link href="/deposit">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-9 px-4"
                          >
                            <div className="flex items-center gap-2">
                              <ArrowUpCircle size={16} className="text-green-500" />
                              <span>Deposit</span>
                            </div>
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-9 px-4"
                          onClick={() => {
                            // Here we would typically open a withdraw modal
                            // For now, we'll just update the points if the user has enough
                            if ((userData.points || 0) >= 50) {
                              const newPoints = (userData.points || 0) - 50;
                              handleProfileUpdate({ points: newPoints });
                            }
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <ArrowDownCircle size={16} className="text-amber-500" />
                            <span>Withdraw</span>
                          </div>
                        </Button>
                      </div>
                    </div>

                    {/* Summary Statistics */}
                    <div className="grid grid-cols-2 sm:grid-cols-2 gap-4 mb-6">
                      <div className="bg-secondary/30 p-4 rounded-lg border border-secondary/90">
                        <div className="flex items-center gap-2 mb-1">
                          <ArrowUpCircle size={16} className="text-green-500" />
                          <p className="text-sm font-medium">Total Earned</p>
                        </div>
                        <p className="text-xl font-bold">{(userData.points || 0) + 125}</p>
                      </div>

                      <div className="bg-secondary/30 p-4 rounded-lg border border-secondary/90">
                        <div className="flex items-center gap-2 mb-1">
                          <ArrowDownCircle size={16} className="text-amber-500" />
                          <p className="text-sm font-medium">Total Spent</p>
                        </div>
                        <p className="text-xl font-bold">125</p>
                      </div>
                    </div>

                    {/* Transaction History Preview */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-medium">Recent Transactions</p>
                        <Button variant="link" size="sm" className="h-auto p-0 text-xs">
                          View All
                        </Button>
                      </div>

                      <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                        <div className="flex items-center justify-between text-sm py-2 border-b border-secondary/80">
                          <div className="flex items-center gap-2">
                            <ArrowUpCircle size={16} className="text-green-500" />
                            <div>
                              <p className="font-medium">Deposit</p>
                              <p className="text-xs text-muted-foreground">Apr 17, 2024</p>
                            </div>
                          </div>
                          <p className="font-medium text-green-500">+100</p>
                        </div>

                        <div className="flex items-center justify-between text-sm py-2 border-b border-secondary/80">
                          <div className="flex items-center gap-2">
                            <ArrowDownCircle size={16} className="text-amber-500" />
                            <div>
                              <p className="font-medium">Book Purchase</p>
                              <p className="text-xs text-muted-foreground">Apr 15, 2024</p>
                            </div>
                          </div>
                          <p className="font-medium text-amber-500">-75</p>
                        </div>

                        <div className="flex items-center justify-between text-sm py-2 border-b border-secondary/80">
                          <div className="flex items-center gap-2">
                            <ArrowUpCircle size={16} className="text-green-500" />
                            <div>
                              <p className="font-medium">Daily Reward</p>
                              <p className="text-xs text-muted-foreground">Apr 14, 2024</p>
                            </div>
                          </div>
                          <p className="font-medium text-green-500">+25</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Activity Summary Card */}
                <div className="bg-white rounded-lg border border-secondary/90 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 bg-secondary/30 border-b border-secondary/90">
                    <h3 className="text-sm font-medium flex items-center gap-2">
                      <BarChart size={16} className="text-primary" />
                      Activity Summary
                    </h3>
                  </div>
                  <div className="p-4">
                    <div className="space-y-4">
                      {/* Activity Stats */}
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Earning Rate</p>
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">25 Haru / day</p>
                          <span className="text-xs bg-green-100 text-green-800 py-0.5 px-2 rounded-full">Active</span>
                        </div>
                        <div className="mt-2 h-2 bg-secondary/30 rounded-full overflow-hidden">
                          <div className="bg-primary h-full rounded-full" style={{ width: '65%' }}></div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">65% to next level</p>
                      </div>

                      <div className="pt-4 border-t border-secondary/90">
                        <p className="text-xs text-muted-foreground mb-1">Reading Streak</p>
                        <p className="text-2xl font-bold">7 days</p>
                        <p className="text-xs text-muted-foreground">Keep reading daily to earn rewards</p>
                      </div>

                      <div className="pt-4 border-t border-secondary/90">
                        <p className="text-xs text-muted-foreground mb-2">Ways to Earn Haru</p>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <CheckCircle2 size={14} className="text-green-500" />
                            <span>Daily reading (up to 25/day)</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <CheckCircle2 size={14} className="text-green-500" />
                            <span>Writing reviews (50/review)</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <CheckCircle2 size={14} className="text-green-500" />
                            <span>Creating content (100+)</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activePage === "analytics" && (
            <div className="flex flex-col flex-grow h-full">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-secondary/90">
                <h2 className="text-xl font-bold">Reading Statistics</h2>

                <div className="flex gap-2">
                  <Link href="/books">
                    <Button variant="outline" className="flex items-center gap-2">
                      <BookOpen size={16} />
                      <span className="hidden sm:inline">Browse Books</span>
                      <span className="sm:hidden">Browse</span>
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Reading Stats */}
              <div className="bg-white rounded-lg p-6 mb-6 border border-secondary/90 shadow-sm">
                <h3 className="text-sm font-medium mb-4">Reading Activity</h3>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                  <div className="bg-secondary/30 rounded-lg p-4 text-center flex flex-col items-center justify-center border border-secondary/90">
                    <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-3">
                      <BookOpen size={22} className="text-primary" />
                    </div>
                    <p className="text-xl font-semibold">{userData.readingStats.booksRead}</p>
                    <p className="text-xs text-muted-foreground mt-1">Books Read</p>
                  </div>
                  <div className="bg-secondary/30 rounded-lg p-4 text-center flex flex-col items-center justify-center border border-secondary/90">
                    <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-3">
                      <Book size={22} className="text-primary" />
                    </div>
                    <p className="text-xl font-semibold">{userData.readingStats.chaptersRead}</p>
                    <p className="text-xs text-muted-foreground mt-1">Chapters Read</p>
                  </div>
                  <div className="bg-secondary/30 rounded-lg p-4 text-center flex flex-col items-center justify-center border border-secondary/90">
                    <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-3">
                      <Clock size={22} className="text-primary" />
                    </div>
                    <p className="text-xl font-semibold">{userData.readingStats.hoursRead}</p>
                    <p className="text-xs text-muted-foreground mt-1">Hours Read</p>
                  </div>
                  <div className="bg-secondary/30 rounded-lg p-4 text-center flex flex-col items-center justify-center border border-secondary/90">
                    <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-3">
                      <Star size={22} className="text-primary" />
                    </div>
                    <p className="text-xl font-semibold">{userData.readingStats.avgRating}</p>
                    <p className="text-xs text-muted-foreground mt-1">Avg Rating</p>
                  </div>
                  <div className="bg-secondary/30 rounded-lg p-4 text-center flex flex-col items-center justify-center border border-secondary/90">
                    <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-3">
                      <PenSquare size={22} className="text-primary" />
                    </div>
                    <p className="text-xl font-semibold">
                      {(userData as any).authoredBooks?.length || 0}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Books Created</p>
                  </div>
                </div>
              </div>

              {/* Progress Chart */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg p-6 border border-secondary/90 shadow-sm">
                  <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
                    <Clock size={18} className="text-primary" />
                    Reading Streak Calendar
                  </h3>
                  <div className="aspect-[4/3] bg-white rounded-lg flex flex-col justify-between border border-secondary/90 p-4">
                    <div className="grid grid-cols-7 gap-1 mb-2">
                      {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                        <div key={i} className="text-center text-xs text-muted-foreground">{day}</div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1 flex-grow">
                      {Array(28).fill(0).map((_, i) => {
                        // Randomly generate some activity for demo purposes
                        const hasActivity = Math.random() > 0.6;
                        const today = i === 18; // Assume day 18 is today
                        const isStreak = i >= 16 && i <= 18; // Last 3 days are streak

                        let bgClass = 'bg-secondary/20';
                        if (hasActivity) bgClass = 'bg-primary/30';
                        if (isStreak) bgClass = 'bg-primary/60';
                        if (today) bgClass = 'bg-primary';

                        return (
                          <div
                            key={i}
                            className={`rounded-sm aspect-square ${bgClass} flex items-center justify-center`}
                            title={today ? "Today" : hasActivity ? "Read" : "No reading"}
                          >
                            {today && <div className="w-1.5 h-1.5 rounded-full bg-white"></div>}
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-sm bg-primary"></div>
                        <p className="text-xs text-muted-foreground">Current streak: 3 days</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-sm bg-primary/30"></div>
                        <p className="text-xs text-muted-foreground">Reading day</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-6 border border-secondary/90 shadow-sm">
                  <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
                    <BarChart size={18} className="text-primary" />
                    Reading Goals
                  </h3>
                  <div className="aspect-[4/3] bg-white rounded-lg flex flex-col justify-between border border-secondary/90 p-4">
                    <div className="space-y-6">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium">Weekly Goal: 7 chapters</p>
                          <p className="text-xs font-medium text-primary">5/7</p>
                        </div>
                        <div className="h-2 bg-secondary/20 rounded-full overflow-hidden">
                          <div className="bg-primary h-full rounded-full" style={{ width: '71%' }}></div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 text-right">71% Complete</p>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium">Monthly Goal: 5 books</p>
                          <p className="text-xs font-medium text-primary">2/5</p>
                        </div>
                        <div className="h-2 bg-secondary/20 rounded-full overflow-hidden">
                          <div className="bg-primary h-full rounded-full" style={{ width: '40%' }}></div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 text-right">40% Complete</p>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium">Daily Reading: 30 mins</p>
                          <p className="text-xs font-medium text-primary">25/30</p>
                        </div>
                        <div className="h-2 bg-secondary/20 rounded-full overflow-hidden">
                          <div className="bg-primary h-full rounded-full" style={{ width: '83%' }}></div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 text-right">83% Complete</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-center mt-4">
                      <div className="flex items-center gap-1 bg-primary/10 px-3 py-1 rounded-full">
                        <CheckCircle2 size={14} className="text-primary" />
                        <p className="text-xs font-medium">You're on track to meet your goals!</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activePage === "history" && (
            <div className="flex flex-col flex-grow h-full">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Recently Read</h2>

                <div className="flex gap-2">
                  <Link href="/books">
                    <Button variant="outline" className="flex items-center gap-2">
                      <BookOpen size={16} />
                      <span className="hidden sm:inline">Browse Books</span>
                      <span className="sm:hidden">Browse</span>
                    </Button>
                  </Link>
                </div>
              </div>

              <RecentlyReadBooks />
            </div>
          )}

          {activePage === "bookmarks" && (
            <div className="flex flex-col flex-grow h-full">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Bookmarked Books</h2>

                <div className="flex gap-2">
                  <Link href="/books">
                    <Button variant="outline" className="flex items-center gap-2">
                      <BookOpen size={16} />
                      <span className="hidden sm:inline">Browse Books</span>
                      <span className="sm:hidden">Browse</span>
                    </Button>
                  </Link>
                </div>
              </div>

              <FollowedBooks />
            </div>
          )}

          {activePage === "shelf" && (
            <div className="flex flex-col flex-grow h-full">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-secondary/90">
                <h2 className="text-xl font-bold">My Books</h2>

                <div className="flex gap-2">

                  <Link href="/books/create">
                    <Button variant="outline" className="flex items-center gap-2">
                      <PlusCircle size={16} />
                      <span className="hidden sm:inline">Submit Book</span>
                      <span className="sm:hidden">Submit</span>
                    </Button>
                  </Link>

                </div>
              </div>

              {/* Display user books with the new status filter system */}
              <UserBooks userId={userData.id} />
            </div>
          )}

          {activePage === "preferences" && (
            <div className="flex flex-col flex-grow h-full">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-secondary/90">
                <h2 className="text-xl font-bold">User Preferences</h2>

                <div className="flex gap-2">
                  {preferencesChanged && (
                    <Button
                      variant="default"
                      size="sm"
                      className="h-8"
                      onClick={savePreferencesEdits}
                    >
                      Save Changes
                    </Button>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 border border-secondary/90 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium mb-4">Reading Preferences</h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium mb-1">Reading Speed</p>

                        <Select
                          value={preferencesFormData.readingSpeed}
                          onValueChange={(value) => handlePreferencesChange('readingSpeed', value)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select reading speed" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="slow">Slow</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="fast">Fast</SelectItem>
                          </SelectContent>
                        </Select>

                      </div>
                      <div>
                        <p className="text-sm font-medium mb-1">Theme</p>

                        <Select
                          value={preferencesFormData.theme}
                          onValueChange={(value) => handlePreferencesChange('theme', value)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select theme" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="light">Light</SelectItem>
                            <SelectItem value="dark">Dark</SelectItem>
                            <SelectItem value="system">System</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <p className="text-sm font-medium mb-1">Language</p>

                        <Select
                          value={preferencesFormData.language}
                          onValueChange={(value) => handlePreferencesChange('language', value)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select language" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="EN">English</SelectItem>
                            <SelectItem value="VI">Vietnamese</SelectItem>
                            <SelectItem value="FR">French</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium mb-4">Notification Settings</h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium mb-1">Email Notifications</p>

                        <Select
                          value={preferencesFormData.emailNotifications}
                          onValueChange={(value) => handlePreferencesChange('emailNotifications', value)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Email notifications" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="enabled">Enabled</SelectItem>
                            <SelectItem value="disabled">Disabled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <p className="text-sm font-medium mb-1">Push Notifications</p>

                        <Select
                          value={preferencesFormData.pushNotifications}
                          onValueChange={(value) => handlePreferencesChange('pushNotifications', value)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Push notifications" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="enabled">Enabled</SelectItem>
                            <SelectItem value="disabled">Disabled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 