"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { BookOpen, Star, Clock, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { featuredBooks } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const textShadowStyles = {
  'text-shadow-xs': 'text-shadow: 0 1px 2px rgba(0,0,0,0.1);',
  'text-shadow-sm': 'text-shadow: 0 2px 4px rgba(0,0,0,0.1);',
  'text-shadow-md': 'text-shadow: 0 4px 8px rgba(0,0,0,0.12), 0 2px 4px rgba(0,0,0,0.08);',
};

export function BookCarousel() {
  const [api, setApi] = useState<CarouselApi>();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!api) return;

    const handleSelect = () => {
      setActiveIndex(api.selectedScrollSnap());
    };

    api.on("select", handleSelect);
    return () => {
      api.off("select", handleSelect);
    };
  }, [api]);

  // Set up autoplay
  useEffect(() => {
    if (!api) return;
    
    const interval = setInterval(() => {
      api.scrollNext();
    }, 5000); // Change slide every 5 seconds
    
    return () => clearInterval(interval);
  }, [api]);

  // Take the first 3 books for the hero carousel
  const heroBooks = featuredBooks.slice(0, 3);

  return (
    <div className="relative border-b border-gray-200">
      <div className="container mx-auto px-4 py-6">
        {/* Card wrapper */}
        <div className="overflow-hidden">
          <Carousel
            className="w-full"
            setApi={setApi}
            opts={{
              loop: true,
              align: "start",
            }}
          >
            <CarouselContent className="h-[400px] md:h-[480px]">
              {heroBooks.map((book, index) => (
                <CarouselItem key={book.id} className="pt-0 h-full">
                  <div className="relative w-full h-full overflow-hidden">
                    {/* Content container with gradient overlay */}
                    <div className="relative h-full container mx-auto px-4 flex flex-col md:flex-row items-center justify-center gap-6 py-6">
                      {/* Book cover - back on left side */}
                      <div className="w-full max-w-[180px] md:max-w-[240px] md:w-1/3 flex-shrink-0 relative">
                        <div className="relative aspect-[3/4] rounded-lg overflow-hidden shadow-lg transform transition-transform duration-500 hover:scale-105">
                          <Image
                            src="/images/book-cover.jpeg"
                            alt={book.title}
                            fill
                            className="object-cover"
                            priority
                          />
                        </div>
                      </div>

                      {/* Book details - now on right side */}
                      <div className="w-full md:w-2/3 space-y-3 text-center md:text-left">
                        <div>
                          <div className="mb-1">
                            <span className="px-3 py-1 bg-red-600 text-white text-xs font-bold uppercase rounded-full">
                              {book.genre}
                            </span>
                          </div>
                          <h1 className="text-2xl md:text-4xl font-bold text-gray-800 mb-1 leading-tight text-shadow-sm">
                            {book.title}
                          </h1>
                          <p className="text-sm text-gray-700 text-shadow-xs">by {book.author}</p>
                        </div>

                        <p className="text-gray-800 max-w-[600px] mx-auto md:mx-0 leading-relaxed text-sm md:text-base line-clamp-3 text-shadow-xs break-words">
                          {book.description}
                        </p>

                        <div className="flex flex-wrap gap-4 justify-center md:justify-start text-xs">
                          <div className="flex items-center bg-white/70 backdrop-blur-sm rounded-full px-3 py-1.5 border border-gray-200">
                            <BookOpen className="h-3.5 w-3.5 text-gray-600 mr-1.5" />
                            <span className="text-gray-800">{book.chapters} Chapters</span>
                          </div>
                          <div className="flex items-center bg-white/70 backdrop-blur-sm rounded-full px-3 py-1.5 border border-gray-200">
                            <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500 mr-1.5" />
                            <span className="text-gray-800">{book.rating.toFixed(1)}</span>
                          </div>
                          <div className="flex items-center bg-white/70 backdrop-blur-sm rounded-full px-3 py-1.5 border border-gray-200">
                            <Clock className="h-3.5 w-3.5 text-gray-600 mr-1.5" />
                            <span className="text-gray-800">~{Math.round(book.chapters * 8)} min</span>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-3 pt-2">
                          <Link href={`/read/${book.id}?chapter=1`}>
                            <Button className="bg-red-600 hover:bg-red-700 text-white text-sm rounded-full px-5">
                              Start Reading
                            </Button>
                          </Link>
                          <Link href={`/books/${book.id}`}>
                            <Button variant="outline" className="bg-white/70 backdrop-blur-sm border-gray-300 text-gray-700 hover:bg-gray-100 text-sm rounded-full px-4">
                              View Details
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>

            {/* Custom navigation arrows */}
            <div className="absolute left-3 top-1/2 -translate-y-1/2 z-20">
              <CarouselPrevious className="bg-white/80 backdrop-blur-sm border border-gray-200 text-gray-800 hover:bg-gray-100 shadow-sm" />
            </div>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 z-20">
              <CarouselNext className="bg-white/80 backdrop-blur-sm border border-gray-200 text-gray-800 hover:bg-gray-100 shadow-sm" />
            </div>
          </Carousel>

          {/* Indicators with transparent background */}
          <div className="flex justify-center gap-1.5 py-3 bg-transparent relative z-10">
            {heroBooks.map((_, index) => (
              <button
                key={index}
                className={`h-1.5 rounded-sm transition-all ${
                  index === activeIndex ? "w-8 bg-red-600" : "w-5 bg-gray-400/50 hover:bg-gray-400"
                }`}
                onClick={() => api?.scrollTo(index)}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}