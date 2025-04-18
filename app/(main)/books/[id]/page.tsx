"use client";

import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { featuredBooks } from "@/lib/mock-data";
import Image from "next/image";
import { BookOpen, ChevronLeft, Star, Info, User, ExternalLink, BookmarkPlus, ShoppingCart, Eye, ShoppingBag, Bookmark, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { RelatedBooks } from "@/components/books/related-books";
import { BookComments } from "@/components/books/book-comments";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function BookPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  
  // Client-side state
  const [book, setBook] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Review state
  const [newReview, setNewReview] = useState("");
  const [rating, setRating] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Mock purchase state
  const [isPurchased, setIsPurchased] = useState(false);
  const [readProgress, setReadProgress] = useState(0.35); // Mock reading progress 35%
  const [isBookmarked, setIsBookmarked] = useState(false);
  
  // Mock stats
  const [readCount, setReadCount] = useState(8432);
  const [purchaseCount, setPurchaseCount] = useState(1254);
  
  // Mock reviews count
  const reviewsCount = 785;
  
  // Mock categories for the book
  const categories = ["Fiction", "Suspense", "Psychology"];
  
  // Add this inside the BookPage component near the top with the other state
  const [visibleChapters, setVisibleChapters] = useState(10);
  const [showAllChapters, setShowAllChapters] = useState(false);
  
  // Add this constant near the other constants at the top of the component
  const FREE_PREVIEW_CHAPTERS = 3;
  
  // Add this state for tab control
  const [activeTab, setActiveTab] = useState("reviews");
  
  // Function to determine if a chapter is free to preview
  const isChapterPreviewable = (chapterIndex: number) => {
    return chapterIndex < FREE_PREVIEW_CHAPTERS;
  };
  
  // Handle posting a review
  const handlePostReview = () => {
    if (!newReview.trim()) return;
    
    setIsSubmitting(true);
    
    // In a real app, this would be an API call
    setTimeout(() => {
      // For demo purposes, just clear the form
      setNewReview("");
      setIsSubmitting(false);
      // You would normally add the review to the reviews list here
    }, 500);
  };
  
  // Handle bookmark
  const handleBookmark = () => {
    // In a real app, this would be an API call to save the bookmark
    setIsBookmarked(!isBookmarked);
  };
  
  // Move data fetching to client-side
  useEffect(() => {
    // Find the book with the matching ID
    const foundBook = featuredBooks.find(book => book.id === id);
    setBook(foundBook);
    setIsLoading(false);
  }, [id]);
  
  // Add this inside the BookPage component near the top with the other state
  const handleViewMoreChapters = () => {
    if (showAllChapters) {
      setVisibleChapters(10);
      setShowAllChapters(false);
    } else {
      setVisibleChapters(book.chapters);
      setShowAllChapters(true);
    }
  };
  
  // Add this function to calculate reading time (average 8 minutes per chapter)
  const calculateReadingTime = (chapterNumber: number) => {
    return Math.round(chapterNumber * 8);
  };
  
  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12 flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }
  
  // If book not found, show an error message
  if (!book) {
    return (
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold">Book not found</h1>
        <p className="mt-2">The book you are looking for does not exist.</p>
        <div className="mt-3">
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={() => router.back()}
          >
            <ChevronLeft size={16} />
            Back
          </Button>
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
                  src={book.coverImage}
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
                  <span className="text-sm text-gray-700">{book.chapters} Chapters</span>
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
                    <span className="text-xs text-gray-600">~{calculateReadingTime(book.chapters)} min</span>
                  </div>
                )}
              </div>
              
              {/* CTA Buttons */}
              <div className="mt-3 flex items-center gap-2">
                <Link href={isPurchased ? `/read/${book.id}${readProgress > 0 ? `?chapter=${Math.ceil(readProgress * book.chapters)}` : ''}` : '#'} className="flex-1">
                  <Button 
                    className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white"
                    disabled={!isPurchased}
                    onClick={(e) => !isPurchased && e.preventDefault()}
                  >
                    <BookOpen size={18} />
                    {isPurchased ? (readProgress > 0 ? 'Continue' : 'Read') : 'Purchase to Read'}
                  </Button>
                </Link>
                
                <Button
                  variant="outline"
                  size="icon"
                  className={cn(
                    "h-10 w-10 rounded-lg border",
                    isBookmarked
                      ? "bg-red-50 border-red-200 text-red-600 hover:bg-red-100 hover:text-red-700"
                      : "bg-white border-gray-200 text-gray-700 hover:bg-gray-100"
                  )}
                  onClick={handleBookmark}
                >
                  <Bookmark
                    className={cn(
                      "h-5 w-5 transition-colors",
                      isBookmarked ? "text-red-500 fill-red-500" : "text-gray-500"
                    )}
                  />
                </Button>
              </div>
            </div>
            
            {/* Book meta info */}
            <div className="flex-1 md:pt-2">
              {/* Book title */}
              <h1 className="text-3xl md:text-4xl font-bold mb-4">{book.title}</h1>
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <p className="text-gray-600 text-lg">by <Link href={`/user/${encodeURIComponent(book.author.toLowerCase().replace(/\s+/g, '-'))}`} className="hover:text-blue-600 hover:underline transition-colors">{book.author}</Link></p>
              </div>
            
              {/* Categories */}
              <div className="flex flex-wrap gap-2 mb-4">
                {categories.map((category) => (
                  <span key={category} className="px-3 py-1 bg-gray-100 text-gray-800 text-sm rounded-full">
                    {category}
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
                  <span className="text-sm text-gray-700">{reviewsCount} reviews</span>
                </div>
                <div className="flex items-center">
                  <Eye className="h-4 w-4 text-gray-500 mr-1.5" />
                  <span className="text-sm text-gray-700">{readCount.toLocaleString()} reads</span>
                </div>
                <div className="flex items-center">
                  <ShoppingBag className="h-4 w-4 text-gray-500 mr-1.5" />
                  <span className="text-sm text-gray-700">{purchaseCount.toLocaleString()} purchases</span>
                </div>
              </div>
              
              {/* Price and purchase info */}
              <div className="mb-5 flex flex-wrap items-center gap-3">
                <div className="text-2xl font-bold">{(book.price || 9.99).toFixed(2)} Haru</div>
                
                {isPurchased ? (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 px-3 py-1">
                    Purchased
                  </Badge>
                ) : (
                  <div className="flex flex-col">
                    <div className="flex gap-2">
                      <Button variant="default" className="flex items-center gap-2" onClick={() => setIsPurchased(true)}>
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
                  </div>
                )}
              </div>
              
              {/* Summary */}
              <div>
                <h2 className="text-xl font-bold mb-2">Summary</h2>
                <p className="text-gray-700 line-clamp-4 mb-2">{book.description}</p>
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
              {/* Post a review section */}
              <div className="mb-8 border rounded-md p-4">
                <h3 className="font-medium mb-3">Write a Review</h3>
                <div className="space-y-4">
                  <Textarea
                    placeholder="Share your thoughts about this book..."
                    value={newReview}
                    onChange={(e) => setNewReview(e.target.value)}
                    className="min-h-[100px]"
                  />
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Rating:</span>
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            className="focus:outline-none"
                          >
                            <Star
                              size={20}
                              className={`${
                                star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <Button 
                      onClick={handlePostReview} 
                      disabled={!newReview.trim() || isSubmitting}
                    >
                      {isSubmitting ? "Posting..." : "Post Review"}
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* User reviews section */}
              <div>
                <h3 className="text-lg font-medium mb-4">Community Reviews</h3>
                <BookComments bookId={id} hidePostForm={true} />
              </div>
            </TabsContent>
            
            <TabsContent value="chapters">
              <div className="space-y-3">
                {Array.from({ length: Math.min(visibleChapters, book.chapters) }, (_, index) => (
                  <div 
                    key={index}
                    className="p-4 border rounded-lg flex justify-between items-center hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Chapter {index + 1}</span>
                      </div>
                      <p className="text-sm text-gray-500">
                        {index === 0 ? "The Beginning" : `Chapter ${index + 1}`}
                      </p>
                    </div>
                    <Link href={isPurchased || isChapterPreviewable(index) ? `/read/${book.id}?chapter=${index + 1}` : '#'}>
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
                ))}
                
                {/* View more button */}
                {book.chapters > 10 && (
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
                      Purchase this book to unlock all {book.chapters} chapters.
                    </p>
                    <Button 
                      variant="default" 
                      className="w-full flex items-center justify-center gap-2"
                      onClick={() => setIsPurchased(true)}
                    >
                      <ShoppingCart size={16} />
                      Purchase for {(book.price || 9.99).toFixed(2)} Haru
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