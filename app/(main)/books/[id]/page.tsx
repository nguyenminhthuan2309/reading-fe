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
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getBookById, getChaptersByBookId } from "@/lib/api/books";
import { Skeleton } from "@/components/ui/skeleton";
import { BOOK_KEYS, CHAPTER_KEYS } from "@/lib/constants/query-keys";
import { useUserStore } from "@/lib/store";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { FollowButton } from "@/components/books/follow-button";
import { ChapterAccessStatus, Chapter, AgeRatingEnum, AGE_RATINGS, ProgressStatusEnum, PROGRESS_STATUSES, AccessStatusEnum } from "@/models/book";
import { PurchaseChapterDialog } from "@/components/books/purchase-chapter-dialog";

// A component to display the age rating badge
const AgeRatingBadge = ({ ageRatingId }: { ageRatingId: number }) => {
  // Default to "Everyone" if rating not found
  const rating = AGE_RATINGS.find(r => r.id === ageRatingId) || AGE_RATINGS[0];
  
  // Determine styling based on rating
  let bgClass = 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-700/50';
  
  switch (ageRatingId) {
    case AgeRatingEnum.ADULT: // 18+
      bgClass = 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-700/50';
      break;
    case AgeRatingEnum.MATURE: // 16+
      bgClass = 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 border-orange-200 dark:border-orange-700/50';
      break;
    case AgeRatingEnum.TEEN: // 13+
      bgClass = 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-700/50';
      break;
    case AgeRatingEnum.EVERYONE: // All ages
    default:
      bgClass = 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-700/50';
      break;
  }
  
  return (
    <div className={`px-3 py-1 rounded-full text-sm font-medium border ${bgClass}`}>
      {rating.name}
    </div>
  );
};

// A component to display the progress status badge
const ProgressStatusBadge = ({ progressStatusId }: { progressStatusId: number }) => {
  // Default to "Ongoing" if status not found
  const status = PROGRESS_STATUSES.find(s => s.id === progressStatusId) || PROGRESS_STATUSES[0];
  
  // Determine styling based on progress status
  let bgClass = 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700/50';
  
  switch (progressStatusId) {
    case ProgressStatusEnum.ONGOING:
      bgClass = 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700/50';
      break;
    case ProgressStatusEnum.COMPLETED:
      bgClass = 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700/50';
      break;
    case ProgressStatusEnum.DROPPED:
      bgClass = 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700/30 dark:text-gray-300 dark:border-gray-600/50';
      break;
    default:
      bgClass = 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700/50';
      break;
  }
  
  return (
    <div className={`px-3 py-1 rounded-full text-sm font-medium border ${bgClass}`}>
      {status.name}
    </div>
  );
};

