"use client";

import { useRouter } from "next/navigation";
import { BookForm } from "@/components/books/book-form";


export default function CreateBookPage() {
  const router = useRouter();

  // Handle successful book creation
  const handleBookCreated = (bookId: number) => {
    // Navigate to the book details page
    router.push(`/books/${bookId}`);
  };

  return (
    <div className="container mx-auto px-4 py-8 pt-4">
      <BookForm onSuccess={handleBookCreated} />
    </div>
  );
} 