"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import { AccessStatusEnum, Chapter, ChapterAccessStatus, BookType, BOOK_TYPES, AgeRatingEnum } from "@/models/book";
import { ModerationResults, NumericAgeRating } from "@/components/moderation/ModerationResults";
import { ModerationModelType, MODERATION_MODELS, DisplayModerationModelType } from "@/lib/hooks/useOpenAI";
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
import { extractChapterContent } from "@/lib/utils";
import { 
  isContentFlagged, 
  AGE_RATING_THRESHOLDS,
} from "@/lib/api/openai";
import { getModerationResults } from "@/lib/api/books";
import { EnhancedModerationResult, ModerationResultsResponse, ModerationResultsPayload } from "@/models/openai";
import { saveModerateResultsStatic } from "@/lib/hooks/useModerationResults";
import { parseStoredModerationResult, processAllModerationResults, checkModerationPassed } from "@/lib/utils/moderation";

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString();
}

// Function to render status badges
function getStatusBadge(accessStatusId: number) {
  if (accessStatusId === AccessStatusEnum.PUBLISHED) {
    return (
      <Badge variant="outline" className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/40 border-green-200 dark:border-green-700/50">
        <CheckCircle className="h-3 w-3 mr-1" />
        Published
      </Badge>
    );
  } else if (accessStatusId === AccessStatusEnum.PENDING) {
    return (
      <Badge variant="outline" className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40 border-blue-200 dark:border-blue-700/50">
        <Eye className="h-3 w-3 mr-1" />
        Pending
      </Badge>
    );
  } else if (accessStatusId === AccessStatusEnum.BLOCKED) {
    return (
      <Badge variant="outline" className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/40 border-red-200 dark:border-red-700/50">
        <XCircle className="h-3 w-3 mr-1" />
        Blocked
      </Badge>
    );
  } else {
    return (
      <Badge variant="outline" className="bg-gray-100 dark:bg-gray-700/50 text-gray-800 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/60 border-gray-200 dark:border-gray-600/50">
        <AlertTriangle className="h-3 w-3 mr-1" />
        Private
      </Badge>
    );
  }
}

// Helper function to check if content is flagged, explicitly handling the threshold
const checkContentFlagged = (scores: Record<string, number>, rating: number) => {
  const safeRating = Math.min(Math.max(0, rating), 3) as AgeRatingEnum;
  return isContentFlagged(scores, safeRating);
};

// RejectBookPopover Component
interface RejectBookPopoverProps {
  bookId: number;
  bookTitle: string;
  onReject: (bookId: number, reason: string) => void;
  isLoading?: boolean;
  trigger: React.ReactNode;
}

function RejectBookPopover({ bookId, bookTitle, onReject, isLoading = false, trigger }: RejectBookPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState("");

  const handleReject = () => {
    if (!reason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }
    
    onReject(bookId, reason);
    setIsOpen(false);
    setReason("");
  };

  const handleCancel = () => {
    setIsOpen(false);
    setReason("");
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        {trigger}
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 rounded-lg border shadow-lg" align="end">
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/10 p-4 rounded-t-lg">
          <h4 className="font-medium text-sm text-amber-700 dark:text-amber-300">Reject Book</h4>
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
            Rejecting "{bookTitle}"
          </p>
        </div>
        
        <div className="p-4 space-y-4">
          <div className="space-y-2">
            <label htmlFor="reason" className="text-sm font-medium">
              Rejection Reason <span className="text-yellow-500">*</span>
            </label>
            <Textarea
              id="reason"
              placeholder="Please provide a detailed reason for rejecting this book..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-[80px] text-sm"
            />
          </div>
          
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="destructive"
              onClick={handleReject}
              disabled={isLoading || !reason.trim()}
              className="flex-1"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <XCircle className="h-4 w-4 mr-1" />
              )}
              Reject
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// BulkRejectPopover Component
interface BulkRejectPopoverProps {
  selectedBooks: ExtendedBook[];
  onReject: (reason: string) => void;
  isLoading?: boolean;
  trigger: React.ReactNode;
}

