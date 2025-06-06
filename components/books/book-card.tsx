"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { BookOpen, Star, Clock, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Author, Category, ReadingProgress } from "@/models";
import { FollowButton } from "@/components/books/follow-button";
import { useTheme } from "next-themes";

interface BookCardProps {
  id: number;
  title: string;
  author: Author;
  description: string;
  coverImage?: string;
  chapters: number;
  rating: number;
  genres: Category[];
  readingProgress?: ReadingProgress;
  className?: string;
  showPreview?: boolean;
  lastReadAt?: string;
  currentChapter?: number;
  lastReadChapterTitle?: string;
  isCreator?: boolean;
  isFollowed?: boolean;
}

export function BookCard({
  id,
  title,
  author,
  description,
  coverImage,
  chapters,
  rating,
  genres,
  readingProgress,
  className,
  showPreview = true,
  currentChapter,
  lastReadChapterTitle,
  isCreator = false,
  isFollowed = false,
}: BookCardProps) {
  const hasStartedReading = readingProgress?.totalReadChapters && readingProgress.totalReadChapters > 0;
  const progress = readingProgress?.totalReadChapters ? (readingProgress.totalReadChapters / chapters) : 0;

  const [isLoaded, setIsLoaded] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Theme
  const { theme } = useTheme();
  
  // Initialize state on client only
  useEffect(() => {
    setIsLoaded(true);
    
    // Cleanup timeout on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
  
  // Hover handlers with delay for better UX
  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsOpen(true);
  };
  
  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      // Check if cursor is over the popover or the card
      const isOverPopover = popoverRef.current && 
        popoverRef.current.matches(':hover');
      
      if (!isOverPopover) {
        setIsOpen(false);
      }
    }, 300); // 300ms delay gives time to move to popover
  };
  
  // Card content that's used in both cases
  const CardContent = () => (
    <div 
    className={cn(
      "flex flex-col rounded-xl overflow-hidden transition-transform duration-300 cursor-pointer border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 h-full w-full", 
      className
    )}
    >
      {/* Cover image container with padding */}
      <div className="p-3 pt-4">
        <div className="relative aspect-[3/4] w-full rounded-lg overflow-hidden shadow-sm">
          {/* Cover image */}
          <Image
            src={coverImage || "/images/book-cover.jpeg"}
            alt={title}
            fill
            className="object-cover"
            priority
            onError={(e) => {
              // Fallback to default image if the provided URL fails to load
              const target = e.target as HTMLImageElement;
              target.src = "/images/book-cover.jpeg";
            }}
          />
          
          {/* Genre badge */}
          <div className="absolute top-3 left-3 z-10 flex flex-wrap gap-1 max-w-[90%]">
             {genres?.map((genre) => (
               <span key={genre.id} className="text-[9px] px-1.5 py-0.5 rounded-full bg-yellow-600/80 text-white uppercase font-bold">{genre.name}</span>
             ))}
          </div>
        </div>
      </div>
      
      {/* Basic info below the cover */}
      <div className="px-4 pb-4 flex flex-col flex-grow justify-between">
        <div>
          <Link href={`/books/${id}`}>
            <h3 className="font-medium text-gray-900 dark:text-white leading-tight line-clamp-1 hover:text-yellow-600 dark:hover:text-yellow-400 transition-colors">{title}</h3>
          </Link>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">by {author.name}</p>
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center space-x-2">
              <div className="flex items-center">
                <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
                <span className="text-xs ml-1 text-gray-700 dark:text-gray-300">{rating.toFixed(1)}</span>
              </div>
              <span className="text-gray-400 dark:text-gray-600 text-xs">•</span>
              <div className="flex items-center">
                <BookOpen className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
                <span className="text-xs ml-1 text-gray-700 dark:text-gray-300">{chapters} Ch</span>
              </div>
            </div>
            
            {progress > 0 && (
              <div className="flex items-center">
                <div className="relative h-1.5 w-12 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="absolute top-0 left-0 h-full bg-yellow-600 rounded-full" 
                    style={{ width: `${progress * 100}%` }}
                  />
                </div>
                <span className="text-[9px] text-gray-600 dark:text-gray-400 ml-1">{Math.round(progress * 100)}%</span>
              </div>
            )}
            
            {/* Last read chapter info - show only if available and progress > 0 */}
            {progress > 0 && lastReadChapterTitle && (
              <div className="mt-1.5 flex items-center text-xs text-gray-600 dark:text-gray-400">
                <Clock className="h-3 w-3 mr-1 text-gray-500 dark:text-gray-400" />
                <span className="line-clamp-1 text-[10px]">
                  Last read: {lastReadChapterTitle}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 mt-3">
          <Link 
            href={hasStartedReading 
              ? `/books/${id}/read?chapter=${readingProgress?.lastReadChapterNumber}&id=${readingProgress?.lastReadChapterId}` 
              : `/books/${id}/read?chapter=${readingProgress?.lastReadChapterNumber}&id=${readingProgress?.lastReadChapterId}`} 
            className="flex-1"
          >
            <Button variant={theme === 'dark' ? 'default' : 'destructive'} size="sm" className="w-full text-xs h-8 rounded-lg">
              {hasStartedReading ? 'Continue' : 'Read'}
            </Button>
          </Link>
          
          <div className="flex gap-1">
            {isCreator && (
              <Link href={`/books/${id}/edit`}>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 px-2 rounded-lg border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <Pencil className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                </Button>
              </Link>
            )}
            
            {/* Only show FollowButton if not the creator */}
            {!isCreator && (
              <FollowButton 
                bookId={id} 
                isFollowed={isFollowed} 
                size="sm" 
                className="h-8 px-2 rounded-lg border" 
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
  
  // If preview is disabled, just return the card
  if (!showPreview) {
    return <CardContent />;
  }
  
  // If we're still on server side or initial render, just return the card
  if (!isLoaded) {
    return <CardContent />;
  }
  
  // With preview enabled, wrap in Popover component
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div
          className="w-full"
          ref={triggerRef}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <CardContent />
        </div>
      </PopoverTrigger>
      <PopoverContent 
        ref={popoverRef}
        className="w-[320px] p-0 border-none rounded-lg shadow-lg transition-opacity duration-300 z-50" 
        sideOffset={5}
        align="center"
        alignOffset={0}
        side="right"
        avoidCollisions={true}
        collisionPadding={10}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
          <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/10 p-4 rounded-t-lg">
            <div className="flex justify-between items-start mb-2">
              <div>
                <Link href={`/books/${id}`}>
                  <h3 className="text-base font-bold text-amber-700 dark:text-amber-300 leading-tight mb-1 hover:underline">{title}</h3>
                </Link>
                <p className="text-xs text-amber-600 dark:text-amber-400">by {author.name}</p>
              </div>
              <div className="flex flex-wrap gap-1 justify-end max-w-[40%]">
                {genres?.map((genre) => (
                  <span key={genre.id} className="text-[9px] px-1.5 py-0.5 rounded-full bg-yellow-600/80 text-white uppercase font-bold">{genre.name}</span>
                ))}
              </div>
            </div>
          </div>
          
          <div className="p-4">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">{description}</p>
            
            <div className="flex justify-between items-center">
              <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                <BookOpen className="h-3 w-3 text-gray-500 dark:text-gray-400 mr-1" />
                <span>{chapters} Ch</span>
              </div>
              
              <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                <Clock className="h-3 w-3 text-gray-500 dark:text-gray-400 mr-1" />
                <span>~{Math.round(chapters * 8)}m</span>
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
} 