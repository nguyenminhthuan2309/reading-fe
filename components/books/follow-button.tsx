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
        "transition-colors duration-200",
        size === "sm" ? "h-8 px-3 text-xs" : "px-4 py-2",
        isFollowed
          ? "bg-yellow-50 border-yellow-200 text-yellow-600 hover:bg-yellow-100 hover:text-yellow-700"
          : "border-gray-200 text-gray-600 hover:border-gray-300",
        className
      )}
      onClick={handleFollow}
      disabled={followBookMutation.isPending}
    >
      <Bookmark 
        className={cn(
          "h-4 w-4 transition-colors", 
          isFollowed ? "text-yellow-500 fill-yellow-500" : "text-gray-500"
        )} 
      />
      {showText && (
        <span className="ml-2">{isFollowed ? "Bookmarked" : "Bookmark"}</span>
      )}
    </Button>
  );
} 