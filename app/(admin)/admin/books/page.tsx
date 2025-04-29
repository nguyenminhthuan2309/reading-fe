"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  CheckCircle, 
  XCircle, 
  Eye, 
  AlertTriangle, 
  ArrowUpDown, 
  Loader2,
  Shield,
  BookOpen 
} from "lucide-react";
import Link from "next/link";
import { DataTable } from "@/components/books/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { toast } from "sonner";
import { AccessStatusEnum } from "@/models/book";
import { ModerationResults } from "@/components/moderation";
import { ModerationModelType, MODERATION_MODELS } from "@/lib/hooks/useOpenAI";
import { 
  useUpdateBookStatus, 
  useApproveBook, 
  useRejectBook, 
  useBulkUpdateBookStatus 
} from "@/lib/hooks/useUpdateBookStatus";
import { useAdminBooks, ExtendedBook } from "@/lib/hooks/useAdminBooks";
import { useQueryClient } from "@tanstack/react-query";
import { ADMIN_KEYS } from "@/lib/constants/query-keys";

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString();
}

// Function to render status badges
function getStatusBadge(accessStatusId: number) {
  if (accessStatusId === AccessStatusEnum.PUBLISHED) {
    return (
      <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">
        <CheckCircle className="h-3 w-3 mr-1" />
        Published
      </Badge>
    );
  } else if (accessStatusId === AccessStatusEnum.PENDING) {
    return (
      <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-100">
        <Eye className="h-3 w-3 mr-1" />
        Pending
      </Badge>
    );
  } else if (accessStatusId === AccessStatusEnum.BLOCKED) {
    return (
      <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-100">
        <XCircle className="h-3 w-3 mr-1" />
        Blocked
      </Badge>
    );
  } else {
    return (
      <Badge variant="outline" className="bg-gray-100 hover:bg-gray-100">
        <AlertTriangle className="h-3 w-3 mr-1" />
        Private
      </Badge>
    );
  }
}

