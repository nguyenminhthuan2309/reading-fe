"use client";

import React, { useState, useRef } from "react";
import NovelContent, { extractTextContent } from "@/components/novel/NovelContent";
import HTMLFlipBook from "react-pageflip";
import { Button } from "@/components/ui/button";
import { BookOpen, ScrollText, ChevronLeft, ChevronRight } from "lucide-react";
import { FlipBook } from "./flip-book";
import { Book, Chapter } from "@/models/book";
// Define type for flip book reference
interface PageFlipRef {
  pageFlip: () => {
    getCurrentPageIndex: () => number;
    flipNext: () => void;
    flipPrev: () => void;
  };
}

interface NovelBookReaderProps {
  bookData: Book;
  currentChapter: Chapter;
  nextChapter?: Chapter;
  content: string;
  className?: string;
  isFlipMode?: boolean;
  onPageChange?: (pageNumber: number) => void;
}

export function NovelBookReader({
  bookData,
  currentChapter,
  nextChapter,
  content,
  className = '',
  isFlipMode = false,
  onPageChange,
}: NovelBookReaderProps) {
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

  return (
    <div className={`w-full ${className}`}>
      {isFlipMode ? (
        // Custom implementation for text-based flip book
        <FlipBook
          bookData={bookData}
          currentChapter={currentChapter}
          nextChapter={nextChapter}
          bookType="novel"
          pages={htmlPages}
          captions={captions}
        />
        
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