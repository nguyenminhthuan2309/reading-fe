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
  LayoutGrid,
  PlusCircle,
  Star,
  User as UserIcon,
  ChevronLeft,
  Settings,
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
  ExternalLink,
  Wallet,
  Coins,
  Award
} from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useMutation,  useQueryClient } from "@tanstack/react-query";
import { updateUserProfile } from "@/lib/api/auth";
import { updatePassword } from "@/lib/api/auth";
import { MAX_AVATAR_SIZE, uploadAvatar } from "@/lib/api/user";
import { useUserStore } from "@/lib/store/useUserStore";
import { User } from "@/models";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import * as yup from "yup";
import { UserBooks } from "@/components/user/user-books";
import { FollowedBooks } from "@/components/user/followed-books";
import { AUTH_KEYS, USER_KEYS } from "@/lib/constants/query-keys";
import { RecentlyReadBooks } from "@/components/user/recently-read-books";
import { AvailableMissions } from "@/components/user/available-missions";
import { MissionHistory } from "@/components/user/mission-history";
import { useMe, useUserBallance } from "@/lib/hooks/useUsers";
import { RecentTransactions } from "@/components/user/recent-transactions";


type ProfilePage = "account" | "balance" | "shelf" | "bookmarks" | "history" | "analytics" | "preferences" | "missions";

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const userId = params.id as string;
  const { user } = useUserStore();
  const { userData, isLoadingProfile } = useMe();
  const { data: userBallance } = useUserBallance(Number(user?.id));

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
    birthDate: '',
    twitter: '',
    facebook: '',
    instagram: '',
  });
  
  // Add these new states and functions
  const [preferencesFormData, setPreferencesFormData] = useState({
    readingMode: userData?.preferences?.readingMode,
    theme: userData?.preferences?.theme,
    language: userData?.preferences?.language,
    volume: userData?.preferences?.volume || 50,
    readingSpeed: userData?.preferences?.readingSpeed || 'medium',
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
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

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

  if (isLoadingProfile) {
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
  if (!userData ) {
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
      birthDate: userData.birthDate || '',
      twitter: userData.twitter || '',
      facebook: userData.facebook || '',
      instagram: userData.instagram || ''
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
      birthDate: editFormData.birthDate || undefined,
      twitter: editFormData.twitter,
      facebook: editFormData.facebook,
      instagram: editFormData.instagram,
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
      [platform]: value
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
        theme: preferencesFormData.theme as 'light' | 'dark' | 'system',
        language: preferencesFormData.language,
        readingMode: preferencesFormData.readingMode,
        volume: preferencesFormData.volume,
        readingSpeed: preferencesFormData.readingSpeed,
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


  return (
    <div className="container mx-auto px-4 py-8 flex flex-col h-full min-h-[calc(100vh-80px)]">
      {/* Main content with side navigation */}
      <div className="flex flex-col md:flex-row gap-8 border rounded-lg p-6 bg-secondary/5 relative flex-grow bg-white dark:bg-gray-900 dark:border-gray-700">
        {/* Full-height border for navigation section - shown only on medium screens and up */}
        <div className="hidden md:block absolute top-0 bottom-0 left-[calc(26%-1px)] w-px border-r border-secondary dark:border-gray-700"></div>

        {/* Left side navigation with fixed height container to support sticky positioning */}
        <div className="md:w-1/4 h-fit self-start">
          <div className="space-y-0.5 pr-2 md:pr-4 max-h-[calc(100vh-120px)] overflow-y-auto">
            <div className="flex flex-col items-center mb-5 p-4 bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700">
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
              <h1 className="text-lg font-bold text-center dark:text-white">{userData.name || 'User Profile'}</h1>
              <p className="text-xs text-muted-foreground text-center mb-2">@{displayUsername}</p>

              {/* Status badge */}
              <div className="flex items-center gap-1 mb-3 bg-secondary/20 dark:bg-gray-700/50 px-2 py-1 rounded-full">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <p className="text-xs font-medium dark:text-gray-200">{userData.status?.name || "Active"}</p>
              </div>

              {/* Bio section */}
              {userData.bio ? (
                <div className="w-full mb-3 text-center">
                  <p className="text-sm text-muted-foreground italic dark:text-gray-300">"{userData.bio}"</p>
                </div>
              ) : (
                <div className="w-full mb-3 text-center">
                  <p className="text-sm text-muted-foreground italic dark:text-gray-400">"Add a bio in your profile settings"</p>
                </div>
              )}

              {/* Social links */}
              <div className="flex items-center justify-center gap-3 mb-3">
                {userData.facebook && (
                  <Link href={userData.facebook} target="_blank" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                    <div className="p-1.5 rounded-full bg-blue-100 dark:bg-blue-900/30">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M16 8.049c0-4.446-3.582-8.05-8-8.05C3.58 0-.002 3.603-.002 8.05c0 4.017 2.926 7.347 6.75 7.951v-5.625h-2.03V8.05H6.75V6.275c0-2.017 1.195-3.131 3.022-3.131.876 0 1.791.157 1.791.157v1.98h-1.009c-.993 0-1.303.621-1.303 1.258v1.51h2.218l-.354 2.326H9.25V16c3.824-.604 6.75-3.934 6.75-7.951z" />
                      </svg>
                    </div>
                  </Link>
                )}
                {userData?.twitter && (
                  <Link href={userData.twitter} target="_blank" className="text-blue-400 hover:text-blue-600 dark:text-blue-300 dark:hover:text-blue-200">
                    <div className="p-1.5 rounded-full bg-blue-50 dark:bg-blue-900/30">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M5.026 15c6.038 0 9.341-5.003 9.341-9.334 0-.14 0-.282-.006-.422A6.685 6.685 0 0 0 16 3.542a6.658 6.658 0 0 1-1.889.518 3.301 3.301 0 0 0 1.447-1.817 6.533 6.533 0 0 1-2.087.793A3.286 3.286 0 0 0 7.875 6.03a9.325 9.325 0 0 1-6.767-3.429 3.289 3.289 0 0 0 1.018 4.382A3.323 3.323 0 0 1 .64 6.575v.045a3.288 3.288 0 0 0 2.632 3.218 3.203 3.203 0 0 1-.865.115 3.23 3.23 0 0 1-.614-.057 3.283 3.283 0 0 0 3.067 2.277A6.588 6.588 0 0 1 .78 13.58a6.32 6.32 0 0 1-.78-.045A9.344 9.344 0 0 0 5.026 15z" />
                      </svg>
                    </div>
                  </Link>
                )}
                {userData?.instagram && (
                  <Link href={userData.instagram} target="_blank" className="text-pink-600 hover:text-pink-800 dark:text-pink-400 dark:hover:text-pink-300">
                    <div className="p-1.5 rounded-full bg-pink-50 dark:bg-pink-900/30">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M8 0C5.829 0 5.556.01 4.703.048 3.85.088 3.269.222 2.76.42a3.917 3.917 0 0 0-1.417.923A3.927 3.927 0 0 0 .42 2.76C.222 3.268.087 3.85.048 4.7.01 5.555 0 5.827 0 8.001c0 2.172.01 2.444.048 3.297.04.852.174 1.433.372 1.942.205.526.478.972.923 1.417.444.445.89.719 1.416.923.51.198 1.09.333 1.942.372C5.555 15.99 5.827 16 8 16s2.444-.01 3.298-.048c.851-.04 1.434-.174 1.943-.372a3.916 3.916 0 0 0 1.416-.923c.445-.445.718-.891.923-1.417.197-.509.332-1.09.372-1.942C15.99 10.445 16 10.173 16 8s-.01-2.445-.048-3.299c-.04-.851-.175-1.433-.372-1.941a3.926 3.926 0 0 0-.923-1.417A3.911 3.911 0 0 0 13.24.42c-.51-.198-1.092-.333-1.943-.372C10.443.01 10.172 0 7.998 0h.003zm-.717 1.442h.718c2.136 0 2.389.007 3.232.046.78.035 1.204.166 1.486.275.373.145.64.319.92.599.28.28.453.546.598.92.11.281.24.705.275 1.485.039.843.047 1.096.047 3.231s-.008 2.389-.047 3.232c-.035.78-.166 1.203-.275 1.485a2.47 2.47 0 0 1-.599.919c-.28.28-.546.453-.92.598-.28.11-.704.24-1.485.276-.843.038-1.096.047-3.232.047s-2.39-.009-3.233-.047c-.78-.036-1.203-.166-1.485-.276a2.478 2.478 0 0 1-.92-.598 2.48 2.48 0 0 1-.6-.92c-.109-.281-.24-.705-.275-1.485-.038-.843-.046-1.096-.046-3.233 0-2.136.008-2.388.046-3.231.036-.78.166-1.204.276-1.486.145-.373.319-.64.599-.92.28-.28.546-.453.92-.598.282-.11.705-.24 1.485-.276.738-.034 1.024-.044 2.515-.045v.002zm4.988 1.328a.96.96 0 1 0 0 1.92.96.96 0 0 0 0-1.92zm-4.27 1.122a4.109 4.109 0 1 0 0 8.217 4.109 4.109 0 0 0 0-8.217zm0 1.441a2.667 2.667 0 1 1 0 5.334 2.667 2.667 0 0 1 0-5.334z" />
                      </svg>
                    </div>
                  </Link>
                )}
                {!userData?.facebook && !userData?.twitter && !userData?.instagram && (
                  <p className="text-xs text-muted-foreground dark:text-gray-400">No social links added</p>
                )}
              </div>

              <div className="w-full">
                <Button
                  variant="outline"
                  className="w-full flex items-center justify-center gap-2 bg-white/50 hover:bg-white/80 dark:bg-gray-700/50 dark:hover:bg-gray-600/80 dark:border-gray-600 transition-colors h-8 text-sm"
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
              className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-amber-100 dark:hover:bg-yellow-900/20 text-sm ${activePage === "account" ? "bg-amber-100 text-yellow-700 font-medium dark:bg-yellow-900/20 dark:text-yellow-400" : "dark:text-gray-200"
                }`}
              onClick={() => handleNavigate("account")}
            >
              <UserIcon size={16} className={activePage === "account" ? "text-yellow-700 dark:text-yellow-400" : "dark:text-gray-200"} />
              <span>Account</span>
            </button>

            <button
              className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-amber-100 dark:hover:bg-yellow-900/20 text-sm ${activePage === "balance" ? "bg-amber-100 text-yellow-700 font-medium dark:bg-yellow-900/20 dark:text-yellow-400" : "dark:text-gray-200"
                }`}
              onClick={() => handleNavigate("balance")}
            >
              <Wallet size={16} className={activePage === "balance" ? "text-yellow-700 dark:text-yellow-400" : "dark:text-gray-200"} />
              <span>Balance</span>
            </button>

            <button
              className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-amber-100 dark:hover:bg-yellow-900/20 text-sm ${activePage === "missions" ? "bg-amber-100 text-yellow-700 font-medium dark:bg-yellow-900/20 dark:text-yellow-400" : "dark:text-gray-200"
                }`}
              onClick={() => handleNavigate("missions")}
            >
              <Star size={16} className={activePage === "missions" ? "text-yellow-700 dark:text-yellow-400" : "dark:text-gray-200"} />
              <span>Missions</span>
            </button>

            {/* Book-related group with divider */}
            <div className="my-1.5 border-t border-secondary/90 dark:border-gray-700"></div>
            <p className="text-xs text-muted-foreground dark:text-gray-400 px-3 py-0.5">Books & Reading</p>

            <button
              className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-amber-100 dark:hover:bg-yellow-900/20 text-sm ${activePage === "shelf" ? "bg-amber-100 text-yellow-700 font-medium dark:bg-yellow-900/20 dark:text-yellow-400" : "dark:text-gray-200"
                }`}
              onClick={() => handleNavigate("shelf")}
            >
              <LayoutGrid size={16} className={activePage === "shelf" ? "text-yellow-700 dark:text-yellow-400" : "dark:text-gray-200"} />
              <span>My Books</span>
            </button>
            <button
              className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-amber-100 dark:hover:bg-yellow-900/20 text-sm ${activePage === "bookmarks" ? "bg-amber-100 text-yellow-700 font-medium dark:bg-yellow-900/20 dark:text-yellow-400" : "dark:text-gray-200"
                }`}
              onClick={() => handleNavigate("bookmarks")}
            >
              <Bookmark size={16} className={activePage === "bookmarks" ? "text-yellow-700 dark:text-yellow-400" : "dark:text-gray-200"} />
              <span>Bookmarked</span>
            </button>
            <button
              className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-amber-100 dark:hover:bg-yellow-900/20 text-sm ${activePage === "history" ? "bg-amber-100 text-yellow-700 font-medium dark:bg-yellow-900/20 dark:text-yellow-400" : "dark:text-gray-200"
                }`}
              onClick={() => handleNavigate("history")}
            >
              <Clock size={16} className={activePage === "history" ? "text-yellow-700 dark:text-yellow-400" : "dark:text-gray-200"} />
              <span>Recently Read</span>
            </button>

            {/* Stats & Settings group with divider */}
            <div className="my-1.5 border-t border-secondary/90 dark:border-gray-700"></div>
            <p className="text-xs text-muted-foreground dark:text-gray-400 px-3 py-0.5">Stats & Settings</p>

            <button
              className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-amber-100 dark:hover:bg-yellow-900/20 text-sm ${activePage === "analytics" ? "bg-amber-100 text-yellow-700 font-medium dark:bg-yellow-900/20 dark:text-yellow-400" : "dark:text-gray-200"
                }`}
              onClick={() => handleNavigate("analytics")}
            >
              <BarChart size={16} className={activePage === "analytics" ? "text-yellow-700 dark:text-yellow-400" : "dark:text-gray-200"} />
              <span>Statistics</span>
            </button>

            <button
              className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-amber-100 dark:hover:bg-yellow-900/20 text-sm ${activePage === "preferences" ? "bg-amber-100 text-yellow-700 font-medium dark:bg-yellow-900/20 dark:text-yellow-400" : "dark:text-gray-200"
                }`}
              onClick={() => handleNavigate("preferences")}
            >
              <Settings size={16} className={activePage === "preferences" ? "text-yellow-700 dark:text-yellow-400" : "dark:text-gray-200"} />
              <span>Preferences</span>
            </button>
          </div>
        </div>



        {/* Right side content */}
        <div className="md:w-3/4 min-h-full h-full flex flex-col md:pl-6">
          {activePage === "account" && (
            <div className="flex flex-col flex-grow h-full">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-secondary/90 dark:border-gray-700">
                <h2 className="text-xl font-bold dark:text-white">Account Information</h2>
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
                  <div className="bg-white dark:bg-gray-800 rounded-lg border border-secondary/90 dark:border-gray-700 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 bg-secondary/30 dark:bg-gray-700/50 border-b border-secondary/90 dark:border-gray-600 flex items-center justify-between">
                      <h3 className="text-sm font-medium flex items-center gap-2 dark:text-white">
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
                          <p className="text-xs text-muted-foreground dark:text-gray-400">Full Name</p>
                          {isEditing ? (
                            <Input
                              value={editFormData.name}
                              onChange={(e) => handleInputChange('name', e.target.value)}
                              className="mt-1"
                            />
                          ) : (
                            <p className="text-sm font-medium dark:text-white">{userData.name || "-"}</p>
                          )}
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground dark:text-gray-400">Username</p>
                          {isEditing ? (
                            <div className="flex items-center mt-1">
                              <span className="mr-1 dark:text-white">@</span>
                              <Input
                                value={editFormData.username}
                                onChange={(e) => handleInputChange('username', e.target.value)}
                              />
                            </div>
                          ) : (
                            <p className="text-sm font-medium dark:text-white">@{displayUsername}</p>
                          )}
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground dark:text-gray-400">Email</p>
                          <p className="text-sm font-medium dark:text-white">{userData.email || "-"}</p>
                        </div>

                        <div>
                          <p className="text-xs text-muted-foreground dark:text-gray-400">Birthday</p>
                          {isEditing ? (
                            <DatePicker
                              date={editFormData.birthDate ? new Date(editFormData.birthDate) : undefined}
                              setDate={(date) => handleInputChange('birthDate', date ? date.toISOString() : '')}
                              placeholder="Select your birthday"
                              className="mt-1"
                            />
                          ) : (
                            <p className="text-sm font-medium dark:text-white">
                              {userData.birthDate ? new Date(userData.birthDate).toLocaleDateString() : "-"}
                            </p>
                          )}
                        </div>

                        <div>
                          <p className="text-xs text-muted-foreground dark:text-gray-400">Status</p>
                          <div className="flex items-center gap-1 mt-1">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            <p className="text-sm font-medium dark:text-white">{userData.status?.name || "Active"}</p>
                          </div>
                        </div>

                        <div className="col-span-1 md:col-span-2">
                          <p className="text-xs text-muted-foreground dark:text-gray-400">Bio</p>
                          {isEditing ? (
                            <Input
                              value={editFormData.bio}
                              onChange={(e) => handleInputChange('bio', e.target.value)}
                              className="mt-1"
                              placeholder="Write a short bio about yourself"
                            />
                          ) : (
                            <p className="text-sm text-muted-foreground dark:text-gray-300">{userData.bio || "No bio provided"}</p>
                          )}
                        </div>
                      </div>

                      <div className="mt-6 border-t border-secondary/90 dark:border-gray-600 pt-6">
                        <h4 className="text-sm font-medium mb-4 dark:text-white">Social Media</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <p className="text-xs text-muted-foreground dark:text-gray-400 mb-1">Facebook</p>
                            {isEditing ? (
                              <Input
                                value={editFormData.facebook}
                                onChange={(e) => handleSocialLinkChange('facebook', e.target.value)}
                                placeholder="Facebook URL"
                              />
                            ) : (
                              <p className="text-sm font-medium">
                                {userData?.facebook ? (
                                  <Link href={userData.facebook} target="_blank" className="text-blue-600 hover:underline dark:text-blue-400">
                                    View Profile
                                  </Link>
                                ) : (
                                  <span className="text-muted-foreground dark:text-gray-400">Not linked</span>
                                )}
                              </p>
                            )}
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground dark:text-gray-400 mb-1">Twitter</p>
                            {isEditing ? (
                              <Input
                                value={editFormData.twitter}
                                onChange={(e) => handleSocialLinkChange('twitter', e.target.value)}
                                placeholder="Twitter URL"
                              />
                            ) : (
                              <p className="text-sm font-medium">
                                {userData?.twitter ? (
                                  <Link href={userData.twitter} target="_blank" className="text-blue-600 hover:underline dark:text-blue-400">
                                    View Profile
                                  </Link>
                                ) : (
                                  <span className="text-muted-foreground dark:text-gray-400">Not linked</span>
                                )}
                              </p>
                            )}
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground dark:text-gray-400 mb-1">Instagram</p>
                            {isEditing ? (
                              <Input
                                value={editFormData.instagram}
                                onChange={(e) => handleSocialLinkChange('instagram', e.target.value)}
                                placeholder="Instagram URL"
                              />
                            ) : (
                              <p className="text-sm font-medium">
                                {userData.instagram ? (
                                  <Link href={userData.instagram} target="_blank" className="text-blue-600 hover:underline dark:text-blue-400">
                                    View Profile
                                  </Link>
                                ) : (
                                  <span className="text-muted-foreground dark:text-gray-400">Not linked</span>
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
                  <div className="bg-white dark:bg-gray-800 rounded-lg border border-secondary/90 dark:border-gray-700 shadow-sm overflow-hidden mt-6">
                    <div className="px-6 py-4 bg-secondary/30 dark:bg-gray-700/50 border-b border-secondary/90 dark:border-gray-600 flex items-center justify-between">
                      <h3 className="text-sm font-medium flex items-center gap-2 dark:text-white">
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
                            <p className="text-xs text-muted-foreground dark:text-gray-400 mb-1">Current Password</p>
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
                            <p className="text-xs text-muted-foreground dark:text-gray-400 mb-1">New Password</p>
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
                            <p className="text-xs text-muted-foreground dark:text-gray-400 mb-1">Confirm New Password</p>
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
                            <p className="text-sm font-medium dark:text-white">••••••••</p>
                            <p className="text-xs text-muted-foreground dark:text-gray-400 mt-1">Password last changed: Recently</p>
                          </div>
                          <div className="flex items-center gap-1 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-2 py-1 rounded">
                            <CheckCircle2 size={14} className="text-primary" />
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
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-secondary/90 dark:border-gray-700">
                <h2 className="text-xl font-bold dark:text-white">Haru Balance</h2>

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
                <div className="lg:col-span-3 bg-secondary/20 dark:bg-gray-800/50 rounded-lg border border-secondary/90 dark:border-gray-700 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 bg-secondary/30 dark:bg-gray-700/50 border-b border-secondary/90 dark:border-gray-600 flex items-center justify-between">
                    <h3 className="text-sm font-medium flex items-center gap-2 dark:text-white">
                      <Wallet size={16} className="text-primary" />
                      Haru Balance
                    </h3>
                  </div>
                  <div className="p-6">
                    {/* Improved Current Balance Layout with Actions */}
                    <div className="flex flex-col sm:flex-row items-center justify-between mb-6 pb-6 border-b border-secondary/90 dark:border-gray-600">
                      <div className="flex items-center gap-4 mb-4 sm:mb-0">
                        <div className="bg-gradient-to-br from-amber-400 to-amber-500 text-white shadow-sm w-16 h-16 rounded-full flex items-center justify-center" title="Haru is used for premium content & purchases">
                          <Award   size={28} className="text-white" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold dark:text-white">{userBallance?.tokenBalance || 0}</p>
                          <p className="text-sm text-muted-foreground dark:text-gray-400">Available Haru</p>
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
                          disabled
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
                      <div className="bg-secondary/30 dark:bg-gray-700/30 p-4 rounded-lg border border-secondary/90 dark:border-gray-600">
                        <div className="flex items-center gap-2 mb-1">
                          <ArrowUpCircle size={16} className="text-green-500" />
                          <p className="text-sm font-medium dark:text-white">Total Earned</p>
                        </div>
                        <p className="text-xl font-bold dark:text-white">{userBallance?.tokenEarned || 0}</p>
                      </div>

                      <div className="bg-secondary/30 dark:bg-gray-700/30 p-4 rounded-lg border border-secondary/90 dark:border-gray-600">
                        <div className="flex items-center gap-2 mb-1">
                          <ArrowDownCircle size={16} className="text-amber-500" />
                          <p className="text-sm font-medium dark:text-white">Total Spent</p>
                        </div>
                        <p className="text-xl font-bold dark:text-white">{userBallance?.tokenSpent || 0}</p>
                      </div>
                    </div>

                    {/* Transaction History Preview */}
                    <RecentTransactions limit={3} showViewAll={true} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activePage === "missions" && (
            <div className="flex flex-col flex-grow h-full">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-secondary/90 dark:border-gray-700">
                <h2 className="text-xl font-bold dark:text-white">Missions & Rewards</h2>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-amber-200 dark:border-amber-700/50 bg-amber-50 dark:bg-amber-900/20">
                  <Wallet className="h-4 w-4 text-amber-500" />
                  <span className="text-sm font-medium text-amber-700 dark:text-amber-400">{userBallance?.tokenBalance || 0} Haru</span>
                </div>
              </div>

              {/* Available Missions */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3 dark:text-white">Available Missions</h3>
                <AvailableMissions />
              </div>

              {/* Completed Missions */}
              <div>
                <h3 className="text-lg font-semibold mb-3 dark:text-white">Completed Missions</h3>
                <MissionHistory />
              </div>
            </div>
          )}

          {activePage === "history" && (
            <div className="flex flex-col flex-grow h-full">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold dark:text-white">Recently Read</h2>

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
                <h2 className="text-xl font-bold dark:text-white">Bookmarked Books</h2>

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
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-secondary/90 dark:border-gray-700">
                <h2 className="text-xl font-bold dark:text-white">My Books</h2>

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
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-secondary/90 dark:border-gray-700">
                <h2 className="text-xl font-bold dark:text-white">User Preferences</h2>

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

              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-secondary/90 dark:border-gray-700 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium mb-4 dark:text-white">Reading Preferences</h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium mb-1 dark:text-white">Reading Speed</p>

                        <Select
                          value={preferencesChanged ? preferencesFormData?.readingSpeed : userData?.preferences?.readingSpeed || 'medium'}
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
                        <p className="text-sm font-medium mb-1 dark:text-white">Volume</p>
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={preferencesChanged ? preferencesFormData.volume : userData?.preferences?.volume || 50}
                            onChange={(e) => handlePreferencesChange('volume', e.target.value)}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                          />
                          <span className="text-xs text-muted-foreground dark:text-gray-400 w-8 text-right">
                            {preferencesChanged ? preferencesFormData.volume : userData?.preferences?.volume || 50}%
                          </span>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium mb-1 dark:text-white">Theme</p>

                        <Select
                          value={preferencesChanged ? preferencesFormData?.theme : userData?.preferences?.theme}
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
                        <p className="text-sm font-medium mb-1 dark:text-white">Language</p>

                        <Select
                          value={preferencesChanged ? preferencesFormData?.language : userData?.preferences?.language}
                          onValueChange={(value) => handlePreferencesChange('language', value)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select language" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="en">English</SelectItem>
                            <SelectItem value="vn">Vietnamese</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activePage === "analytics" && (
            <div className="flex flex-col flex-grow h-full">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-secondary/90 dark:border-gray-700">
                <h2 className="text-xl font-bold dark:text-white">Reading Statistics</h2>

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
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-6 border border-secondary/90 dark:border-gray-700 shadow-sm">
                <h3 className="text-sm font-medium mb-4 dark:text-white">Reading Activity</h3>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                  <div className="bg-secondary/30 dark:bg-gray-700/30 rounded-lg p-4 text-center flex flex-col items-center justify-center border border-secondary/90 dark:border-gray-600">
                    <div className="bg-primary/10 dark:bg-primary/20 w-12 h-12 rounded-full flex items-center justify-center mb-3">
                      <BookOpen size={22} className="text-primary" />
                    </div>
                    <p className="text-xl font-semibold dark:text-white">{userData.readingStats.booksRead}</p>
                    <p className="text-xs text-muted-foreground dark:text-gray-400 mt-1">Books Read</p>
                  </div>
                  <div className="bg-secondary/30 dark:bg-gray-700/30 rounded-lg p-4 text-center flex flex-col items-center justify-center border border-secondary/90 dark:border-gray-600">
                    <div className="bg-primary/10 dark:bg-primary/20 w-12 h-12 rounded-full flex items-center justify-center mb-3">
                      <Book size={22} className="text-primary" />
                    </div>
                    <p className="text-xl font-semibold dark:text-white">{userData.readingStats.chaptersRead}</p>
                    <p className="text-xs text-muted-foreground dark:text-gray-400 mt-1">Chapters Read</p>
                  </div>
                  <div className="bg-secondary/30 dark:bg-gray-700/30 rounded-lg p-4 text-center flex flex-col items-center justify-center border border-secondary/90 dark:border-gray-600">
                    <div className="bg-primary/10 dark:bg-primary/20 w-12 h-12 rounded-full flex items-center justify-center mb-3">
                      <PenSquare size={22} className="text-primary" />
                    </div>
                    <p className="text-xl font-semibold dark:text-white">
                      {(userData as any).authoredBooks?.length || 0}
                    </p>
                    <p className="text-xs text-muted-foreground dark:text-gray-400 mt-1">Books Created</p>
                  </div>
                </div>
              </div>

              {/* Progress Chart */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-secondary/90 dark:border-gray-700 shadow-sm">
                  <h3 className="text-sm font-medium mb-4 flex items-center gap-2 dark:text-white">
                    <Clock size={18} className="text-primary" />
                    Reading Streak Calendar
                  </h3>
                  <div className="aspect-[4/3] bg-white dark:bg-gray-900/50 rounded-lg flex flex-col justify-between border border-secondary/90 dark:border-gray-600 p-4">
                    <div className="grid grid-cols-7 gap-1 mb-2">
                      {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                        <div key={i} className="text-center text-xs text-muted-foreground dark:text-gray-400">{day}</div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1 flex-grow">
                      {Array(28).fill(0).map((_, i) => {
                        // Randomly generate some activity for demo purposes
                        const hasActivity = Math.random() > 0.6;
                        const today = i === 18; // Assume day 18 is today
                        const isStreak = i >= 16 && i <= 18; // Last 3 days are streak

                        let bgClass = 'bg-secondary/20 dark:bg-gray-700/50';
                        if (hasActivity) bgClass = 'bg-primary/30 dark:bg-primary/40';
                        if (isStreak) bgClass = 'bg-primary/60 dark:bg-primary/70';
                        if (today) bgClass = 'bg-primary dark:bg-primary';

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
                        <p className="text-xs text-muted-foreground dark:text-gray-400">Current streak: 3 days</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-sm bg-primary/30 dark:bg-primary/40"></div>
                        <p className="text-xs text-muted-foreground dark:text-gray-400">Reading day</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-secondary/90 dark:border-gray-700 shadow-sm">
                  <h3 className="text-sm font-medium mb-4 flex items-center gap-2 dark:text-white">
                    <BarChart size={18} className="text-primary" />
                    Reading Goals
                  </h3>
                  <div className="aspect-[4/3] bg-white dark:bg-gray-900/50 rounded-lg flex flex-col justify-between border border-secondary/90 dark:border-gray-600 p-4">
                    <div className="space-y-6">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium dark:text-white">Weekly Goal: 7 chapters</p>
                          <p className="text-xs font-medium text-primary">5/7</p>
                        </div>
                        <div className="h-2 bg-secondary/20 dark:bg-gray-700/50 rounded-full overflow-hidden">
                          <div className="bg-primary h-full rounded-full" style={{ width: '71%' }}></div>
                        </div>
                        <p className="text-xs text-muted-foreground dark:text-gray-400 mt-1 text-right">71% Complete</p>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium dark:text-white">Monthly Goal: 5 books</p>
                          <p className="text-xs font-medium text-primary">2/5</p>
                        </div>
                        <div className="h-2 bg-secondary/20 dark:bg-gray-700/50 rounded-full overflow-hidden">
                          <div className="bg-primary h-full rounded-full" style={{ width: '40%' }}></div>
                        </div>
                        <p className="text-xs text-muted-foreground dark:text-gray-400 mt-1 text-right">40% Complete</p>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium dark:text-white">Daily Reading: 30 mins</p>
                          <p className="text-xs font-medium text-primary">25/30</p>
                        </div>
                        <div className="h-2 bg-secondary/20 dark:bg-gray-700/50 rounded-full overflow-hidden">
                          <div className="bg-primary h-full rounded-full" style={{ width: '83%' }}></div>
                        </div>
                        <p className="text-xs text-muted-foreground dark:text-gray-400 mt-1 text-right">83% Complete</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-center mt-4">
                      <div className="flex items-center gap-1 bg-primary/10 dark:bg-primary/20 px-3 py-1 rounded-full">
                        <CheckCircle2 size={14} className="text-primary" />
                        <p className="text-xs font-medium dark:text-white">You're on track to meet your goals!</p>
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