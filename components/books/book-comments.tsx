"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { getNameColor } from "@/components/ui/avatar";
import { Star, ChevronDown, ChevronUp } from "lucide-react";
import { bookComments } from "@/lib/mock-data";
import { formatDistanceToNow } from "date-fns";

type Comment = {
  id: string;
  userId: string;
  username: string;
  userAvatar: string;
  content: string;
  rating: number;
  timestamp: string;
};

export function BookComments({ bookId, hidePostForm = false }: { bookId: string; hidePostForm?: boolean }) {
  const [comments, setComments] = useState<Comment[]>(
    // Use a type safe way to access bookComments
    (bookComments as Record<string, Comment[]>)[bookId] || []
  );
  const [newComment, setNewComment] = useState("");
  const [rating, setRating] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [visibleComments, setVisibleComments] = useState(5);
  const [showAllComments, setShowAllComments] = useState(false);

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    
    setIsSubmitting(true);
    
    // In a real app, this would be an API call
    setTimeout(() => {
      const comment: Comment = {
        id: `c${Date.now()}`,
        userId: "current-user", // In a real app, this would be the authenticated user's ID
        username: "You", // In a real app, this would be the authenticated user's username
        userAvatar: "/images/avatar.png",
        content: newComment,
        rating: rating,
        timestamp: new Date().toISOString(),
      };
      
      setComments([comment, ...comments]);
      setNewComment("");
      setIsSubmitting(false);
    }, 500);
  };
  
  function formatCommentTime(timestamp: string): string {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  }
  
  const handleViewMore = () => {
    if (showAllComments) {
      setVisibleComments(5);
      setShowAllComments(false);
    } else {
      setVisibleComments(comments.length);
      setShowAllComments(true);
    }
  };
  
  // Determine which comments to display
  const displayedComments = comments.slice(0, visibleComments);

  return (
    <div className="space-y-6">
      {/* Add a comment - only show if hidePostForm is false */}
      {!hidePostForm && (
        <div className="space-y-4 mb-8">
          <Textarea
            placeholder="Write your review..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[100px] border rounded-md"
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
              onClick={handleAddComment} 
              disabled={!newComment.trim() || isSubmitting}
              size="sm"
            >
              {isSubmitting ? "Posting..." : "Post Review"}
            </Button>
          </div>
        </div>
      )}
      
      {/* Comments list */}
      <div className="space-y-6">
        {comments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No reviews yet. Be the first to share your thoughts!
          </div>
        ) : (
          displayedComments.map((comment) => (
            <div key={comment.id} className="border-b pb-4 last:border-0">
              <div className="flex items-start gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={comment.userAvatar} alt={comment.username} />
                  <AvatarFallback className={getNameColor(comment.username)}>
                    {comment.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{comment.username}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatCommentTime(comment.timestamp)}
                    </span>
                  </div>
                  
                  <div className="flex mt-1 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={14}
                        className={`${
                          i < comment.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  
                  <p className="text-sm mt-1">{comment.content}</p>
                </div>
              </div>
            </div>
          ))
        )}
        
        {/* View more button */}
        {comments.length > 5 && (
          <div className="flex justify-center mt-6">
            <Button
              variant="link"
              size="sm"
              onClick={handleViewMore}
              className="flex items-center gap-1.5 text-black font-medium hover:text-gray-700"
            >
              {showAllComments ? (
                <>Show less <ChevronUp size={16} /></>
              ) : (
                <>View more <ChevronDown size={16} /></>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
} 