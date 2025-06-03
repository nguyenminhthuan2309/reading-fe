"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { 
  BookOpen, 
  Clock, 
  ChevronLeft,
  User as UserIcon,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {  getUserById } from "@/lib/api/auth";
import { useUserStore } from "@/lib/store";
import { User, UserPreferences } from "@/models";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { USER_KEYS } from "@/lib/constants/query-keys";
import { useUserBooks } from "@/lib/hooks/useUserBooks";
import { BookCard } from "@/components/books/book-card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";

// Create a complete initial user data with proper types
const defaultPreferences: Required<UserPreferences> = {
  theme: "light",
  language: "EN",
  readingSpeed: "medium",
  readingMode: "scroll",
  volume: 50,
};


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
  points: 0,
  status: { id: 0, name: 'New' },
  role: { id: 0, name: 'User' },
  readingStats: {
    booksRead: 0,
    chaptersRead: 0,
  },
  tokenBalance: 0,
  tokenEarned: 0,
  tokenPurchased: 0,
  tokenReceived: 0,
  tokenSpent: 0,
  tokenWithdrawn: 0,
  preferences: defaultPreferences,
  
};

// Create a CompactUserBooks component that displays smaller book cards
function CompactUserBooks({ userId, filter = "created", limitPage = 16 }: { userId: number, filter?: "all" | "inProgress" | "created" | "completed", limitPage?: number }) {
  const [page, setPage] = useState(1);
  const [limit] = useState(limitPage); // Show more books per page
  const { user } = useUserStore();
  
  const { 
    data, 
    isLoading, 
    error 
  } = useUserBooks(userId, page, limit, filter);
  
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
        {Array.from({ length: 12 }).map((_, index) => (
          <div key={index} className="space-y-2">
            <Skeleton className="h-[140px] w-full rounded-md" />
            <Skeleton className="h-3 w-2/3" />
            <Skeleton className="h-2 w-1/2" />
          </div>
        ))}
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="rounded-md bg-destructive/15 p-4">
        <div className="flex items-center">
          <AlertCircle className="h-4 w-4 text-destructive mr-2" />
          <h3 className="font-medium text-destructive">Error</h3>
        </div>
        <p className="text-destructive text-sm mt-2">
          Failed to load books. {(error as Error).message}
        </p>
      </div>
    );
  }
  
  if (!data?.data.length) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground text-sm">No books created yet.</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
        {data.data.map((book) => (
          <div key={book.id} className="flex h-full w-full">
            <BookCard
              id={book.id}
              title={book.title}
              author={book.author}
              description={book.description || ""}
              coverImage={book.cover}
              chapters={book.totalChapters || 0}
              rating={book.rating || 0}
              genres={book.categories || []}
              readingProgress={book.readingProgress}
              isCreator={user?.id === book.author.id}
              isFollowed={book.isFollowed}
              className="w-full scale-95 origin-top"
              showPreview={false} // Disable hover preview for compact view
            />
          </div>
        ))}
      </div>
      
      {data.totalPages > 1 && (
        <div className="flex justify-center mt-4">
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setPage(currentPage => Math.max(1, currentPage - 1))}
              disabled={page <= 1}
              className="h-7 text-xs px-2"
            >
              Previous
            </Button>
            
            <span className="text-xs">
              Page {page} of {data.totalPages}
            </span>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setPage(currentPage => Math.min(data.totalPages, currentPage + 1))}
              disabled={page >= data.totalPages}
              className="h-7 text-xs px-2"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const userId = params.id as string;
  const { user } = useUserStore();
  
  // Initialize with the default user data (non-null)
  const [userData, setUserData] = useState<User>(structuredClone(INITIAL_USER_DATA));
  
  const userQuery = useQuery({
    queryKey: USER_KEYS.DETAIL(userId),
    queryFn: async () => {
        
        const response = await getUserById(userId);        
        // Check if user doesn't exist (404 status)
        if (response.status === 404) {
          return null;
        }
        
        if (response.data) {
          const fetchedUser = response.data;
          
          // Create a safely merged user object
          const mergedUser: User = {
            ...structuredClone(INITIAL_USER_DATA),
            ...fetchedUser,
          };
          
          setUserData(mergedUser);
          return mergedUser;
      }
      
      // If we get here, either there was an error or no data
      return userData;
    },
    staleTime: 0,
  });
  
  if (userQuery.isLoading) {
    return (
      <div className="container mx-auto px-4 py-12 flex flex-col items-center justify-center min-h-[70vh] dark:bg-gray-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
          <p className="text-lg font-medium dark:text-white">Loading profile...</p>
        </div>
      </div>
    );
  }
  
  // Show user not found message if user doesn't exist
  if (userQuery.data === null) {
    return (
      <div className="container mx-auto px-4 py-12 flex flex-col items-center justify-center min-h-[70vh] dark:bg-gray-900">
        <h1 className="text-4xl font-bold text-red-600 dark:text-red-400 mb-4">User Not Found</h1>
        <p className="text-lg mb-8 dark:text-gray-300">The user you're looking for doesn't exist or has been removed.</p>
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
  
  // Generate a display username
  const displayUsername = userData.username || userData.name.toLowerCase().replace(/\s+/g, '');
  
  // Add a banner notice if this is the user's own profile
  const isOwnProfile = user && user.id === parseInt(userId);
  
  return (
    <div className="container mx-auto py-8 px-4 dark:bg-gray-900 min-h-screen">
      {isOwnProfile && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/50 rounded-lg p-4 mb-4 flex items-center justify-between">
          <div className="flex items-center">
            <UserIcon className="h-5 w-5 text-blue-500 dark:text-blue-400 mr-2" />
            <p className="text-sm text-blue-700 dark:text-blue-300">You are viewing your public profile as others see it</p>
          </div>
          <Link href="/me">
            <Button variant="outline" size="sm" className="text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-600 dark:hover:bg-blue-800/20">
              Back to Dashboard
            </Button>
          </Link>
        </div>
      )}
      {/* Public Profile Header */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 mb-8 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Avatar */}
          <Avatar className="w-24 h-24" gender={userData.gender}>
            {userData.avatar && (
              <AvatarImage src={userData.avatar} alt={userData.name} />
            )}
            <AvatarFallback gender={userData.gender}>
            </AvatarFallback>
          </Avatar>
          
          {/* User Information */}
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-2xl font-bold dark:text-white">{userData.name}</h1>
            <p className="text-sm text-muted-foreground dark:text-gray-400 mb-3">@{displayUsername}</p>
            
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 mb-4">
              <div className="flex items-center gap-1 justify-center sm:justify-start">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <p className="text-sm font-medium dark:text-white">{userData.status?.name || "Active"}</p>
              </div>
              
              <div className="flex items-center gap-1 justify-center sm:justify-start">
                <Clock size={16} className="text-muted-foreground dark:text-gray-400" />
                <p className="text-sm text-muted-foreground dark:text-gray-400">Joined {new Date(userData.joinedDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long' })}</p>
              </div>
            </div>
            
            {userData.bio && (
              <div className="mb-4 max-w-2xl">
                <p className="text-sm dark:text-gray-300">{userData.bio}</p>
              </div>
            )}
            
            {/* Enhanced Social Links */}
            {((userData as any).socialLinks?.facebook || (userData as any).socialLinks?.twitter || (userData as any).socialLinks?.instagram) && (
              <div className="flex items-center gap-3 justify-center sm:justify-start mb-4">
                <p className="text-xs text-muted-foreground dark:text-gray-400">Connect:</p>
                {(userData as any).socialLinks?.facebook && (
                  <Link href={(userData as any).socialLinks.facebook} target="_blank" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors">
                    <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-800/50 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M16 8.049c0-4.446-3.582-8.05-8-8.05C3.58 0-.002 3.603-.002 8.05c0 4.017 2.926 7.347 6.75 7.951v-5.625h-2.03V8.05H6.75V6.275c0-2.017 1.195-3.131 3.022-3.131.876 0 1.791.157 1.791.157v1.98h-1.009c-.993 0-1.303.621-1.303 1.258v1.51h2.218l-.354 2.326H9.25V16c3.824-.604 6.75-3.934 6.75-7.951z"/>
                      </svg>
                    </div>
                  </Link>
                )}
                {(userData as any).socialLinks?.twitter && (
                  <Link href={(userData as any).socialLinks.twitter} target="_blank" className="text-blue-400 hover:text-blue-600 dark:text-blue-300 dark:hover:text-blue-200 transition-colors">
                    <div className="p-2 rounded-full bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-800/50 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M5.026 15c6.038 0 9.341-5.003 9.341-9.334 0-.14 0-.282-.006-.422A6.685 6.685 0 0 0 16 3.542a6.658 6.658 0 0 1-1.889.518 3.301 3.301 0 0 0 1.447-1.817 6.533 6.533 0 0 1-2.087.793A3.286 3.286 0 0 0 7.875 6.03a9.325 9.325 0 0 1-6.767-3.429 3.289 3.289 0 0 0 1.018 4.382A3.323 3.323 0 0 1 .64 6.575v.045a3.288 3.288 0 0 0 2.632 3.218 3.203 3.203 0 0 1-.865.115 3.23 3.23 0 0 1-.614-.057 3.283 3.283 0 0 0 3.067 2.277A6.588 6.588 0 0 1 .78 13.58a6.32 6.32 0 0 1-.78-.045A9.344 9.344 0 0 0 5.026 15z"/>
                      </svg>
                    </div>
                  </Link>
                )}
                {(userData as any).socialLinks?.instagram && (
                  <Link href={(userData as any).socialLinks.instagram} target="_blank" className="text-pink-600 hover:text-pink-800 dark:text-pink-400 dark:hover:text-pink-300 transition-colors">
                    <div className="p-2 rounded-full bg-pink-50 dark:bg-pink-900/30 hover:bg-pink-100 dark:hover:bg-pink-800/50 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M8 0C5.829 0 5.556.01 4.703.048 3.85.088 3.269.222 2.76.42a3.917 3.917 0 0 0-1.417.923A3.927 3.927 0 0 0 .42 2.76C.222 3.268.087 3.85.048 4.7.01 5.555 0 5.827 0 8.001c0 2.172.01 2.444.048 3.297.04.852.174 1.433.372 1.942.205.526.478.972.923 1.417.444.445.89.719 1.416.923.51.198 1.09.333 1.942.372C5.555 15.99 5.827 16 8 16s2.444-.01 3.298-.048c.851-.04 1.434-.174 1.943-.372a3.916 3.916 0 0 0 1.416-.923c.445-.445.718-.891.923-1.417.197-.509.332-1.09.372-1.942C15.99 10.445 16 10.173 16 8s-.01-2.445-.048-3.299c-.04-.851-.175-1.433-.372-1.941a3.926 3.926 0 0 0-.923-1.417A3.911 3.911 0 0 0 13.24.42c-.51-.198-1.092-.333-1.943-.372C10.443.01 10.172 0 7.998 0h.003zm-.717 1.442h.718c2.136 0 2.389.007 3.232.046.78.035 1.204.166 1.486.275.373.145.64.319.92.599.28.28.453.546.598.92.11.281.24.705.275 1.485.039.843.047 1.096.047 3.231s-.008 2.389-.047 3.232c-.035.78-.166 1.203-.275 1.485a2.47 2.47 0 0 1-.599.919c-.28.28-.546.453-.92.598-.28.11-.704.24-1.485.276-.843.038-1.096.047-3.232.047s-2.39-.009-3.233-.047c-.78-.036-1.203-.166-1.485-.276a2.478 2.478 0 0 1-.92-.598 2.48 2.48 0 0 1-.6-.92c-.109-.281-.24-.705-.275-1.485-.038-.843-.046-1.096-.046-3.233 0-2.136.008-2.388.046-3.231.036-.78.166-1.204.276-1.486.145-.373.319-.64.599-.92.28-.28.546-.453.92-.598.282-.11.705-.24 1.485-.276.738-.034 1.024-.044 2.515-.045v.002zm4.988 1.328a.96.96 0 1 0 0 1.92.96.96 0 0 0 0-1.92zm-4.27 1.122a4.109 4.109 0 1 0 0 8.217 4.109 4.109 0 0 0 0-8.217zm0 1.441a2.667 2.667 0 1 1 0 5.334 2.667 2.667 0 0 1 0-5.334z"/>
                      </svg>
                    </div>
                  </Link>
                )}
              </div>
            )}
          </div>
          
          {/* User Stats */}
          <div className="flex flex-row sm:flex-col gap-4 mt-4 sm:mt-0 text-center">
            <div className="bg-secondary/10 dark:bg-gray-700/30 rounded-lg px-4 py-3 flex-1">
              <p className="text-xl font-bold dark:text-white">{userData.readingStats.booksRead || 0}</p>
              <p className="text-xs text-muted-foreground dark:text-gray-400">Books Read</p>
            </div>
            <div className="bg-secondary/10 dark:bg-gray-700/30 rounded-lg px-4 py-3 flex-1">
              <p className="text-xl font-bold dark:text-white">{(userData as any).authoredBooks?.length || 0}</p>
              <p className="text-xs text-muted-foreground dark:text-gray-400">Books Created</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* More Compact Books Section */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold dark:text-white">Books by {userData.name}</h2>
          
          <Link href="/books">
            <Button variant="outline" size="sm" className="flex items-center gap-2 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
              <BookOpen size={14} />
              <span>Browse All Books</span>
            </Button>
          </Link>
        </div>
        
        {/* Use our custom compact component instead of UserBooks */}
        <CompactUserBooks userId={parseInt(userId)} limitPage={18} />
      </div>
    </div>
  );
} 