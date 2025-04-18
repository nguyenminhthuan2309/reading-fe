"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { BookOpen, Star, Clock, Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Genre, GENRE_OPTIONS } from "@/models/genre";

interface BookCardProps {
  id: string;
  title: string;
  author: string;
  description: string;
  coverImage?: string;
  chapters: number;
  rating: number;
  genre: Genre;
  progress?: number;
  className?: string;
  showPreview?: boolean;
}

export function BookCard({
  id,
  title,
  author,
  description,
  coverImage,
  chapters,
  rating,
  genre,
  progress = 0,
  className,
  showPreview = true,
}: BookCardProps) {
  const hasStartedReading = progress > 0;
  const [isLoaded, setIsLoaded] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  
  // Initialize state on client only
  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // Get genre display name 
  const getGenreDisplayName = (): string => {
    const option = GENRE_OPTIONS.find(opt => opt.value === genre);
    return option?.label || genre;
  };
  
  // Card content that's used in both cases
  const CardContent = () => (
    <div 
      className={cn(
        "relative h-[360px] rounded-xl overflow-hidden transition-transform duration-300 hover:scale-105 cursor-pointer", 
        className
      )}
    >
      {/* Cover image as background */}
      <div className="absolute inset-0 w-full h-full">
        <Image
          src="/images/book-cover.jpeg"
          alt={title}
          fill
          className="object-cover"
          priority
        />
        {/* Gradient overlay for better text visibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
      </div>
      
      {/* Bookmark icon in top right corner */}
      {isLoaded && (
        <button 
          className="absolute top-3 right-3 z-20 p-1.5 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            setIsBookmarked(!isBookmarked);
          }}
        >
          <Bookmark 
            className={cn(
              "h-5 w-5 transition-colors", 
              isBookmarked ? "text-red-500 fill-red-500" : "text-white"
            )} 
          />
        </button>
      )}
      
      {/* Content overlaid on image, aligned to bottom */}
      <div className="absolute bottom-0 left-0 right-0 z-10 p-4 md:p-5">
        <div className="mb-2">
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-600/50 text-white uppercase font-bold">{getGenreDisplayName()}</span>
        </div>
        
        <Link href={`/books/${id}`}>
          <h3 className="text-lg font-extrabold uppercase mb-1 text-white leading-tight line-clamp-2 hover:underline">{title}</h3>
        </Link>
        
        <p className="text-xs text-gray-300 mb-3">by {author}</p>
        
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center">
              <BookOpen className="h-3 w-3 text-gray-300 mr-1" />
              <span className="text-xs text-gray-300">{chapters} Ch</span>
            </div>
            
            {progress > 0 && (
              <div className="flex items-center">
                <div className="relative h-1.5 w-12 bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="absolute top-0 left-0 h-full bg-red-600 rounded-full" 
                    style={{ width: `${progress * 100}%` }}
                  />
                </div>
                <span className="text-[9px] text-gray-300 ml-1">{Math.round(progress * 100)}%</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star 
                key={star} 
                className={`h-3 w-3 ${star <= Math.round(rating) ? 'text-yellow-500 fill-yellow-500' : 'text-gray-600'} mr-0.5`}
              />
            ))}
          </div>
        </div>
        
        <Link 
          href={hasStartedReading 
            ? `/read/${id}?chapter=${Math.ceil(progress * chapters)}` 
            : `/read/${id}?chapter=1`} 
          onClick={(e) => e.stopPropagation()}
        >
          <Button variant="destructive" size="sm" className="cursor-pointer w-full text-xs">
            {hasStartedReading ? 'Continue Reading' : 'Read First Ch.'}
          </Button>
        </Link>
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
          onMouseEnter={() => setIsOpen(true)}
          onMouseLeave={() => setIsOpen(false)}
        >
          <CardContent />
        </div>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[320px] p-0 border-none rounded-lg shadow-xl transition-opacity duration-300 z-50" 
        sideOffset={20}
        align="center"
        alignOffset={0}
        side="right"
        avoidCollisions={true}
        collisionPadding={20}
      >
        <div className="bg-white rounded-lg overflow-hidden border border-gray-200">
          <div className="p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <Link href={`/books/${id}`}>
                  <h3 className="text-base font-bold text-black leading-tight mb-1 hover:underline">{title}</h3>
                </Link>
                <p className="text-xs text-gray-600">by {author}</p>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-600/80 text-white uppercase font-bold">{getGenreDisplayName()}</span>
            </div>
            
            <p className="text-xs text-gray-600 mb-4 line-clamp-3">{description}</p>
            
            <div className="flex justify-between items-center">
              <div className="flex items-center text-xs text-gray-600">
                <BookOpen className="h-3 w-3 text-gray-500 mr-1" />
                <span>{chapters} Ch</span>
              </div>
              
              <div className="flex items-center text-xs text-gray-600">
                <Clock className="h-3 w-3 text-gray-500 mr-1" />
                <span>~{Math.round(chapters * 8)}m</span>
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
} 