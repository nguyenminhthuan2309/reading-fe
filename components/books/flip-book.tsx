"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import HTMLFlipBook from "react-pageflip";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import NovelContent from "../novel/NovelContent";
import { Book, Chapter } from "@/models/book";
import Link from "next/link";
// Type definitions for react-pageflip
interface PageFlipProps {
  width: number;
  height: number;
  size: "fixed" | "stretch";
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
  drawShadow?: boolean;
  flippingTime?: number;
  usePortrait?: boolean;
  startPage?: number;
  useMouseEvents?: boolean;
  swipeDistance?: number;
  showCover?: boolean;
  autoSize?: boolean;
  maxShadowOpacity?: number;
  clickEventForward?: boolean;
  mobileScrollSupport?: boolean;
  className?: string;
  style?: React.CSSProperties;
  startZIndex?: number;
  showPageCorners?: boolean;
  disableFlipByClick?: boolean;
  children: React.ReactNode;
  onFlip?: (e: { data: number }) => void;
  onChangeOrientation?: (e: { data: "portrait" | "landscape" }) => void;
  onChangeState?: (e: { data: "user_fold" | "fold_corner" | "flipping" | "read" }) => void;
  onInit?: (e: { data: any }) => void;
  onUpdate?: (e: { data: any }) => void;
}

interface PageRef {
  pageFlip: () => {
    flipNext: () => void;
    flipPrev: () => void;
    flip: (page: number) => void;
  };
}

interface PageProps {
  content: string;
  caption: string;
}

interface BookCoverProps {
    bookData: Book;
    currentChapter: Chapter;
}

interface BookEndProps  {
  bookData: Book;
  nextChapter?: Chapter;
}

// Book Cover component for react-pageflip
const BookCover = React.forwardRef<HTMLDivElement, BookCoverProps>(({ bookData, currentChapter }, ref) => {
  return (
    <div
      className="relative bg-white dark:bg-gray-900 shadow-md overflow-hidden"
      ref={ref}
    >
      <div className="w-full h-full flex flex-col items-center justify-center">
        {/* Book Title */}
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{bookData.title}</h1>
        {/* Author */}
        <p className="text-sm text-muted-foreground dark:text-gray-300">By: {bookData.author.name}</p>
        {/* Chapter Title */}
        <p className="text-sm text-muted-foreground dark:text-gray-300">Chapter: {currentChapter.chapter} - {currentChapter.title}</p>
      </div>
    </div>
  );
});

