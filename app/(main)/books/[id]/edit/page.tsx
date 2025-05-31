"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getBookById } from "@/lib/api/books";
import { BookForm } from "@/components/books/book-form";
import { useUserStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { BOOK_KEYS, CHAPTER_KEYS } from "@/lib/constants/query-keys";
export default function EditBookPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useUserStore();
  const bookId = parseInt(params.id as string);
  const queryClient = useQueryClient();

  // Fetch book data
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: BOOK_KEYS.DETAIL(bookId.toString()),
    queryFn: async () => {
      const response = await getBookById(bookId);

      if (response.status !== 200) {
        throw new Error(response.msg || 'Failed to fetch book');
      }

      return response.data?.data?.[0]; // First item in the data array
    },
    retry: 1,
  });
  
  if (data && user && data.author.id !== +user.id) {
    toast.error("You don't have permission to edit this book");
    router.push(`/books/${bookId}`);
  }

  const handleSuccess = (bookId: number) => {
    queryClient.invalidateQueries({ queryKey: BOOK_KEYS.DETAIL(bookId.toString()), type: 'active' });
    queryClient.invalidateQueries({ queryKey: CHAPTER_KEYS.BOOK_CHAPTERS(bookId), type: 'active' });
    queryClient.invalidateQueries({ queryKey: CHAPTER_KEYS.LIST(bookId), type: 'active' });
    toast.success("Book updated successfully");
    router.push(`/books/${bookId}`);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 min-h-screen">
        <div className="flex justify-center items-center min-h-[300px]">
          <div className="animate-pulse text-lg dark:text-white">Loading book details...</div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container mx-auto px-4 py-8 min-h-screen">
        <div className="bg-destructive/15 dark:bg-red-900/20 p-4 rounded-md text-center my-8 border dark:border-red-800">
          <h2 className="text-lg font-medium text-destructive dark:text-red-400 mb-2">Error Loading Book</h2>
          <p className="text-destructive/90 dark:text-red-300">
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
    <div className="container mx-auto px-4 py-8 pt-4 min-h-screen">
      <div className="border border-secondary/90 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 shadow-sm p-6">
        <BookForm
          initialData={data}
          isEditing={true}
          onSuccess={handleSuccess}
        />
      </div>
    </div>
  );
} 