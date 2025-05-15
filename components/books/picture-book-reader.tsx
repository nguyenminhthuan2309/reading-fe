"use client";

import React, { useState } from "react";
import { FlipBookWrapper } from "@/components/books/flip-book";
import { PictureImage } from "@/components/books/picture-image";
import { Book, Chapter } from "@/models/book";

interface PictureBookReaderProps {
  bookData: Book;
  currentChapter: Chapter;
  nextChapter?: Chapter;
  images: string[];
  captions?: string[];
  isFlipMode?: boolean;
}

export function PictureBookReader({
  bookData,
  currentChapter,
  nextChapter,
  images,
  captions = [],
  isFlipMode = false,
}: PictureBookReaderProps) {
  return (
    <div className="w-full">
      {isFlipMode ? (
        // Flip Book Mode
        <FlipBookWrapper 
          bookData={bookData}
          currentChapter={currentChapter}
          nextChapter={nextChapter}
          bookType="manga"
          pages={images}
          captions={captions}
        />
      ) : (
        // Scroll Mode (default)
        <div className="space-y-8 mb-12">
          {images.map((imageUrl, index) => (
            <div key={index} className="flex flex-col items-center">
              <PictureImage
                src={imageUrl}
                alt={`Page ${index + 1}`}
                caption={captions[index] || ``}
                className="max-w-full md:max-w-[85%] lg:max-w-[70%] mx-auto"
                showPopoverOnHover={false}
              />
              {!captions[index] && (
                <p className="text-center text-muted-foreground text-sm mt-2">
                  Page {index + 1}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 