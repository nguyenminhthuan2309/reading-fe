"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import { Star, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Book } from "@/models/book";
import { getRelatedBooks } from "@/lib/api/books";
import { BOOK_KEYS } from "@/lib/constants/query-keys";
export function RelatedBooks({ bookId, compactView = false }: { bookId: string; compactView?: boolean }) {
  const limit = compactView ? 5 : 4;
  const page = 1;

  // Use React Query to fetch related books
  const {
    data: relatedBooksData,
    isLoading,
    error
  } = useQuery({
    queryKey: BOOK_KEYS.RELATED(bookId, page, limit),
    queryFn: async () => {
      const response = await getRelatedBooks({
        bookId: Number(bookId),
        page,
        limit
      });
      
      if (response.status !== 200) {
        throw new Error(response.msg || 'Failed to fetch related books');
      }
      
      return response.data;
    },
    enabled: !!bookId,
  });

  // If loading, show skeleton
  if (isLoading) {
    return (
      <div className="space-y-4">
        {!compactView && <h2 className="text-2xl font-bold">Related Books</h2>}
        {compactView ? (
          // Compact view skeleton (sidebar)
          <div className="space-y-6">
            {[...Array(limit)].map((_, i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="w-20 h-28 rounded" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="h-3 w-1/4 mt-1" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Grid view skeleton
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(limit)].map((_, i) => (
              <div key={i} className="flex flex-col rounded-xl overflow-hidden border border-gray-200 bg-white p-3">
                <Skeleton className="aspect-[3/4] w-full rounded-lg" />
                <div className="pt-3 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                  <div className="flex justify-between">
                    <div className="flex gap-2">
                      <Skeleton className="h-3 w-8" />
                      <Skeleton className="h-3 w-8" />
                    </div>
                  </div>
                  <Skeleton className="h-8 w-full mt-1 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // If error, show message
  if (error) {
    return (
      <div className="space-y-4">
        {!compactView && <h2 className="text-2xl font-bold">Related Books</h2>}
        <div className="text-center py-8 text-destructive">
          Error loading related books. Please try again later.
        </div>
      </div>
    );
  }

  // If no related books found
  if (!relatedBooksData?.data || relatedBooksData.data.length === 0) {
    return (
      <div className="space-y-4">
        {!compactView && <h2 className="text-2xl font-bold">Related Books</h2>}
        <div className="text-center py-8 text-muted-foreground">
          No related books found.
        </div>
      </div>
    );
  }

  // Render appropriate view
  if (compactView) {
    return (
      <div className="space-y-6">
        {relatedBooksData.data.map((book) => (
          <NewCompactBookCard key={book.id} book={book} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Related Books</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {relatedBooksData.data.map((book) => (
          <RelatedBookCard key={book.id} book={book} />
        ))}
      </div>
    </div>
  );
}

// New compact book card that matches the reference design
function NewCompactBookCard({ book }: { book: Book }) {
  return (
    <div className="flex gap-4">
      {/* Book cover */}
      <div className="w-20 h-28 flex-shrink-0">
        <Link href={`/books/${book.id}`}>
          <div className="relative w-full h-full rounded overflow-hidden">
            <Image
              src={book.cover}
              alt={book.title}
              fill
              className="object-cover"
            />
          </div>
        </Link>
      </div>
      
      {/* Book details */}
      <div className="flex-1">
        <Link href={`/books/${book.id}`}>
          <h3 className="font-medium text-base hover:text-blue-600 transition-colors line-clamp-2">
            {book.title}
          </h3>
        </Link>
        <p className="text-sm text-gray-600 mt-1">
          {book.author.name}
        </p>
        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
          {book.description.length > 120 ? `${book.description.substring(0, 120)}...` : book.description}
        </p>
        <Link href={`/books/${book.id}`}>
          <Button variant="link" className="text-xs text-blue-400 h-auto p-0 mt-2">View details</Button>
        </Link>
      </div>
    </div>
  );
}

// Simplified version of BookCard for grid display
function RelatedBookCard({ book }: { book: Book }) {
  return (
    <div className="flex flex-col rounded-xl overflow-hidden border border-gray-200 bg-white">
      {/* Cover image container with padding */}
      <div className="p-3 pt-4">
        <div className="relative aspect-[3/4] w-full rounded-lg overflow-hidden shadow-sm">
          <Image
            src={book.cover}
            alt={book.title}
            fill
            className="object-cover"
            priority
          />
          {book.categories && book.categories.length > 0 && (
            <div className="absolute top-3 left-3 z-10">
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-yellow-600/80 text-white uppercase font-bold">
                {book.categories[0].name}
              </span>
            </div>
          )}
        </div>
      </div>
      
      {/* Basic info below the cover */}
      <div className="px-4 pb-4">
        <Link href={`/books/${book.id}`}>
          <h3 className="font-medium text-gray-900 leading-tight line-clamp-1 hover:text-yellow-600 transition-colors">
            {book.title}
          </h3>
        </Link>
        <p className="text-xs text-gray-600 mt-1">by {book.author.name}</p>
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center space-x-2">
            <div className="flex items-center">
              <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
              <span className="text-xs ml-1 text-gray-700">{book.rating.toFixed(1)}</span>
            </div>
            <span className="text-gray-400 text-xs">•</span>
            <div className="flex items-center">
              <BookOpen className="h-3.5 w-3.5 text-gray-500" />
              <span className="text-xs ml-1 text-gray-700">{book.totalChapters} Ch</span>
            </div>
          </div>
        </div>
        
        {/* Action button */}
        <div className="mt-3">
          <Link href={`/books/${book.id}`} className="w-full">
            <Button variant="default" size="sm" className="w-full text-xs h-8 rounded-lg bg-yellow-600 hover:bg-yellow-700 text-white">
              View Book
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
} 