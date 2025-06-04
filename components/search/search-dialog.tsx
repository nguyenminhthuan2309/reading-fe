"use client";

import * as React from "react";
import { 
  Dialog, 
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Search, Book, User, Tag, Loader2, XCircle, History } from "lucide-react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getBooks } from "@/lib/api/books";
import { searchUsersByName, addRecentSearch, getRecentSearches } from "@/lib/api/user";
import { Book as BookType, User as UserType, Category } from "@/models";
import { useInView } from "react-intersection-observer";
import { useDebounce } from "use-debounce";
import { 
  useInfiniteQuery, 
  keepPreviousData, 
  useQueryClient,
  useMutation,
  useQuery
} from "@tanstack/react-query";

type SearchMode = "book" | "author";

// Type for recent search items
interface RecentSearchItem {
  id: number;
  title: string;
  type: string;
}


// No results component with icon
const NoResults = ({ query, mode }: { query: string; mode: SearchMode }) => (
  <div className="flex flex-col items-center justify-center text-center h-full py-8">
    <XCircle className="h-12 w-12 text-muted-foreground mb-3 opacity-50" />
    <h3 className="text-base font-medium mb-1">No {mode}s found</h3>
    <p className="text-sm text-muted-foreground">
      We couldn't find any {mode}s matching "{query}"
    </p>
    <p className="text-xs text-muted-foreground mt-1">
      Try a different search term
    </p>
  </div>
);

// Type for paginated API responses
interface PaginatedResponse {
  data: BookType[] | UserType[];
  totalPages: number;
  totalItems: number;
}

interface SearchDialogProps {
  variant?: 'default' | 'mobile';
}