function BulkRejectPopover({ selectedBooks, onReject, isLoading = false, trigger }: BulkRejectPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState("");

  const handleReject = () => {
    if (!reason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }
    
    onReject(reason);
    setIsOpen(false);
    setReason("");
  };

  const handleCancel = () => {
    setIsOpen(false);
    setReason("");
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        {trigger}
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 rounded-lg border shadow-lg" align="end">
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/10 p-4 rounded-t-lg">
          <h4 className="font-medium text-sm text-amber-700 dark:text-amber-300">Reject Books</h4>
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
            Rejecting {selectedBooks.length} selected {selectedBooks.length === 1 ? 'book' : 'books'}
          </p>
        </div>
        
        <div className="p-4 space-y-4">
          <div className="space-y-2">
            <label htmlFor="bulk-reason" className="text-sm font-medium">
              Rejection Reason <span className="text-yellow-500">*</span>
            </label>
            <Textarea
              id="bulk-reason"
              placeholder="Please provide a detailed reason for rejecting these books..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-[80px] text-sm"
            />
          </div>
          
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="destructive"
              onClick={handleReject}
              disabled={isLoading || !reason.trim()}
              className="flex-1"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <XCircle className="h-4 w-4 mr-1" />
              )}
              Reject All
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default function BooksPage() {
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState<"pending" | "published" | "blocked">("pending");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchApplied, setSearchApplied] = useState("");
  const [selectedBook, setSelectedBook] = useState<ExtendedBook | null>(null);
  const [expandedRows, setExpandedRows] = useState<{[key: number]: boolean}>({});
  const [chaptersData, setChaptersData] = useState<Record<number, Chapter[]>>({});
  const [loadingChapters, setLoadingChapters] = useState<{[key: number]: boolean}>({});
  const [selectedRows, setSelectedRows] = useState<ExtendedBook[]>([]);
  const [expandAll, setExpandAll] = useState(false);
  const [moderationResults, setModerationResults] = useState<EnhancedModerationResult | null>(null);
  const [moderationDialogOpen, setModerationDialogOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState<DisplayModerationModelType>('Level 3');
  const [checkingModeration, setCheckingModeration] = useState(false);
  const [isViewingModeration, setIsViewingModeration] = useState(false);
  const [isEditingModeration, setIsEditingModeration] = useState(false);

  // New state to track available results for different models
  const [availableModelResults, setAvailableModelResults] = useState<Record<string, ModerationResultsResponse>>({});

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
  const rejectBookMutation = useRejectBook();
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
  
  const handleBulkReject = async (selectedBooks: ExtendedBook[], clearSelection: () => void, reason: string) => {
    const bookIds = selectedBooks.map(book => book.id);
    await bulkRejectBooks(bookIds, reason);
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
  
  const handleRejectBook = (bookId: number, reason: string) => {
    rejectBookMutation.mutate({ bookId, reason }, {
      onSuccess: () => {
        toast.success("Book rejected successfully");
        // Invalidate the current query to refresh the data
        queryClient.invalidateQueries({
          queryKey: ADMIN_KEYS.BOOKS.LIST(selectedTab, currentPage, searchApplied)
        });
      }
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

  // Function to view existing moderation results
  const handleViewModerationResults = async (model: DisplayModerationModelType, book: ExtendedBook, isViewing: boolean = false, result?: ModerationResultsResponse) => {
    // Set model selection and the selected book
    setSelectedModel(model);
    setSelectedBook(book);
    setIsViewingModeration(isViewing); // Set viewing mode based on parameter
    setIsEditingModeration(false); // Reset edit mode
    
    // If we have specific result provided, use it directly
    if (result) {
      // Store this result in available results
      setAvailableModelResults(prev => ({
        ...prev,
        [result.model]: result
      }));
      
      // Use utility function to parse and check result
      const enhancedResults = parseStoredModerationResult(result, book.ageRating as NumericAgeRating);
      
      // Set moderation results and open dialog
      setModerationResults(enhancedResults);
      setModerationDialogOpen(true);
    } else if ((book as any).moderation && Array.isArray((book as any).moderation) && (book as any).moderation.length > 0) {
      // Use existing moderation data from book if available
      try {
        setCheckingModeration(true);
        
        // Store all available results from book.moderation
        const resultsMap: Record<string, ModerationResultsResponse> = {};
        (book as any).moderation.forEach((result: ModerationResultsResponse) => {
          resultsMap[result.model] = result;
        });
        
        setAvailableModelResults(resultsMap);
        
        // Use the first available result and set the model to that result's model
        const firstResult = (book as any).moderation[0];
        setSelectedModel(firstResult.model as DisplayModerationModelType);
        
        // Parse and display the first result
        const enhancedResults = parseStoredModerationResult(firstResult, book.ageRating as NumericAgeRating);
        setModerationResults(enhancedResults);
        setModerationDialogOpen(true);
      } catch (error) {
        console.error("Error parsing book moderation data:", error);
        // Fall back to API call if parsing fails
        await handleViewModerationResultsFromAPI(model, book, isViewing);
      } finally {
        setCheckingModeration(false);
      }
    } else {
      // Fall back to API call if no moderation data in book
      await handleViewModerationResultsFromAPI(model, book, isViewing);
    }
  };

  // Fallback function to fetch moderation results from API
  const handleViewModerationResultsFromAPI = async (model: DisplayModerationModelType, book: ExtendedBook, isViewing: boolean = false) => {
    try {
      setCheckingModeration(true);
      const response = await getModerationResults(book.id);
      if (response.code === 200 && response.data && response.data.length > 0) {
        // Store all available results
        const resultsMap: Record<string, ModerationResultsResponse> = {};
        response.data.forEach(result => {
          resultsMap[result.model] = result;
        });
        
        setAvailableModelResults(resultsMap);
        
        // Use the first available result and set the model to that result's model
        const firstResult = response.data[0];
        setSelectedModel(firstResult.model as DisplayModerationModelType);
        
        // Parse and display the first result
        const enhancedResults = parseStoredModerationResult(firstResult, book.ageRating as NumericAgeRating);
        setModerationResults(enhancedResults);
        setModerationDialogOpen(true);
      } else {
        // If no results at all, just open the modal with empty state
        setAvailableModelResults({});
        setModerationResults(null);
        setModerationDialogOpen(true);
      }
    } catch (error) {
      console.error("Error fetching moderation results:", error);
      toast.error("Failed to fetch moderation results");
      // Still open the modal with empty state instead of running moderation
      setAvailableModelResults({});
      setModerationResults(null);
      setModerationDialogOpen(true);
    } finally {
      setCheckingModeration(false);
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
              <BulkRejectPopover
                selectedBooks={selectedBooks}
                onReject={(reason) => handleBulkReject(selectedBooks, clearSelection, reason)}
                isLoading={isBulkUpdating}
                trigger={
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="text-yellow-600"
                    disabled={isBulkUpdating}
                  >
                    {isBulkUpdating ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <XCircle className="h-4 w-4 mr-1" />
                    )}
                    Reject Selected
                  </Button>
                }
              />
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
          <Link href={`/books/${row.original.id}`} className="hover:underline hover:text-yellow-600">{row.getValue("title")}</Link>
        </div>
      ),
    },
    {
      id: "bookType",
      accessorKey: "bookType.name",
      header: "Type",
      cell: ({ row }) => (
        <Badge variant="outline" className={`${row.original.bookType?.name === BOOK_TYPES.MANGA ? 'bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-300' : 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300'} capitalize`}>
          {row.original.bookType?.name?.toLowerCase() || "Unknown"}
        </Badge>
      ),
    },
    {
      id: "ageRating",
      accessorKey: "ageRating",
      header: "Age Rating",
      cell: ({ row }) => {
        const ageRating = row.original.ageRating;
        let badgeClass = "bg-gray-100 dark:bg-gray-700/50 text-gray-800 dark:text-gray-300";
        let displayText = "Unknown";

        if (ageRating === 4) {
          badgeClass = "bg-red-200 dark:bg-red-900/30 text-red-800 dark:text-red-300 font-medium";
          displayText = "18+";
        } else if (ageRating === 3) {
          badgeClass = "bg-orange-200 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 font-medium";
          displayText = "16+";
        } else if (ageRating === 2) {
          badgeClass = "bg-amber-200 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 font-medium";
          displayText = "13+";
        } else if (ageRating === 1) {
          badgeClass = "bg-green-200 dark:bg-green-900/30 text-green-800 dark:text-green-300 font-medium";
          displayText = "All";
        }
        
        return (
          <Badge variant="outline" className={badgeClass}>
            {displayText}
          </Badge>
        );
      },
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
      header: "Result",
      cell: ({ row }) => {
        const book = row.original;
        const hasModeration = (book as any).moderation && Array.isArray((book as any).moderation) && (book as any).moderation.length > 0;
        
        if (!hasModeration) {
          return (
            <Badge 
              variant="outline" 
              className="bg-gray-100 dark:bg-gray-700/50 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-600/50 cursor-pointer"
              onClick={() => handleViewModerationResults('Level 3', book, false)}
            >
              Not Moderated
            </Badge>
          );
        }

        // Show all moderation results
        return (
          <div className="flex flex-wrap gap-1">
            {(book as any).moderation.map((modResult: any, index: number) => {
              const model = modResult.model as DisplayModerationModelType;
              const isPassed = checkModerationPassed(modResult, book.ageRating as NumericAgeRating || 0);
              
              return (
                <Badge 
                  key={index}
                  variant="outline" 
                  className={`${isPassed 
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-700/50' 
                    : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-700/50'
                  } cursor-pointer text-xs`}
                  onClick={() => handleViewModerationResults(model, book, true, modResult)}
                >
                  <Shield className="h-3 w-3 mr-1" />
                  {model}
                </Badge>
              );
            })}
          </div>
        );
      },
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
                  className="h-8 w-8 text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 cursor-pointer"
                  onClick={() => handleApproveBook(book.id)}
                  title="Approve Book"
                >
                  <CheckCircle className="h-4 w-4" />
                  <span className="sr-only">Approve book</span>
                </Button>
                <RejectBookPopover
                  bookId={book.id}
                  bookTitle={book.title}
                  onReject={handleRejectBook}
                  isLoading={rejectBookMutation.isPending}
                  trigger={
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="h-8 w-8 text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 cursor-pointer"
                      title="Reject Book"
                    >
                      <XCircle className="h-4 w-4" />
                      <span className="sr-only">Reject book</span>
                    </Button>
                  }
                />
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
      cell: ({ row }: { row: any }) => <div className="dark:text-gray-100">{row.original.chapter}</div>,
    },
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }: { row: any }) => <div className="font-medium dark:text-white">{row.original.title}</div>,
    },
    {
      accessorKey: "chapterAccessStatus",
      header: "Status",
      cell: ({ row }: { row: any }) => {
        const chapter = row.original;
        const accessStatus = chapter.chapterAccessStatus // Fallback to isLocked if no status
        
        if (accessStatus === ChapterAccessStatus.PUBLISHED) { // Published/Unlocked
          return (
            <Badge variant="outline" className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-700/50">
              Published
            </Badge>
          );
        } else if (accessStatus === ChapterAccessStatus.PENDING_REVIEW) { // Private/Locked
          return (
            <Badge variant="outline" className="bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-700/50">
              Pending Review
            </Badge>
          );
        } else if (accessStatus === ChapterAccessStatus.REJECTED) { // Blocked
          return (
            <Badge variant="outline" className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-700/50">
              Rejected
            </Badge>
          );
        } else if (accessStatus === ChapterAccessStatus.DRAFT) { // Pending
          return (
            <Badge variant="outline" className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-700/50">
              Draft
            </Badge>
          );
        } else {
          return (
            <Badge variant="outline" className="bg-gray-100 dark:bg-gray-700/50 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-600/50">
              Unknown
            </Badge>
          );
        }
      },
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }: { row: any }) => <div className="dark:text-gray-100">{formatDate(row.original.createdAt)}</div>,
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }: { row: any }) => (
        <div className="flex justify-end space-x-2">
          <Button variant="ghost" size="icon" asChild className="dark:hover:bg-gray-600">
            <Link href={`/books/${row.original.bookId}/read?chapter=${row.original.chapter}&id=${row.original.id}`}>
              <Eye className="h-4 w-4 dark:text-gray-100" />
              <span className="sr-only">View Chapter</span>
            </Link>
          </Button>
        </div>
      ),
    },
  ];

  // Update the search implementation
  const [debouncedSearchQuery] = useDebounce(searchQuery, 300);

  useEffect(() => {
    setSearchApplied(debouncedSearchQuery);
  }, [debouncedSearchQuery]);

  // Create a custom wrapper component for the DataTable
  const CustomDataTable = () => {
    if (!data || !data.books || data.books.length === 0) {
      return (
        <div className="text-center py-10 border rounded-lg dark:border-gray-700 dark:bg-gray-800">
          <div className="flex justify-center mb-4">
            <BookOpen size={48} className="text-muted-foreground/50 dark:text-gray-600" />
          </div>
          <p className="text-muted-foreground dark:text-gray-400">No books to review at this time.</p>
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
        : column.id === "bookType" ? "Type"
        : column.id === "ageRating" ? "Age Rating"
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
            <Link href={`/books/${book.id}`} className="hover:underline hover:text-yellow-600">{book.title}</Link>
          </div>
        );
      }
      
      if (column.id === "bookType") {
        return (
          <Badge variant="outline" className={`${book.bookType?.name === BOOK_TYPES.MANGA ? 'bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-300' : 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300'} capitalize`}>
            {book.bookType?.name?.toLowerCase() || "Unknown"}
          </Badge>
        );
      }
      
      if (column.id === "ageRating") {
        const ageRating = book.ageRating;
        let badgeClass = "bg-gray-100 dark:bg-gray-700/50 text-gray-800 dark:text-gray-300";
        let displayText = "Unknown";
        
        if (ageRating === AgeRatingEnum.ADULT) {
          badgeClass = "bg-red-200 dark:bg-red-900/30 text-red-800 dark:text-red-300 font-medium";
          displayText = "18+";
        } else if (ageRating === AgeRatingEnum.MATURE) {
          badgeClass = "bg-orange-200 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 font-medium";
          displayText = "16+";
        } else if (ageRating === AgeRatingEnum.TEEN) {
          badgeClass = "bg-amber-200 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 font-medium";
          displayText = "13+";
        } else if (ageRating === AgeRatingEnum.EVERYONE) {
          badgeClass = "bg-green-200 dark:bg-green-900/30 text-green-800 dark:text-green-300 font-medium";
          displayText = "All";
        }
        
        return (
          <Badge variant="outline" className={badgeClass}>
            {displayText}
          </Badge>
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
        const hasModeration = (book as any).moderation && Array.isArray((book as any).moderation) && (book as any).moderation.length > 0;
        
        if (!hasModeration) {
          return (
            <Badge 
              variant="outline" 
              className="bg-gray-100 dark:bg-gray-700/50 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-600/50 cursor-pointer"
              onClick={() => handleViewModerationResults('Level 3', book, false)}
            >
              Not Moderated
            </Badge>
          );
        }

        // Show all moderation results
        return (
          <div className="flex flex-wrap gap-1">
            {(book as any).moderation.map((modResult: any, index: number) => {
              const model = modResult.model as DisplayModerationModelType;
              const isPassed = checkModerationPassed(modResult, book.ageRating as NumericAgeRating || 0);
              
              return (
                <Badge 
                  key={index}
                  variant="outline" 
                  className={`${isPassed 
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-700/50' 
                    : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-700/50'
                  } cursor-pointer text-xs`}
                  onClick={() => handleViewModerationResults(model, book, true, modResult)}
                >
                  <Shield className="h-3 w-3 mr-1" />
                  {model}
                </Badge>
              );
            })}
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
                  className="h-8 w-8 text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 cursor-pointer"
                  onClick={() => handleApproveBook(book.id)}
                  title="Approve Book"
                >
                  <CheckCircle className="h-4 w-4" />
                  <span className="sr-only">Approve book</span>
                </Button>
                <RejectBookPopover
                  bookId={book.id}
                  bookTitle={book.title}
                  onReject={handleRejectBook}
                  isLoading={rejectBookMutation.isPending}
                  trigger={
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="h-8 w-8 text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 cursor-pointer"
                      title="Reject Book"
                    >
                      <XCircle className="h-4 w-4" />
                      <span className="sr-only">Reject book</span>
                    </Button>
                  }
                />
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
      <div className="rounded-md border dark:border-gray-700">
        <table className="w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.id}
                  className={`px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 tracking-wider ${column.id === "select" && "w-[32px] pr-2"} ${column.id === "expand" && "w-[32px] pl-0 pr-0"}`}
                >
                  {renderColumnHeader(column)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {data.books.map((book) => (
              <React.Fragment key={book.id}>
                <tr>
                  {columns.map((column) => (
                    <td 
                      key={column.id} 
                      className={`px-4 py-2 dark:text-gray-300 ${column.id === "select" && "pr-2"} ${column.id === "expand" && "pl-0 pr-0"}`}
                    >
                      {renderColumnCell(column, book)}
                    </td>
                  ))}
                </tr>
                {expandedRows[book.id] && (
                  <tr>
                    <td colSpan={columns.length} className="px-12 py-2 border-b dark:border-gray-700">
                      {renderChapters(book)}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
        <div className="flex items-center justify-between space-x-2 p-4 border-t dark:border-gray-700">
          <div className="text-sm text-muted-foreground dark:text-gray-400">
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
      <div className="p-4 bg-slate-50 dark:bg-gray-800 rounded-md border dark:border-gray-700">
        {loadingChapters[book.id] ? (
          <div className="rounded-md border dark:border-gray-700 overflow-hidden">
            <table className="w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  {chapterColumns.map((column) => (
                    <th
                      key={column.accessorKey || column.id}
                      className={`px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 tracking-wider ${column.accessorKey === "chapter" && "w-[100px]"} ${column.id === "actions" && "w-[50px]"}`}
                    >
                      {column.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {/* Skeleton loader rows based on book's totalChapters */}
                {Array.from({ length: book.totalChapters || 3 }).map((_, index) => (
                  <tr key={`skeleton-${index}`} className="animate-pulse">
                    <td className="px-4 py-2">
                      <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-8"></div>
                    </td>
                    <td className="px-4 py-2">
                      <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-full"></div>
                    </td>
                    <td className="px-4 py-2">
                      <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded w-16 mx-auto"></div>
                    </td>
                    <td className="px-4 py-2">
                      <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-24"></div>
                    </td>
                    <td className="px-4 py-2">
                      <div className="h-8 bg-gray-200 dark:bg-gray-600 rounded-full w-8 ml-auto"></div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : chaptersData[book.id]?.length ? (
          <div className="rounded-md border dark:border-gray-700 overflow-hidden">
            <table className="w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  {chapterColumns.map((column) => (
                    <th
                      key={column.accessorKey || column.id}
                      className={`px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider ${column.accessorKey === "chapter" && "w-[100px]"} ${column.id === "actions" && "w-[50px]"}`}
                    >
                      {column.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {chaptersData[book.id].map((chapter) => (
                  <tr key={chapter.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    {chapterColumns.map((column) => (
                      <td key={column.accessorKey || column.id} className="px-4 py-2 text-gray-900 dark:text-gray-100">
                        {column.cell({ row: { original: {...chapter, bookId: book.id} } })}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground dark:text-gray-400">
            No chapters found for this book.
          </div>
        )}
      </div>
    );
  };

  // Helper function to check content moderation
  const checkContentModeration = async (model: DisplayModerationModelType, book: ExtendedBook): Promise<EnhancedModerationResult> => {
    if (!book) {
      throw new Error("No book selected for moderation");
    }

    // Get chapters data if needed
    let chaptersResponse;
    if (!chaptersData[book.id]) {
      const response = await getChaptersByBookId(book.id);
      if (response.code === 200) {
        chaptersResponse = response.data;
        setChaptersData((prev: Record<number, Chapter[]>) => ({...prev, [book.id]: response.data}));
      } else {
        throw new Error("Failed to load chapters");
      }
    } else {
      chaptersResponse = chaptersData[book.id];
    }

    // Filter chapters that are in pending status
    const pendingChapters = chaptersResponse?.filter(
      (chapter: Chapter) => chapter.chapterAccessStatus === ChapterAccessStatus.PENDING_REVIEW
    ) || [];

    // Prepare chapters for moderation
    const chapters = pendingChapters.map((chapter: Chapter, index: number) => ({
      id: chapter.id,
      chapter: index + 1,
      title: chapter.title,
      content: book.bookType.name === BOOK_TYPES.NOVEL && typeof chapter.content === 'string'
        ? extractChapterContent(chapter.content)
        : JSON.parse(chapter.content as string)
    }));

    // Call moderation API
    const result = await moderateContent({
      title: book.title,
      description: book.description,
      chapters: chapters,
      coverImage: book.cover,
      model: model === 'Level 1' ? MODERATION_MODELS.OMNI : model === 'Level 2' ? MODERATION_MODELS.O4_MINI : MODERATION_MODELS.GPT4O
    });

    console.log('result==========', result);
    
    // Process the moderation results to add flagged property to each content item
    const ageRating = book.ageRating as NumericAgeRating || 0;
    
    if (result && result.contentResults) {
      // Process title
      const title = result.contentResults.title as any;
      if (title && title.category_scores) {
        title.flagged = checkContentFlagged(
          title.category_scores as Record<string, number>, 
          ageRating as number
        );
      }
      
      // Process description
      const description = result.contentResults.description as any;
      if (description && description.category_scores) {
        description.flagged = checkContentFlagged(
          description.category_scores as Record<string, number>, 
          ageRating as number
        );
      }
      
      // Process cover image
      const coverImage = result.contentResults.coverImage as any;
      if (coverImage && coverImage.category_scores) {
        coverImage.flagged = checkContentFlagged(
          coverImage.category_scores as Record<string, number>, 
          ageRating as number
        );
      }
      
      // Process chapters
      const chapters = result.contentResults.chapters as any[];
      if (chapters && chapters.length > 0) {
        chapters.forEach(chapter => {
          if (chapter.result && chapter.result.category_scores) {
            chapter.result.flagged = checkContentFlagged(
              chapter.result.category_scores as Record<string, number>,
              ageRating as number
            );
          }
        });
      }
      
      // Determine overall flagged status (failed if any content is flagged)
      const titleFlagged = title?.flagged || false;
      const descriptionFlagged = description?.flagged || false;
      const coverImageFlagged = coverImage?.flagged || false;
      const anyChapterFlagged = chapters?.some(chapter => chapter.result?.flagged) || false;
      
      // Set overall flagged status
      (result as any).flagged = titleFlagged || descriptionFlagged || coverImageFlagged || anyChapterFlagged;
      
      // Set passed property for clearer UI feedback
      (result as any).passed = !(result as any).flagged;
    }
    
    return result as EnhancedModerationResult;
  };

  // Function to run content moderation
  const handleRunModeration = async (model: DisplayModerationModelType, book: ExtendedBook, isEdit: boolean = false) => {
    // Set loading state and book
    setCheckingModeration(true);
    setSelectedModel(model);
    setSelectedBook(book);
    setIsViewingModeration(false); // Reset viewing mode
    setIsEditingModeration(isEdit); // Set edit mode based on parameter
    
    try {
      // Call moderation API
      const results = await checkContentModeration(model, book);
      
      // Update moderation results and open dialog
      setModerationResults(results);
      
      // Automatically save results if book ID is available
      if (book.id) {
        // Prepare the moderation data
        const moderationData: ModerationResultsPayload = {
          title: results.contentResults?.title 
            ? JSON.stringify(results.contentResults.title) 
            : null,
          description: results.contentResults?.description 
            ? JSON.stringify(results.contentResults.description) 
            : null,
          coverImage: results.contentResults?.coverImage 
            ? JSON.stringify(results.contentResults.coverImage) 
            : null,
          chapters: results.contentResults?.chapters 
            ? JSON.stringify(results.contentResults.chapters)
            : null,
          model: results.model,
          bookId: book.id,
        };

        try {
          // Save results using the static function
          const savedResult = await saveModerateResultsStatic(book.id, moderationData, isEdit);
          
          // Store the saved result in available results
          if (savedResult) {
            setAvailableModelResults(prev => ({
              ...prev,
              [model]: savedResult
            }));
          }
          
          // Re-fetch the book data
          queryClient.invalidateQueries({
            queryKey: ADMIN_KEYS.BOOKS.LIST(selectedTab, currentPage, searchApplied)
          });

        } catch (saveError) {
          console.error("Error saving moderation results:", saveError);
          toast.error("Failed to save moderation results automatically");
        }
      }
      
      setModerationDialogOpen(true);
    } catch (error) {
      console.error("Error checking moderation:", error);
      toast.error("Failed to check moderation");
    } finally {
      setCheckingModeration(false);
    }
  };

  return (
    <div className="space-y-6 dark:bg-gray-900 min-h-screen">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold dark:text-white">Content Moderation</h1>
          <p className="text-muted-foreground dark:text-gray-400 mt-1">Review and approve books submitted by users</p>
        </div>
      </div>

      <Tabs 
        defaultValue="pending" 
        value={selectedTab} 
        onValueChange={(value) => handleTabChange(value as "pending" | "published" | "blocked")} 
        className="w-full dark:bg-gray-900"
      >
        <TabsList className="dark:bg-gray-800">
          <TabsTrigger value="pending" className="dark:text-gray-300 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white">Pending Review</TabsTrigger>
          <TabsTrigger value="published" className="dark:text-gray-300 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white">Published</TabsTrigger>
          <TabsTrigger value="blocked" className="dark:text-gray-300 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white">Rejected</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab} className="mt-4">
          <div className="relative mb-4">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground dark:text-gray-400" />
            <Input
              type="search"
              placeholder="Search books..."
              className="pl-8 w-[250px] dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {isError && (
            <div className="rounded-md bg-yellow-100/15 dark:bg-yellow-900/20 p-4 text-yellow-600 dark:text-yellow-400 flex items-center border dark:border-yellow-800">
              <AlertTriangle className="h-5 w-5 mr-2" />
              <p>Error loading books: {error?.message || "Unknown error occurred"}</p>
              <Button variant="outline" size="sm" className="ml-auto dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700" onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 dark:text-white">Loading books...</span>
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
          open={moderationDialogOpen}
          onOpenChange={setModerationDialogOpen}
          results={moderationResults}
          selectedModel={selectedModel}
          onModelChange={(model) => {
            setSelectedModel(model);
            // Check if we have results for this model
            if (availableModelResults[model]) {
              // If we have results, view them
              handleViewModerationResults(model, selectedBook, isViewingModeration, availableModelResults[model]);
            } else {
              // If not, keep the dialog open but clear current results - this will trigger the empty state
              // with a "Run" button
              setModerationResults(null);
            }
          }}
          onRecheck={(isEdit: boolean) => handleRunModeration(selectedModel, selectedBook as ExtendedBook, isEdit)}
          isLoading={checkingModeration}
          bookAgeRating={selectedBook?.ageRating as NumericAgeRating || 0}
          bookId={selectedBook?.id}
          isViewing={isViewingModeration}
          isEdit={isEditingModeration}
        />
      )}
    </div>
  );
} 