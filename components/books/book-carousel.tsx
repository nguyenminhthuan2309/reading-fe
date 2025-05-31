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
import { BookOpen, Star, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Book } from "@/models";

const textShadowStyles = {
  'text-shadow-xs': 'text-shadow: 0 1px 2px rgba(0,0,0,0.1);',
  'text-shadow-sm': 'text-shadow: 0 2px 4px rgba(0,0,0,0.1);',
  'text-shadow-md': 'text-shadow: 0 4px 8px rgba(0,0,0,0.12), 0 2px 4px rgba(0,0,0,0.08);',
};

interface BookCarouselProps {
  books: Book[] | undefined;
  isLoading?: boolean;
}

export function BookCarousel({ books, isLoading = false }: BookCarouselProps) {
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
  const heroBooks = books?.slice(0, 3) || [];

  // Show skeleton loading when loading or no books
  if (isLoading || !books || books.length === 0) {
    return (
      <div className="relative border-b border-gray-200 dark:border-gray-700 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-6">
          <div className="overflow-hidden">
            <div className="h-[400px] md:h-[480px]">
              <div className="relative w-full h-full overflow-hidden">
                <div className="relative h-full container mx-auto px-4 flex flex-col md:flex-row items-center justify-center gap-6 py-6">
                  {/* Book cover skeleton */}
                  <div className="w-full max-w-[180px] md:max-w-[240px] md:w-1/3 flex-shrink-0 relative">
                    <div className="relative aspect-[3/4] rounded-lg overflow-hidden shadow-lg">
                      <Skeleton className="w-full h-full" />
                    </div>
                  </div>

                  {/* Book details skeleton */}
                  <div className="w-full md:w-2/3 space-y-3 text-center md:text-left">
                    <div>
                      <div className="mb-1">
                        <Skeleton className="h-6 w-20 rounded-full mx-auto md:mx-0" />
                      </div>
                      <Skeleton className="h-8 md:h-12 w-3/4 mb-1 mx-auto md:mx-0" />
                      <Skeleton className="h-4 w-32 mx-auto md:mx-0" />
                    </div>

                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full max-w-[600px] mx-auto md:mx-0" />
                      <Skeleton className="h-4 w-5/6 max-w-[500px] mx-auto md:mx-0" />
                      <Skeleton className="h-4 w-4/6 max-w-[400px] mx-auto md:mx-0" />
                    </div>

                    <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                      <Skeleton className="h-8 w-24 rounded-full" />
                      <Skeleton className="h-8 w-20 rounded-full" />
                      <Skeleton className="h-8 w-28 rounded-full" />
                    </div>

                    <div className="flex flex-wrap gap-3 pt-2 justify-center md:justify-start">
                      <Skeleton className="h-10 w-32 rounded-full" />
                      <Skeleton className="h-10 w-28 rounded-full" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Skeleton indicators */}
            <div className="flex justify-center gap-1.5 py-3 bg-transparent relative z-10">
              {Array(3).fill(0).map((_, index) => (
                <Skeleton key={index} className="h-1.5 w-5 rounded-sm" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative border-b border-gray-200 dark:border-gray-700 dark:bg-gray-900">
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
                            src={book.cover}
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
                            {book.categories.map((genre) => <span key={genre.id} className="px-3 py-1 bg-red-600 text-white text-xs font-bold uppercase rounded-full">
                              {genre.name}
                            </span> )}
                          </div>
                          <h1 className="text-2xl md:text-4xl font-bold text-gray-800 dark:text-white mb-1 leading-tight text-shadow-sm">
                            {book.title}
                          </h1>
                          <p className="text-sm text-gray-700 dark:text-gray-300 text-shadow-xs">by {book.author.name}</p>
                        </div>

                        <p className="text-gray-800 dark:text-gray-200 max-w-[600px] mx-auto md:mx-0 leading-relaxed text-sm md:text-base line-clamp-3 text-shadow-xs break-words">
                          {book.description}
                        </p>

                        <div className="flex flex-wrap gap-4 justify-center md:justify-start text-xs">
                          <div className="flex items-center bg-white/70 dark:bg-gray-800/80 backdrop-blur-sm rounded-full px-3 py-1.5 border border-gray-200 dark:border-gray-600">
                            <BookOpen className="h-3.5 w-3.5 text-gray-600 dark:text-gray-400 mr-1.5" />
                            <span className="text-gray-800 dark:text-gray-200">{book.totalChapters} Chapters</span>
                          </div>
                          <div className="flex items-center bg-white/70 dark:bg-gray-800/80 backdrop-blur-sm rounded-full px-3 py-1.5 border border-gray-200 dark:border-gray-600">
                            <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500 mr-1.5" />
                            <span className="text-gray-800 dark:text-gray-200">{book.rating.toFixed(1)}</span>
                          </div>
                          <div className="flex items-center bg-white/70 dark:bg-gray-800/80 backdrop-blur-sm rounded-full px-3 py-1.5 border border-gray-200 dark:border-gray-600">
                            <Clock className="h-3.5 w-3.5 text-gray-600 dark:text-gray-400 mr-1.5" />
                            <span className="text-gray-800 dark:text-gray-200">~{Math.round(book.totalChapters * 8)} min</span>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-3 pt-2">
                          <Link href={`/books/${book.id}/read?chapter=${book.readingProgress?.lastReadChapterNumber}&id=${book.readingProgress?.lastReadChapterId}`}>
                            <Button className="bg-red-600 hover:bg-red-700 text-white text-sm rounded-full px-5">
                              Start Reading
                            </Button>
                          </Link>
                          <Link href={`/books/${book.id}`}>
                            <Button variant="outline" className="bg-white/70 dark:bg-gray-800/80 backdrop-blur-sm border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/80 text-sm rounded-full px-4">
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
              <CarouselPrevious className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/80 shadow-sm" />
            </div>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 z-20">
              <CarouselNext className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/80 shadow-sm" />
            </div>
          </Carousel>

          {/* Indicators with transparent background */}
          <div className="flex justify-center gap-1.5 py-3 bg-transparent relative z-10">
            {heroBooks.map((_, index) => (
              <button
                key={index}
                className={`h-1.5 rounded-sm transition-all ${
                  index === activeIndex ? "w-8 bg-red-600" : "w-5 bg-gray-400/50 dark:bg-gray-600/50 hover:bg-gray-400 dark:hover:bg-gray-500"
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