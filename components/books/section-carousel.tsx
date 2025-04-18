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
    <section className={cn(isFirstSection ? "pt-1 pb-4 group" : "py-4 group", className)}>
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-1">
          <h2 className="text-xl font-bold text-black">{title}</h2>
          <Link href={linkHref} className="flex items-center gap-1 text-sm text-red-500 hover:text-red-600 hover:underline">
            View All <ChevronRight className="h-4 w-4" />
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
              {books.slice(0, 10).map((book) => (
                <CarouselItem 
                  key={book.id} 
                  className="pl-6 basis-full sm:basis-[45%] md:basis-[32%] lg:basis-[23%] xl:basis-[19%] p-2"
                >
                  <div className="transition-all duration-200 transform hover:scale-105 mx-1">
                    <BookCard
                      id={book.id}
                      title={book.title}
                      author={book.author}
                      description={book.description}
                      chapters={book.chapters}
                      rating={book.rating}
                      genre={book.genre}
                      progress={book.progress}
                      className="border-0 bg-white shadow-none"
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