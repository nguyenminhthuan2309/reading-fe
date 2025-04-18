"use client";

import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { featuredBooks } from "@/lib/mock-data";
import Image from "next/image";
import { BookOpen, ChevronLeft, Star } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";

export default function BookPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  
  // Client-side state
  const [book, setBook] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Move data fetching to client-side
  useEffect(() => {
    // Find the book with the matching ID
    const foundBook = featuredBooks.find(book => book.id === id);
    setBook(foundBook);
    setIsLoading(false);
  }, [id]);
  
  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12 flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }
  
  // If book not found, show an error message
  if (!book) {
    return (
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold">Book not found</h1>
        <p className="mt-2">The book you are looking for does not exist.</p>
        <div className="mt-3">
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={() => router.back()}
          >
            <ChevronLeft size={16} />
            Back
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back button */}
      <div className="mb-3">
        <Button 
          variant="link" 
          className="flex items-center gap-2 py-1 pl-0"
          onClick={() => router.back()}
        >
          <ChevronLeft size={16} />
          Back
        </Button>
      </div>
      
      <div className="flex flex-col md:flex-row gap-8">
        {/* Book cover */}
        <div className="w-full md:w-1/3 lg:w-1/4">
          <div className="relative aspect-[2/3] w-full rounded-lg overflow-hidden shadow-lg">
            <Image
              src={book.coverImage}
              alt={book.title}
              fill
              className="object-cover"
              priority
            />
          </div>
        </div>
        
        {/* Book details */}
        <div className="flex-1">
          <div className="space-y-4">
            <div>
              <span className="inline-block bg-primary/10 text-primary text-xs px-3 py-1 rounded-full">
                {book.genre}
              </span>
            </div>
            
            <h1 className="text-3xl md:text-4xl font-bold">{book.title}</h1>
            <p className="text-muted-foreground">by {book.author}</p>
            
            <div className="flex items-center gap-2">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={16}
                    className={`${
                      i < book.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm">{book.rating.toFixed(1)}</span>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <BookOpen size={16} />
              <span>{book.chapters} Chapters</span>
            </div>
            
            <div className="pt-2">
              <h2 className="text-xl font-semibold mb-2">Description</h2>
              <p className="text-muted-foreground">{book.description}</p>
            </div>
            
            <div className="pt-4">
              <Link href={`/read/${book.id}?chapter=1`}>
                <Button className="w-full md:w-auto" size="lg">
                  Read First Chapter
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* Chapters section */}
      <div className="mt-3">
        <h2 className="text-2xl font-bold mb-4">Chapters</h2>
        <div className="grid gap-2">
          {Array.from({ length: book.chapters }, (_, index) => (
            <div 
              key={index}
              className="p-4 border rounded-lg flex justify-between items-center hover:bg-accent/50 transition-colors"
            >
              <div>
                <span className="font-medium">Chapter {index + 1}</span>
                <p className="text-sm text-muted-foreground">
                  {index === 0 ? "The Beginning" : `Chapter ${index + 1}`}
                </p>
              </div>
              <Link href={`/read/${book.id}?chapter=${index + 1}`}>
                <Button variant="ghost" size="sm">
                  Read
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 