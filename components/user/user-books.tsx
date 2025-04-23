import React, { useState } from "react";
import { useUserBooks } from "@/lib/hooks/useUserBooks";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useUserStore } from "@/lib/store";
import { BookCard } from "@/components/books/book-card";

type BookFilter = "all" | "inProgress" | "created" | "completed";

interface UserBooksProps {
  userId: string;
  filter?: BookFilter;
}

export function UserBooks({ userId, filter = "all" }: UserBooksProps) {
  const [page, setPage] = useState(1);
  const [limit] = useState(12);
  const { user } = useUserStore();
  
  const { 
    data, 
    isLoading, 
    error 
  } = useUserBooks(userId, page, limit, filter);
  
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="space-y-3">
            <Skeleton className="h-[200px] w-full rounded-md" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="rounded-md bg-destructive/15 p-4">
        <div className="flex items-center">
          <AlertCircle className="h-4 w-4 text-destructive mr-2" />
          <h3 className="font-medium text-destructive">Error</h3>
        </div>
        <p className="text-destructive text-sm mt-2">
          Failed to load books. {(error as Error).message}
        </p>
      </div>
    );
  }
  
  if (!data?.data.length) {
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground">No books found.</p>
        {filter !== "all" && (
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-4"
            onClick={() => window.location.href = `?section=shelf`}
          >
            View All Books
          </Button>
        )}
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {data.data.map((book) => (
          <div key={book.id} className="flex h-full w-full">
            <BookCard
              id={book.id}
              title={book.title}
              author={book.author}
              description={book.description || ""}
              coverImage={book.cover}
              chapters={book.totalChapters || 0}
              rating={book.rating || 0}
              genres={book.categories || []}
              progress={0}
              isCreator={user?.id === book.author.id}
              isFollowed={book.isFollowed}
              className="w-full"
            />
          </div>
        ))}
      </div>
      
      {data.totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <PaginationControl
            currentPage={page}
            totalPages={data.totalPages}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
}

// Simple pagination component
function PaginationControl({
  currentPage,
  totalPages,
  onPageChange
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
      >
        Previous
      </Button>
      
      <span className="text-sm">
        Page {currentPage} of {totalPages}
      </span>
      
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
      >
        Next
      </Button>
    </div>
  );
} 