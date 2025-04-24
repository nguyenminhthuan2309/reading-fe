"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getBooks, getGenres } from "@/lib/api/books";
import { Author, BookFilters, Category, SortDirectionEnum } from "@/models/book";
import { BookCard } from "@/components/books/book-card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Filter, PlusCircle, Search, SlidersHorizontal, ChevronsLeft, ChevronsRight } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import { GENRE_OPTIONS } from "@/models/genre";
import React from "react";
import { useUserStore } from "@/lib/store";
import { BOOK_KEYS, CATEGORY_KEYS } from "@/lib/constants/query-keys";
// Define a string-based genre type for the UI
type UIGenre = string;

// Define genre categories with predefined mappings
const GENRE_CATEGORIES: Record<string, string[]> = {
  "Popular Genres": [
    "Fantasy", "Romance", "Mystery", "Adventure", "Sci-fi", 
    "Drama", "Comedy", "Thriller", "Horror"
  ],
  "Eastern": [
    "Wuxia", "Xianxia", "Xuanhuan", "Martial Arts", 
    "Philosophical", "Historical"
  ],
  "Speculative": [
    "Supernatural", "Horror", "Time Travel", "Cyberpunk", 
    "Magic", "Post-Apocalyptic", "Steampunk", "Virtual Reality"
  ],
  "Contemporary": [
    "Drama", "Slice of Life", "School Life", "Comedy", 
    "Crime", "Detective", "Psychological", "Tragedy"
  ],
  "Other Genres": [] // This will be populated dynamically with any uncategorized genres
};

// Default genre categories used before API data is loaded
const defaultGenreCategories: Record<string, UIGenre[]> = GENRE_CATEGORIES;

// Page size options
const PAGE_SIZE_OPTIONS = [16, 24, 36];

// Book type for display
interface DisplayBook {
  id: number;
  title: string;
  description: string;
  chapters: number;
  rating: number;
  genre: Category[];
  progress: number;
  coverImage: string;
  author?: Author; // Adding authorId field to match the usage
  isFollowed: boolean;
}

// Define the API response type structure
interface PaginatedData<T> {
  data: T[];
  totalItems: number;
  totalPages: number;
}

