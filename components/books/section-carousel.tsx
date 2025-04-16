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

interface SectionCarouselProps {
  title: string;
  books: any[];
  linkHref: string;
  className?: string;
}

export function SectionCarousel({ title, books, linkHref, className }: SectionCarouselProps) {
  const isFirstSection = title === "Recently Viewed";
  
  return (
    <section className={cn(isFirstSection ? "pt-4 pb-8 group" : "py-8 group", className)}>
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">{title}</h2>
          <Link href={linkHref} className="flex items-center gap-1 text-sm text-red-500 hover:text-red-400 hover:underline">
            View All <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        
        <div className="carousel-section">
          <Carousel
            className="w-full cursor-grab active:cursor-grabbing"
            opts={{
              align: "start",
              dragFree: true,
              containScroll: "trimSnaps",
              loop: false,
            }}
          >
            <CarouselContent className="-ml-4 overflow-visible py-5 px-2">
              {books.slice(0, 10).map((book) => (
                <CarouselItem key={book.id} className="pl-4 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/5 p-2">
                  <div className="transition-all duration-200 transform hover:scale-105">
                    <BookCard
                      id={book.id}
                      title={book.title}
                      author={book.author}
                      description={book.description}
                      chapters={book.chapters}
                      rating={book.rating}
                      genre={book.genre}
                      progress={book.progress}
                      className="border-0 shadow-none"
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>
      </div>
    </section>
  );
} 