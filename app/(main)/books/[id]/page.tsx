"use client";

import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { BookOpen, ChevronLeft, Star, ShoppingCart, Eye, ShoppingBag, ChevronDown, ChevronUp, PencilLine } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { RelatedBooks } from "@/components/books/related-books";
import { BookReview } from "@/components/books/book-review";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { getBookById, getChaptersByBookId } from "@/lib/api/books";
import { Skeleton } from "@/components/ui/skeleton";
import { BOOK_KEYS, CHAPTER_KEYS } from "@/lib/constants/query-keys";
import { useUserStore } from "@/lib/store";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { FollowButton } from "@/components/books/follow-button";
import { ChapterAccessStatus } from "@/models/book";
export default function BookPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { user } = useUserStore();
  
  // Fetch book data with React Query directly in the component
  const { 
    data: book, 
    isLoading: isLoadingBook, 
    error: bookError
  } = useQuery({
    queryKey: BOOK_KEYS.DETAIL(id),
    queryFn: async () => {
      const response = await getBookById(Number(id));
      if (response.status !== 200) {
        if (response.status === 404) {
          throw new Error('Book not found');
        }

        throw new Error(response.msg || 'Failed to fetch book details');
      }

      return response.data.data[0];
    },
    enabled: !!id,
  });

  // Fetch chapters data with React Query
  const {
    data: chaptersData,
    isLoading: isLoadingChapters,
    error: chaptersError
  } = useQuery({
    queryKey: CHAPTER_KEYS.BOOK_CHAPTERS(id),
    queryFn: async () => {
      const response = await getChaptersByBookId(Number(id), ChapterAccessStatus.PUBLISHED);
      if (response.status !== 200) {
        throw new Error(response.msg || 'Failed to fetch chapters');
      }
      return response.data;
    },
    enabled: !!id && !!book,
  });
  
  // Mock purchase state
  const [isPurchased, setIsPurchased] = useState(false);
  const [readProgress, setReadProgress] = useState(0.35); // Mock reading progress 35%
  
  // Chapter visibility state
  const [visibleChapters, setVisibleChapters] = useState(10);
  const [showAllChapters, setShowAllChapters] = useState(false);
  
  // Constants
  const FREE_PREVIEW_CHAPTERS = 3;
  
  // Tab control
  const [activeTab, setActiveTab] = useState("reviews");
  
  // Function to determine if a chapter is free to preview
  const isChapterPreviewable = (chapterIndex: number) => {
    return chapterIndex < FREE_PREVIEW_CHAPTERS;
  };
  
  // Check if current user is the book owner
  const isOwner = user && book?.author?.id === user.id;
  
  // Handle viewing more chapters
  const handleViewMoreChapters = () => {
    if (showAllChapters) {
      setVisibleChapters(10);
      setShowAllChapters(false);
    } else {
      setVisibleChapters(book?.totalChapters || 0);
      setShowAllChapters(true);
    }
  };
  
  // Calculate reading time (average 8 minutes per chapter)
  const calculateReadingTime = (chapterNumber: number) => {
    return Math.round(chapterNumber * 8);
  };
  
  // Loading state
  if (isLoadingBook) {
    return (
      <div className="container mx-auto px-4 py-8 pt-4">
        {/* Back button skeleton */}
        <div className="mb-6">
          <Skeleton className="h-10 w-20" />
        </div>
        
        <div className="flex flex-col lg:flex-row lg:items-start gap-8">
          {/* Left side: Book details skeleton */}
          <div className="flex-1">
            <div className="flex flex-col md:flex-row gap-8 mb-8">
              {/* Book cover skeleton */}
              <div className="w-full md:w-1/3 lg:w-1/4">
                <Skeleton className="aspect-[3/4] w-full rounded-lg" />
                <div className="mt-3 flex items-center justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-12" />
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <Skeleton className="h-10 flex-1" />
                  <Skeleton className="h-10 w-10 rounded-lg" />
                </div>
              </div>
              
              {/* Book meta info skeleton */}
              <div className="flex-1 md:pt-2">
                <Skeleton className="h-10 w-3/4 mb-4" />
                <Skeleton className="h-5 w-1/2 mb-4" />
                
                <div className="flex flex-wrap gap-2 mb-4">
                  <Skeleton className="h-6 w-16 rounded-full" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-6 w-14 rounded-full" />
                </div>
                
                <div className="flex flex-wrap gap-4 mb-5">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-24" />
                </div>
                
                <Skeleton className="h-24 w-full mb-5 rounded-lg" />
                
                <Skeleton className="h-6 w-40 mb-2" />
                <Skeleton className="h-20 w-full" />
              </div>
            </div>
            
            {/* Tabs skeleton */}
            <div className="mt-8">
              <div className="flex gap-2 mb-8">
                <Skeleton className="h-10 w-20" />
                <Skeleton className="h-10 w-20" />
              </div>
              
              <div>
                <Skeleton className="h-8 w-40 mb-4" />
                <div className="space-y-4">
                  <Skeleton className="h-32 w-full rounded-md" />
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-16" />
                      <div className="flex gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Skeleton key={i} className="h-5 w-5 rounded-full" />
                        ))}
                      </div>
                    </div>
                    <Skeleton className="h-9 w-24" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right side: Related Books skeleton */}
          <div className="lg:w-1/4 lg:top-4">
            <div className="rounded-sm p-4 shadow-sm bg-white/10">
              <Skeleton className="h-8 w-40 mb-4" />
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex gap-3">
                    <Skeleton className="h-16 w-12 rounded-md" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <Skeleton className="h-9 w-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Error state
  if (bookError) {
    // Check if it's a 404 error
    const is404 = bookError instanceof Error && 
      bookError.message.includes('Book not found')
    
    // If it's a 404 error, show the "Book not found" message
    if (is404) {
      return (
        <div className="container mx-auto px-4 py-4">
          {/* Back button at top left */}
          <div className="mb-8">
            <Button 
              variant="link" 
              className="flex items-center gap-2 pl-0 text-gray-600 hover:text-gray-900"
              onClick={() => router.back()}
            >
              <ChevronLeft size={20} />
              <span>Back</span>
            </Button>
          </div>
          
          <div className="flex flex-col items-center justify-center text-center">
            <div className="max-w-md">
              <h1 className="text-9xl font-bold text-red-500 mb-2">404</h1>
              <h2 className="text-3xl font-bold mb-4">Book not found</h2>
              <p className="text-gray-600 mb-8">The book you are looking for does not exist or may have been removed.</p>
            </div>
          </div>
        </div>
      );
    }
    
    // For other types of errors, show the general error message
    return (
      <div className="container mx-auto px-4 py-12 pt-4">
        {/* Back button at top left */}
        <div className="mb-8">
          <Button 
            variant="link" 
            className="flex items-center gap-2 pl-0 text-gray-600 hover:text-gray-900"
            onClick={() => router.back()}
          >
            <ChevronLeft size={20} />
            <span>Back</span>
          </Button>
        </div>
        
        <div className="flex flex-col items-center justify-center text-center">
          <div className="max-w-md">
            <h1 className="text-9xl font-bold text-red-500 mb-2">ERROR</h1>
            <h2 className="text-3xl font-bold mb-4">Error loading book</h2>
            <p className="text-gray-600 mb-8">An error occurred while fetching the book details. Please try again later.</p>
          </div>
        </div>
      </div>
    );
  }
  
  // If book not found, show an error message
  if (!book) {
    return (
      <div className="container mx-auto px-4 py-12 flex flex-col items-center justify-center text-center pt-4">
        <div className="max-w-md">
          <h1 className="text-3xl font-bold mb-4">Book not found</h1>
          <p className="text-gray-600 mb-8">The book you are looking for does not exist or may have been removed.</p>
          <div className="mt-6">
            <Button 
              variant="ghost" 
              className="flex items-center gap-2 pl-0 hover:bg-transparent"
              onClick={() => router.back()}
            >
              <ChevronLeft size={20} />
              <span>Back</span>
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8 pt-4">
      {/* Back button */}
      <div className="mb-6">
        <Button 
          variant="ghost" 
          className="flex items-center gap-2 pl-0 hover:bg-transparent"
          onClick={() => router.back()}
        >
          <ChevronLeft size={20} />
          <span>Back</span>
        </Button>
      </div>
      
      <div className="flex flex-col lg:flex-row lg:items-start gap-8">
        {/* Left side: Book details */}
        <div className="flex-1">
          <div className="flex flex-col md:flex-row gap-8 mb-8">
            {/* Book cover */}
            <div className="w-full md:w-1/3 lg:w-1/4">
              <div className="relative aspect-[3/4] w-full rounded-lg overflow-hidden shadow-lg mx-auto flex items-center justify-center">
                <Image
                  src={book.cover}
                  alt={book.title}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
              
              {/* Chapter info and reading progress */}
              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center">
                  <BookOpen className="h-4 w-4 text-gray-500 mr-1.5" />
                  <span className="text-sm text-gray-700">{book.totalChapters} Chapters</span>
                </div>
                
                {readProgress > 0 && isPurchased ? (
                  <div className="flex items-center">
                    <span className="text-xs text-gray-600 mr-2">{Math.round(readProgress * 100)}%</span>
                    <div className="relative h-1.5 w-12 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="absolute top-0 left-0 h-full bg-red-600 rounded-full" 
                        style={{ width: `${readProgress * 100}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center">
                    <span className="text-xs text-gray-600">~{calculateReadingTime(book.totalChapters)} min</span>
                  </div>
                )}
              </div>
              
              {/* CTA Buttons */}
              <div className="mt-3 flex items-center gap-2">

                {/* TODO: Add chapter id */}
                <Link href={isPurchased ? `/books/${book.id}/read${readProgress > 0 ? `?chapter=${Math.ceil(readProgress * book.totalChapters)}&id=${1}` : ''}` : '#'} className="flex-1">
                  <Button 
                    className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white"
                    disabled={!isPurchased}
                    onClick={(e) => !isPurchased && e.preventDefault()}
                  >
                    <BookOpen size={18} />
                    {isPurchased ? (readProgress > 0 ? 'Continue' : 'Read') : 'Purchase to Read'}
                  </Button>
                </Link>
                
                {/* Follow Button */}
                <FollowButton 
                  bookId={Number(id)} 
                  size="default"
                  isFollowed={book.isFollowed} 
                />
                
                {/* Edit Button (only shown if user is the author) */}
                {isOwner && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Link href={`/books/${book.id}/edit`}>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-10 w-10 rounded-lg border bg-white border-gray-200 text-gray-700 hover:bg-gray-100"
                          >
                            <PencilLine className="h-5 w-5" />
                          </Button>
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent>
                        Edit this book
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            </div>
            
            {/* Book meta info */}
            <div className="flex-1 md:pt-2">
              {/* Book title */}
              <h1 className="text-3xl md:text-4xl font-bold mb-4">{book.title}</h1>
              <div className="flex items-center gap-2 mb-4">
                <p className="text-gray-600 text-lg">
                  by <Link href={`/user/${book.author?.id}`} className="hover:text-blue-600 hover:underline transition-colors inline-flex items-center gap-1">
                    {book.author?.name}
                    {isOwner && <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200 px-2 py-0.5 text-xs ml-1">You</Badge>}
                  </Link>
                </p>
              </div>
            
              {/* Categories */}
              <div className="flex flex-wrap gap-2 mb-4">
                {book.categories?.map((category) => (
                  <span key={category.id} className="px-3 py-1 bg-gray-100 text-gray-800 text-sm rounded-full">
                    {category.name}
                  </span>
                ))}
              </div>
              
              {/* Book stats */}
              <div className="flex flex-wrap gap-4 mb-5">
                <div className="flex items-center">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={14}
                        className={`${
                          i < Math.floor(book.rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs ml-1 text-gray-700">{book.rating.toFixed(1)}</span>
                </div>
                <div className="flex items-center">
                  <Star className="h-4 w-4 text-gray-500 mr-1.5" />
                  <span className="text-sm text-gray-700">Reviews</span>
                </div>
                <div className="flex items-center">
                  <Eye className="h-4 w-4 text-gray-500 mr-1.5" />
                  <span className="text-sm text-gray-700">{book.views} reads</span>
                </div>
                <div className="flex items-center">
                  <ShoppingBag className="h-4 w-4 text-gray-500 mr-1.5" />
                  <span className="text-sm text-gray-700">{book.totalPurchases} purchases</span>
                </div>
              </div>
              
              {/* Summary */}
              <div className="mb-5">
                <h2 className="text-xl font-bold mb-2">Summary</h2>
                <p className="text-gray-700 line-clamp-4 mb-2">{book.description}</p>
              </div>
              
              {/* Price and purchase info */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-lg">
                      {book.totalPrice.toFixed(2)} HARU
                    </h3>
                    <p className="text-xs text-gray-500">One-time purchase - get full content and future chapters</p>
                  </div>
                  
                  {isPurchased ? (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 px-3 py-1">
                      Purchased
                    </Badge>
                  ) : (
                    <div className="flex gap-2">
                      <Button 
                        variant="default" 
                        className="bg-black hover:bg-gray-800 flex items-center gap-2 opacity-70 cursor-not-allowed" 
                        onClick={() => setIsPurchased(true)}
                        disabled={true}
                      >
                        <ShoppingCart size={16} />
                        Purchase
                      </Button>
                      <Button 
                        variant="outline" 
                        className="flex items-center gap-2"
                        onClick={() => setActiveTab("chapters")}
                      >
                        <BookOpen size={16} />
                        Preview
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Tabs for reviews and chapters */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-8">
            <TabsList className="mb-8">
              <TabsTrigger value="reviews" className="text-base">
                Reviews
              </TabsTrigger>
              <TabsTrigger value="chapters" className="text-base">
                Chapters
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="reviews">
              <BookReview bookId={id} />
            </TabsContent>
            
            <TabsContent value="chapters">
              <div className="space-y-3">
                {isLoadingChapters ? (
                  // Skeleton loading state for chapters
                  Array.from({ length: 5 }, (_, index) => (
                    <div key={index} className="p-4 border rounded-lg flex justify-between items-center">
                      <div className="flex-1">
                        <Skeleton className="h-5 w-24 mb-2" />
                        <Skeleton className="h-4 w-40" />
                      </div>
                      <Skeleton className="h-9 w-20" />
                    </div>
                  ))
                ) : chaptersError ? (
                  // Error state
                  <div className="p-4 border border-red-200 bg-red-50 rounded-lg text-red-700">
                    <p>Failed to load chapters. Please try again later.</p>
                  </div>
                ) : chaptersData && chaptersData.length > 0 ? (
                  // Display actual chapters data
                  chaptersData.slice(0, showAllChapters ? undefined : visibleChapters).map((chapter, index) => (
                    <div 
                      key={chapter.id}
                      className="p-4 border rounded-lg flex justify-between items-center hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{chapter.title || `Chapter ${index + 1}`}</span>
                        </div>
                        <p className="text-sm text-gray-500">
                          {index === 0 ? "The Beginning" : (chapter.chapter ? `Chapter ${chapter.chapter}` : `Chapter ${index + 1}`)}
                        </p>
                      </div>
                      <Link href={isPurchased || isChapterPreviewable(index) ? `/books/${book.id}/read?chapter=${chapter.chapter}&id=${chapter.id}` : '#'}>
                        <Button 
                          variant={isPurchased ? "outline" : isChapterPreviewable(index) ? "outline" : "ghost"} 
                          size="sm"
                          disabled={!isPurchased && !isChapterPreviewable(index)}
                          className={!isPurchased && !isChapterPreviewable(index) ? "text-gray-400 border-gray-200" : ""}
                        >
                          {isPurchased ? "Read" : isChapterPreviewable(index) ? "Preview" : "Locked"}
                        </Button>
                      </Link>
                    </div>
                  ))
                ) : (
                  // No chapters found
                  <div className="p-4 border rounded-lg text-center text-gray-500">
                    <p>No chapters available for this book yet.</p>
                  </div>
                )}
                
                {/* View more button - only show if we have more than 10 chapters */}
                {chaptersData && chaptersData.length > 10 && (
                  <div className="flex justify-center mt-6">
                    <Button
                      variant="link"
                      size="sm"
                      onClick={handleViewMoreChapters}
                      className="flex items-center gap-1.5 text-black font-medium hover:text-gray-700"
                    >
                      {showAllChapters ? (
                        <>Show less <ChevronUp size={16} /></>
                      ) : (
                        <>View more <ChevronDown size={16} /></>
                      )}
                    </Button>
                  </div>
                )}
                
                {!isPurchased && (
                  <div className="mt-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <p className="text-center mb-3 text-gray-700">
                      Purchase this book to unlock all {book.totalChapters} chapters.
                    </p>
                    <Button 
                      variant="default" 
                      onClick={() => {
                        setIsPurchased(true);
                        setActiveTab("chapters");
                      }}
                      className="w-full mb-2 opacity-70 cursor-not-allowed bg-black hover:bg-gray-800"
                      disabled={true}
                    >
                      <ShoppingCart size={16} />
                      Purchase for {book.totalPrice.toFixed(2)} HARU
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Right side: Related Books */}
        <div className="lg:w-1/4 lg:top-4">
          <div className="rounded-sm p-4 shadow-sm bg-white/10">
            <h2 className="text-xl font-bold mb-4">Related Books</h2>
            <RelatedBooks bookId={id} compactView={true} />
            <div className="mt-4 text-center">
              <Link href={`/books?related=${id}`}>
                <Button variant="outline" size="sm" className="w-full text-black border-gray-300 hover:bg-gray-100 hover:text-gray-900">
                  View More Related Books
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 