// Book End component for react-pageflip
const BookEnd = React.forwardRef<HTMLDivElement, BookEndProps>(({ bookData, nextChapter }, ref) => {
  return (
    <div className="relative bg-white dark:bg-gray-900 shadow-md overflow-hidden" ref={ref}>
      <div className="w-full h-full flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">The End</h1>

        {/* next chapter button */}
         { nextChapter && <Link className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors" href={`/books/${bookData.id}/read?chapter=${nextChapter.chapter}&id=${nextChapter.id}`}>Next Chapter <ArrowRight className="w-4 h-4" /></Link> }  
      </div>
    </div>
  );
});


// Page component for react-pageflip
const Page = React.forwardRef<HTMLDivElement, PageProps>(({ content, caption }, ref) => {
  return (
    <div
      className="relative bg-white dark:bg-gray-900 shadow-md overflow-hidden"
      ref={ref}
    >
      <div className="w-full h-full">
        <div className="relative w-full h-full aspect-[3/4]">
           {content && (
            <Image
              src={content}
              alt={content}
              fill
              className="object-cover"
              priority
            />
          )}
        </div>
        {caption && (
          <div className="absolute bottom-0 left-0 right-0 bg-black/50 backdrop-blur-md p-2 text-white text-sm text-center">
            {caption}
          </div>
        )}
      </div>
    </div>
  );
});

// Custom Page component for text content in flip book
const TextPage = React.forwardRef<HTMLDivElement, PageProps>(({ content }, ref) => {
  return (
    <div className="relative bg-white dark:bg-gray-900 shadow-md overflow-hidden p-8" ref={ref}>
      <div className="text-gray-900 dark:text-gray-100">
        <NovelContent 
          content={content}
          className="mx-auto prose prose-gray dark:prose-invert prose-sm max-w-none"
        />
      </div>
    </div>
  );
});

Page.displayName = "Page";
TextPage.displayName = "TextPage";

interface FlipBookProps {
  bookType: 'manga' | 'novel';
  pages: string[]; // Array of image URLs for pages
  bookData: Book;
  currentChapter: Chapter;
  nextChapter?: Chapter;
  captions?: string[]; // Optional captions for each page
  className?: string;
  initialPage?: number;
  onPageChange?: (pageNumber: number) => void;
}

export function FlipBook({
  bookType = 'manga',
  pages,
  bookData,
  currentChapter,
  nextChapter,
  captions = [],
  className,
  initialPage = 0,
  onPageChange,
}: FlipBookProps) {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(pages.length);
  const bookRef = useRef<PageRef>(null);

  console.log('pages', pages);

  // Add cleanup effect for chapter changes
  useEffect(() => {
    // Reset current page when chapter changes
    setCurrentPage(initialPage);
    
    // Cleanup function
    return () => {
      // Force reset any internal state when unmounting or when chapter changes
      setCurrentPage(0);
      setTotalPages(0);
    };
  }, [currentChapter.id, initialPage]);

  useEffect(() => {
    // If the initial page prop changes, flip to that page
    if (initialPage > 0 && bookRef.current) {
      bookRef.current.pageFlip().flip(initialPage);
    }
  }, [initialPage]);

  useEffect(() => {
    // Update total pages if pages array changes
    setTotalPages(pages.length + 2);
  }, [pages]);

  // Handle page change
  const handlePageFlip = (e: { data: number }) => {
    setCurrentPage(e.data);
    if (onPageChange) {
      onPageChange(e.data);
    }
  };

  // Navigate to previous page
  const prevPage = () => {
    if (bookRef.current && currentPage > 0) {
      bookRef.current.pageFlip().flipPrev();
    }
  };

  // Navigate to next page
  const nextPage = () => {
    if (bookRef.current && currentPage < totalPages - 1) {
      bookRef.current.pageFlip().flipNext();
    }
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        nextPage();
      } else if (e.key === "ArrowLeft") {
        prevPage();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [currentPage, totalPages]);

  return (
    <div className={cn("w-full flex flex-col items-center", className)}>
      {/* Book container */}
      <div className="relative w-full max-w-6xl mx-auto mb-8">
        <div className="book-container relative overflow-hidden">
          <HTMLFlipBook
            key={`flip-book-${currentChapter.id}`}
            width={700}
            height={900}
            size="stretch"
            minWidth={400}
            maxWidth={1400}
            minHeight={500}
            maxHeight={1800}
            drawShadow={true}
            flippingTime={1000}
            usePortrait={true}
            startPage={initialPage + 1}
            autoSize={true}
            maxShadowOpacity={0.5}
            showCover={false}
            useMouseEvents={true}
            swipeDistance={10}
            startZIndex={0}
            clickEventForward={false}
            mobileScrollSupport={true}
            showPageCorners={true}
            disableFlipByClick={false}
            className="mx-auto"
            style={{}}
            ref={bookRef}
            onFlip={handlePageFlip}
          >
            {/* Book Cover */}
            <BookCover 
                bookData={bookData}
                currentChapter={currentChapter}
            />
            
            {bookType === 'manga' ? (
              pages.map((page, index) => (
                <Page 
                    key={index} 
                    content={page} 
                    caption={captions[index]}
              />
            ))) : (
              pages.map((page, index) => (
                <TextPage    
                    key={index} 
                    content={page}
                    caption={captions[index]}
                    
                />
              ))
            )}

            {/* Book End */}
            <BookEnd 
                bookData={bookData}
                nextChapter={nextChapter}
            />

          </HTMLFlipBook>
        </div>
      </div>

      {/* Navigation controls placed outside the book */}
      <div className="flex items-center justify-center gap-6 w-full">
        <Button
          variant="secondary"
          size="icon"
          onClick={prevPage}
          disabled={currentPage === 0}
          className={cn(
            "h-12 w-12 rounded-full shadow-lg",
            "bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-700",
            "border border-gray-200 dark:border-gray-600",
            "text-gray-700 dark:text-gray-200",
            currentPage === 0 && "opacity-50 cursor-not-allowed"
          )}
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>
        
        {/* Page number indicator */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground dark:text-gray-300">
            Page {currentPage + 1} of {totalPages}
          </p>
        </div>
        
        <Button
          variant="secondary"
          size="icon"
          onClick={nextPage}
          disabled={currentPage >= totalPages - 1}
          className={cn(
            "h-12 w-12 rounded-full shadow-lg",
            "bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-700",
            "border border-gray-200 dark:border-gray-600",
            "text-gray-700 dark:text-gray-200",
            currentPage >= totalPages - 1 && "opacity-50 cursor-not-allowed"
          )}
        >
          <ChevronRight className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
}

// Add a wrapper component to handle clean remounting
export function FlipBookWrapper(props: FlipBookProps) {
  const [key, setKey] = useState<string>(`flipbook-${props.currentChapter.id}`);
  
  // Force remount when chapter changes
  useEffect(() => {
    setKey(`flipbook-${props.currentChapter.id}-${Date.now()}`);
  }, [props.currentChapter.id]);
  
  return (
    <div key={key} className="w-full">
      <FlipBook {...props} />
    </div>
  );
} 