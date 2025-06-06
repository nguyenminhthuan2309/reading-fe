import React, { useState } from "react";
import { useUserBooks } from "@/lib/hooks/useUserBooks";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, BookOpen, Edit, Star, Calendar, Filter } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useUserStore } from "@/lib/store";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AccessStatusEnum, ProgressStatusEnum, PROGRESS_STATUSES } from "@/models/book";

type BookFilter = "all" | "inProgress" | "created" | "completed";
type AccessStatusFilter = "all" | "published" | "draft" | "blocked" | "pending";
type ProgressStatusFilter = "all" | "ongoing" | "completed" | "dropped";

interface UserBooksProps {
  userId: number;
  filter?: BookFilter;
  limitPage?: number;
}

export function UserBooks({ userId, limitPage = 12 }: UserBooksProps) {
  const [page, setPage] = useState(1);
  const [limit] = useState(limitPage);
  const [accessStatusFilter, setAccessStatusFilter] = useState<AccessStatusFilter>("all");
  const [progressStatusFilter, setProgressStatusFilter] = useState<ProgressStatusFilter>("all");
  const { user } = useUserStore();
  
  // Map the access status filter to the actual accessStatusId
  const getAccessStatusId = (filter: AccessStatusFilter) => {
    switch (filter) {
      case "published":
        return AccessStatusEnum.PUBLISHED;
      case "draft":
        return AccessStatusEnum.PRIVATE;
      case "blocked":
        return AccessStatusEnum.BLOCKED;
      case "pending":
        return AccessStatusEnum.PENDING;
      default:
        return undefined;
    }
  };

  // Map the progress status filter to the actual progressStatusId
  const getProgressStatusId = (filter: ProgressStatusFilter) => {
    switch (filter) {
      case "ongoing":
        return ProgressStatusEnum.ONGOING;
      case "completed":
        return ProgressStatusEnum.COMPLETED;
      case "dropped":
        return ProgressStatusEnum.DROPPED;
      default:
        return undefined;
    }
  };
  
  const { 
    data, 
    isLoading, 
    error 
  } = useUserBooks(
    userId, 
    page, 
    limit, 
    "all", // Always use "all" for the main filter 
    getAccessStatusId(accessStatusFilter),
    getProgressStatusId(progressStatusFilter)
  );

  // Helper function to render progress status badge
  const renderProgressStatusBadge = (progressStatus: { id: number; name: string } | undefined) => {
    if (!progressStatus) return null;
    
    let badgeClass = "";
    switch (progressStatus.id) {
      case ProgressStatusEnum.ONGOING:
        badgeClass = "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40";
        break;
      case ProgressStatusEnum.COMPLETED:
        badgeClass = "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/40";
        break;
      case ProgressStatusEnum.DROPPED:
        badgeClass = "bg-gray-100 dark:bg-gray-700/50 text-gray-800 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/60";
        break;
      default:
        badgeClass = "bg-slate-100 dark:bg-slate-700/50 text-slate-800 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60";
    }
    
    return <Badge className={badgeClass}>{progressStatus.name}</Badge>;
  };

  // Filter controls component
  const FilterControls = () => (
    <div className="flex flex-wrap gap-4 mb-6">
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium text-muted-foreground">Filters:</span>
      </div>
      
      {/* Access Status Filter */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Access Status:</span>
        <Select value={accessStatusFilter} onValueChange={(value: AccessStatusFilter) => setAccessStatusFilter(value)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="blocked">Blocked</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* Progress Status Filter */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Progress Status:</span>
        <Select value={progressStatusFilter} onValueChange={(value: ProgressStatusFilter) => setProgressStatusFilter(value)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Select progress" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Progress</SelectItem>
            <SelectItem value="ongoing">Ongoing</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="dropped">Dropped</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        <FilterControls />
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Chapters</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Access Status</TableHead>
                <TableHead>Progress Status</TableHead>
                <TableHead>Last Updated</TableHead>
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
                  <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="rounded-md bg-yellow-100/15 p-4">
        <div className="flex">
          <AlertCircle className="h-4 w-4 text-yellow-600 mr-2" />
          <h3 className="font-medium text-yellow-600">Error</h3>
        </div>
        <p className="text-yellow-600 text-sm mt-2">
          Failed to load books. {(error as Error).message}
        </p>
      </div>
    );
  }
  
  if (!data?.data.length) {
    return (
      <div>
        <FilterControls />
        <div className="text-center py-10">
          <p className="text-muted-foreground">No books found.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <FilterControls />
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Chapters</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Access Status</TableHead>
              <TableHead>Progress Status</TableHead>
              <TableHead>Last Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.data.map((book) => (
              <TableRow key={book.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="relative h-12 w-9 rounded overflow-hidden">
                      <img 
                        src={book.cover || "/placeholder-book.png"} 
                        alt={book.title} 
                        className="object-cover h-full w-full"
                      />
                    </div>
                    <div>
                      <Link href={`/books/${book.id}`} className="font-medium hover:underline hover:text-yellow-600 dark:hover:text-yellow-400">{book.title}</Link>
                      <div className="text-xs text-muted-foreground">by {book.author.name}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{book.totalChapters || 0}</TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400 mr-1" />
                    <span>{book.rating?.toFixed(1) || "N/A"}</span>
                  </div>
                </TableCell>
                <TableCell>
                  {book.accessStatus?.id === 1 && (
                    <Badge className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/40">Published</Badge>
                  )}
                  {book.accessStatus?.id === 2 && (
                    <Badge className="bg-slate-100 dark:bg-slate-700/50 text-slate-800 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60">Draft</Badge>
                  )}
                  {book.accessStatus?.id === 3 && (
                    <Badge className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 hover:bg-yellow-100 dark:hover:bg-yellow-900/40">Blocked</Badge>
                  )}
                  {book.accessStatus?.id === 4 && (
                    <Badge className="bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40">Pending</Badge>
                  )}
                </TableCell>
                <TableCell>
                  {renderProgressStatusBadge(book.progressStatus)}
                </TableCell>
                <TableCell>
                  {book.updatedAt ? format(new Date(book.updatedAt), 'MMM d, yyyy') : 'N/A'}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-2">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/books/${book.id}`}>
                        <BookOpen className="h-4 w-4" />
                        <span className="sr-only">View</span>
                      </Link>
                    </Button>
                    {user?.id === book.author.id && (
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/books/${book.id}/edit`}>
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
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