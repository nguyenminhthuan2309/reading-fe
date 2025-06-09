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
      <div className="relative border-b border-gray-200 dark:border-gray-700 bg-[#FFB371] dark:bg-gray-900">
        <div className="container mx-auto px-4 py-6">
          <div className="overflow-hidden">
            <div className="h-auto min-h-[500px] md:h-[480px]">
              <div className="relative w-full h-full overflow-visible">
                <div className="relative h-auto min-h-[500px] md:h-full container mx-auto px-4 flex flex-col md:flex-row items-center justify-center gap-6 py-6">
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
    <div className="relative border-b border-gray-200 dark:border-gray-700 bg-[#FFB371] dark:bg-gray-900">
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
            <CarouselContent className="h-auto min-h-[500px] md:h-[480px]">
              {heroBooks.map((book, index) => (
                <CarouselItem key={book.id} className="pt-0 h-full">
                  <div className="relative w-full h-full overflow-hidden rounded-2xl border-4 border-orange-400">
                    {/* Background cover image - light mode only */}
                    <div className="absolute inset-0 w-full h-full dark:hidden">
                      <Image
                        src={book.cover}
                        alt=""
                        fill
                        className="object-cover object-top"
                        priority
                      />
                      {/* Overlay to ensure text readability */}
                      <div className="absolute inset-0 bg-black/20"></div>
                    </div>
                    {/* Content container with gradient overlay */}
                    <div className="relative h-auto min-h-[500px] md:h-full container mx-auto px-4 flex flex-col md:flex-row items-center justify-center gap-6 py-6 z-10">
                      {/* Book info box - light mode only */}
                      <div className="w-full md:w-2/3 order-2 md:order-1">
                        {/* Light mode - Yellow info box */}
                        <div className="bg-yellow-100/95 backdrop-blur-sm rounded-2xl p-6 md:p-8 max-w-lg shadow-xl border border-yellow-200/50 dark:hidden">
                          <div className="space-y-4">
                            <div>
                              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 leading-tight">
                                {book.title}
                              </h1>
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-sm text-gray-700">by {book.author.name}</p>
                                <span className="text-gray-400">•</span>
                                <div className="flex flex-wrap gap-1">
                                  {book.categories.map((genre) => (
                                    <span key={genre.id} className="px-2 py-0.5 bg-orange-500 text-white text-xs font-medium uppercase rounded-full">
                                      {genre.name}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>

                            <p className="text-gray-800 leading-relaxed text-sm line-clamp-3">
                              {book.description}
                            </p>

                            <div className="flex flex-wrap gap-3 text-xs">
                              <div className="flex items-center bg-white/80 rounded-full px-3 py-1.5 border border-gray-200">
                                <BookOpen className="h-3 w-3 text-gray-600 mr-1.5" />
                                <span className="text-gray-800">{book.totalChapters} Chapters</span>
                              </div>
                              <div className="flex items-center bg-white/80 rounded-full px-3 py-1.5 border border-gray-200">
                                <Star className="h-3 w-3 text-yellow-500 fill-yellow-500 mr-1.5" />
                                <span className="text-gray-800">{book.rating.toFixed(1)}</span>
                              </div>
                              <div className="flex items-center bg-white/80 rounded-full px-3 py-1.5 border border-gray-200">
                                <Clock className="h-3 w-3 text-gray-600 mr-1.5" />
                                <span className="text-gray-800">~{Math.round(book.totalChapters * 8)} min</span>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-3 pt-2">
                              <Link href={`/books/${book.id}/read?chapter=${book.readingProgress?.lastReadChapterNumber}&id=${book.readingProgress?.lastReadChapterId}`}>
                                <Button className="bg-orange-600 hover:bg-orange-700 text-white text-sm rounded-full px-5 py-2">
                                  Start Reading
                                </Button>
                              </Link>
                              <Link href={`/books/${book.id}`}>
                                <Button variant="outline" className="bg-white/80 border-gray-300 text-gray-700 hover:bg-gray-100 text-sm rounded-full px-4 py-2">
                                  View Details
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </div>

                        {/* Dark mode - Original styling */}
                        <div className="hidden dark:block space-y-4 text-center md:text-left">
                          <div>
                            <h1 className="text-3xl md:text-5xl font-bold text-yellow-600 dark:text-yellow-400 mb-2 leading-tight text-shadow-sm">
                              {book.title}
                            </h1>
                            <div className="flex flex-wrap items-center gap-2 justify-center md:justify-start">
                              <p className="text-base text-gray-700 dark:text-gray-300 text-shadow-xs">by {book.author.name}</p>
                              <span className="text-gray-400">•</span>
                              <div className="flex flex-wrap gap-1">
                                {book.categories.map((genre) => (
                                  <span key={genre.id} className="px-2 py-0.5 bg-yellow-500/80 text-white text-xs font-medium uppercase rounded-full">
                                    {genre.name}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>

                          <p className="text-gray-800 dark:text-gray-200 max-w-[600px] mx-auto md:mx-0 leading-relaxed text-base md:text-lg line-clamp-3 text-shadow-xs break-words">
                            {book.description}
                          </p>

                          <div className="flex flex-wrap gap-4 justify-center md:justify-start text-sm">
                            <div className="flex items-center bg-white/70 dark:bg-gray-800/80 backdrop-blur-sm rounded-full px-4 py-2 border border-gray-200 dark:border-gray-600">
                              <BookOpen className="h-4 w-4 text-gray-600 dark:text-gray-400 mr-2" />
                              <span className="text-gray-800 dark:text-gray-200">{book.totalChapters} Chapters</span>
                            </div>
                            <div className="flex items-center bg-white/70 dark:bg-gray-800/80 backdrop-blur-sm rounded-full px-4 py-2 border border-gray-200 dark:border-gray-600">
                              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 mr-2" />
                              <span className="text-gray-800 dark:text-gray-200">{book.rating.toFixed(1)}</span>
                            </div>
                            <div className="flex items-center bg-white/70 dark:bg-gray-800/80 backdrop-blur-sm rounded-full px-4 py-2 border border-gray-200 dark:border-gray-600">
                              <Clock className="h-4 w-4 text-gray-600 dark:text-gray-400 mr-2" />
                              <span className="text-gray-800 dark:text-gray-200">~{Math.round(book.totalChapters * 8)} min</span>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-4 pt-2 justify-center md:justify-start">
                            <Link href={`/books/${book.id}/read?chapter=${book.readingProgress?.lastReadChapterNumber}&id=${book.readingProgress?.lastReadChapterId}`}>
                              <Button className="bg-yellow-600 hover:bg-yellow-700 text-white text-base rounded-full px-6 py-3">
                                Start Reading
                              </Button>
                            </Link>
                            <Link href={`/books/${book.id}`}>
                              <Button variant="outline" className="bg-white/70 dark:bg-gray-800/80 backdrop-blur-sm border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/80 text-base rounded-full px-5 py-3">
                                View Details
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </div>

                      {/* Book cover - enhanced 3D effects */}
                      <div className="w-full max-w-[220px] md:max-w-[300px] md:w-1/3 flex-shrink-0 relative order-1 md:order-2">
                        {/* Background image pattern */}
                        <div className="absolute inset-0 opacity-15 bg-gradient-to-br from-orange-200/30 via-yellow-100/20 to-amber-200/30 backdrop-blur-sm"></div>
                        {/* Custom shape background - enhanced */}
                        <div className="absolute inset-0 transform rotate-8 scale-115">
                          <div className="w-full h-full bg-gradient-to-br from-yellow-100 via-yellow-200 to-yellow-300 dark:from-yellow-900/25 dark:via-yellow-800/20 dark:to-yellow-700/15 rounded-2xl opacity-20"></div>
                        </div>
                        <div className="absolute inset-0 transform -rotate-4 scale-108">
                          <div className="w-full h-full bg-gradient-to-tl from-yellow-200 via-yellow-300 to-yellow-400 dark:from-yellow-800/20 dark:via-yellow-700/15 dark:to-yellow-600/12 rounded-xl opacity-16"></div>
                        </div>
                        <div className="absolute inset-0 transform rotate-2 scale-103">
                          <div className="w-full h-full bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-500 dark:from-yellow-700/15 dark:via-yellow-600/12 dark:to-yellow-500/8 rounded-lg opacity-12"></div>
                        </div>
                        
                        {/* 3D Book cover - enhanced effects */}
                        <div className="relative aspect-[3/4] rounded-lg overflow-hidden transform transition-all duration-600 hover:scale-108 hover:rotate-y-18 group perspective-1200">
                          {/* Book spine shadow - enhanced */}
                          <div className="absolute top-0 right-0 w-4 h-full bg-gradient-to-r from-transparent via-black/12 to-black/25 transform translate-x-full group-hover:translate-x-2.5 transition-transform duration-600 rounded-r-lg z-10"></div>
                          
                          {/* Main book cover */}
                          <div className="relative w-full h-full rounded-lg overflow-hidden shadow-2xl transform-gpu transition-all duration-600 group-hover:shadow-enhanced">
                            {/* Book cover image */}
                            <Image
                              src={book.cover}
                              alt={book.title}
                              fill
                              className="object-cover transition-transform duration-600 group-hover:scale-112"
                              priority
                            />
                            
                            {/* 3D highlight effect - enhanced */}
                            <div className="absolute inset-0 bg-gradient-to-br from-white/18 via-transparent to-black/18 pointer-events-none"></div>
                            
                            {/* Gloss effect - enhanced */}
                            <div className="absolute top-0 left-0 w-2/5 h-full bg-gradient-to-r from-white/35 via-white/18 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1100 ease-out pointer-events-none"></div>
                            
                            {/* Additional depth shadow */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/8 via-transparent to-transparent pointer-events-none"></div>
                          </div>
                          
                          {/* Book thickness/depth - enhanced */}
                          <div className="absolute top-0 right-0 w-3 h-full bg-gradient-to-r from-gray-300 via-gray-500 to-gray-700 dark:from-gray-500 dark:via-gray-700 dark:to-gray-800 transform translate-x-full group-hover:translate-x-1.5 transition-transform duration-600 rounded-r-md shadow-lg z-20"></div>
                          
                          {/* Book pages effect - subtle */}
                          <div className="absolute top-0.5 right-0 w-2 h-[calc(100%-4px)] bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-400 dark:to-gray-500 transform translate-x-full group-hover:translate-x-1 transition-transform duration-600 rounded-r-sm shadow-sm z-15"></div>
                        </div>
                        
                        {/* Floating particles effect - enhanced */}
                        <div className="absolute inset-0 pointer-events-none overflow-hidden">
                          <div className="absolute top-1/4 left-1/4 w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse opacity-65"></div>
                          <div className="absolute top-3/4 right-1/4 w-2 h-2 bg-yellow-300 rounded-full animate-pulse opacity-45 animation-delay-500"></div>
                          <div className="absolute top-1/2 left-1/3 w-0.5 h-0.5 bg-yellow-500 rounded-full animate-pulse opacity-75 animation-delay-1000"></div>
                          <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-yellow-200 rounded-full animate-pulse opacity-50 animation-delay-1500"></div>
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
                  index === activeIndex ? "w-8 bg-yellow-600" : "w-5 bg-gray-400/50 dark:bg-gray-600/50 hover:bg-gray-400 dark:hover:bg-gray-500"
                }`}
                onClick={() => api?.scrollTo(index)}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
      <style jsx global>{`
        @keyframes spin-slow {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
        
        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-8px);
          }
        }
        
        .animate-spin-slow {
          animation: spin-slow 6s infinite linear;
        }
        
        .animate-bounce-slow {
          animation: bounce-slow 3s infinite ease-in-out;
        }
        
        .animation-delay-500 {
          animation-delay: 0.5s;
        }
        
        .animation-delay-1000 {
          animation-delay: 1s;
        }
        
        .animation-delay-1500 {
          animation-delay: 1.5s;
        }
        
        .perspective-1200 {
          perspective: 1200px;
        }
        
        .hover\\:rotate-y-18:hover {
          transform: rotateY(18deg) scale(1.08);
        }
        
        .transform-gpu {
          transform: translateZ(0);
        }
        
        .hover\\:scale-108:hover {
          transform: scale(1.08);
        }
        
        .group-hover\\:scale-112:hover {
          transform: scale(1.12);
        }
        
        .scale-108 {
          transform: scale(1.08);
        }
        
        .scale-103 {
          transform: scale(1.03);
        }
        
        .scale-115 {
          transform: scale(1.15);
        }
        
        .z-15 {
          z-index: 15;
        }
        
        .shadow-enhanced {
          box-shadow: 0 30px 60px -12px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(255, 255, 255, 0.12), 0 12px 40px rgba(0, 0, 0, 0.15);
        }
      `}</style>
    </div>
  );
}