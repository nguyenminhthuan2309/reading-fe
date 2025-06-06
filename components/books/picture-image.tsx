"use client";

import React, { useState } from "react";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";

interface PictureImageProps {
  src: string;
  alt: string;
  caption?: string;
  className?: string;
  showPopoverOnHover?: boolean;
}

export function PictureImage({ 
  src, 
  alt, 
  caption, 
  className = "",
  showPopoverOnHover = true 
}: PictureImageProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className={`relative ${className}`}>
      {showPopoverOnHover ? (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <div 
              className="cursor-zoom-in relative rounded-md overflow-hidden w-full h-full"
              onMouseEnter={() => setIsOpen(true)}
              onMouseLeave={() => setIsOpen(false)}
            >
              <img 
                src={src} 
                alt={alt} 
                className="w-full h-full object-cover" 
              />
              {caption && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white p-2 text-sm">
                  {caption}
                </div>
              )}
            </div>
          </PopoverTrigger>
          <PopoverContent 
            className="p-0 border-none rounded-lg shadow-lg"
            sideOffset={5}
            align="center"
            side="top"
            avoidCollisions={true}
            collisionPadding={20}
          >
            <div className="relative max-w-[90vw] max-h-[80vh]">
              <img 
                src={src} 
                alt={alt} 
                className="w-full h-auto object-contain" 
              />
              {caption && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white p-2 text-sm">
                  {caption}
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      ) : (
        <div className="relative rounded-md overflow-hidden w-full h-full">
          <img 
            src={src} 
            alt={alt} 
            className="w-full h-full object-cover" 
          />
          {caption && (
            <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white p-2 text-sm">
              {caption}
            </div>
          )}
        </div>
      )}
    </div>
  );
} 