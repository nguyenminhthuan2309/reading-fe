"use client";

import React from "react";
import { PictureImage } from "@/components/books/picture-image";

interface PictureBookReaderProps {
  images: string[];
  captions?: string[];
}

export function PictureBookReader({ images, captions = [] }: PictureBookReaderProps) {
  return (
    <div className="space-y-8 mb-12">
      {images.map((imageUrl, index) => (
        <div key={index} className="flex flex-col items-center">
          <PictureImage
            src={imageUrl}
            alt={`Page ${index + 1}`}
            caption={captions[index] || ``}
            className="max-w-full md:max-w-[85%] lg:max-w-[70%] mx-auto"
          />
          {!captions[index] && (
            <p className="text-center text-muted-foreground text-sm mt-2">
              Page {index + 1}
            </p>
          )}
        </div>
      ))}
    </div>
  );
} 