export default function BookPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { user } = useUserStore();
  const queryClient = useQueryClient();

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


  // Tab control
  const [activeTab, setActiveTab] = useState("reviews");


  // Check if current user is the book owner
  const isOwner = user && book?.author?.id === user.id;

  // Check is admin or moderator
  const isAdminOrModerator = user && (user.role.id === 1 || user.role.id === 2);

  // Check if book is pending and no published chapters
  const isPendingBook = !isOwner && !isAdminOrModerator && book?.accessStatus?.id === AccessStatusEnum.PENDING && chaptersData?.filter(chapter => chapter.chapterAccessStatus === ChapterAccessStatus.PUBLISHED).length === 0;

  // Check if book is draft
  const isDraftBook = !isOwner && book?.accessStatus?.id === AccessStatusEnum.PRIVATE;

  // Check if book is blocked
  const isBlockedBook = !isOwner && book?.accessStatus?.id === AccessStatusEnum.BLOCKED;

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

  // Add state variables at the appropriate place in the component
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);

  // Loading state
  if (isLoadingBook) {
    return (
      <div className="container mx-auto px-4 py-8 pt-4 dark:bg-gray-900 min-h-screen">
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
  if (bookError || isPendingBook || isDraftBook || isBlockedBook) {
    // Check if it's a 404 error
    const is404 = bookError instanceof Error &&
      bookError.message.includes('Book not found')

    // If it's a 404 error, show the "Book not found" message
    if (is404 || isPendingBook || isDraftBook || isBlockedBook) {
      return (
        <div className="container mx-auto px-4 py-4 dark:bg-gray-900 min-h-screen">
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
      <div className="container mx-auto px-4 py-12 pt-4 dark:bg-gray-900 min-h-screen">
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
      <div className="container mx-auto px-4 py-12 flex flex-col items-center justify-center text-center pt-4 dark:bg-gray-900 min-h-screen">
        <div className="max-w-md">
          <h1 className="text-3xl font-bold mb-4">Book not found</h1>
          <p className="text-gray-600 mb-8">The book you are looking for does not exist or may have been removed.</p>
          <div className="mt-6">
            <Button
              variant="ghost"
              className="flex items-center gap-2 pl-0 hover:bg-transparent dark:text-white"
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
    <div className="container mx-auto px-4 py-8 pt-4 md:pt-6 dark:bg-gray-900 min-h-screen">
      {/* Back button */}
      <div className="mb-6">
        <Button
          variant="ghost"
          className="flex items-center gap-2 pl-0 hover:bg-transparent dark:text-white"
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
                  <BookOpen className="h-4 w-4 text-gray-500 dark:text-gray-400 mr-1.5" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{book.totalChapters} Chapters</span>
                </div>

                {readProgress > 0 && isPurchased ? (
                  <div className="flex items-center">
                    <span className="text-xs text-gray-600 dark:text-gray-400 mr-2">{Math.round(readProgress * 100)}%</span>
                    <div className="relative h-1.5 w-12 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="absolute top-0 left-0 h-full bg-red-600 rounded-full"
                        style={{ width: `${readProgress * 100}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center">
                    <span className="text-xs text-gray-600 dark:text-gray-400">~{calculateReadingTime(book.totalChapters)} min</span>
                  </div>
                )}
              </div>

              {/* CTA Buttons */}
              <div className="mt-3 flex items-center gap-2">

                {/* Show purchase/read button only if not the author */}
                {!isOwner && (
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
                )}

                {/* Show follow button only if not the author */}
                {!isOwner && (
                  <FollowButton
                    bookId={Number(id)}
                    size="default"
                    isFollowed={book.isFollowed}
                  />
                )}

                {/* Edit Button (only shown if user is the author) */}
                {isOwner && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Link href={`/books/${book.id}/edit`} className="flex-1">
                          <Button
                            variant="outline"
                            className="h-10 w-full flex items-center justify-center gap-2 rounded-lg border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            <PencilLine className="h-5 w-5" />
                            Edit Book
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
              <h1 className="text-3xl md:text-4xl font-bold mb-4 dark:text-white">{book.title}</h1>
              <div className="flex items-center gap-2 mb-4">
                <p className="text-gray-600 dark:text-gray-300 text-lg">
                  by <Link href={`/user/${book.author?.id}`} className="hover:text-blue-600 dark:hover:text-blue-400 hover:underline transition-colors inline-flex items-center gap-1">
                    {book.author?.name}
                    {isOwner && <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 border-blue-200 dark:border-blue-700/50 px-2 py-0.5 text-xs ml-1">You</Badge>}
                  </Link>
                </p>
              </div>

              {/* Categories */}
              <div className="flex flex-wrap gap-2 mb-4">
                {book.categories?.map((category) => (
                  <span key={category.id} className="px-3 py-1 bg-gray-100 dark:bg-gray-700/50 text-gray-800 dark:text-gray-200 text-sm rounded-full">
                    {category.name}
                  </span>
                ))}
                
                {/* Age Rating Badge */}
                <AgeRatingBadge ageRatingId={book.ageRating || AgeRatingEnum.EVERYONE} />
                
                {/* Progress Status Badge */}
                <ProgressStatusBadge progressStatusId={book.progressStatus?.id || ProgressStatusEnum.ONGOING} />
              </div>

              {/* Book stats */}
              <div className="flex flex-wrap gap-4 mb-5">
                <div className="flex items-center">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={14}
                        className={`${i < Math.floor(book.rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300 dark:text-gray-600"
                          }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs ml-1 text-gray-700 dark:text-gray-300">{book.rating.toFixed(1)}</span>
                </div>
                <div className="flex items-center">
                  <Star className="h-4 w-4 text-gray-500 dark:text-gray-400 mr-1.5" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Reviews</span>
                </div>
                <div className="flex items-center">
                  <Eye className="h-4 w-4 text-gray-500 dark:text-gray-400 mr-1.5" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{book.views} reads</span>
                </div>
                <div className="flex items-center">
                  <ShoppingBag className="h-4 w-4 text-gray-500 dark:text-gray-400 mr-1.5" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{book.totalPurchases} purchases</span>
                </div>
              </div>

              {/* Summary */}
              <div className="mb-5">
                <h2 className="text-xl font-bold mb-2 dark:text-white">Summary</h2>
                <p className="text-gray-700 dark:text-gray-300 line-clamp-4 mb-2">{book.description}</p>
              </div>

              {/* Price and purchase info */}
              {!isOwner && (
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-lg dark:text-white">
                        {book.totalPrice.toFixed(2)} HARU
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">One-time purchase - get full content and future chapters</p>
                    </div>

                    {isPurchased ? (
                      <Badge variant="outline" className="bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700/50 px-3 py-1">
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
                          className="flex items-center gap-2 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                          onClick={() => setActiveTab("chapters")}
                        >
                          <BookOpen size={16} />
                          Preview
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Tabs for reviews and chapters */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6 md:mt-8">
            <TabsList className="mb-8 dark:bg-gray-800">
              <TabsTrigger value="reviews" className="text-base dark:text-gray-300 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white">
                Reviews
              </TabsTrigger>
              <TabsTrigger value="chapters" className="text-base dark:text-gray-300 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white">
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
                    <div key={index} className="p-4 border rounded-lg flex justify-between items-center dark:border-gray-700 dark:bg-gray-800/50">
                      <div className="flex-1">
                        <Skeleton className="h-5 w-24 mb-2" />
                        <Skeleton className="h-4 w-40" />
                      </div>
                      <Skeleton className="h-9 w-20" />
                    </div>
                  ))
                ) : chaptersError ? (
                  // Error state
                  <div className="p-4 border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-700 dark:text-red-400">
                    <p>Failed to load chapters. Please try again later.</p>
                  </div>
                ) : chaptersData && chaptersData.length > 0 ? (
                  // Display actual chapters data
                  chaptersData.slice(0, showAllChapters ? undefined : visibleChapters).map((chapter, index) => (
                    <div
                      key={chapter.id}
                      className="p-4 border rounded-lg flex justify-between items-center hover:bg-accent/50 dark:hover:bg-gray-800/50 transition-colors dark:border-gray-700 dark:bg-gray-800/30"
                    >
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <span className="font-medium dark:text-white">{chapter.title || `Chapter ${index + 1}`}</span>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {index === 0 ? "The Beginning" : (chapter.chapter ? `Chapter ${chapter.chapter}` : `Chapter ${index + 1}`)}
                        </p>
                      </div>
                      {isPurchased || !chapter.isLocked ? (
                        <Link href={`/books/${book.id}/read?chapter=${chapter.chapter}&id=${chapter.id}`}>
                          <Button
                            size="sm"
                            variant="destructive"
                          >
                            Read
                          </Button>
                        </Link>
                      ) : (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setSelectedChapter(chapter);
                            setPurchaseDialogOpen(true);
                          }}
                        >
                          Unlock
                        </Button>
                      )}
                    </div>
                  ))
                ) : (
                  // No chapters found
                  <div className="p-4 border rounded-lg text-center text-gray-500 dark:text-gray-400 dark:border-gray-700 dark:bg-gray-800/30">
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
                      className="flex items-center gap-1.5 text-black dark:text-gray-300 font-medium hover:text-gray-700 dark:hover:text-gray-100"
                    >
                      {showAllChapters ? (
                        <>Show less <ChevronUp size={16} /></>
                      ) : (
                        <>View more <ChevronDown size={16} /></>
                      )}
                    </Button>
                  </div>
                )}

                {!isPurchased && !isOwner && (
                  <div className="mt-6 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <p className="text-center mb-3 text-gray-700 dark:text-gray-300">
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
        <div className="lg:w-1/4 lg:top-4 mt-8 lg:mt-0">
          <div className="rounded-sm p-4 shadow-sm bg-white/10 dark:bg-gray-800/50 border dark:border-gray-700">
            <h2 className="text-xl font-bold mb-4 dark:text-white">Related Books</h2>
            <RelatedBooks bookId={id} compactView={true} />
            <div className="mt-4 text-center">
              <Link href={`/books?related=${id}`}>
                <Button variant="outline" size="sm" className="w-full text-black dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100">
                  View More Related Books
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Purchase Chapter Dialog */}
      {selectedChapter && (
        <PurchaseChapterDialog
          chapter={selectedChapter}
          open={purchaseDialogOpen}
          onOpenChange={setPurchaseDialogOpen}
          onSuccess={() => {
            // Refetch chapters data after successful purchase
            queryClient.invalidateQueries({ queryKey: CHAPTER_KEYS.BOOK_CHAPTERS(id) });
          }}
        />
      )}
    </div>
  );
} 