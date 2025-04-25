"use client";

import React, { useState, useRef } from "react";
import NovelContent, { extractTextContent } from "@/components/novel/NovelContent";
import HTMLFlipBook from "react-pageflip";
import { Button } from "@/components/ui/button";
import { BookOpen, ScrollText, ChevronLeft, ChevronRight } from "lucide-react";

// Define type for flip book reference
interface PageFlipRef {
  pageFlip: () => {
    getCurrentPageIndex: () => number;
    flipNext: () => void;
    flipPrev: () => void;
  };
}

// Custom Page component for text content in flip book
const TextPage = React.forwardRef<HTMLDivElement, { content: string; pageNumber: number }>(
  ({ content, pageNumber }, ref) => {
    return (
      <div
        className="relative bg-white dark:bg-zinc-900 shadow-md overflow-hidden p-6"
        ref={ref}
      >
        <div className="w-full h-full prose prose-sm dark:prose-invert">
          <div dangerouslySetInnerHTML={{ __html: content }} />
          <div className="absolute bottom-3 right-4 text-xs text-muted-foreground">
            {pageNumber}
          </div>
        </div>
      </div>
    );
  }
);

TextPage.displayName = "TextPage";

interface NovelBookReaderProps {
  content: string;
  title?: string;
  author?: string;
  chapterNumber?: number;
  className?: string;
  defaultMode?: 'scroll' | 'flip';
  onPageChange?: (pageNumber: number) => void;
}

export function NovelBookReader({
  content,
  title = '',
  author = '',
  chapterNumber = 1,
  className = '',
  defaultMode = 'scroll',
  onPageChange,
}: NovelBookReaderProps) {
  const [isFlipMode, setIsFlipMode] = useState(defaultMode === 'flip');
  const flipBookRef = useRef<PageFlipRef>(null);
  
  // Toggle between reading modes
  const toggleReadingMode = () => {
    setIsFlipMode(!isFlipMode);
  };
  
  // Extract text content for flip book pages
  const textPages = React.useMemo(() => {
    const extractedText = extractTextContent(content);
    return extractedText.length > 0 ? extractedText : ['No content available'];
  }, [content]);
  
  // Generate HTML paragraphs for each page
  const htmlPages = React.useMemo(() => {
    return textPages.map(text => `<p>${text.replace(/\n/g, '<br/>')}</p>`);
  }, [textPages]);
  
  // Generate captions for pages
  const captions = React.useMemo(() => {
    return textPages.map((_, index) => 
      `Page ${index + 1} of ${textPages.length}`
    );
  }, [textPages]);

  // Handle page flip events
  const handlePageFlip = (e: { data: number }) => {
    if (onPageChange) {
      onPageChange(e.data);
    }
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Reading mode toggle button */}
      <div className="flex justify-end mb-4">
        <Button 
          variant="outline" 
          size="sm"
          className="flex items-center gap-1.5 text-xs"
          onClick={toggleReadingMode}
        >
          {isFlipMode ? (
            <>
              <ScrollText className="h-3.5 w-3.5" />
              <span>Switch to Scroll Mode</span>
            </>
          ) : (
            <>
              <BookOpen className="h-3.5 w-3.5" />
              <span>Switch to Flip Book Mode</span>
            </>
          )}
        </Button>
      </div>
      
      {isFlipMode ? (
        // Custom implementation for text-based flip book
        <div className="relative mx-auto w-full max-w-2xl">
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
            startPage={0}
            autoSize={true}
            maxShadowOpacity={0.5}
            showCover={true}
            useMouseEvents={true}
            swipeDistance={10}
            startZIndex={0}
            showPageCorners={true}
            disableFlipByClick={false}
            mobileScrollSupport={true}
            clickEventForward={false}
            className="mx-auto"
            style={{}}
            ref={flipBookRef}
            onFlip={handlePageFlip}
          >
            {/* Front Cover */}
            <div
              className="relative bg-primary/10 dark:bg-primary/20 shadow-md rounded-r-md overflow-hidden p-6"
            >
              <div className="flex flex-col justify-center items-center h-full">
                <h1 className="text-xl md:text-2xl font-bold text-center mb-4">{title}</h1>
                <p className="text-sm text-muted-foreground">by {author}</p>
                <p className="text-xs text-muted-foreground mt-4">Chapter {chapterNumber}</p>
              </div>
            </div>
            
            {/* Content Pages */}
            {htmlPages.map((pageContent, index) => (
              <TextPage
                key={index}
                content={pageContent}
                pageNumber={index + 1}
              />
            ))}
            
            {/* Back Cover */}
            <div
              className="relative bg-primary/10 dark:bg-primary/20 shadow-md rounded-l-md overflow-hidden p-6"
            >
              <div className="flex flex-col justify-center items-center h-full">
                <p className="text-muted-foreground text-sm">End of Chapter {chapterNumber}</p>
              </div>
            </div>
          </HTMLFlipBook>
          
          {/* Navigation controls placed outside the book */}
          <div className="flex items-center justify-center gap-6 w-full mt-8">
            <Button
              variant="secondary"
              size="icon"
              onClick={() => flipBookRef.current?.pageFlip().flipPrev()}
              className="h-12 w-12 rounded-full shadow-lg bg-white/80 backdrop-blur-sm hover:bg-white"
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
            
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                {flipBookRef.current && typeof flipBookRef.current.pageFlip === 'function'
                  ? `Page ${flipBookRef.current.pageFlip().getCurrentPageIndex() + 1} of ${htmlPages.length + 2}`
                  : `Page 1 of ${htmlPages.length + 2}`}
              </p>
            </div>
            
            <Button
              variant="secondary"
              size="icon"
              onClick={() => flipBookRef.current?.pageFlip().flipNext()}
              className="h-12 w-12 rounded-full shadow-lg bg-white/80 backdrop-blur-sm hover:bg-white"
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          </div>
        </div>
      ) : (
        // Scroll Mode (default)
        <div className="prose prose-sm sm:prose-base dark:prose-invert mx-auto">
          <NovelContent 
            content={content}
            className="mx-auto"
          />
        </div>
      )}
    </div>
  );
} 