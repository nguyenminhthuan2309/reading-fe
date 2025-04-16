"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { featuredBooks } from "@/lib/mock-data";
import { currentUser } from "@/lib/mock-user";
import { BookCard } from "@/components/books/book-card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Book, 
  BookOpen, 
  Clock, 
  Heart, 
  LayoutGrid, 
  PlusCircle,
  Settings, 
  Star, 
  User as UserIcon,
  ChevronLeft
} from "lucide-react";
import { useParams } from "next/navigation";
import { EditProfileDialog } from "@/components/user/edit-profile-dialog";

export default function UserProfilePage() {
  const params = useParams();
  const userId = params.id as string;
  
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [bookmarkedBooks, setBookmarkedBooks] = useState<any[]>([]);
  const [currentlyReadingBooks, setCurrentlyReadingBooks] = useState<any[]>([]);
  const [recentlyReadBooks, setRecentlyReadBooks] = useState<any[]>([]);
  
  useEffect(() => {
    // In a real app, we would fetch user data based on userId
    // For now, we'll use the mock data regardless of ID
    const loadUserData = async () => {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Check if user exists (currently only ID "1" will work)
      if (userId === "1" || userId === currentUser.id) {
        setUserData(currentUser);
        
        // Find books based on user data
        const bookmarks = featuredBooks.filter(book => 
          currentUser.bookmarks.includes(book.id)
        );
        
        const current = currentUser.currentlyReading.map(item => {
          const book = featuredBooks.find(book => book.id === item.bookId);
          return book ? { ...book, progress: item.progress, lastReadChapter: item.lastReadChapter } : null;
        }).filter(Boolean);
        
        const recent = featuredBooks.filter(book => 
          currentUser.recentlyRead.includes(book.id)
        );
        
        setBookmarkedBooks(bookmarks);
        setCurrentlyReadingBooks(current as any[]);
        setRecentlyReadBooks(recent);
      }
      
      setIsLoading(false);
    };
    
    loadUserData();
  }, [userId]);
  
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12 flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }
  
  // Handle user not found
  if (!userData) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
          <UserIcon className="w-12 h-12 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-bold mb-2">User Not Found</h1>
        <p className="text-muted-foreground mb-6">The user you're looking for does not exist.</p>
        <Link href="/">
          <Button variant="link" className="flex items-center gap-2 py-1">
            <ChevronLeft size={16} />
            Back to Home
          </Button>
        </Link>
      </div>
    );
  }
  
  // Handle profile update
  const handleProfileUpdate = (updatedData: any) => {
    setUserData(updatedData);
    
    // In a real app, this would make an API call to update the user data
    console.log("Profile updated:", updatedData);
    
    // Show success notification or message
    alert("Profile updated successfully!");
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      {/* User header section */}
      <div className="flex flex-col md:flex-row gap-8 items-center md:items-start mb-10">
        <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-primary/20">
          {/* Fallback avatar if no image exists */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
            <UserIcon className="w-16 h-16 text-primary/50" />
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
        </div>
        
        <div className="text-center md:text-left">
          <h1 className="text-3xl font-bold">{userData.name}</h1>
          <p className="text-muted-foreground mb-2">@{userData.username}</p>
          
          {userData.bio && (
            <p className="my-3 text-sm text-muted-foreground max-w-md">
              {userData.bio}
            </p>
          )}
          
          <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-4">
            <div className="flex items-center gap-1.5">
              <BookOpen size={18} className="text-primary" />
              <span className="text-sm font-medium">{userData.readingStats.booksRead} Books</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Book size={18} className="text-primary" />
              <span className="text-sm font-medium">{userData.readingStats.chaptersRead} Chapters</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock size={18} className="text-primary" />
              <span className="text-sm font-medium">{userData.readingStats.hoursRead} Hours</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Star size={18} className="text-primary" />
              <span className="text-sm font-medium">{userData.readingStats.avgRating} Avg Rating</span>
            </div>
          </div>
          
          <div className="mt-6">
            <p className="text-sm text-muted-foreground">
              Member since {new Date(userData.joinedDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
        </div>
        
        <div className="md:ml-auto mt-4 md:mt-0">
          {/* Only show edit button if viewing your own profile */}
          {userId === "1" && (
            <div className="flex flex-col sm:flex-row gap-2">
              <EditProfileDialog 
                userData={userData}
                onSave={handleProfileUpdate}
              />
              
              <Link href="/books/create">
                <Button variant="outline" className="flex items-center gap-2 w-full">
                  <PlusCircle size={16} />
                  Create New Book
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
      
      {/* User favorites/genres */}
      <div className="mb-8">
        <h2 className="text-lg font-medium mb-3">Favorite Genres</h2>
        <div className="flex flex-wrap gap-2">
          {userData.preferences.favorites.map((genre: string, index: number) => (
            <Link href={`/books?filter=${genre}`} key={index}>
              <div className="bg-secondary hover:bg-secondary/80 rounded-full px-4 py-1.5 text-sm flex items-center gap-1.5">
                <Heart size={14} className="text-red-500" />
                {genre}
              </div>
            </Link>
          ))}
        </div>
      </div>
      
      {/* User reading content */}
      <Tabs defaultValue="reading" className="mt-10">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="reading" className="flex items-center gap-2">
            <BookOpen size={16} />
            <span className="hidden sm:inline">Currently Reading</span>
            <span className="sm:hidden">Reading</span>
          </TabsTrigger>
          <TabsTrigger value="bookmarks" className="flex items-center gap-2">
            <Heart size={16} />
            <span className="hidden sm:inline">Bookmarked</span>
            <span className="sm:hidden">Saved</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <Clock size={16} />
            <span className="hidden sm:inline">Recently Read</span>
            <span className="sm:hidden">Recent</span>
          </TabsTrigger>
          <TabsTrigger value="shelf" className="flex items-center gap-2">
            <LayoutGrid size={16} />
            <span className="hidden sm:inline">Bookshelf</span>
            <span className="sm:hidden">Shelf</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="reading" className="mt-6">
          <h3 className="text-xl font-bold mb-4">Continue Reading</h3>
          {currentlyReadingBooks.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {currentlyReadingBooks.map(book => (
                <div key={book.id}>
                  <BookCard
                    id={book.id}
                    title={book.title}
                    author={book.author}
                    description={book.description}
                    chapters={book.chapters}
                    rating={book.rating}
                    genre={book.genre}
                    progress={book.progress}
                    className="h-[360px] border-0 shadow-lg"
                    showPreview={false}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-muted-foreground">No books currently being read.</p>
              <Link href="/books">
                <Button className="mt-4">Browse Books</Button>
              </Link>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="bookmarks" className="mt-6">
          <h3 className="text-xl font-bold mb-4">Bookmarked Books</h3>
          {bookmarkedBooks.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {bookmarkedBooks.map(book => (
                <div key={book.id}>
                  <BookCard
                    id={book.id}
                    title={book.title}
                    author={book.author}
                    description={book.description}
                    chapters={book.chapters}
                    rating={book.rating}
                    genre={book.genre}
                    className="h-[360px] border-0 shadow-lg"
                    showPreview={false}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-muted-foreground">No bookmarked books yet.</p>
              <Link href="/books">
                <Button className="mt-4">Browse Books</Button>
              </Link>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="history" className="mt-6">
          <h3 className="text-xl font-bold mb-4">Recently Read</h3>
          {recentlyReadBooks.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {recentlyReadBooks.map(book => (
                <div key={book.id}>
                  <BookCard
                    id={book.id}
                    title={book.title}
                    author={book.author}
                    description={book.description}
                    chapters={book.chapters}
                    rating={book.rating}
                    genre={book.genre}
                    className="h-[360px] border-0 shadow-lg"
                    showPreview={false}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-muted-foreground">No recently read books.</p>
              <Link href="/books">
                <Button className="mt-4">Browse Books</Button>
              </Link>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="shelf" className="mt-6">
          <h3 className="text-xl font-bold mb-4">Bookshelf</h3>
          <div className="text-center py-10">
            <p className="text-muted-foreground">Organize books by creating custom shelves.</p>
            <Button className="mt-4">Create a Shelf</Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 