"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Star } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { getBookReviews, postBookReview } from "@/lib/api/books";
import { BookReview as BookReviewType } from "@/models/book";
import { BOOK_KEYS, COMMENT_KEYS } from "@/lib/constants/query-keys";
import { useUserStore } from "@/lib/store";
import { useAvailableActivities } from "@/lib/hooks/useActivities";
import Link from "next/link";
import { ActivityType } from "@/lib/hooks/useActivities";

interface BookReviewProps {
  bookId: string;
  hidePostForm?: boolean;
}

export function BookReview({ bookId, hidePostForm = false }: BookReviewProps) {
  const queryClient = useQueryClient();
  const { isLoggedIn } = useUserStore();
  const [newReview, setNewReview] = useState("");
  const [rating, setRating] = useState(5);
  const [commentsPage, setCommentsPage] = useState(1);
  const commentsLimit = 10;
  const { createActivity } = useAvailableActivities();
  
  // State to keep track of all reviews (for pagination)
  const [allReviews, setAllReviews] = useState<BookReviewType[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Fetch book reviews with React Query
  const {
    data: reviewsData,
    isLoading: isLoadingReviews,
    error: reviewsError,
    refetch
  } = useQuery({
    queryKey: COMMENT_KEYS.BOOK_REVIEWS(bookId, commentsPage, commentsLimit),
    queryFn: async () => {
      const response = await getBookReviews({
        bookId: +bookId,
        page: commentsPage,
        limit: commentsLimit
      });
      if (response.status !== 200) {
        throw new Error(response.msg || 'Failed to fetch book reviews');
      }
      return response.data;
    },
    enabled: !!bookId,
    // Don't refetch when the window gets focus
    refetchOnWindowFocus: false,
    // Don't automatically refetch when revisiting the page
    staleTime: Infinity
  });

  // Update allReviews state when reviewsData changes
  useEffect(() => {
    if (reviewsData) {
      if (commentsPage === 1) {
        // If it's the first page, just set the reviews
        setAllReviews(reviewsData.data);
      } else {
        // If it's a subsequent page, append to existing reviews
        setAllReviews(prev => [...prev, ...reviewsData.data]);
      }
      setTotalPages(reviewsData.totalPages);
      setIsLoadingMore(false);
    }
  }, [reviewsData, commentsPage]);

  // Create a mutation for posting reviews
  const { mutate: submitReview, isPending: isSubmittingReview } = useMutation({
    mutationFn: async (reviewData: { comment: string; rating: number }) => {
      const response = await postBookReview(Number(bookId), reviewData);
      if (response.status !== 200 && response.status !== 201) {
        throw new Error(response.msg || 'Failed to post review');
      }
      return response.data;
    },
    onSuccess: () => {
    
      // Reset form
      setNewReview("");
      // Reset rating back to 5
      setRating(5);


      if (newReview.trim().length > 100) {
        createActivity({
          activityType: 'rate_book',
          relatedEntityId: Number(bookId),
      });}
      
      // Show success message
      toast.success("Your review has been posted successfully!");
      
      // Invalidate and refetch the book details (to update average rating, review count)
      queryClient.invalidateQueries({ queryKey: BOOK_KEYS.DETAIL(bookId) });
      queryClient.invalidateQueries({ queryKey: COMMENT_KEYS.BOOK_REVIEWS(bookId, commentsPage, commentsLimit) });
      
      // Reset to page 1 and refetch reviews
      setCommentsPage(1);
      setAllReviews([]);

    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to post your review. Please try again.");
    }
  });

  // Handle posting a review
  const handlePostReview = () => {
    if (!newReview.trim()) return;
    
    submitReview({
      comment: newReview,
      rating: rating
    });
  };

  // Handle loading more comments
  const handleLoadMoreComments = () => {
    if (commentsPage < totalPages && !isLoadingMore) {
      setIsLoadingMore(true);
      setCommentsPage(prev => prev + 1);
    }
  };

  return (
    <div className="space-y-6">
      {/* Post a review section - only show if hidePostForm is false */}
      {!hidePostForm && (
        <div className="mb-8 border rounded-md p-4">
          <h3 className="font-medium mb-3">Write a Review</h3>
          
          {isLoggedIn ? (
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
                  disabled={!newReview.trim() || isSubmittingReview}
                >
                  {isSubmittingReview ? "Posting..." : "Post Review"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col text-center space-y-3">
              <p className="text-muted-foreground">You need to be logged in to write reviews.</p>
              <Link href="/signin" className="mx-auto">
                <Button variant="default">
                  Login to Review
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}
      
      {/* User reviews section */}
      <div>
        <h3 className="text-lg font-medium mb-4">Community Reviews</h3>
        
        {isLoadingReviews && commentsPage === 1 ? (
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="border-b pb-4 last:border-0">
                <div className="flex items-start gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-24 mb-1" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                    <div className="flex gap-1 my-2">
                      {[...Array(5)].map((_, j) => (
                        <Skeleton key={j} className="h-3 w-3 rounded-full" />
                      ))}
                    </div>
                    <Skeleton className="h-4 w-full mb-1" />
                    <Skeleton className="h-4 w-4/5" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : reviewsError ? (
          <div className="py-8 text-center text-destructive">
            <p>Error loading reviews. Please try again later.</p>
          </div>
        ) : allReviews.length === 0 && !isLoadingReviews ? (
          <div className="py-8 text-center text-muted-foreground">
            <p>No reviews yet. Be the first to share your thoughts!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {allReviews.map((review: BookReviewType) => (
              <div key={review.id} className="border-b pb-4 last:border-0">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                    {review.user.avatar ? (
                      <Image 
                        src={review.user.avatar} 
                        alt={review.user.name} 
                        width={32} 
                        height={32} 
                        className="object-cover"
                      />
                    ) : (
                      <span className="text-xs font-medium">
                        {review.user.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{review.user.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <div className="flex mt-1 mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={14}
                          className={`${
                            i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                    
                    <p className="text-sm mt-1">{review.comment}</p>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Load more button */}
            {totalPages > commentsPage && (
              <div className="flex justify-center mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLoadMoreComments}
                  disabled={isLoadingMore}
                  className="flex items-center gap-1.5"
                >
                  {isLoadingMore ? "Loading..." : "Load more reviews"}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 