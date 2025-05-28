import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getUserReadingHistory } from "@/lib/api/books";
import { BOOK_KEYS } from "@/lib/constants/query-keys";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, BookOpen, Star, Clock, Eye, Play } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ReadingHistoryItem } from "@/models/book";

interface RecentlyReadBooksProps {
  limitPage?: number;
}

export function RecentlyReadBooks({ limitPage = 10 }: RecentlyReadBooksProps) {
  const [page, setPage] = useState(1);
  const [limit] = useState(limitPage);
  
  const { 
    data, 
    isLoading, 
    error 
  } = useQuery({
    queryKey: BOOK_KEYS.RECENTLY_READ,
    queryFn: async () => {
      const response = await getUserReadingHistory({
        page,
        limit
      });
      
      if (response.status !== 200) {
        throw new Error(response.msg || 'Failed to fetch reading history');
      }
      
      return response.data;
    }
  });
  
  if (isLoading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Last Read</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-12 w-9 rounded-sm" />
                    <Skeleton className="h-4 w-36" />
                  </div>
                </TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
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
          Failed to load reading history. {(error as Error).message}
        </p>
      </div>
    );
  }
  
  if (!data?.data?.length) {
    return (
      <div className="text-center py-10">
        <div className="flex justify-center mb-4">
          <Clock size={48} className="text-muted-foreground/50" />
        </div>
        <p className="text-muted-foreground">No recently read books.</p>
        <Link href="/books">
          <Button className="mt-4">Browse Books</Button>
        </Link>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Last Read</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.data.map((item: ReadingHistoryItem) => (
              <TableRow key={item.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="relative h-12 w-9 rounded overflow-hidden">
                      <img 
                        src={item.cover || "/placeholder-book.png"} 
                        alt={item.title} 
                        className="object-cover h-full w-full"
                      />
                    </div>
                    <div>
                      <Link href={`/books/${item.id}`} className="font-medium hover:underline hover:text-destructive">
                        {item.title}
                      </Link>
                      <div className="text-xs text-muted-foreground">by {item.author.name}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {item.chaptersRead[0]?.lastReadAt ? format(new Date(item.chaptersRead[0].lastReadAt), 'MMM d, yyyy') : 'N/A'}
                </TableCell>
                <TableCell>
                  {Math.round((item.chaptersRead.length / item.totalChapters) * 100)}%
                </TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400 mr-1" />
                    <span>{item.rating?.toFixed(1) || "N/A"}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-2">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/books/${item.id}`}>
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">View</span>
                      </Link>
                    </Button>
                    {item.chaptersRead.length > 0 && (
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/books/${item.id}/read/?chapter=${item.chaptersRead[0].chapter}&id=${item.chaptersRead[0].id}`}>
                          <Play className="h-4 w-4" />
                          <span className="sr-only">Continue Reading</span>
                        </Link>
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
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