"use client";

import React, { useState } from "react";
import { FlipBook } from "@/components/books/flip-book";
import { PictureImage } from "@/components/books/picture-image";
import { Button } from "@/components/ui/button";
import { BookOpen, Book } from "lucide-react";

interface PictureBookReaderProps {
  images: string[];
  captions?: string[];
  isFlipMode?: boolean;
}

export function PictureBookReader({
  images,
  captions = [],
  isFlipMode = false,
}: PictureBookReaderProps) {

  return (
    <div className="w-full">
      {isFlipMode ? (
        // Flip Book Mode
        <FlipBook 
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