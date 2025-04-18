"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
  Save,
  Edit,
  X,
  Facebook,
  Twitter,
  Instagram,
  Link as LinkIcon,
  CreditCard,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  Camera,
  Upload
} from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getCurrentUser, getUserById, updateUserProfile } from "@/lib/api";
import { useUserStore } from "@/lib/store";
import { User, UserPreferences } from "@/models";
import { Genre } from "@/models/genre";
import { BookCard } from "@/components/books/book-card";

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

// Initial user data
const INITIAL_USER_DATA: User = {
  id: '',
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
  preferences: defaultPreferences,
  socialLinks: {
    facebook: '',
    twitter: '',
    instagram: '',

  }
};

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const userId = params.id as string;
  const { user, token } = useUserStore();
  // Initialize with the default user data (non-null)
  const [userData, setUserData] = useState<User>(structuredClone(INITIAL_USER_DATA));
  
  // Get section from URL query parameter and set active page accordingly
  const sectionParam = searchParams.get('section');
  const [activePage, setActivePage] = useState<string>(sectionParam || "account");
  
  // Update URL with section=account if it's missing on initial load
  useEffect(() => {
    if (!sectionParam) {
      // If no section parameter, add it with default value "account"
      const newParams = new URLSearchParams(searchParams);
      newParams.set('section', 'account');
      // Update URL without reloading the page
      router.replace(`${params.id}?${newParams.toString()}`, { scroll: false });
    }
  }, [router, params, searchParams, sectionParam]);
  
  // Update active page when URL changes
  useEffect(() => {
    if (sectionParam) {
      setActivePage(sectionParam);
    }
  }, [sectionParam]);
  
  // Function to update active page and URL query parameter
  const handleNavigate = (page: string) => {
    setActivePage(page);
    // Create new URLSearchParams object from current params
    const newParams = new URLSearchParams(searchParams);
    // Set the section parameter
    newParams.set('section', page);
    // Update URL without reloading the page
    router.replace(`${params.id}?${newParams.toString()}`, { scroll: false });
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
  
  const userQuery = useQuery({
    queryKey: ['user', userId],
    queryFn: async () => {
        
        const response = await getCurrentUser(token || '');
        
        if (response.data?.data) {
          const fetchedUser = response.data.data;
          
          // Create a safely merged user object
          const mergedUser: User = {
            ...structuredClone(INITIAL_USER_DATA),
            ...fetchedUser,
            // Ensure these nested objects are properly merged
            readingStats: {
              ...INITIAL_USER_DATA.readingStats,
              ...(fetchedUser.readingStats || {})
            },
            // Ensure preferences is never undefined
            preferences: {
              ...defaultPreferences,
              ...(fetchedUser.preferences || {}),
              // Ensure favoriteGenres is always present
              favoriteGenres: fetchedUser.preferences?.favoriteGenres || []
            }
          };
          
          setUserData(mergedUser);
          return mergedUser;
      }
      
      // If we get here, either there was an error or no data
      return userData;
    }
  });
  
  const updateUserMutation = useMutation({
    mutationFn: async (updatedData: Partial<User>) => {
      return await updateUserProfile(userId, updatedData, token || undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', userId] });
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
  
  if (userQuery.isLoading) {
    return (
      <div className="container mx-auto px-4 py-12 flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }
  
  // Handle profile update
  const handleProfileUpdate = (updatedData: Partial<User>) => {
    updateUserMutation.mutate(updatedData);
  };
  
  // Generate a display username
  const displayUsername = userData.username || userData.name.toLowerCase().replace(/\s+/g, '');
  
  // Check if the profile belongs to the current logged-in user
  const isMyProfile = user && user.id.toString() === userId;
  
  // Ensure preferences is always accessible
  const preferences = userData.preferences || defaultPreferences;
  const favoriteGenres = preferences.favoriteGenres || [];
  
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
  };
  
  // Handle password field changes
  const handlePasswordChange = (field: string, value: string) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Save password changes
  const savePasswordChange = () => {
    // Validate passwords
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      // Handle password mismatch
      alert("New passwords don't match");
      return;
    }
    
    if (!passwordData.currentPassword || !passwordData.newPassword) {
      // Handle empty fields
      alert("Please fill all password fields");
      return;
    }
    
    // Create a separate API call for password update
    // This is a mock - would need to be implemented on backend
    const passwordUpdateData = {
      password: passwordData.newPassword,
      currentPassword: passwordData.currentPassword,
      userId: userId
    };
    
    // Example of how you might call a specific password update API
    // updateUserPassword(passwordUpdateData)
    //   .then(() => {
    //     setIsChangingPassword(false);
    //     setPasswordData({...});
    //   });
    
    // For now, just pretend it was successful
    alert("Password would be updated in a real implementation");
    setIsChangingPassword(false);
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
  };
  
  // Function to handle avatar upload
  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setAvatarFile(files[0]);
      
      // Here you would typically upload the file to your server
      // For now, we'll just simulate it by showing a preview
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target && e.target.result) {
          // In a real app, you would upload this to your server
          // and update the userData with the new avatar URL
          console.log("Avatar file read:", e.target.result);
          
          // Simulate updating the avatar (in real app, this would be done via API)
          // handleProfileUpdate({ avatar: e.target.result as string });
          alert("In a real app, the avatar would be uploaded to the server");
        }
      };
      reader.readAsDataURL(files[0]);
    }
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
              <div className="relative w-20 h-20 rounded-full overflow-hidden border border-primary/20 shadow-sm mb-3 ring-2 ring-secondary/10 group">
          {/* Fallback avatar if no image exists */}
                <div className="absolute inset-0 bg-gray-50 flex items-center justify-center">
                  <UserIcon className="w-10 h-10 text-gray-400" />
          </div>
          {/* Will display if image exists */}
          {userData.avatar && (
            <Image
              src={userData.avatar}
              alt={userData.name}
              fill
              className="object-cover"
              priority
            />
          )}
                
                {/* Edit avatar overlay - only visible for the profile owner */}
                {isMyProfile && (
                  <>
                    <label 
                      htmlFor="avatar-upload"
                      className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      <div className="flex flex-col items-center text-white">
                        <Camera size={18} className="mb-1" />
                        <span className="text-xs font-medium">Change Photo</span>
        </div>
                    </label>
                    <input 
                      id="avatar-upload" 
                      type="file" 
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarUpload}
                    />
                  </>
                )}
              </div>
              <h1 className="text-lg font-bold text-center">{userData.name || 'User Profile'}</h1>
              <p className="text-xs text-muted-foreground text-center mb-3">@{displayUsername}</p>
              
              {isMyProfile && (
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
              )}
            </div>
            
            <button
              className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-primary/20 text-sm ${
                activePage === "account" ? "bg-primary/10 text-primary font-medium" : ""
              }`}
              onClick={() => handleNavigate("account")}
            >
              <UserIcon size={16} className={activePage === "account" ? "text-primary" : ""} />
              <span>Account</span>
            </button>
            
            {/* Update payment section button to Balance */}
            <button
              className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-primary/20 text-sm ${
                activePage === "balance" ? "bg-primary/10 text-primary font-medium" : ""
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
              className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-primary/20 text-sm ${
                activePage === "shelf" ? "bg-primary/10 text-primary font-medium" : ""
              }`}
              onClick={() => handleNavigate("shelf")}
            >
              <LayoutGrid size={16} className={activePage === "shelf" ? "text-primary" : ""} />
              <span>My Books</span>
            </button>
            <button
              className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-primary/20 text-sm ${
                activePage === "bookmarks" ? "bg-primary/10 text-primary font-medium" : ""
              }`}
              onClick={() => handleNavigate("bookmarks")}
            >
              <Bookmark size={16} className={activePage === "bookmarks" ? "text-primary" : ""} />
              <span>Bookmarked</span>
            </button>
            <button
              className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-primary/20 text-sm ${
                activePage === "history" ? "bg-primary/10 text-primary font-medium" : ""
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
              className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-primary/20 text-sm ${
                activePage === "analytics" ? "bg-primary/10 text-primary font-medium" : ""
              }`}
              onClick={() => handleNavigate("analytics")}
            >
              <BarChart size={16} className={activePage === "analytics" ? "text-primary" : ""} />
              <span>Statistics</span>
            </button>
            <button
              className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-primary/20 text-sm ${
                activePage === "preferences" ? "bg-primary/10 text-primary font-medium" : ""
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
                      {isMyProfile && !isEditing && (
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
                      
                      {isMyProfile && isEditing && (
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
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className="w-full justify-start text-left font-normal mt-1"
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {editFormData.birthday ? (
                                    format(new Date(editFormData.birthday), "PPP")
                                  ) : (
                                    <span className="text-muted-foreground">Select your birthday</span>
                                  )}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={editFormData.birthday ? new Date(editFormData.birthday) : undefined}
                                  onSelect={(date) => handleInputChange('birthday', date ? date.toISOString().split('T')[0] : '')}
                                  initialFocus
                                  captionLayout="dropdown-buttons"
                                  fromYear={1920}
                                  toYear={new Date().getFullYear()}
                                />
                              </PopoverContent>
                            </Popover>
                          ) : (
                            <p className="text-sm font-medium">
                              {userData.birthday ? new Date(userData.birthday).toLocaleDateString('en-US', {
                month: 'long',
                                day: 'numeric',
                                year: 'numeric'
                              }) : "-"}
            </p>
                          )}
          </div>
        </div>
        
                      <div className="mt-6 pt-6 border-t border-secondary/90">
                        <div className="flex flex-col md:flex-row gap-6">
                          {/* Bio Section - Left Half */}
                          <div className="w-full md:w-1/2">
                            <p className="text-xs text-muted-foreground mb-2">Bio</p>
                            {isEditing ? (
                              <Textarea
                                value={editFormData.bio}
                                onChange={(e) => handleInputChange('bio', e.target.value)}
                                placeholder="Tell us about yourself..."
                                rows={4}
                                className="w-full"
                              />
                            ) : (
                              userData.bio ? (
                                <p className="text-sm">{userData.bio}</p>
                              ) : (
                                <div className="py-2">
                                  <p className="text-sm text-muted-foreground">No bio provided</p>
                                  {isMyProfile && (
                                    <p className="text-xs text-muted-foreground mt-1">Click Edit to add your bio</p>
                                  )}
                                </div>
                              )
                            )}
                          </div>
                          
                          {/* Social Links Section - Right Half */}
                          <div className="w-full md:w-1/2">
                            <p className="text-xs text-muted-foreground mb-2">Social Links</p>
                            {isEditing ? (
                              <div className="space-y-3">
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <Facebook size={16} className="text-blue-600" />
                                    <p className="text-xs text-muted-foreground">Facebook</p>
                                  </div>
                                  <Input
                                    value={editFormData.socialLinks.facebook}
                                    onChange={(e) => handleSocialLinkChange('facebook', e.target.value)}
                                    placeholder="https://facebook.com/username"
                                    className="text-sm"
                                  />
                                </div>
                                
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <Twitter size={16} className="text-blue-400" />
                                    <p className="text-xs text-muted-foreground">Twitter</p>
                                  </div>
                                  <Input
                                    value={editFormData.socialLinks.twitter}
                                    onChange={(e) => handleSocialLinkChange('twitter', e.target.value)}
                                    placeholder="https://twitter.com/username"
                                    className="text-sm"
                                  />
                                </div>
                                
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <Instagram size={16} className="text-pink-600" />
                                    <p className="text-xs text-muted-foreground">Instagram</p>
                                  </div>
                                  <Input
                                    value={editFormData.socialLinks.instagram}
                                    onChange={(e) => handleSocialLinkChange('instagram', e.target.value)}
                                    placeholder="https://instagram.com/username"
                                    className="text-sm"
                                  />
                                </div>
                              </div>
                            ) : (
                              userData.socialLinks && Object.entries(userData.socialLinks).some(([key, value]) => value && (key === 'facebook' || key === 'twitter' || key === 'instagram')) ? (
                                <div className="space-y-2">
                                  {userData.socialLinks.facebook && (
                                    <a 
                                      href={userData.socialLinks.facebook} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
                                    >
                                      <Facebook size={18} className="text-blue-600" />
                                      <span>Facebook</span>
                                    </a>
                                  )}
                                  
                                  {userData.socialLinks.twitter && (
                                    <a 
                                      href={userData.socialLinks.twitter} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
                                    >
                                      <Twitter size={18} className="text-blue-400" />
                                      <span>Twitter</span>
                                    </a>
                                  )}
                                  
                                  {userData.socialLinks.instagram && (
                                    <a 
                                      href={userData.socialLinks.instagram} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
                                    >
                                      <Instagram size={18} className="text-pink-600" />
                                      <span>Instagram</span>
                                    </a>
                                  )}
                                </div>
                              ) : (
                                <div>
                                  <div className="flex items-center gap-2 text-muted-foreground">
                                    <LinkIcon size={16} />
                                    <p className="text-sm">No social links added</p>
                                  </div>
                                  {isMyProfile && (
                                    <p className="text-xs text-muted-foreground mt-1">Click Edit to add your social profiles</p>
                                  )}
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Password Security Section - Separate box */}
                  {isMyProfile && (
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
                                  className="pr-10"
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
      </div>
      
                            <div className="relative">
                              <p className="text-xs text-muted-foreground mb-1">New Password</p>
                              <div className="flex items-center">
                                <Input
                                  type={showPassword.new ? "text" : "password"}
                                  value={passwordData.newPassword}
                                  onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                                  placeholder="Enter new password"
                                  className="pr-10"
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
                            </div>
                            
                            <div className="relative">
                              <p className="text-xs text-muted-foreground mb-1">Confirm New Password</p>
                              <div className="flex items-center">
                                <Input
                                  type={showPassword.confirm ? "text" : "password"}
                                  value={passwordData.confirmPassword}
                                  onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                                  placeholder="Confirm new password"
                                  className="pr-10"
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
                              >
                                Save
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
                  )}
                </div>
              </div>
            </div>
          )}
          
          {activePage === "balance" && (
            <div className="flex flex-col flex-grow h-full">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-secondary/90">
                <h2 className="text-xl font-bold">Haru Balance</h2>
                
                <div className="flex gap-2">
                  {isMyProfile && (
                    <>
                      <Link href="/deposit">
                        <Button variant="outline" className="flex items-center gap-2">
                          <ArrowUpCircle size={16} className="text-green-500" />
                          <span className="hidden sm:inline">Deposit Haru</span>
                          <span className="sm:hidden">Deposit</span>
                </Button>
              </Link>
                    </>
          )}
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
                  {isMyProfile && (
                    <Link href="/books">
                      <Button variant="outline" className="flex items-center gap-2">
            <BookOpen size={16} />
                        <span className="hidden sm:inline">Browse Books</span>
                        <span className="sm:hidden">Browse</span>
                      </Button>
                    </Link>
          )}
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
                  {isMyProfile && (
                    <Link href="/books/create">
                      <Button variant="outline" className="flex items-center gap-2">
                        <PlusCircle size={16} />
                        <span className="hidden sm:inline">Create Book</span>
                        <span className="sm:hidden">Create</span>
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
              
          <div className="text-center py-10">
                <div className="flex justify-center mb-4">
                  <Clock size={48} className="text-muted-foreground/50" />
                </div>
                <p className="text-muted-foreground">No recently read books.</p>
            <Link href="/books">
              <Button className="mt-4">Browse Books</Button>
            </Link>
          </div>
            </div>
          )}
          
          {activePage === "bookmarks" && (
            <div className="flex flex-col flex-grow h-full">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Bookmarked Books</h2>
                
                <div className="flex gap-2">
                  {isMyProfile && (
                    <Link href="/books/create">
                      <Button variant="outline" className="flex items-center gap-2">
                        <PlusCircle size={16} />
                        <span className="hidden sm:inline">Create Book</span>
                        <span className="sm:hidden">Create</span>
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
              
          <div className="text-center py-10">
                <div className="flex justify-center mb-4">
                  <Bookmark size={48} className="text-muted-foreground/50" />
                </div>
            <p className="text-muted-foreground">No bookmarked books yet.</p>
            <Link href="/books">
              <Button className="mt-4">Browse Books</Button>
            </Link>
          </div>
            </div>
          )}
          
          {activePage === "shelf" && (
            <div className="flex flex-col flex-grow h-full">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-secondary/90">
                <h2 className="text-xl font-bold">My Books</h2>
                
                <div className="flex gap-2">
                  {isMyProfile && (
                    <Link href="/books/create">
                      <Button variant="outline" className="flex items-center gap-2">
                        <PlusCircle size={16} />
                        <span className="hidden sm:inline">Create Book</span>
                        <span className="sm:hidden">Create</span>
                      </Button>
            </Link>
                  )}
          </div>
              </div>
              
              <div className="flex gap-4 mb-6 overflow-x-auto pb-4">
                <Button 
                  variant={activeBookFilter === "all" ? "default" : "outline"} 
                  className={`rounded-full px-4 text-sm ${activeBookFilter === "all" ? "bg-primary text-white" : ""}`}
                  onClick={() => handleBookFilterChange("all")}
                >
                  All Books
                </Button>
                <Button 
                  variant={activeBookFilter === "inProgress" ? "default" : "outline"} 
                  className={`rounded-full px-4 text-sm ${activeBookFilter === "inProgress" ? "bg-primary text-white" : ""}`}
                  onClick={() => handleBookFilterChange("inProgress")}
                >
                  In Progress
                </Button>
                <Button 
                  variant={activeBookFilter === "created" ? "default" : "outline"} 
                  className={`rounded-full px-4 text-sm ${activeBookFilter === "created" ? "bg-primary text-white" : ""}`}
                  onClick={() => handleBookFilterChange("created")}
                >
                  Created
                </Button>
                <Button 
                  variant={activeBookFilter === "completed" ? "default" : "outline"} 
                  className={`rounded-full px-4 text-sm ${activeBookFilter === "completed" ? "bg-primary text-white" : ""}`}
                  onClick={() => handleBookFilterChange("completed")}
                >
                  Completed
                </Button>
          </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Show books based on active filter */}
                {(activeBookFilter === "all" || activeBookFilter === "inProgress") && (
                  <div>
                    <BookCard
                      id="1"
                      title="The Adventure Begins"
                      author={userData.name}
                      description="An exciting journey through imagination and creativity."
                      chapters={5}
                      rating={4.5}
                      genre="Fantasy"
                      progress={0.3}
                      className="h-[360px] border-0 shadow-lg"
                      showPreview={false}
                    />
                  </div>
                )}
                
                {(activeBookFilter === "all" || activeBookFilter === "inProgress") && (
                  <div>
                    <BookCard
                      id="2"
                      title="Fantasy World"
                      author="Maria Johnson"
                      description="Explore a magical world full of wonder and mystery."
                      chapters={8}
                      rating={4.2}
                      genre="Fantasy"
                      progress={0.7}
                      className="h-[360px] border-0 shadow-lg"
                      showPreview={false}
                    />
                  </div>
                )}
                
                {(activeBookFilter === "all" || activeBookFilter === "created") && (
                  <div>
                    <div className="rounded-lg border border-dashed border-secondary/90 h-[360px] flex flex-col items-center justify-center p-6 bg-secondary/10 hover:bg-secondary/20 transition-colors cursor-pointer">
                      <PlusCircle size={40} className="mb-4" />
                      <p className="text-center text-sm text-muted-foreground">Create a new book</p>
                      <Button variant="outline" size="sm" className="mt-4 text-black">Start Creating</Button>
                    </div>
                  </div>
                )}
                
                {/* Show empty state if no books match the filter */}
                {activeBookFilter === "completed" && (
                  <div className="col-span-full text-center py-10">
                    <div className="flex justify-center mb-4">
                      <CheckCircle2 size={48} className="text-muted-foreground/50" />
                    </div>
                    <p className="text-muted-foreground">No completed books yet.</p>
                    <Button variant="outline" className="mt-4" onClick={() => handleBookFilterChange("all")}>View All Books</Button>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {activePage === "preferences" && (
            <div className="flex flex-col flex-grow h-full">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-secondary/90">
                <h2 className="text-xl font-bold">User Preferences</h2>
                
                <div className="flex gap-2">
                  {isMyProfile && preferencesChanged && (
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
                        {isMyProfile ? (
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
                        ) : (
                          <p className="text-sm text-muted-foreground capitalize">{preferences.readingSpeed || "Medium"}</p>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium mb-1">Theme</p>
                        {isMyProfile ? (
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
                        ) : (
                          <p className="text-sm text-muted-foreground capitalize">{preferences.theme || "Light"}</p>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium mb-1">Language</p>
                        {isMyProfile ? (
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
                        ) : (
                          <p className="text-sm text-muted-foreground capitalize">{preferences.language === "EN" ? "English" : preferences.language === "VI" ? "Vietnamese" : preferences.language === "FR" ? "French" : preferences.language || "English"}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium mb-4">Notification Settings</h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium mb-1">Email Notifications</p>
                        {isMyProfile ? (
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
                        ) : (
                          <p className="text-sm text-muted-foreground">{preferences.notifications?.email ? "Enabled" : "Disabled"}</p>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium mb-1">Push Notifications</p>
                        {isMyProfile ? (
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
                        ) : (
                          <p className="text-sm text-muted-foreground">{preferences.notifications?.push ? "Enabled" : "Disabled"}</p>
                        )}
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