export function SearchDialog({ variant = 'default' }: SearchDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [searchMode, setSearchMode] = React.useState<SearchMode>("book");
  const [recentSearches, setRecentSearches] = React.useState<RecentSearchItem[]>([]);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const router = useRouter();
  const queryClient = useQueryClient();
  
  // Query for fetching recent searches
  const { data: recentSearchesData, refetch: refetchRecentSearches } = useQuery({
    queryKey: ['recentSearches'],
    queryFn: async () => {
      const response = await getRecentSearches();
      if (response.code === 200) {
        return response.data.map(item => ({
          id: item.id,
          title: item.searchValue,
          type: item.searchType,
        }));
      }
      return [];
    },
    enabled: false, // Don't fetch on component mount
  });
  
  // Update local state when backend data changes
  React.useEffect(() => {
    if (recentSearchesData) {
      setRecentSearches(recentSearchesData);
    }
  }, [recentSearchesData]);
  
  // Fetch recent searches when the dialog opens
  React.useEffect(() => {
    if (open) {
      refetchRecentSearches();
    }
  }, [open, refetchRecentSearches]);
  
  // Store the search query in local storage for recent searches
  const addToRecentSearches = React.useCallback((item: RecentSearchItem) => {
    setRecentSearches(prev => {
      // Remove if already exists
      const filtered = prev.filter(search => !(search.title === item.title && search.type === item.type));
      // Add to beginning and limit to 5
      return [item, ...filtered].slice(0, 5);
    });
  }, []);
  
  // Mutation for adding recent searches to the backend
  const addRecentSearchMutation = useMutation({
    mutationFn: ({ searchType, searchValue }: { searchType: string; searchValue: string }) => 
      addRecentSearch(searchType, searchValue),
    onSuccess: () => {
      // Refetch recent searches after a successful mutation
      refetchRecentSearches();
    },
    onError: (error) => {
      console.error("Failed to save recent search:", error);
    }
  });
  
  // Debounced search query
  const [debouncedQuery] = useDebounce(query, 300);
  
  // Book search React Query
  const {
    data: bookResults,
    fetchNextPage: fetchNextBookPage,
    hasNextPage: hasMoreBooks,
    isFetchingNextPage: isLoadingMoreBooks,
    isFetching: isLoadingBooks,
  } = useInfiniteQuery<PaginatedResponse>({
    queryKey: ['searchBooks', debouncedQuery],
    queryFn: async ({ pageParam }) => {
      if (!debouncedQuery.trim()) return { data: [], totalPages: 0, totalItems: 0 };
      
      const response = await getBooks({
        search: debouncedQuery,
        page: pageParam as number,
        limit: 5,
        accessStatusId: 1,
      });
      
      return response.data;
    },
    getNextPageParam: (lastPage, pages) => {
      return pages.length < (lastPage as PaginatedResponse).totalPages ? pages.length + 1 : undefined;
    },
    enabled: searchMode === 'book' && debouncedQuery.trim().length > 0,
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 5, // 5 minutes
    initialPageParam: 1,
  });
  
  // Author search React Query
  const {
    data: authorResults,
    fetchNextPage: fetchNextAuthorPage,
    hasNextPage: hasMoreAuthors,
    isFetchingNextPage: isLoadingMoreAuthors,
    isFetching: isLoadingAuthors,
  } = useInfiniteQuery<PaginatedResponse>({
    queryKey: ['searchAuthors', debouncedQuery],
    queryFn: async ({ pageParam }) => {
      if (!debouncedQuery.trim()) return { data: [], totalPages: 0, totalItems: 0 };
      
      const response = await searchUsersByName(debouncedQuery, pageParam as number, 5);
      
      return response.data;
    },
    getNextPageParam: (lastPage, pages) => {
      return pages.length < (lastPage as PaginatedResponse).totalPages ? pages.length + 1 : undefined;
    },
    enabled: searchMode === 'author' && debouncedQuery.trim().length > 0,
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 5, // 5 minutes
    initialPageParam: 1,
  });
  
  // Update query
  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };
  
  // Clear results when dialog closes
  React.useEffect(() => {
    if (!open) {
      setQuery("");
    }
  }, [open]);
  
  // InView hook for infinite loading
  const { ref: bookLoadMoreRef, inView: bookLoadMoreInView } = useInView();
  const { ref: authorLoadMoreRef, inView: authorLoadMoreInView } = useInView();
  
  // Trigger load more when in view
  React.useEffect(() => {
    if (bookLoadMoreInView && hasMoreBooks && searchMode === "book") {
      fetchNextBookPage();
    }
  }, [bookLoadMoreInView, hasMoreBooks, searchMode, fetchNextBookPage]);
  
  React.useEffect(() => {
    if (authorLoadMoreInView && hasMoreAuthors && searchMode === "author") {
      fetchNextAuthorPage();
    }
  }, [authorLoadMoreInView, hasMoreAuthors, searchMode, fetchNextAuthorPage]);
  
  // Listen for keyboard shortcut
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Command+K (Mac) or Control+K (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
  
  // Focus input when dialog opens
  React.useEffect(() => {
    if (open) {
      // Use a shorter timeout to ensure focus happens sooner
      const focusTimeout = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      
      return () => clearTimeout(focusTimeout);
    }
  }, [open]);
  
  // Handle result selection
  const handleBookClick = (book: BookType) => {
    setOpen(false);
    setQuery("");
    
    // Save to backend
    addRecentSearchMutation.mutate({
      searchType: "book",
      searchValue: book.title
    });
    
    router.push(`/books/${book.id}`);
  };
  
  const handleAuthorClick = (author: UserType) => {
    setOpen(false);
    setQuery("");

    // Save to backend
    addRecentSearchMutation.mutate({
      searchType: "author",
      searchValue: author.name
    });
    
    router.push(`/user/${author.id}`);
  };
  
  const handleRecentSearchClick = (item: typeof recentSearches[0]) => {
    setOpen(false);
    
    if (item.type === "book") {
      router.push(`/books/${item.id}`);
    } else if (item.type === "author") {
      router.push(`/user/${item.id}`);
    } else if (item.type === "category") {
      router.push(`/categories/${item.id}`);
    }
  };
  
  // Get icon based on result type
  const getResultIcon = (type: string) => {
    switch (type) {
      case "book":
        return <Book className="h-4 w-4 text-muted-foreground" />;
      case "author":
        return <User className="h-4 w-4 text-muted-foreground" />;
      case "category":
        return <Tag className="h-4 w-4 text-muted-foreground" />;
      default:
        return <Search className="h-4 w-4 text-muted-foreground" />;
    }
  };

  // Determine the shortcut text based on platform
  const shortcutText = React.useMemo(() => {
    return typeof navigator !== 'undefined' && navigator.platform.toLowerCase().includes('mac') ? '⌘K' : 'Ctrl+K';
  }, []);

  // Get flattened book results from infinite query
  const flattenedBookResults = React.useMemo(() => {
    return bookResults?.pages.flatMap(page => page.data as BookType[]) || [];
  }, [bookResults]);

  // Get flattened author results from infinite query
  const flattenedAuthorResults = React.useMemo(() => {
    return authorResults?.pages.flatMap(page => page.data as UserType[]) || [];
  }, [authorResults]);

  // Determine button styling based on variant
  const buttonClass = variant === 'mobile' 
    ? "w-full flex items-center justify-center gap-2 bg-muted py-2 px-4 rounded-md border border-input focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-ring" 
    : "flex items-center relative bg-gray-100 rounded-md pr-4 pl-10 h-9 min-w-[200px] hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors text-sm text-muted-foreground border";

  return (
    <>
      {variant === 'mobile' ? (
        <button
          onClick={() => setOpen(true)}
          className={buttonClass}
        >
          <Search className="h-4 w-4 mr-2" />
          <span>Search</span>
        </button>
      ) : (
        <div className="relative">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 z-10 text-muted-foreground" />
          <button
            onClick={() => setOpen(true)}
            className={buttonClass}
            aria-label="Search"
          >
            <span className="truncate">Search books or authors...</span>
            <kbd className="ml-2 pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
              <span className="text-xs">{shortcutText}</span>
            </kbd>
          </button>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[600px] p-0 gap-0">
          <DialogHeader className="px-4 pt-4 pb-0">
            <DialogTitle className="sr-only">Search Haru's Library</DialogTitle>
          </DialogHeader>
          
          {/* Tabs for switching search mode */}
          <Tabs
            defaultValue="book"
            value={searchMode}
            onValueChange={(value) => setSearchMode(value as SearchMode)}
            className="px-4 pt-2 pb-8"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="book">Books</TabsTrigger>
              <TabsTrigger value="author">Authors</TabsTrigger>
            </TabsList>
            
            <div className="relative mt-2">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                ref={inputRef}
                placeholder={searchMode === "book" ? "Search for books..." : "Search for authors..."}
                className="pl-8"
                value={query}
                onChange={handleQueryChange}
                autoFocus
              />
              {query && (
                <div className="absolute right-2 top-[3px]">
                  <kbd className="inline-flex h-5 select-none items-center gap-1 rounded border px-1.5 font-mono text-xs font-medium text-muted-foreground">
                    ESC
                  </kbd>
                </div>
              )}
            </div>
            
            <div className="text-xs text-muted-foreground mt-2 mb-1">
              <span>Type to search {searchMode === "book" ? "books" : "authors"}</span>
            </div>
            
            <div className="h-[214px] overflow-hidden"> {/* Fixed height container */}
              <TabsContent value="book" className="mt-0 h-full">
                {/* Book search results */}
                {query ? (
                  <div 
                    className="h-full overflow-y-auto scrollbar-thin"
                    style={{ 
                      scrollbarWidth: 'thin', 
                      scrollbarColor: 'rgba(156, 163, 175, 0.3) transparent'
                    }}
                  >
                    {flattenedBookResults.length > 0 ? (
                      <div className="space-y-1 p-2">
                        {flattenedBookResults.map((book) => (
                          <button
                            key={book.id}
                            className="w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted text-left h-9"
                            onClick={() => handleBookClick(book)}
                          >
                            <Book className="h-4 w-4 text-muted-foreground" />
                            <span className="flex-1 truncate">{book.title}</span>
                            <span className="text-xs text-muted-foreground capitalize shrink-0">book</span>
                          </button>
                        ))}
                        {hasMoreBooks && (
                          <div ref={bookLoadMoreRef} className="flex justify-center py-2">
                            {isLoadingMoreBooks && <Loader2 className="h-4 w-4 animate-spin text-gray-500" />}
                          </div>
                        )}
                      </div>
                    ) : isLoadingBooks ? (
                      <div className="flex items-center justify-center h-full">
                        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                      </div>
                    ) : (
                      <NoResults query={query} mode="book" />
                    )}
                  </div>
                ) : (
                  <div 
                    className="h-full overflow-y-auto scrollbar-thin"
                    style={{ 
                      scrollbarWidth: 'thin', 
                      scrollbarColor: 'rgba(156, 163, 175, 0.3) transparent' 
                    }}
                  >
                    {/* Recent book searches */}
                    <div className="pt-1 px-2">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-medium">Recent searches</h3>
                        <History className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <div className="space-y-1">
                        {recentSearches
                          .filter(item => item.type === "book")
                          .map((item, index) => (
                            <button
                              key={index}
                              className="w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted text-left h-9"
                              onClick={() => handleRecentSearchClick(item)}
                            >
                              {getResultIcon(item.type)}
                              <span className="flex-1 truncate">{item.title}</span>
                              <span className="text-xs text-muted-foreground capitalize shrink-0">{item.type}</span>
                            </button>
                          ))}
                        {recentSearches.filter(item => item.type === "book").length === 0 && (
                          <div className="text-center text-sm text-muted-foreground p-2">
                            No recent book searches
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="author" className="mt-0 h-full">
                {/* Author search results */}
                {query ? (
                  <div 
                    className="h-full overflow-y-auto scrollbar-thin"
                    style={{ 
                      scrollbarWidth: 'thin', 
                      scrollbarColor: 'rgba(156, 163, 175, 0.3) transparent' 
                    }}
                  >
                    {flattenedAuthorResults?.length > 0 ? (
                      <div className="space-y-1 p-2">
                        {flattenedAuthorResults.map((author) => (
                          <button
                            key={author.id}
                            className="w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted text-left h-9"
                            onClick={() => handleAuthorClick(author)}
                          >
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="flex-1 truncate">{author.name}</span>
                            <span className="text-xs text-muted-foreground capitalize shrink-0">author</span>
                          </button>
                        ))}
                        {hasMoreAuthors && (
                          <div ref={authorLoadMoreRef} className="flex justify-center py-2">
                            {isLoadingMoreAuthors && <Loader2 className="h-4 w-4 animate-spin text-gray-500" />}
                          </div>
                        )}
                      </div>
                    ) : isLoadingAuthors ? (
                      <div className="flex items-center justify-center h-full">
                        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                      </div>
                    ) : (
                      <NoResults query={query} mode="author" />
                    )}
                  </div>
                ) : (
                  <div 
                    className="h-full overflow-y-auto scrollbar-thin"
                    style={{ 
                      scrollbarWidth: 'thin', 
                      scrollbarColor: 'rgba(156, 163, 175, 0.3) transparent' 
                    }}
                  >
                    {/* Recent author searches */}
                    <div className="pt-1 px-2">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-medium">Recent searches</h3>
                        <History className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <div className="space-y-1">
                        {recentSearches
                          .filter(item => item.type === "author")
                          .map((item, index) => (
                            <button
                              key={index}
                              className="w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted text-left h-9"
                              onClick={() => handleRecentSearchClick(item)}
                            >
                              {getResultIcon(item.type)}
                              <span className="flex-1 truncate">{item.title}</span>
                              <span className="text-xs text-muted-foreground capitalize shrink-0">{item.type}</span>
                            </button>
                          ))}
                        {recentSearches.filter(item => item.type === "author").length === 0 && (
                          <div className="text-center text-sm text-muted-foreground p-2">
                            No recent author searches
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>
            </div>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
} 