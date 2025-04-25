"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import HTMLFlipBook from "react-pageflip";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
  pageNumber: number;
  image: string;
  caption?: string;
}

interface BookCoverProps extends PageProps {
  chapterTitle: string;
  chapterNumber: number;
}

interface BookEndProps extends PageProps {
  chapterTitle: string;
  chapterNumber: number;
}

// Book Cover component for react-pageflip
const BookCover = React.forwardRef<HTMLDivElement, BookCoverProps>(({ chapterTitle, chapterNumber, pageNumber, image = null, caption = null }, ref) => {
  return (
    <div
      className="relative bg-white shadow-md overflow-hidden"
      ref={ref}
    >
      <div className="w-full h-full flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold">{chapterTitle}</h1>
        <p className="text-sm text-muted-foreground">{chapterNumber}</p>
      </div>
    </div>
  );
});

// Book End component for react-pageflip
const BookEnd = React.forwardRef<HTMLDivElement, BookEndProps>(({ chapterTitle, chapterNumber, pageNumber = null, image = null, caption = null }, ref) => {
  return (
    <div className="relative bg-white shadow-md overflow-hidden" ref={ref}>
      <div className="w-full h-full flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold">The End</h1>
      </div>
    </div>
  );
});


// Page component for react-pageflip
const Page = React.forwardRef<HTMLDivElement, PageProps>(({ pageNumber, image, caption }, ref) => {
  return (
    <div
      className="relative bg-white shadow-md overflow-hidden"
      ref={ref}
    >
      <div className="w-full h-full">
        <div className="relative w-full h-full aspect-[3/4]">
          <Image
            src={image}
            alt={`Page ${pageNumber}`}
            fill
            className="object-cover"
            priority
          />
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

Page.displayName = "Page";

interface FlipBookProps {
  pages: string[]; // Array of image URLs for pages
  captions?: string[]; // Optional captions for each page
  className?: string;
  initialPage?: number;
  onPageChange?: (pageNumber: number) => void;
}

export function FlipBook({
  pages,
  captions = [],
  className,
  initialPage = 0,
  onPageChange,
}: FlipBookProps) {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(pages.length);
  const bookRef = useRef<PageRef>(null);

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
      <div className="relative w-full max-w-2xl mx-auto mb-8">
        <div className="book-container relative overflow-hidden">
          <HTMLFlipBook
            width={500}
            height={700}
            size="stretch"
            minWidth={315}
            maxWidth={1000}
            minHeight={400}
            maxHeight={1533}
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
              chapterTitle="TEST"
              chapterNumber={1}
              pageNumber={0}
              image=""
              caption=""
            />
            
            {pages.map((page, index) => (
              <Page 
                key={index} 
                pageNumber={index + 2} 
                image={page} 
                caption={captions[index]}
              />
            ))}

            {/* Book End */}
            <BookEnd 
              chapterTitle="TEST"
              chapterNumber={1}
              pageNumber={pages.length + 1}
              image=""
              caption=""
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
            "bg-white/80 backdrop-blur-sm hover:bg-white",
            currentPage === 0 && "opacity-50 cursor-not-allowed"
          )}
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>
        
        {/* Page number indicator */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
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
            "bg-white/80 backdrop-blur-sm hover:bg-white",
            currentPage >= totalPages - 1 && "opacity-50 cursor-not-allowed"
          )}
        >
          <ChevronRight className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
} 