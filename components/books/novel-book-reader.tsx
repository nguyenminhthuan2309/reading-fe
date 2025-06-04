"use client";

import React, { useState, useRef } from "react";
import NovelContent, { extractTextContent } from "@/components/novel/NovelContent";
import HTMLFlipBook from "react-pageflip";
import { Button } from "@/components/ui/button";
import { BookOpen, ScrollText, ChevronLeft, ChevronRight } from "lucide-react";
import { FlipBookWrapper } from "./flip-book";
import { Book, Chapter } from "@/models/book";

// Function to split content into pages that fit the page size
function splitContentIntoPages(content: string, maxWordsPerPage: number = 300): string[] {
  if (!content) return ['No content available'];
  
  // Extract text content into paragraphs
  const extractedParagraphs = extractTextContent(content);
  if (extractedParagraphs.length === 0) return ['No content available'];
  
  const pages: string[] = [];
  let currentPage: string[] = [];
  let currentWordCount = 0;
  
  for (const paragraph of extractedParagraphs) {
    const trimmedParagraph = paragraph.trim();
    if (!trimmedParagraph) continue;
    
    const paragraphWords = trimmedParagraph.split(/\s+/).length;
    
    // If this single paragraph is too long for one page, we need to split it
    if (paragraphWords > maxWordsPerPage) {
      // Save current page if it has content
      if (currentPage.length > 0) {
        pages.push(currentPage.map(p => `<p class="mb-4 text-justify leading-relaxed">${p.replace(/\n/g, '<br/>')}</p>`).join(''));
        currentPage = [];
        currentWordCount = 0;
      }
      
      // Split the long paragraph into chunks
      const words = trimmedParagraph.split(/\s+/);
      let chunkStart = 0;
      
      while (chunkStart < words.length) {
        const chunkEnd = Math.min(chunkStart + maxWordsPerPage, words.length);
        const chunk = words.slice(chunkStart, chunkEnd).join(' ');
        pages.push(`<p class="mb-4 text-justify leading-relaxed">${chunk.replace(/\n/g, '<br/>')}</p>`);
        chunkStart = chunkEnd;
      }
    } 
    // If adding this paragraph would exceed the word limit, start a new page
    else if (currentWordCount + paragraphWords > maxWordsPerPage && currentPage.length > 0) {
      // Save current page
      pages.push(currentPage.map(p => `<p class="mb-4 text-justify leading-relaxed">${p.replace(/\n/g, '<br/>')}</p>`).join(''));
      
      // Start new page with current paragraph
      currentPage = [trimmedParagraph];
      currentWordCount = paragraphWords;
    } else {
      // Add paragraph to current page
      currentPage.push(trimmedParagraph);
      currentWordCount += paragraphWords;
    }
  }
  
  // Add the last page if it has content
  if (currentPage.length > 0) {
    pages.push(currentPage.map(p => `<p class="mb-4 text-justify leading-relaxed">${p.replace(/\n/g, '<br/>')}</p>`).join(''));
  }
  
  return pages.length > 0 ? pages : ['No content available'];
}

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
  highlightParagraph?: number;
  highlightWordStart?: number;
  highlightWordEnd?: number;
  onParagraphClick?: (index: number) => void;
}

export function NovelBookReader({
  bookData,
  currentChapter,
  nextChapter,
  content,
  className = '',
  isFlipMode = false,
  onPageChange,
  highlightParagraph = -1,
  highlightWordStart,
  highlightWordEnd,
  onParagraphClick,
}: NovelBookReaderProps) {
  // Split content into properly sized pages for flip book
  const htmlPages = React.useMemo(() => {
    if (isFlipMode) {
      return splitContentIntoPages(content, 250); // ~250 words per page for better fit
    }
    return [];
  }, [content, isFlipMode]);
  
  // Generate captions for pages
  const captions = React.useMemo(() => {
    if (isFlipMode) {
      return htmlPages.map((_, index) => 
        `Page ${index + 1} of ${htmlPages.length}`
      );
    }
    return [];
  }, [htmlPages, isFlipMode]);

  return (
    <div className={`w-full ${className}`}>
      {isFlipMode ? (
        // Custom implementation for text-based flip book
        <FlipBookWrapper
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
            highlightParagraph={highlightParagraph}
            highlightWordStart={highlightWordStart}
            highlightWordEnd={highlightWordEnd}
            onParagraphClick={onParagraphClick}
          />
        </div>
      )}
    </div>
  );
} 