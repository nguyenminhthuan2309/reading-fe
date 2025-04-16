"use client";

import * as React from "react";
import { 
  Dialog, 
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Book, User, Tag } from "lucide-react";
import { useRouter } from "next/navigation";

type SearchResult = {
  id: string;
  title: string;
  type: "book" | "author" | "category";
  url: string;
};

const mockResults: SearchResult[] = [
  { id: "1", title: "The Great Gatsby", type: "book", url: "/books/the-great-gatsby" },
  { id: "2", title: "F. Scott Fitzgerald", type: "author", url: "/authors/f-scott-fitzgerald" },
  { id: "3", title: "To Kill a Mockingbird", type: "book", url: "/books/to-kill-a-mockingbird" },
  { id: "4", title: "Harper Lee", type: "author", url: "/authors/harper-lee" },
  { id: "5", title: "Classic Literature", type: "category", url: "/categories/classic-literature" },
  { id: "6", title: "American Fiction", type: "category", url: "/categories/american-fiction" },
];

export function SearchDialog() {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<SearchResult[]>([]);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const router = useRouter();
  
  // Filter results based on query
  React.useEffect(() => {
    if (query.trim() === "") {
      setResults([]);
      return;
    }
    
    const filtered = mockResults.filter(result => 
      result.title.toLowerCase().includes(query.toLowerCase())
    );
    setResults(filtered);
  }, [query]);
  
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
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);
  
  // Handle result selection
  const handleResultClick = (result: SearchResult) => {
    setOpen(false);
    setQuery("");
    router.push(result.url);
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

  // Popular search suggestions
  const popularSearches = [
    "Fiction",
    "Fantasy",
    "Mystery",
    "New Releases",
    "Award Winners"
  ];

  // Determine the shortcut text based on platform
  const shortcutText = React.useMemo(() => {
    return typeof navigator !== 'undefined' && navigator.platform.toLowerCase().includes('mac') ? '⌘K' : 'Ctrl+K';
  }, []);

  return (
    <>
      <div className="relative w-48 md:w-64 lg:w-72">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
        <button
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 pl-8 text-sm text-left text-gray-700 flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 cursor-pointer hover:bg-gray-50"
          onClick={() => setOpen(true)}
        >
          <span>Search...</span>
          <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-gray-200 bg-gray-100 px-1.5 font-mono text-[10px] font-medium text-gray-600">
            {shortcutText}
          </kbd>
        </button>
      </div>
      
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[500px] p-0">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle className="text-lg">Search Haru's Library</DialogTitle>
          </DialogHeader>
          <div className="px-4 pb-2 relative">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                ref={inputRef}
                placeholder="Search books, authors, or categories..."
                className="pl-8"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {query && (
                <div className="absolute right-2 top-2">
                  <kbd className="inline-flex h-5 select-none items-center gap-1 rounded border px-1.5 font-mono text-xs font-medium text-muted-foreground">
                    ESC
                  </kbd>
                </div>
              )}
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              <span>Type to search or use arrow keys to navigate</span>
            </div>
          </div>
          
          {/* Search results */}
          {results.length > 0 && (
            <div className="max-h-[300px] overflow-y-auto p-4 pt-0">
              <div className="mt-4 border-t pt-4">
                <div className="space-y-1">
                  {results.map((result) => (
                    <button
                      key={result.id}
                      className="w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted text-left"
                      onClick={() => handleResultClick(result)}
                    >
                      {getResultIcon(result.type)}
                      <span className="flex-1">{result.title}</span>
                      <span className="text-xs text-muted-foreground capitalize">{result.type}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {/* No results message */}
          {query && results.length === 0 && (
            <div className="p-4 pt-0">
              <div className="mt-4 border-t pt-4 text-center text-muted-foreground">
                No results found for "{query}"
              </div>
            </div>
          )}
          
          {/* Popular searches - shown when no query is entered */}
          {!query && (
            <div className="p-4 pt-0">
              <div className="mt-4 border-t pt-4">
                <h3 className="text-sm font-medium mb-3">Popular searches</h3>
                <div className="flex flex-wrap gap-2">
                  {popularSearches.map((term, index) => (
                    <button
                      key={index}
                      className="rounded-full bg-muted px-3 py-1 text-xs hover:bg-muted/80 cursor-pointer transition-colors"
                      onClick={() => {
                        setQuery(term);
                      }}
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="mt-6">
                <h3 className="text-sm font-medium mb-3">Recent searches</h3>
                <div className="space-y-1">
                  {mockResults.slice(0, 3).map((result) => (
                    <button
                      key={result.id}
                      className="w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted text-left"
                      onClick={() => handleResultClick(result)}
                    >
                      {getResultIcon(result.type)}
                      <span className="flex-1">{result.title}</span>
                      <span className="text-xs text-muted-foreground capitalize">{result.type}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
} 