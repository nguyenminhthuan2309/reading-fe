"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { featuredBooks } from "@/lib/mock-data";
import { BookCard } from "@/components/books/book-card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronDown, ChevronRight, Filter, PlusCircle, Search, SlidersHorizontal, ChevronsLeft, ChevronsRight } from "lucide-react";
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
import { Genre, GENRE_OPTIONS } from "@/models/genre";

// Group genres into categories for better organization, using the Genre type
const genreCategories: Record<string, Genre[]> = {
  "Popular Genres": ["Fantasy", "Romance", "Mystery", "Adventure", "Sci-fi"],
  "Eastern": ["Wuxia", "Xianxia", "Xuanhuan", "Martial Arts", "Philosophical"],
  "Speculative": ["Supernatural", "Horror", "Time Travel", "Cyberpunk", "Magic"],
  "Contemporary": ["Drama", "Slice of Life", "School Life", "Comedy", "Crime"],
  "Other Genres": ["Sports", "Medical", "Music", "Cooking", "Game", "Politics", "Science"]
};

// Page size options
const PAGE_SIZE_OPTIONS = [8, 12, 16, 24, 36];

export default function BooksPage() {
  const router = useRouter();
  const [sortBy, setSortBy] = useState("title");
  const [isLoading, setIsLoading] = useState(true);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<Genre[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [displayedBooks, setDisplayedBooks] = useState<any[]>([]);
  const [filteredBooks, setFilteredBooks] = useState<any[]>([]);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<string[]>(
    Object.keys(genreCategories) // Initialize with all category keys to expand all by default
  );
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [totalPages, setTotalPages] = useState(1);
  
  // Toggle category expansion
  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category) 
        : [...prev, category]
    );
  };
  
  // Move data fetching and processing to client-side
  useEffect(() => {
    // Get unique genres with the correct type
    const uniqueGenres = Array.from(new Set(featuredBooks.map(book => book.genre))) as Genre[];
    setGenres(uniqueGenres);
    
    // Initial filtering and sorting
    updateDisplayedBooks(selectedGenres, sortBy, searchQuery);
    
    setIsLoading(false);
  }, []);
  
  // Update displayed books when filter, sort, or search changes
  useEffect(() => {
    updateDisplayedBooks(selectedGenres, sortBy, searchQuery);
    // Reset to first page when filters change
    setCurrentPage(1);
  }, [selectedGenres, sortBy, searchQuery]);
  
  // Update pagination when page size or current page changes
  useEffect(() => {
    paginateBooks();
  }, [currentPage, pageSize, filteredBooks]);
  
  // Handle genre selection
  const handleGenreToggle = (genre: Genre) => {
    setSelectedGenres(prev => {
      if (prev.includes(genre)) {
        return prev.filter(g => g !== genre);
      } else {
        return [...prev, genre];
      }
    });
  };

  // Clear all filters
  const clearFilters = () => {
    setSelectedGenres([]);
    setSearchQuery("");
  };
  
  // Paginate the filtered books
  const paginateBooks = () => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    setDisplayedBooks(filteredBooks.slice(startIndex, endIndex));
    setTotalPages(Math.max(1, Math.ceil(filteredBooks.length / pageSize)));
  };
  
  // Apply filter and sorting
  const updateDisplayedBooks = (
    currentGenres: Genre[], 
    currentSortBy: string,
    query: string
  ) => {
    let books = [...featuredBooks];
    
    // Apply genre filter
    if (currentGenres.length > 0) {
      books = books.filter(book => currentGenres.includes(book.genre as Genre));
    }

    // Apply search query
    if (query.trim() !== "") {
      const searchTerms = query.toLowerCase().trim().split(/\s+/);
      books = books.filter(book => {
        const bookText = `${book.title} ${book.author} ${book.description}`.toLowerCase();
        return searchTerms.every(term => bookText.includes(term));
      });
    }
    
    // Apply sorting
    books.sort((a, b) => {
      switch (currentSortBy) {
        case "title":
          return a.title.localeCompare(b.title);
        case "rating":
          return b.rating - a.rating;
        case "chapters":
          return b.chapters - a.chapters;
        default:
          return 0;
      }
    });
    
    // Store filtered books before pagination
    setFilteredBooks(books);
  };
  
  // Handle page change
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };
  
  // Handle page size change
  const handlePageSizeChange = (size: string) => {
    setPageSize(parseInt(size));
    setCurrentPage(1); // Reset to first page when changing page size
  };
  
  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12 flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }
  
  // Get count of books in each category
  const getCategoryCount = (categoryGenres: Genre[]) => {
    return featuredBooks.filter(book => categoryGenres.includes(book.genre as Genre)).length;
  };
  
  // Get genre display name from options
  const getGenreDisplayName = (genreValue: Genre): string => {
    const option = GENRE_OPTIONS.find(opt => opt.value === genreValue);
    return option?.label || genreValue;
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
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
            {/* Search Bar */}
            <div className="relative w-full sm:w-auto">
              <Input
                placeholder="Search books..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full sm:w-48 md:w-64"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
            
            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <SlidersHorizontal size={16} className="text-muted-foreground hidden sm:block" />
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="title">Title (A-Z)</SelectItem>
                  <SelectItem value="rating">Rating (High to Low)</SelectItem>
                  <SelectItem value="chapters">Chapters (Most to Least)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Link href="/books/create" className="inline-block mt-2 sm:mt-0">
              <Button className="flex items-center gap-2 w-full sm:w-auto">
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
              >
                Clear all
              </Button>
            </div>
            
            <div className="space-y-3">
              {Object.entries(genreCategories).map(([category, categoryGenres]) => {
                // Get all genres from the category
                const availableGenres = categoryGenres;
                
                // Calculate count of books in this category
                const categoryCount = getCategoryCount(availableGenres);
                
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
                        <span className={`text-xs inline-flex items-center ml-1.5 ${categoryCount === 0 ? 'text-muted-foreground/50' : 'text-muted-foreground'}`}>
                          ({categoryCount})
                        </span>
                      </div>
                      <ChevronRight className={`h-4 w-4 transition-transform duration-200 group-hover:text-primary ${expandedCategories.includes(category) ? 'rotate-90' : ''}`} />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-1 pl-2 space-y-1">
                      {availableGenres.map(genre => {
                        const count = featuredBooks.filter(book => book.genre === genre).length;
                        
                        return (
                          <div key={genre} className="flex items-center space-x-2 py-1">
                            <Checkbox 
                              id={`genre-${genre}`} 
                              checked={selectedGenres.includes(genre)}
                              onCheckedChange={() => handleGenreToggle(genre)}
                              disabled={count === 0}
                            />
                            <Label 
                              htmlFor={`genre-${genre}`}
                              className={`text-sm cursor-pointer flex-1 flex justify-between items-center ${count === 0 ? 'text-muted-foreground/50' : ''}`}
                            >
                              <span className="leading-none">{GENRE_OPTIONS.find(opt => opt.value === genre)?.label || genre}</span>
                              <span className={`text-xs inline-flex items-center px-1 ${count === 0 ? 'text-muted-foreground/30' : 'text-muted-foreground'}`}>
                                {count}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {displayedBooks.map(book => (
              <div key={book.id}>
                <BookCard
                  id={book.id}
                  title={book.title}
                  author={book.author}
                  description={book.description}
                  chapters={book.chapters}
                  rating={book.rating}
                  genre={book.genre}
                  progress={book.progress}
                  className="h-[360px] border-0 shadow-lg"
                  showPreview={false}
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
                <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
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
                  disabled={currentPage === 1}
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
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
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => goToPage(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 