"use client";

import { getRelatedBooks } from "@/lib/mock-data";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Star, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Genre } from "@/models/genre";

// Define BookType to match the expected structure
type BookType = {
  id: string;
  title: string;
  author: string;
  description: string;
  coverImage: string;
  chapters: number;
  rating: number;
  genre: Genre;
  progress?: number;
};

export function RelatedBooks({ bookId, compactView = false }: { bookId: string; compactView?: boolean }) {
  const [relatedBooks, setRelatedBooks] = useState<BookType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // In a real app, this would be an API call
    // Use a different limit based on view mode
    const limit = compactView ? 5 : 4;
    const books = getRelatedBooks(bookId, limit);
    setRelatedBooks(books);
    setIsLoading(false);
  }, [bookId, compactView]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {!compactView && <h2 className="text-2xl font-bold">Related Books</h2>}
        <div className="text-center py-8 text-muted-foreground">
          Loading related books...
        </div>
      </div>
    );
  }

  if (relatedBooks.length === 0) {
    return (
      <div className="space-y-4">
        {!compactView && <h2 className="text-2xl font-bold">Related Books</h2>}
        <div className="text-center py-8 text-muted-foreground">
          No related books found.
        </div>
      </div>
    );
  }

  if (compactView) {
    return (
      <div className="space-y-6">
        {relatedBooks.map((book) => (
          <NewCompactBookCard key={book.id} book={book} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Related Books</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {relatedBooks.map((book) => (
          <RelatedBookCard key={book.id} book={book} />
        ))}
      </div>
    </div>
  );
}

// New compact book card that matches the reference design
function NewCompactBookCard({ book }: { book: BookType }) {
  return (
    <div className="flex gap-4">
      {/* Book cover */}
      <div className="w-20 h-28 flex-shrink-0">
        <Link href={`/books/${book.id}`}>
          <div className="relative w-full h-full rounded overflow-hidden">
            <Image
              src={book.coverImage}
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
          {book.author}
        </p>
        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
          {book.genre === "Fantasy" 
            ? "Pioneer in the world of commercial magazine fiction, he was one of the first writers to become a worldwide..." 
            : "This book explores themes of human nature, society, and the complexity of interpersonal relationships..."}
        </p>
        <Link href={`/books/${book.id}`}>
          <Button variant="link" className="text-xs text-blue-400 h-auto p-0 mt-2">View details</Button>
        </Link>
      </div>
    </div>
  );
}

// Compact version of the book card for sidebar display
function CompactBookCard({ book }: { book: BookType }) {
  return (
    <Link href={`/books/${book.id}`}>
      <div className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors">
        {/* Small book cover */}
        <div className="relative w-16 h-20 rounded overflow-hidden flex-shrink-0">
          <Image
            src={book.coverImage}
            alt={book.title}
            fill
            className="object-cover"
          />
        </div>
        
        {/* Book info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm leading-tight line-clamp-2">
            {book.title}
          </h3>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
            by {book.author}
          </p>
          <div className="flex items-center mt-1.5">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={12}
                  className={`${
                    i < book.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                  }`}
                />
              ))}
            </div>
            <span className="text-xs ml-1">{book.rating.toFixed(1)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

// Simplified version of BookCard to avoid TypeScript errors
function RelatedBookCard({ book }: { book: BookType }) {
  return (
    <div className="flex flex-col rounded-xl overflow-hidden border border-gray-200 bg-white">
      {/* Cover image container with padding */}
      <div className="p-3 pt-4">
        <div className="relative aspect-[3/4] w-full rounded-lg overflow-hidden shadow-sm">
          <Image
            src={book.coverImage}
            alt={book.title}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute top-3 left-3 z-10">
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-600/80 text-white uppercase font-bold">
              {book.genre}
            </span>
          </div>
        </div>
      </div>
      
      {/* Basic info below the cover */}
      <div className="px-4 pb-4">
        <Link href={`/books/${book.id}`}>
          <h3 className="font-medium text-gray-900 leading-tight line-clamp-1 hover:text-red-600 transition-colors">
            {book.title}
          </h3>
        </Link>
        <p className="text-xs text-gray-600 mt-1">by {book.author}</p>
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center space-x-2">
            <div className="flex items-center">
              <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
              <span className="text-xs ml-1 text-gray-700">{book.rating.toFixed(1)}</span>
            </div>
            <span className="text-gray-400 text-xs">•</span>
            <div className="flex items-center">
              <BookOpen className="h-3.5 w-3.5 text-gray-500" />
              <span className="text-xs ml-1 text-gray-700">{book.chapters} Ch</span>
            </div>
          </div>
        </div>
        
        {/* Action button */}
        <div className="mt-3">
          <Link href={`/books/${book.id}`} className="w-full">
            <Button variant="destructive" size="sm" className="w-full text-xs h-8 rounded-lg">
              View Book
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
} 