"use client";

import React, { useState, useEffect } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { BookCard } from "./book-card";
import { featuredBooks } from "@/lib/mock-data";

export function BookCarousel() {
  const [api, setApi] = useState<CarouselApi>();
  const [activeIndex, setActiveIndex] = useState(1); // Start with second book (index 1)
  const [visibleCount, setVisibleCount] = useState(3);

  // Monitor window size and set visible count
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1280) {
        setVisibleCount(3);
      } else if (window.innerWidth >= 768) {
        setVisibleCount(3);
      } else {
        setVisibleCount(1);
      }
    };
    
    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    if (!api) return;

    // Set initial position to the second slide
    api.scrollTo(1);

    const handleSelect = () => {
      setActiveIndex(api.selectedScrollSnap());
    };

    api.on("select", handleSelect);
    return () => {
      api.off("select", handleSelect);
    };
  }, [api]);

  // Take the first 3 books for the carousel
  const carouselBooks = featuredBooks.slice(0, 3);

  return (
    <div className="bg-black text-white h-[70vh] flex flex-col justify-center">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-5xl font-bold mb-8 pl-4">
          BEST NEW MANGA IN <span className="text-red-600">2025</span>
        </h2>
        <div className="relative">
          <Carousel 
            className="w-full mx-auto overflow-visible" 
            setApi={setApi}
            opts={{
              align: "center",
              loop: true,
              startIndex: 1, // Start with the second item
            }}
          >
            <CarouselContent className="-ml-2 md:-ml-3">
              {carouselBooks.map((book, index) => (
                <CarouselItem 
                  key={book.id} 
                  className={`
                    ${visibleCount === 3 ? 
                      'pl-2 md:pl-3 basis-full sm:basis-1/3 md:basis-1/3 lg:basis-1/3' : 
                      'pl-2 basis-full'
                    } 
                    transition-opacity duration-300
                  `}
                >
                  <div className="px-1">
                    <div 
                      className={`
                        transition-all duration-500 transform-gpu 
                        ${activeIndex === index 
                          ? "scale-110 z-10" 
                          : "scale-90 opacity-60"
                        }
                      `}
                    >
                      <BookCard
                        id={book.id}
                        title={book.title}
                        author={book.author}
                        description={book.description}
                        chapters={book.chapters}
                        rating={book.rating}
                        genre={book.genre}
                        progress={book.progress}
                        showPreview={false}
                        className="bg-transparent border-0 shadow-none h-[350px]"
                      />
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <div className="absolute left-4 top-1/2 -translate-y-1/2 z-20">
              <CarouselPrevious className="bg-black/40 border-0 text-white hover:bg-black/60" />
            </div>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20">
              <CarouselNext className="bg-black/40 border-0 text-white hover:bg-black/60" />
            </div>
          </Carousel>
        </div>
        <div className="flex justify-center mt-6 gap-2 pb-3">
          {carouselBooks.map((_, index) => (
            <div 
              key={index} 
              className={`w-5 h-1.5 rounded-full cursor-pointer transition-all ${index === activeIndex ? 'bg-red-600 w-7' : 'bg-gray-500'}`}
              onClick={() => api?.scrollTo(index)}
            />
          ))}
        </div>
      </div>
    </div>
  );
} 