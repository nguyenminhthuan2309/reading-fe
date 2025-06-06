"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { BookCard } from "./book-card";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useUserStore } from "@/lib/store";
import { Book } from "@/models";

interface SectionCarouselProps {
  title: string;
  books: Book[];
  linkHref: string;
  className?: string;
  isLoading?: boolean;
}

export function SectionCarousel({ title, books, linkHref, className, isLoading = false }: SectionCarouselProps) {
  const isFirstSection = title === "Recently Viewed";
  const { user } = useUserStore();
  
  // Don't render if not loading and no books
  if (!isLoading && (!books || books.length === 0)) {
    return null;
  }
  
  return (
    <section className={cn(isFirstSection ? "pt-1 pb-4 group" : "py-6 group dark:bg-gray-900", className)}>
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-1">
          {/* Header with pill shape */}
          <div className="flex items-center">
            <div className="h-8 w-3 bg-gradient-to-b from-yellow-500 to-yellow-600 rounded-full mr-3 shadow-sm"></div>
            <h2 className="text-xl font-bold text-black dark:text-white">{title}</h2>
          </div>
          
          <Link href={linkHref} className="flex items-center gap-1 text-sm font-medium text-yellow-500 hover:text-yellow-600 dark:text-yellow-400 dark:hover:text-yellow-300 hover:underline group">
            View All <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
        
        <div className="carousel-section">
          <Carousel
            className="w-full cursor-grab active:cursor-grabbing"
            opts={{
              align: "start",
              dragFree: true,
              containScroll: false,
              loop: false,
            }}
          >
            <CarouselContent className="-ml-4 overflow-visible py-2 px-2">
              {isLoading ? (
                // Loading skeleton placeholders
                Array(5).fill(0).map((_, index) => (
                  <CarouselItem 
                    key={`skeleton-${index}`} 
                    className="pl-6 basis-full sm:basis-[45%] md:basis-[32%] lg:basis-[23%] xl:basis-[19%] p-2"
                  >
                    <div className="mx-1 rounded-xl overflow-hidden">
                      <div className="space-y-2">
                        <Skeleton className="h-56 w-full rounded-t-xl" />
                        <div className="p-3 space-y-2">
                          <Skeleton className="h-5 w-3/4" />
                          <Skeleton className="h-4 w-1/2" />
                          <div className="pt-2 flex gap-2">
                            <Skeleton className="h-4 w-12 rounded-full" />
                            <Skeleton className="h-4 w-12 rounded-full" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </CarouselItem>
                ))
              ) : (
                // Render actual book items
                books?.map((book) => (
                  <CarouselItem 
                    key={book.id} 
                    className="pl-6 basis-full sm:basis-[45%] md:basis-[32%] lg:basis-[23%] xl:basis-[19%] p-2"
                  >
                    <div className="transition-all duration-200 transform hover:scale-[1.02] mx-1 rounded-xl overflow-hidden hover:shadow-md h-full">
                      <BookCard
                        id={book.id}
                        title={book.title}
                        coverImage={book.cover}
                        author={book.author || "Unknown author"}
                        description={book.description}
                        chapters={book.totalChapters}
                        rating={book.rating || 0}
                        genres={book.categories}
                        readingProgress={book.readingProgress}
                        className="shadow-none h-full w-full"
                        isCreator={user?.id === book.author?.id }
                        isFollowed={book.isFollowed}
                      />
                    </div>
                  </CarouselItem>
                ))
              )}
            </CarouselContent>
          </Carousel>
        </div>
      </div>
    </section>
  );
} 