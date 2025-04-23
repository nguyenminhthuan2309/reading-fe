import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFollowBook } from "@/lib/hooks/useFollowBook";
import { toast } from "sonner";

interface FollowButtonProps {
  bookId: number;
  isFollowed?: boolean;
  className?: string;
  variant?: "default" | "outline" | "destructive";
  size?: "sm" | "default" | "lg";
  showText?: boolean;
}

export function FollowButton({
  bookId,
  isFollowed: initialIsFollowed = false,
  className,
  variant = "outline",
  size = "sm",
  showText = false
}: FollowButtonProps) {
  const [isFollowed, setIsFollowed] = useState(initialIsFollowed);
  const followBookMutation = useFollowBook();
  
  const handleFollow = () => {
    const newFollowState = !isFollowed;
    setIsFollowed(newFollowState);
    
    followBookMutation.mutate(
      { 
        bookId, 
        isFollowed: isFollowed // Pass current state before toggle
      }, 
      {
        onError: () => {
          // Revert state on error
          setIsFollowed(isFollowed);
          toast.error(`Failed to ${isFollowed ? 'remove bookmark' : 'bookmark'} book. Please try again.`);
        }
      }
    );
  };
  
  return (
    <Button 
      variant={variant} 
      size={size} 
      className={cn(
        isFollowed 
          ? "bg-red-50 border-red-200 text-red-600 hover:bg-red-100 hover:text-red-700" 
          : "",
        className
      )}
      onClick={handleFollow}
      disabled={followBookMutation.isPending}
    >
      <Bookmark 
        className={cn(
          "h-4 w-4 transition-colors", 
          isFollowed ? "text-red-500 fill-red-500" : "text-gray-500"
        )} 
      />
      {showText && (
        <span className="ml-2">{isFollowed ? "Bookmarked" : "Bookmark"}</span>
      )}
    </Button>
  );
} 