export default function BooksPage() {
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState<"pending" | "published" | "blocked">("pending");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchApplied, setSearchApplied] = useState("");
  const [selectedBook, setSelectedBook] = useState<ExtendedBook | null>(null);
  const [showModerationDialog, setShowModerationDialog] = useState(false);

  // Use React Query to fetch books
  const {
    data,
    isLoading,
    isError,
    error,
    refetch
  } = useAdminBooks({
    status: selectedTab,
    page: currentPage,
    pageSize,
    search: searchApplied,
  });

  // Use the mutation hooks
  const { approveBook, isPending: isApproving } = useApproveBook();
  const { rejectBook, isPending: isRejecting } = useRejectBook();
  const { 
    bulkApproveBooks, 
    bulkRejectBooks, 
    isPending: isBulkUpdating 
  } = useBulkUpdateBookStatus();

  // Handle search
  const handleSearch = () => {
    setCurrentPage(1); // Reset to first page
    setSearchApplied(searchQuery);
  };

  // Handle tab change
  const handleTabChange = (tab: "pending" | "published" | "blocked") => {
    setSelectedTab(tab);
    setCurrentPage(1);
    // If there's a search, apply it to the new tab
    if (searchApplied) {
      // Invalidate the query for the new tab with the current search
      queryClient.invalidateQueries({
        queryKey: ADMIN_KEYS.BOOKS.LIST(tab, 1, searchApplied)
      });
    }
  };

  // Bulk actions using the new hooks
  const handleBulkApprove = async (selectedBooks: ExtendedBook[]) => {
    const bookIds = selectedBooks.map(book => book.id);
    await bulkApproveBooks(bookIds);
    // Invalidate queries to refresh the data
    queryClient.invalidateQueries({
      queryKey: ADMIN_KEYS.BOOKS.LIST(selectedTab, currentPage, searchApplied)
    });
  };
  
  const handleBulkReject = async (selectedBooks: ExtendedBook[]) => {
    const bookIds = selectedBooks.map(book => book.id);
    await bulkRejectBooks(bookIds);
    // Invalidate queries to refresh the data
    queryClient.invalidateQueries({
      queryKey: ADMIN_KEYS.BOOKS.LIST(selectedTab, currentPage, searchApplied)
    });
  };

  // Individual actions using the new hooks
  const handleApproveBook = (bookId: number) => {
    approveBook(bookId, () => {
      // Invalidate the current query to refresh the data
      queryClient.invalidateQueries({
        queryKey: ADMIN_KEYS.BOOKS.LIST(selectedTab, currentPage, searchApplied)
      });
    });
  };
  
  const handleRejectBook = (bookId: number) => {
    rejectBook(bookId, () => {
      // Invalidate the current query to refresh the data
      queryClient.invalidateQueries({
        queryKey: ADMIN_KEYS.BOOKS.LIST(selectedTab, currentPage, searchApplied)
      });
    });
  };

  const handleViewModerationResults = (book: ExtendedBook) => {
    setSelectedBook(book);
    setShowModerationDialog(true);
  };

  // Render selected items view
  const renderSelectedItems = (selectedBooks: ExtendedBook[], clearSelection: () => void) => {
    return (
      <div className="flex items-center justify-between bg-muted p-3 rounded-md">
        <div className="text-sm font-medium">
          {selectedBooks.length} {selectedBooks.length === 1 ? 'book' : 'books'} selected
        </div>
        <div className="flex space-x-2">
          <Button 
            size="sm" 
            variant="outline" 
            className="text-green-600"
            onClick={() => handleBulkApprove(selectedBooks)}
            disabled={isBulkUpdating}
          >
            {isBulkUpdating ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4 mr-1" />
            )}
            Approve Selected
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            className="text-red-600"
            onClick={() => handleBulkReject(selectedBooks)}
            disabled={isBulkUpdating}
          >
            {isBulkUpdating ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <XCircle className="h-4 w-4 mr-1" />
            )}
            Reject Selected
          </Button>
        </div>
      </div>
    );
  };

  // Create columns definition
  const columns: ColumnDef<ExtendedBook>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "title",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Title
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => (
        <div className="font-medium flex items-center">
          {row.original.cover && (
            <img 
              src={row.original.cover} 
              alt={row.getValue("title")} 
              className="w-8 h-10 object-cover rounded mr-2" 
            />
          )}
          <span>{row.getValue("title")}</span>
        </div>
      ),
    },
    {
      accessorKey: "author.name",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Author
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => <div>{row.original.author?.name || "Unknown"}</div>,
    },
    {
      accessorKey: "categories",
      header: "Categories",
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          {row.original.categories?.slice(0, 2).map((category) => (
            <Badge key={category.id} variant="secondary" className="text-xs">
              {category.name}
            </Badge>
          ))}
          {row.original.categories?.length > 2 && (
            <Badge variant="outline" className="text-xs">
              +{row.original.categories.length - 2}
            </Badge>
          )}
        </div>
      ),
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Submitted
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => <div>{formatDate(row.original.createdAt)}</div>,
    },
    {
      accessorKey: "accessStatus.id",
      header: "Status",
      cell: ({ row }) => getStatusBadge(row.original.accessStatus?.id),
    },
    {
      accessorKey: "moderated",
      header: "Moderation",
      cell: ({ row }) => (
        <div>
          {row.original.moderationResults ? (
            <Badge 
              variant="outline" 
              className={`${row.original.moderationResults.passed ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'} cursor-pointer`}
              onClick={() => handleViewModerationResults(row.original)}
            >
              <Shield className="h-3 w-3 mr-1" />
              {row.original.moderationResults.passed ? 'Passed' : 'Review Required'}
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-gray-100 text-gray-800">
              Not Moderated
            </Badge>
          )}
        </div>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const book = row.original;
        return (
          <div className="flex justify-end space-x-2">
            <Link href={`/books/${book.id}`} target="_blank">
              <Button 
                variant="ghost" 
                size="icon"
                className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 cursor-pointer"
                title="View Book"
              >
                <BookOpen className="h-4 w-4" />
                <span className="sr-only">View book</span>
              </Button>
            </Link>
            
            {book.accessStatus?.id === AccessStatusEnum.PENDING && (
              <>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50 cursor-pointer"
                  onClick={() => handleApproveBook(book.id)}
                  disabled={isApproving}
                  title="Approve"
                >
                  {isApproving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4" />
                  )}
                  <span className="sr-only">Approve</span>
                </Button>
                
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer"
                  onClick={() => handleRejectBook(book.id)}
                  disabled={isRejecting}
                  title="Reject"
                >
                  {isRejecting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <XCircle className="h-4 w-4" />
                  )}
                  <span className="sr-only">Reject</span>
                </Button>
              </>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Content Moderation</h1>
          <p className="text-muted-foreground mt-1">Review and approve books submitted by users</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Tabs 
          defaultValue="pending" 
          value={selectedTab} 
          onValueChange={(value) => handleTabChange(value as "pending" | "published" | "blocked")} 
          className="w-full"
        >
          <TabsList>
            <TabsTrigger value="pending">Pending Review</TabsTrigger>
            <TabsTrigger value="published">Published</TabsTrigger>
            <TabsTrigger value="blocked">Rejected</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search books..."
              className="pl-8 w-[250px] h-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>
          <Button size="sm" onClick={handleSearch}>Search</Button>
        </div>
      </div>

      {isError && (
        <div className="rounded-md bg-destructive/15 p-4 text-destructive flex items-center">
          <AlertTriangle className="h-5 w-5 mr-2" />
          <p>Error loading books: {error?.message || "Unknown error occurred"}</p>
          <Button variant="outline" size="sm" className="ml-auto" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading books...</span>
        </div>
      ) : (
        <>
          {data?.books.length === 0 ? (
            <div className="text-center py-10 border rounded-lg">
              <div className="flex justify-center mb-4">
                <BookOpen size={48} className="text-muted-foreground/50" />
              </div>
              <p className="text-muted-foreground">No books to review at this time.</p>
            </div>
          ) : (
            <DataTable 
              columns={columns} 
              data={data?.books || []} 
              pageSize={pageSize}
              pageCount={data?.pageCount || 1}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
              manualPagination={true}
              renderSelectedItemsView={renderSelectedItems}
            />
          )}
        </>
      )}

      {/* Moderation Results Dialog */}
      {selectedBook && (
        <ModerationResults
          open={showModerationDialog}
          onOpenChange={setShowModerationDialog}
          results={selectedBook.moderationResults}
          selectedModel={MODERATION_MODELS.OMNI as ModerationModelType}
          onModelChange={() => {}}
          bookAgeRating={selectedBook.ageRating === 1 ? "ALL" : 
                         selectedBook.ageRating === 2 ? "13_PLUS" : 
                         selectedBook.ageRating === 3 ? "16_PLUS" : "18_PLUS"}
        />
      )}
    </div>
  );
} 