export default function BooksPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { user } = useUserStore();
  
  // Parse query parameters
  const currentPage = Number(searchParams.get("page")) || 1;
  const pageSize = Number(searchParams.get("limit")) || 16;
  const searchQuery = searchParams.get("search") || "";
  const sortByParam = searchParams.get("sortBy") || "title";
  const sortDirectionParam = searchParams.get("sortDirection") || SortDirectionEnum.DESC;
  
  // Parse selectedGenres from URL (comma-separated list of genres)
  const selectedGenresParam = searchParams.get("genres") || "";
  const selectedGenres = selectedGenresParam ? selectedGenresParam.split(",") as UIGenre[] : [];
  
  // UI state
  const [searchInput, setSearchInput] = useState(searchQuery);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<string[]>(
    Object.keys(GENRE_CATEGORIES) // Initialize with predefined categories
  );

  // Clear the timer on component unmount
  useEffect(() => {
    return () => {
      if (searchDebounceTimerRef.current) {
        clearTimeout(searchDebounceTimerRef.current);
      }
    };
  }, []);

  // Fetch genres from the API
  const { 
    data: genresData,
    isLoading: isLoadingGenres
  } = useQuery({
    queryKey: CATEGORY_KEYS.CATEGORIES,
    queryFn: async () => {
      const response = await getGenres();
      if (response.status !== 200) {
        throw new Error(response.msg || 'Failed to fetch genres');
      }
      return response.data as Category[];
    },
    staleTime: Infinity, // Never mark data as stale
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
    refetchOnMount: false, // Don't refetch when component remounts
    refetchOnReconnect: false // Don't refetch when network reconnects
  });
  
  // Transform genres data into categories
  const genreCategories: Record<string, UIGenre[]> = useMemo(() => {
    if (!genresData || genresData.length === 0) {
      return defaultGenreCategories;
    }
    
    // Create a copy of our category definition to populate
    const categorizedGenres: Record<string, UIGenre[]> = {};
    
    // Track which genres have been categorized
    const categorizedGenreNames = new Set<string>();
    
    // Populate each category with matching genres from the API
    Object.entries(GENRE_CATEGORIES).forEach(([category, genreList]) => {
      // Skip "Other Genres" as we'll handle it separately
      if (category !== "Other Genres") {
        // Filter API genres that match this category's predefined genres
        const matchingGenres = genresData
          .filter(apiGenre => genreList.includes(apiGenre.name))
          .map(apiGenre => {
            categorizedGenreNames.add(apiGenre.name); // Mark as categorized
            return apiGenre.name;
          });
        
        // Only add the category if it has matching genres
        if (matchingGenres.length > 0) {
          categorizedGenres[category] = matchingGenres;
        }
      }
    });
    
    // Add "Other Genres" category with any remaining uncategorized genres
    const otherGenres = genresData
      .filter(apiGenre => !categorizedGenreNames.has(apiGenre.name))
      .map(apiGenre => apiGenre.name);
    
    if (otherGenres.length > 0) {
      categorizedGenres["Other Genres"] = otherGenres;
    }
    
    return categorizedGenres;
  }, [genresData]);
  
  // Update expanded categories when genre categories change
  useEffect(() => {
    if (genresData && genresData.length > 0) {
      // Expand categories by default
      setExpandedCategories(Object.keys(genreCategories));
    }
  }, [genreCategories, genresData]);

  // Helper function to update URL with new query parameters
  const updateUrlParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    
    // Apply all updates
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    
    // Always reset to page 1 when filters change, unless we're explicitly changing the page
    if (!updates.hasOwnProperty('page')) {
      params.set('page', '1');
    }
    
    // Use shallow routing to update URL without triggering a full navigation
    const url = `/books?${params.toString()}`;
    // Use the router to update the URL without a full page refresh
    router.push(url, { scroll: false });
  };
  
  // Debounced search handler
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSearchValue = e.target.value;
    setSearchInput(newSearchValue);
    
    // Save cursor position for later restoration
    const selectionStart = e.target.selectionStart;
    const selectionEnd = e.target.selectionEnd;
    
    // Clear any existing timer
    if (searchDebounceTimerRef.current) {
      clearTimeout(searchDebounceTimerRef.current);
    }
    
    // Set a new timer for the debounce
    searchDebounceTimerRef.current = setTimeout(() => {
      // Update the URL with the new search parameter
      updateUrlParams({
        search: newSearchValue || null,
        page: "1", // Reset to first page when search changes
      });
      
      // Restore focus after URL params change
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
          // Restore cursor position if available
          if (selectionStart !== null && selectionEnd !== null) {
            searchInputRef.current.setSelectionRange(selectionStart, selectionEnd);
          }
        }
      }, 10);
    }, 300);
  };

  // Prepare filters for API request
  const filters: BookFilters = useMemo(() => {
    const queryFilters: BookFilters = {
      page: currentPage,
      limit: pageSize,
      sortBy: sortByParam as "createdAt" | "updatedAt" | "views" | "title",
      sortDirection: sortDirectionParam as SortDirectionEnum,
    };
    
    if (searchQuery) queryFilters.search = searchQuery;
    if (selectedGenres.length > 0) {
      // Map selected genres to categoryIds using the genresData
      if (genresData) {
        const categoryIds = selectedGenres.map(genreName => {
          const category = genresData.find(g => g.name === genreName);
          return category ? category.id : 0;
        }).filter(id => id !== 0);
        
        if (categoryIds.length > 0) {
          queryFilters.categoryId = categoryIds;
        }
      }
    }
    
    return queryFilters;
  }, [currentPage, pageSize, sortByParam, sortDirectionParam, searchQuery, selectedGenres, genresData]);
  
  // Fetch books data with React Query - now with request cancellation
  const { 
    data: booksData, 
    isLoading: isLoadingBooks,
    isFetching: isFetchingBooks,
    error: booksError
  } = useQuery({
    queryKey: BOOK_KEYS.LIST(filters),
    queryFn: async ({ signal }) => {
      // Pass the signal to the underlying fetch by wrapping the API call
      const controller = new AbortController();
      // Forward the signal to abort our controller when React Query aborts
      signal.addEventListener('abort', () => {
        controller.abort();
      });

      try {
        const response = await getBooks(filters);
        if (response.status !== 200) {
          throw new Error(response.msg || 'Failed to fetch books');
        }
        return response.data;
      } catch (error) {
        if (controller.signal.aborted) {
          throw new Error('Request was cancelled');
        }
        throw new Error((error as Error).message || 'Failed to fetch books');
      }
    },
    staleTime: 30000, // Data remains fresh for 30 seconds
    placeholderData: (previous) => previous, // Equivalent to keepPreviousData
  });
  
  // When fetching completes, restore focus to search input if needed
  useEffect(() => {
    if (searchInput && searchInputRef.current && !isFetchingBooks) {
      searchInputRef.current.focus();
    }
  }, [isFetchingBooks, searchInput]);
  
  // Format book data for display
  const { displayedBooks, totalPages } = useMemo(() => {
    if (!booksData) {
      return { 
        displayedBooks: [] as DisplayBook[], 
        totalPages: 1,
      };
    }
    
    // Safe type assertion for book data
    const bookData = booksData as PaginatedData<{
      id: number;
      title: string;
      author: Author;
      description: string;
      totalChapters: number;
      rating: number;
      categories?: Category[];
      cover: string;
      isFollowed: boolean;
    }>;
    
    const books = bookData.data.map(book => ({
      id: book.id,
      title: book.title,
      author: book.author,
      description: book.description || "",
      chapters: book.totalChapters || 0,
      rating: book.rating || 0,
      genre: book.categories || [],
      progress: 0,
      coverImage: book.cover || "",
      authorId: book.author?.id,
      isFollowed: book.isFollowed,
    }));
    
    return {
      displayedBooks: books,
      totalPages: bookData.totalPages || 1,
    };
  }, [booksData]);

  // Toggle category expansion
  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category) 
        : [...prev, category]
    );
  };

  // Handlers for filtering
  const handleGenreToggle = (genre: UIGenre) => {
    const newSelectedGenres = selectedGenres.includes(genre)
      ? selectedGenres.filter(g => g !== genre)
      : [...selectedGenres, genre];
        
    // Update URL params with the new genres
    const genresParam = newSelectedGenres.length > 0 
      ? newSelectedGenres.join(',') 
      : null;
    
    updateUrlParams({
      'genres': genresParam,
      'page': '1' // Reset to first page when filter changes
    });
  };

  // Filter books based on selected genres
  const filteredBooks = useMemo(() => {
    if (selectedGenres.length === 0) {
      return displayedBooks;
    }
    
    return displayedBooks.filter(book => {
      // Filter by genres if any are selected
      const genreMatch = selectedGenres.length === 0 || 
        selectedGenres.some(genreName => book.genre.find(g => g.name === genreName));
      
      return genreMatch;
    });
  }, [displayedBooks, selectedGenres]);
  
  // Handle page change
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      updateUrlParams({ 'page': page.toString() });
    }
  };
  
  // Handle page size change
  const handlePageSizeChange = (size: string) => {
    updateUrlParams({ 'limit': size });
  };
  
  // Handle search submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // The search is now triggered by the debounced input change
  };
  
  // Handle sort change
  const handleSortChange = (value: string) => {
    updateUrlParams({ 'sortBy': value });
  };
  
  // Get genre display name from options
  const getGenreDisplayName = (genreValue: UIGenre): string => {
    const option = GENRE_OPTIONS.find(opt => opt.value === genreValue);
    return option?.label || genreValue;
  };
  
  // Determine if we should show loading states
  const showFullPageLoading = (isLoadingBooks && !booksData) || isLoadingGenres;
  const isTransitioning = isFetchingBooks && !isLoadingBooks;
  
  // Clear all filters
  const clearFilters = () => {
    updateUrlParams({
      'search': null,
      'genres': null,
      'page': '1'
    });
    setSearchInput("");
  };
  
  // Loading state - only for initial load
  if (showFullPageLoading) {
    return (
      <div className="container mx-auto px-4 py-8 pt-4">
        {/* Back button */}
        <div className="mb-3">
          <Button 
            variant="link" 
            className="flex items-center gap-2 py-1 pl-0"
            onClick={() => router.back()}
          >
            <ChevronLeft size={16} />
            Back
          </Button>
        </div>
        
        {/* Header skeleton */}
        <div className="mb-6">
          <Skeleton className="h-9 w-48 mb-2" />
          <Skeleton className="h-6 w-72" />
        </div>
        
        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar skeleton */}
          <div className="md:w-72 flex-shrink-0">
            <div className="border rounded-lg p-4 shadow-sm">
              <Skeleton className="h-7 w-full mb-4" />
              <div className="space-y-4">
                {Array(5).fill(0).map((_, i) => (
                  <div key={i}>
                    <Skeleton className="h-6 w-32 mb-2" />
                    <div className="space-y-2 pl-2">
                      {Array(4).fill(0).map((_, j) => (
                        <div key={j} className="flex items-center gap-2">
                          <Skeleton className="h-4 w-4 rounded" />
                          <Skeleton className="h-4 w-24" />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Books grid skeleton */}
          <div className="flex-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array(12).fill(0).map((_, index) => (
                <div key={index} className="flex flex-col space-y-2 border rounded-xl p-3">
                  <Skeleton className="aspect-[3/4] w-full rounded-lg" />
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Error state
  if (booksError) {
    return (
      <div className="container mx-auto px-4 py-12 pt-4 flex flex-col items-center justify-center text-center">
        <div className="max-w-md">
          <h1 className="text-3xl font-bold mb-4">Error Loading Books</h1>
          <p className="text-gray-600 mb-8">An error occurred while fetching the books. Please try again later.</p>
          <Button 
            variant="link" 
            className="flex items-center gap-2 py-1 pl-0"
            onClick={() => router.back()}
          >
            <ChevronLeft size={16} />
            Back
          </Button>
        </div>
      </div>
    );
  }
  
  // Render the main UI
  return (
    <div className="container mx-auto px-4 py-8 pt-4">
      {/* Back button */}
      <div className="mb-3">
        <Button 
          variant="link" 
          className="flex items-center gap-2 py-1 pl-0"
          onClick={() => router.back()}
        >
          <ChevronLeft size={16} />
          Back
        </Button>
      </div>
      
      {/* Header with search */}
      <div className="mb-3">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">All Books</h1>
            <p className="text-muted-foreground">
              Discover {filteredBooks.length} {selectedGenres.length === 1 ? getGenreDisplayName(selectedGenres[0]) : ""} books in our collection
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            {/* Search Bar - updated to use debounced input with ref for focus management */}
            <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-auto">
              <Input
                ref={searchInputRef}
                placeholder="Search books..."
                value={searchInput}
                onChange={handleSearchInputChange}
                className="pl-10 w-full sm:w-48 md:w-64"
                disabled={isTransitioning}
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </form>
            
            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <SlidersHorizontal size={16} className="text-muted-foreground hidden sm:block" />
              <Select value={sortByParam} onValueChange={handleSortChange} disabled={isTransitioning}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="title">Title (A-Z)</SelectItem>
                  <SelectItem value="rating">Rating (High to Low)</SelectItem>
                  <SelectItem value="chapters">Chapters (Most to Least)</SelectItem>
                  <SelectItem value="createdAt">Newest</SelectItem>
                  <SelectItem value="views">Most Popular</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Link href="/books/create" className="inline-block mt-2 sm:mt-0">
              <Button className="flex items-center gap-2 w-full sm:w-auto" disabled={isTransitioning}>
                <PlusCircle size={16} />
                Create New Book
              </Button>
            </Link>
          </div>
        </div>
      </div>
      
      {/* Mobile Filter Toggle */}
      <Button 
        variant="outline" 
        size="sm" 
        className="md:hidden w-full flex justify-between items-center mb-4"
        onClick={() => setShowMobileFilters(!showMobileFilters)}
        disabled={isTransitioning}
      >
        <span className="flex items-center gap-2">
          <Filter size={16} />
          {selectedGenres.length > 0 ? `Filters (${selectedGenres.length})` : "Browse Genres"}
        </span>
        <ChevronLeft 
          size={16} 
          className={`transition-transform ${showMobileFilters ? "rotate-90" : "-rotate-90"}`} 
        />
      </Button>
      
      <div className="flex flex-col md:flex-row gap-6">
        {/* Genre Filter Sidebar */}
        <div className={`md:w-72 flex-shrink-0 ${showMobileFilters ? 'block' : 'hidden md:block'}`}>
          <div className="bg-white border border-secondary/40 rounded-lg p-4 shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium">Browse Genres</h3>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearFilters}
                className={`h-8 text-xs transition-opacity duration-200 ${selectedGenres.length > 0 ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                disabled={isTransitioning}
              >
                Clear all
              </Button>
            </div>
            
            <div className="space-y-3" style={isTransitioning ? { opacity: 0.6, pointerEvents: 'none' } : {}}>
              {Object.entries(genreCategories).map(([category, categoryGenres]) => {
                // Get all genres from the category
                const availableGenres = categoryGenres as UIGenre[];
                
                return (
                  <Collapsible 
                    key={category}
                    open={expandedCategories.includes(category)}
                    onOpenChange={() => toggleCategory(category)}
                    className="border-b border-border pb-2 last:border-0 last:pb-0"
                  >
                    <CollapsibleTrigger className="flex justify-between items-center w-full text-left py-1 hover:text-primary group">
                      <div className="flex items-center">
                        <h4 className="text-sm font-medium leading-none">{category}</h4>
                        <span className={`text-xs inline-flex items-center ml-1.5 ${availableGenres.length === 0 ? 'text-muted-foreground/50' : 'text-muted-foreground'}`}>
                          ({genreCategories[category]?.reduce((total, genre) => {
                            const genreObj = genresData?.find(g => g.name === genre);
                            return total + (genreObj?.totalBooks || 0);
                          }, 0)})
                        </span>
                      </div>
                      <ChevronRight className={`h-4 w-4 transition-transform duration-200 group-hover:text-primary ${expandedCategories.includes(category) ? 'rotate-90' : ''}`} />
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent className="mt-1 pl-2 space-y-1">
                      {availableGenres.map((genre: string) => {
                        const count = filteredBooks.filter(book => book.genre.find(g => g.name === genre)).length;
                        const isSelected = selectedGenres.includes(genre);
                        const genreObj = genresData?.find(g => g.name === genre);
                        
                        return (
                          <div key={genre} className="flex items-center space-x-2 py-1">
                            <Checkbox 
                              id={`genre-${genre}`} 
                              checked={isSelected}
                              onCheckedChange={() => handleGenreToggle(genre as UIGenre)}
                              disabled={genreObj?.totalBooks === 0}
                              className={isSelected ? "text-red-500 border-red-500" : ""}
                            />
                            <Label 
                              htmlFor={`genre-${genre}`}
                              className={`text-sm cursor-pointer flex-1 flex justify-between items-center 
                                ${genreObj?.totalBooks === 0 ? 'text-muted-foreground/50' : isSelected ? 'text-red-600 font-medium' : ''}`}
                            >
                              <span className="leading-none">{GENRE_OPTIONS.find(opt => opt.value === genre)?.label || genre}</span>
                              <span className={`text-xs inline-flex items-center px-1 
                                ${genreObj?.totalBooks === 0 ? 'text-muted-foreground/30' : 
                                isSelected ? 'text-red-600' : 'text-muted-foreground'}`}
                              >
                                {genreObj?.totalBooks || 0}
                              </span>
                            </Label>
                          </div>
                        );
                      })}
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
            </div>
          </div>
        </div>
        
        {/* Book Grid */}
        <div className="flex-1">
          {isTransitioning ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array(12).fill(0).map((_, index) => (
                <div key={index} className="flex flex-col space-y-2 border rounded-xl p-3">
                  <Skeleton className="aspect-[3/4] w-full rounded-lg" />
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {displayedBooks.map(book => (
                  <div key={book.id} className="flex h-full">
                    <BookCard
                      id={book.id}
                      title={book.title}
                      author={book.author as Author}
                      description={book.description}
                      chapters={book.chapters}
                      rating={book.rating}
                      genres={book.genre}
                      progress={book.progress}
                      coverImage={book.coverImage}
                      className="h-full w-full border-0 shadow-lg"
                      showPreview={false}
                      isCreator={book.author?.id ? user?.id === book.author?.id : false}
                      isFollowed={book.isFollowed}
                    />
                  </div>
                ))}
              </div>
              
              {/* Empty state */}
              {filteredBooks.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-lg font-medium">No books found</p>
                  <p className="text-muted-foreground">Try adjusting your filters or search query</p>
                  {(selectedGenres.length > 0 || searchQuery) && (
                    <Button onClick={clearFilters} className="mt-4">
                      Clear Filters
                    </Button>
                  )}
                </div>
              )}
              
              {/* Pagination Controls */}
              {filteredBooks.length > 0 && (
                <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Showing</span>
                    <Select value={pageSize.toString()} onValueChange={handlePageSizeChange} disabled={isTransitioning}>
                      <SelectTrigger className="h-8 w-[70px]">
                        <SelectValue placeholder={pageSize.toString()} />
                      </SelectTrigger>
                      <SelectContent>
                        {PAGE_SIZE_OPTIONS.map(size => (
                          <SelectItem key={size} value={size.toString()}>
                            {size}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span>of {filteredBooks.length} books</span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => goToPage(1)}
                      disabled={currentPage === 1 || isTransitioning}
                    >
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1 || isTransitioning}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    
                    <div className="flex items-center gap-1 mx-2">
                      {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                        let pageNumber: number;
                        
                        // Calculate which page numbers to display
                        if (totalPages <= 5) {
                          pageNumber = i + 1;
                        } else if (currentPage <= 3) {
                          pageNumber = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNumber = totalPages - 4 + i;
                        } else {
                          pageNumber = currentPage - 2 + i;
                        }
                        
                        return (
                          <Button
                            key={pageNumber}
                            variant={currentPage === pageNumber ? "default" : "outline"}
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => goToPage(pageNumber)}
                            disabled={isTransitioning}
                          >
                            {pageNumber}
                          </Button>
                        );
                      })}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages || isTransitioning}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => goToPage(totalPages)}
                      disabled={currentPage === totalPages || isTransitioning}
                    >
                      <ChevronsRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
} 