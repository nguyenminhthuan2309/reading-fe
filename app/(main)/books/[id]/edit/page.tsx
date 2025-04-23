"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getBookById } from "@/lib/api/books";
import { BookForm } from "@/components/books/book-form";
import { useUserStore } from "@/lib/store";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { BOOK_KEYS } from "@/lib/query-keys";
export default function EditBookPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useUserStore();
  const bookId = parseInt(params.id as string);
  
  // Fetch book data
  const { data, isLoading, error } = useQuery({
    queryKey: BOOK_KEYS.DETAIL(bookId),
    queryFn: async () => {
      const response = await getBookById(bookId);
      
      if (response.status !== 200) {
        throw new Error(response.msg || 'Failed to fetch book');
      }
      
      return response.data?.data?.[0]; // First item in the data array
    },
    retry: 1,
  });
  
  useEffect(() => {
    // Check if the user is the author of the book
    if (data && user && data.author.id !== +user.id) {
      toast.error("You don't have permission to edit this book");
      router.push(`/books/${bookId}`);
    }
  }, [data, user, router, bookId]);
  
  const handleSuccess = (bookId: number) => {
    toast.success("Book updated successfully");
    router.push(`/books/${bookId}`);
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-[300px]">
          <div className="animate-pulse text-lg">Loading book details...</div>
        </div>
      </div>
    );
  }
  
  if (error || !data) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-destructive/15 p-4 rounded-md text-center my-8">
          <h2 className="text-lg font-medium text-destructive mb-2">Error Loading Book</h2>
          <p className="text-destructive/90">
            {(error as Error)?.message || "This book couldn't be loaded or doesn't exist"}
          </p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => router.push('/books')}
          >
            Browse Books
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8 pt-4">
      <BookForm 
        initialData={data} 
        isEditing={true} 
        onSuccess={handleSuccess} 
      />
    </div>
  );
} 