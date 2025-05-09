"use client";

import * as React from "react";
import { useState, useEffect } from "react";
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
  BookOpen,
  Ban,
  Unlock,
  ChevronDown,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronLeft,
  ChevronsDown,
  ChevronsUp
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
import { AccessStatusEnum, Chapter, ChapterAccessStatus } from "@/models/book";
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
import { updateBookStatus, updateBook, getChaptersByBookId } from "@/lib/api/books";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { useOpenAI } from "@/lib/hooks/useOpenAI";

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
  const [isModerating, setIsModerating] = useState(false);
  const [expandedRows, setExpandedRows] = useState<{[key: number]: boolean}>({});
  const [chaptersData, setChaptersData] = useState<{[key: number]: Chapter[]}>({});
  const [loadingChapters, setLoadingChapters] = useState<{[key: number]: boolean}>({});
  const [selectedRows, setSelectedRows] = useState<ExtendedBook[]>([]);
  const [expandAll, setExpandAll] = useState(false);

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

  // Use the OpenAI hook
  const { moderateContent } = useOpenAI();

  // Handle search
  const handleSearch = () => {
    setCurrentPage(1); // Reset to first page
    setSearchApplied(searchQuery);
  };

  // Handle tab change
  const handleTabChange = (tab: "pending" | "published" | "blocked") => {
    setSelectedTab(tab);
    setCurrentPage(1);
    setSearchQuery(""); // Clear search when changing tabs
    setSearchApplied(""); // Clear applied search
  };

  // Handle bulk actions using the new hooks
  const handleBulkApprove = async (selectedBooks: ExtendedBook[], clearSelection: () => void) => {
    const bookIds = selectedBooks.map(book => book.id);
    await bulkApproveBooks(bookIds);
    // Invalidate queries to refresh the data
    queryClient.invalidateQueries({
      queryKey: ADMIN_KEYS.BOOKS.LIST(selectedTab, currentPage, searchApplied)
    });
    clearSelection(); // Clear selection after action
  };
  
  const handleBulkReject = async (selectedBooks: ExtendedBook[], clearSelection: () => void) => {
    const bookIds = selectedBooks.map(book => book.id);
    await bulkRejectBooks(bookIds);
    // Invalidate queries to refresh the data
    queryClient.invalidateQueries({
      queryKey: ADMIN_KEYS.BOOKS.LIST(selectedTab, currentPage, searchApplied)
    });
    clearSelection(); // Clear selection after action
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

  const handleBlockBook = async (bookId: number) => {
    try {
      await updateBookStatus(bookId, {
        accessStatusId: AccessStatusEnum.BLOCKED
      });
      toast.success("Book blocked successfully");
      queryClient.invalidateQueries({ queryKey: ['admin', 'books'] });
    } catch (error) {
      toast.error("Failed to block book");
    }
  };

  const handleUnblockBook = async (bookId: number) => {
    try {
      await updateBookStatus(bookId, {
        accessStatusId: AccessStatusEnum.PUBLISHED
      });
      toast.success("Book unblocked successfully");
      queryClient.invalidateQueries({ queryKey: ['admin', 'books'] });
    } catch (error) {
      toast.error("Failed to unblock book");
    }
  };

  const handleViewModerationResults = (book: ExtendedBook) => {
    setSelectedBook(book);
    setShowModerationDialog(true);
  };

  const handleModerateBook = async (book: ExtendedBook) => {
    setIsModerating(true);
    try {
      // Prepare chapters for moderation
      const chapters = book.chapters?.map((chapter, index) => ({
        id: chapter.id,
        chapter: index + 1,
        title: chapter.title,
        content: chapter.content
      })) || [];

      // Call moderation API
      const result = await moderateContent({
        title: book.title,
        description: book.description,
        chapters: chapters,
        coverImage: book.cover,
        model: MODERATION_MODELS.OMNI
      });

      console.log('Moderation result', result);

      // Show moderation results
      setSelectedBook({
        ...book,
        moderationResults: result
      });
      setShowModerationDialog(true);

      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({
        queryKey: ADMIN_KEYS.BOOKS.LIST(selectedTab, currentPage, searchApplied)
      });

      toast.success("Book moderated successfully");
    } catch (error) {
      toast.error("Failed to moderate book");
      console.error("Moderation error:", error);
    } finally {
      setIsModerating(false);
    }
  };

  // Handle row expansion to show chapters
  const handleExpandRow = async (bookId: number) => {
    // Toggle expanded state
    setExpandedRows(prev => {
      const newState = {...prev};
      newState[bookId] = !prev[bookId];
      return newState;
    });
    
    // If expanding and we don't have chapters data yet, fetch it
    if (!expandedRows[bookId] && !chaptersData[bookId]) {
      setLoadingChapters(prev => ({...prev, [bookId]: true}));
      try {
        const response = await getChaptersByBookId(bookId);
        if (response.code === 200) {
          setChaptersData(prev => ({...prev, [bookId]: response.data}));
        } else {
          toast.error("Failed to load chapters");
        }
      } catch (error) {
        console.error("Error loading chapters:", error);
        toast.error("Failed to load chapters");
      } finally {
        setLoadingChapters(prev => ({...prev, [bookId]: false}));
      }
    }
  };

  // Handle expand/collapse all books
  const handleExpandAllToggle = async () => {
    const newExpandAll = !expandAll;
    setExpandAll(newExpandAll);
    
    if (newExpandAll) {
      // Expand all rows
      const newExpandedState: {[key: number]: boolean} = {};
      const fetchPromises = [];
      
      // Set all rows as expanded and prepare fetch promises
      for (const book of data?.books || []) {
        newExpandedState[book.id] = true;
        
        // Only fetch data if we don't already have it
        if (!chaptersData[book.id]) {
          setLoadingChapters(prev => ({...prev, [book.id]: true}));
          
          const fetchPromise = getChaptersByBookId(book.id)
            .then(response => {
              if (response.code === 200) {
                setChaptersData(prev => ({...prev, [book.id]: response.data}));
              }
              return book.id;
            })
            .catch(error => {
              console.error(`Error loading chapters for book ${book.id}:`, error);
              return book.id;
            })
            .finally(() => {
              setLoadingChapters(prev => ({...prev, [book.id]: false}));
            });
            
          fetchPromises.push(fetchPromise);
        }
      }
      
      setExpandedRows(newExpandedState);
      
      // Execute all fetch promises concurrently
      if (fetchPromises.length > 0) {
        await Promise.all(fetchPromises);
      }
    } else {
      // Collapse all rows
      setExpandedRows({});
    }
  };

  // Render selected items view
  const renderSelectedItems = (selectedBooks: ExtendedBook[], clearSelection: () => void) => {
    return (
      <div className="flex items-center justify-between bg-muted p-3 rounded-md">
        <div className="text-sm font-medium">
          {selectedBooks.length} {selectedBooks.length === 1 ? 'book' : 'books'} selected
        </div>
        <div className="flex space-x-2">
          {selectedTab === "pending" && (
            <>
              <Button 
                size="sm" 
                variant="outline" 
                className="text-green-600"
                onClick={() => handleBulkApprove(selectedBooks, clearSelection)}
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
                onClick={() => handleBulkReject(selectedBooks, clearSelection)}
                disabled={isBulkUpdating}
              >
                {isBulkUpdating ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <XCircle className="h-4 w-4 mr-1" />
                )}
                Reject Selected
              </Button>
            </>
          )}

          {selectedTab === "published" && (
            <Button 
              size="sm" 
              variant="outline" 
              className="text-red-600"
              onClick={() => handleBulkBlock(selectedBooks, clearSelection)}
              disabled={isBulkUpdating}
            >
              {isBulkUpdating ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Ban className="h-4 w-4 mr-1" />
              )}
              Block Selected
            </Button>
          )}

          {selectedTab === "blocked" && (
            <Button 
              size="sm" 
              variant="outline" 
              className="text-green-600"
              onClick={() => handleBulkUnblock(selectedBooks, clearSelection)}
              disabled={isBulkUpdating}
            >
              {isBulkUpdating ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Unlock className="h-4 w-4 mr-1" />
              )}
              Unblock Selected
            </Button>
          )}
        </div>
      </div>
    );
  };

  // Add new bulk action handlers
  const handleBulkBlock = async (selectedBooks: ExtendedBook[], clearSelection: () => void) => {
    const bookIds = selectedBooks.map(book => book.id);
    try {
      await Promise.all(
        bookIds.map(bookId => 
          updateBookStatus(bookId, {
            accessStatusId: AccessStatusEnum.BLOCKED
          })
        )
      );
      toast.success("Selected books blocked successfully");
      queryClient.invalidateQueries({
        queryKey: ['admin', 'books']
      });
      clearSelection(); // Clear selection after action
    } catch (error) {
      toast.error("Failed to block some books");
    }
  };

  const handleBulkUnblock = async (selectedBooks: ExtendedBook[], clearSelection: () => void) => {
    const bookIds = selectedBooks.map(book => book.id);
    try {
      await Promise.all(
        bookIds.map(bookId => 
          updateBookStatus(bookId, {
            accessStatusId: AccessStatusEnum.PUBLISHED
          })
        )
      );
      toast.success("Selected books unblocked successfully");
      queryClient.invalidateQueries({
        queryKey: ['admin', 'books']
      });
      clearSelection(); // Clear selection after action
    } catch (error) {
      toast.error("Failed to unblock some books");
    }
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
      id: "expand",
      header: () => (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handleExpandAllToggle}
          title={expandAll ? "Collapse All" : "Expand All"}
        >
          {expandAll ? (
            <ChevronsUp className="h-4 w-4" />
          ) : (
            <ChevronsDown className="h-4 w-4" />
          )}
        </Button>
      ),
      cell: ({ row }) => {
        const book = row.original;
        return (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => handleExpandRow(book.id)}
          >
            {loadingChapters[book.id] ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : expandedRows[book.id] ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        );
      },
      enableSorting: false,
      enableHiding: false,
    },
    {
      id: "title",
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
      id: "author.name",
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
      id: "categories",
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
      id: "createdAt",
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
      id: "accessStatus.id",
      accessorKey: "accessStatus.id",
      header: "Status",
      cell: ({ row }) => getStatusBadge(row.original.accessStatus?.id),
    },
    {
      id: "moderated",
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
            <Button variant="ghost" size="icon" asChild>
              <Link href={`/books/${book.id}`}>
                <Eye className="h-4 w-4" />
                <span className="sr-only">View</span>
              </Link>
            </Button>
            {book.accessStatus?.id === AccessStatusEnum.PENDING && (
              <>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50 cursor-pointer"
                  onClick={() => handleApproveBook(book.id)}
                  title="Approve Book"
                >
                  <CheckCircle className="h-4 w-4" />
                  <span className="sr-only">Approve book</span>
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer"
                  onClick={() => handleRejectBook(book.id)}
                  title="Reject Book"
                >
                  <XCircle className="h-4 w-4" />
                  <span className="sr-only">Reject book</span>
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 cursor-pointer"
                  onClick={() => handleModerateBook(book)}
                  disabled={isModerating}
                  title="Moderate Book"
                >
                  {isModerating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Shield className="h-4 w-4" />
                  )}
                  <span className="sr-only">Moderate book</span>
                </Button>
              </>
            )}
            {book.accessStatus?.id === AccessStatusEnum.BLOCKED && (
              <Button 
                variant="ghost" 
                size="icon"
                className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50 cursor-pointer"
                onClick={() => handleUnblockBook(book.id)}
                title="Unblock Book"
              >
                <Unlock className="h-4 w-4" />
                <span className="sr-only">Unblock book</span>
              </Button>
            )}
            {book.accessStatus?.id !== AccessStatusEnum.BLOCKED && book.accessStatus?.id !== AccessStatusEnum.PENDING && (
              <Button 
                variant="ghost" 
                size="icon"
                className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer"
                onClick={() => handleBlockBook(book.id)}
                title="Block Book"
              >
                <Ban className="h-4 w-4" />
                <span className="sr-only">Block book</span>
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  // Chapter table columns
  const chapterColumns = [
    {
      accessorKey: "chapter",
      header: "Chapter #",
      cell: ({ row }: { row: any }) => <div>{row.original.chapter}</div>,
    },
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }: { row: any }) => <div className="font-medium">{row.original.title}</div>,
    },
    {
      accessorKey: "chapterAccessStatus",
      header: "Status",
      cell: ({ row }: { row: any }) => {
        const chapter = row.original;
        const accessStatus = chapter.chapterAccessStatus // Fallback to isLocked if no status
        
        if (accessStatus === ChapterAccessStatus.PUBLISHED) { // Published/Unlocked
          return (
            <Badge variant="outline" className="bg-green-100 text-green-800">
              Published
            </Badge>
          );
        } else if (accessStatus === ChapterAccessStatus.PENDING_REVIEW) { // Private/Locked
          return (
            <Badge variant="outline" className="bg-amber-100 text-amber-800">
              Pending Review
            </Badge>
          );
        } else if (accessStatus === ChapterAccessStatus.REJECTED) { // Blocked
          return (
            <Badge variant="outline" className="bg-red-100 text-red-800">
              Rejected
            </Badge>
          );
        } else if (accessStatus === ChapterAccessStatus.DRAFT) { // Pending
          return (
            <Badge variant="outline" className="bg-blue-100 text-blue-800">
              Draft
            </Badge>
          );
        } else {
          return (
            <Badge variant="outline" className="bg-gray-100 text-gray-800">
              Unknown
            </Badge>
          );
        }
      },
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }: { row: any }) => <div>{formatDate(row.original.createdAt)}</div>,
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }: { row: any }) => (
        <div className="flex justify-end space-x-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/books/${row.original.bookId}/read?chapter=${row.original.chapter}&id=${row.original.id}`}>
              <Eye className="h-4 w-4" />
              <span className="sr-only">View Chapter</span>
            </Link>
          </Button>
        </div>
      ),
    },
  ];

  // Update the search implementation
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  useEffect(() => {
    setSearchApplied(debouncedSearchQuery);
  }, [debouncedSearchQuery]);

  // Create a custom wrapper component for the DataTable
  const CustomDataTable = () => {
    if (!data || !data.books || data.books.length === 0) {
      return (
        <div className="text-center py-10 border rounded-lg">
          <div className="flex justify-center mb-4">
            <BookOpen size={48} className="text-muted-foreground/50" />
          </div>
          <p className="text-muted-foreground">No books to review at this time.</p>
        </div>
      );
    }

    // Simplified column rendering to avoid TypeScript errors
    const renderColumnHeader = (column: ColumnDef<ExtendedBook, any>) => {
      if (column.id === "select") {
        return (
          <Checkbox
            checked={selectedRows.length === data.books.length && data.books.length > 0}
            onCheckedChange={(value: boolean) => {
              if (value) {
                setSelectedRows([...data.books]);
              } else {
                setSelectedRows([]);
              }
            }}
            aria-label="Select all"
          />
        );
      }
      
      if (column.id === "expand") {
        return (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleExpandAllToggle}
            title={expandAll ? "Collapse All" : "Expand All"}
          >
            {expandAll ? (
              <ChevronsUp className="h-4 w-4" />
            ) : (
              <ChevronsDown className="h-4 w-4" />
            )}
          </Button>
        );
      }
      
      return column.header && typeof column.header === "string" 
        ? column.header 
        : column.id === "title" ? "Title" 
        : column.id === "expand" ? "" 
        : column.id === "author.name" ? "Author" 
        : column.id === "categories" ? "Categories" 
        : column.id === "createdAt" ? "Submitted" 
        : column.id === "accessStatus.id" ? "Status" 
        : column.id === "moderated" ? "Moderation" 
        : column.id === "actions" ? "Actions" 
        : "";
    };

    const renderColumnCell = (column: ColumnDef<ExtendedBook, any>, book: ExtendedBook) => {
      if (column.id === "select") {
        return (
          <Checkbox
            checked={selectedRows.some(row => row.id === book.id)}
            onCheckedChange={(value: boolean) => {
              if (value) {
                setSelectedRows(prev => [...prev, book]);
              } else {
                setSelectedRows(prev => prev.filter(row => row.id !== book.id));
              }
            }}
            aria-label="Select row"
          />
        );
      }
      
      if (column.id === "expand") {
        return (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => handleExpandRow(book.id)}
          >
            {loadingChapters[book.id] ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : expandedRows[book.id] ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        );
      }
      
      if (column.id === "title") {
        return (
          <div className="font-medium flex items-center">
            {book.cover && (
              <img 
                src={book.cover} 
                alt={book.title} 
                className="w-8 h-10 object-cover rounded mr-2" 
              />
            )}
            <span>{book.title}</span>
          </div>
        );
      }
      
      if (column.id === "author.name") {
        return <div>{book.author?.name || "Unknown"}</div>;
      }
      
      if (column.id === "categories") {
        return (
          <div className="flex flex-wrap gap-1">
            {book.categories?.slice(0, 2).map((category: any) => (
              <Badge key={category.id} variant="secondary" className="text-xs">
                {category.name}
              </Badge>
            ))}
            {book.categories?.length > 2 && (
              <Badge variant="outline" className="text-xs">
                +{book.categories.length - 2}
              </Badge>
            )}
          </div>
        );
      }
      
      if (column.id === "createdAt") {
        return <div>{formatDate(book.createdAt)}</div>;
      }
      
      if (column.id === "accessStatus.id") {
        return getStatusBadge(book.accessStatus?.id);
      }
      
      if (column.id === "moderated") {
        return (
          <div>
            {book.moderationResults ? (
              <Badge 
                variant="outline" 
                className={`${book.moderationResults.passed ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'} cursor-pointer`}
                onClick={() => handleViewModerationResults(book)}
              >
                <Shield className="h-3 w-3 mr-1" />
                {book.moderationResults.passed ? 'Passed' : 'Review Required'}
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-gray-100 text-gray-800">
                Not Moderated
              </Badge>
            )}
          </div>
        );
      }
      
      if (column.id === "actions") {
        return (
          <div className="flex justify-end space-x-2">
            <Button variant="ghost" size="icon" asChild>
              <Link href={`/books/${book.id}`}>
                <Eye className="h-4 w-4" />
                <span className="sr-only">View</span>
              </Link>
            </Button>
            {book.accessStatus?.id === AccessStatusEnum.PENDING && (
              <>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50 cursor-pointer"
                  onClick={() => handleApproveBook(book.id)}
                  title="Approve Book"
                >
                  <CheckCircle className="h-4 w-4" />
                  <span className="sr-only">Approve book</span>
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer"
                  onClick={() => handleRejectBook(book.id)}
                  title="Reject Book"
                >
                  <XCircle className="h-4 w-4" />
                  <span className="sr-only">Reject book</span>
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 cursor-pointer"
                  onClick={() => handleModerateBook(book)}
                  disabled={isModerating}
                  title="Moderate Book"
                >
                  {isModerating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Shield className="h-4 w-4" />
                  )}
                  <span className="sr-only">Moderate book</span>
                </Button>
              </>
            )}
            {book.accessStatus?.id === AccessStatusEnum.BLOCKED && (
              <Button 
                variant="ghost" 
                size="icon"
                className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50 cursor-pointer"
                onClick={() => handleUnblockBook(book.id)}
                title="Unblock Book"
              >
                <Unlock className="h-4 w-4" />
                <span className="sr-only">Unblock book</span>
              </Button>
            )}
            {book.accessStatus?.id !== AccessStatusEnum.BLOCKED && book.accessStatus?.id !== AccessStatusEnum.PENDING && (
              <Button 
                variant="ghost" 
                size="icon"
                className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer"
                onClick={() => handleBlockBook(book.id)}
                title="Block Book"
              >
                <Ban className="h-4 w-4" />
                <span className="sr-only">Block book</span>
              </Button>
            )}
          </div>
        );
      }
      
      return null;
    };

    return (
      <div className="rounded-md border">
        <table className="w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.id}
                  className={`px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${column.id === "select" && "w-[32px] pr-2"} ${column.id === "expand" && "w-[32px] pl-0 pr-0"}`}
                >
                  {renderColumnHeader(column)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.books.map((book) => (
              <React.Fragment key={book.id}>
                <tr>
                  {columns.map((column) => (
                    <td 
                      key={column.id} 
                      className={`px-4 py-2 ${column.id === "select" && "pr-2"} ${column.id === "expand" && "pl-0 pr-0"}`}
                    >
                      {renderColumnCell(column, book)}
                    </td>
                  ))}
                </tr>
                {expandedRows[book.id] && (
                  <tr>
                    <td colSpan={columns.length} className="px-12 py-2 border-b">
                      {renderChapters(book)}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
        <div className="flex items-center justify-between space-x-2 p-4 border-t">
          <div className="text-sm text-muted-foreground">
            Showing {data.books.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} to {Math.min(
              currentPage * pageSize,
              data.pageCount * pageSize
            )} of {data.pageCount * pageSize} records
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage <= 1}
              title="First Page"
              className="cursor-pointer"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage <= 1}
              title="Previous Page"
              className="cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({length: Math.min(5, data.pageCount || 1)}, (_, i) => {
                // Show a sliding window of page numbers
                let startPage = Math.max(1, currentPage - 2);
                const endPage = Math.min(data.pageCount || 1, startPage + 4);
                startPage = Math.max(1, endPage - 4);
                return startPage + i <= endPage ? startPage + i : null;
              })
              .filter(Boolean)
              .map((pageNumber) => (
                <Button
                  key={pageNumber}
                  variant={pageNumber === currentPage ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(pageNumber as number)}
                  className="h-8 w-8 p-0 cursor-pointer"
                >
                  {pageNumber}
                </Button>
              ))}
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage(Math.min(data.pageCount || 1, currentPage + 1))}
              disabled={currentPage >= (data.pageCount || 1)}
              title="Next Page"
              className="cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage(data.pageCount || 1)}
              disabled={currentPage >= (data.pageCount || 1)}
              title="Last Page"
              className="cursor-pointer"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // Render the chapters for a book
  const renderChapters = (book: ExtendedBook) => {
    if (!expandedRows[book.id]) return null;
    
    return (
      <div className="p-4 bg-slate-50 rounded-md border">
        {loadingChapters[book.id] ? (
          <div className="rounded-md border overflow-hidden">
            <table className="w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {chapterColumns.map((column) => (
                    <th
                      key={column.accessorKey || column.id}
                      className={`px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${column.accessorKey === "chapter" && "w-[100px]"} ${column.id === "actions" && "w-[50px]"}`}
                    >
                      {column.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {/* Skeleton loader rows based on book's totalChapters */}
                {Array.from({ length: book.totalChapters || 3 }).map((_, index) => (
                  <tr key={`skeleton-${index}`} className="animate-pulse">
                    <td className="px-4 py-2">
                      <div className="h-4 bg-gray-200 rounded w-8"></div>
                    </td>
                    <td className="px-4 py-2">
                      <div className="h-4 bg-gray-200 rounded w-full"></div>
                    </td>
                    <td className="px-4 py-2">
                      <div className="h-6 bg-gray-200 rounded w-16 mx-auto"></div>
                    </td>
                    <td className="px-4 py-2">
                      <div className="h-4 bg-gray-200 rounded w-24"></div>
                    </td>
                    <td className="px-4 py-2">
                      <div className="h-8 bg-gray-200 rounded-full w-8 ml-auto"></div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : chaptersData[book.id]?.length ? (
          <div className="rounded-md border overflow-hidden">
            <table className="w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {chapterColumns.map((column) => (
                    <th
                      key={column.accessorKey || column.id}
                      className={`px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${column.accessorKey === "chapter" && "w-[100px]"} ${column.id === "actions" && "w-[50px]"}`}
                    >
                      {column.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {chaptersData[book.id].map((chapter) => (
                  <tr key={chapter.id}>
                    {chapterColumns.map((column) => (
                      <td key={column.accessorKey || column.id} className="px-4 py-2">
                        {column.cell({ row: { original: {...chapter, bookId: book.id} } })}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            No chapters found for this book.
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Content Moderation</h1>
          <p className="text-muted-foreground mt-1">Review and approve books submitted by users</p>
        </div>
      </div>

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

        <TabsContent value={selectedTab} className="mt-4">
          <div className="relative mb-4">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search books..."
              className="pl-8 w-[250px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
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
              {/* Selected items area */}
              {selectedRows.length > 0 && (
                <div className="mb-4">
                  {renderSelectedItems(
                    selectedRows,
                    () => setSelectedRows([])
                  )}
                </div>
              )}
              
              <CustomDataTable />
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Moderation Results Dialog */}
      {selectedBook && (
        <ModerationResults
          open={showModerationDialog}
          onOpenChange={setShowModerationDialog}
          results={selectedBook.moderationResults}
          selectedModel={MODERATION_MODELS.OMNI}
          onModelChange={() => {}}
          bookAgeRating={selectedBook.ageRating?.toString() as any}
        />
      )}
    </div>
  );
} 