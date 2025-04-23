"use client";

import { useParams, useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Menu, X, BookOpen, ScrollText, Maximize2, Volume2, VolumeX, Volume1, MessageCircle, Plus, Minus } from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import HTMLFlipBook from "react-pageflip";
import { PictureBookReader } from "@/components/books/picture-book-reader";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getChapterDetail, getBookById, getChaptersByBookId, updateReadingHistory } from "@/lib/api/books";
import { Book, Chapter } from "@/models/book";
import { Skeleton } from "@/components/ui/skeleton";
import { ChapterComments } from "@/components/books/chapter-comments";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { BOOK_KEYS, CHAPTER_KEYS } from "@/lib/query-keys";

// Define reading mode type for type safety
type ReadingMode = 'scroll' | 'flip';

// Define a ref type for the flipbook
type FlipBookRef = {
  pageFlip: () => {
    turnToPage: (page: number) => void;
    flipNext: () => void;
    flipPrev: () => void;
    getCurrentPageIndex: () => number;
  };
};

// Define type for book content items
interface PictureItem {
  url: string;
  caption: string;
}

// Page component for flip book
const Page = ({ children, pageNumber }: { children: React.ReactNode, pageNumber: number }) => {
  return (
    <div className="demoPage page relative bg-white dark:bg-zinc-900 shadow-md rounded-r-md overflow-hidden" style={{ width: '100%', height: '100%' }}>
      <div className="page-content p-6 h-full flex flex-col">
        {children}
        <div className="page-number text-xs text-muted-foreground text-center absolute bottom-3 right-4">
          {pageNumber}
        </div>
      </div>
    </div>
  );
};

// Cover component
const BookCover = ({ title, author, isBackCover = false }: { title: string, author: string, isBackCover?: boolean }) => {
  return (
    <div className={`demoPage cover-page relative bg-primary/10 dark:bg-primary/20 shadow-md ${isBackCover ? 'rounded-l-md' : 'rounded-r-md'} overflow-hidden`} style={{ width: '100%', height: '100%' }}>
      <div className="page-content p-6 h-full flex flex-col justify-center items-center">
        {!isBackCover ? (
          <>
            <h1 className="text-xl md:text-2xl font-bold text-center mt-3 mb-4">{title}</h1>
            <p className="text-sm text-muted-foreground">by {author}</p>
          </>
        ) : (
          <div className="text-center">
            <p className="text-muted-foreground text-sm">End of Chapter</p>
          </div>
        )}
      </div>
    </div>
  );
};

// FlipBook component wrapper
const FlipBook = ({ 
  bookData, 
  currentChapterIndex, 
  width, 
  height 
}: { 
  bookData: any, 
  currentChapterIndex: number, 
  width: number, 
  height: number 
}) => {
  const flipBookRef = useRef<any>(null);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(0);
  
  const currentChapter = bookData.chapters[currentChapterIndex];
  const isPictureBook = bookData.type === 'picture';
  
  // Generate content for the current chapter - explicitly type as string[]
  const content: string[] = isPictureBook 
    ? (currentChapter.images || [])
    : (currentChapter.content || '').split("\n\n");
    
  useEffect(() => {
    if (flipBookRef.current && typeof flipBookRef.current.pageFlip === 'function') {
      const pageFlip = flipBookRef.current.pageFlip();
      if (pageFlip && typeof pageFlip.getPageCount === 'function') {
        setTotalPages(pageFlip.getPageCount());
      }
    }
  }, [currentChapter, width]);
  
  const handlePageFlip = (e: any) => {
    setCurrentPage(e.data);
  };
  
  return (
    <div className="flip-book-container my-8 relative w-full flex justify-center" style={{ minHeight: `${height + 50}px` }}>
      <HTMLFlipBook
        width={width}
        height={height}
        size="stretch"
        minWidth={315}
        maxWidth={800}
        minHeight={400}
        maxHeight={1000}
        maxShadowOpacity={0.5}
        showCover={true}
        mobileScrollSupport={true}
        className="demo-book"
        ref={flipBookRef}
        onFlip={handlePageFlip}
        style={{ display: "flex" }}
        drawShadow={true}
        flippingTime={1000}
        usePortrait={false}
        startPage={0}
        useMouseEvents={true}
        startZIndex={20}
        autoSize={false}
        clickEventForward={true}
        swipeDistance={30}
        showPageCorners={true}
        disableFlipByClick={false}
      >
        <BookCover title={bookData.title} author={bookData.author} />
        
        {content.map((item, index) => (
          <Page key={index} pageNumber={index + 1}>
            {isPictureBook ? (
              <div className="h-full flex flex-col items-center justify-between">
                <img src={item} alt={`Page ${index + 1}`} className="max-h-[75%] w-auto object-contain mx-auto" />
                <p className="text-center mt-4">Chapter {currentChapterIndex + 1} - Page {index + 1}</p>
              </div>
            ) : (
              <div className="text-base">
                {item}
              </div>
            )}
          </Page>
        ))}
        
        <BookCover title={bookData.title} author={bookData.author} isBackCover={true} />
      </HTMLFlipBook>
      
      <div className="flip-controls flex items-center justify-center gap-4 mt-4 absolute bottom-[-3rem] left-0 right-0">
        <Button 
          variant="outline" 
          size="icon"
          onClick={() => {
            if (flipBookRef.current && typeof flipBookRef.current.pageFlip === 'function') {
              flipBookRef.current.pageFlip().flipPrev();
            }
          }}
          disabled={currentPage <= 0}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm">
          Page {currentPage + 1} of {totalPages}
        </span>
        <Button 
          variant="outline" 
          size="icon"
          onClick={() => {
            if (flipBookRef.current && typeof flipBookRef.current.pageFlip === 'function') {
              flipBookRef.current.pageFlip().flipNext();
            }
          }}
          disabled={currentPage >= totalPages - 1}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default function ReadPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const bookId = params.id as string;
  const flipBookRef = useRef<FlipBookRef>(null);
  const queryClient = useQueryClient();
  // Get chapter parameters from query params
  const chapterParam = searchParams.get("chapter");
  const chapterNumber = chapterParam ? parseInt(chapterParam) : 1;
  const chapterIdParam = searchParams.get("id");
  const chapterId = chapterIdParam ? parseInt(chapterIdParam) : undefined;

  // Create mutation for updating reading history
  const updateReadingHistoryMutation = useMutation({
    mutationFn: ({ bookId, chapterId }: { bookId: number, chapterId: number }) => 
      updateReadingHistory(bookId, chapterId),
    onSuccess: () => {
      // Re-validate the query to refresh the reading history and book details
      queryClient.invalidateQueries({ queryKey: BOOK_KEYS.RECENTLY_READ });
      queryClient.invalidateQueries({ queryKey: BOOK_KEYS.DETAIL(bookId) });
    },
    onError: (error) => {
      console.error('Failed to update reading history:', error);
      // Silent failure - don't show error to user as this is a background operation
    }
  });

  // Fetch book data with React Query
  const {
    data: bookData,
    isLoading: isLoadingBook,
    error: bookError
  } = useQuery({
    queryKey: BOOK_KEYS.DETAIL(bookId),
    queryFn: async () => {
      const response = await getBookById(Number(bookId));
      if (response.status !== 200) {
        throw new Error(response.msg || 'Failed to fetch book details');
      }
      return response.data.data[0] as Book;
    },
    enabled: !!bookId
  });
  
  // Fetch chapter list to know the next and previous chapter
  const {
    data: chapterList,
    isLoading: isLoadingChapterList,
    error: chapterListError
  } = useQuery({
    queryKey: CHAPTER_KEYS.LIST(bookId),
    queryFn: async () => {
      const response = await getChaptersByBookId(Number(bookId));
      if (response.status !== 200) {
        throw new Error(response.msg || 'Failed to fetch chapter list');
      }
      return response.data as Chapter[];
    },
    enabled: !!bookId
  });

  // Fetch chapter data with React Query
  const {
    data: chapterData,
    isLoading: isLoadingChapter,
    error: chapterError
  } = useQuery({
    queryKey: CHAPTER_KEYS.DETAIL(chapterId || 0, chapterNumber),
    queryFn: async () => {
      const response = await getChapterDetail(Number(chapterId));
      if (response.status !== 200) {
        throw new Error(response.msg || 'Failed to fetch chapter details');
      }

      return response.data as Chapter;
    },
    enabled: !!chapterId && !!chapterNumber
  });

  // Helper function to get chapter navigation information
  const getChapterNavigation = () => {
    if (!chapterList || chapterList.length === 0) {
      return { prev: null, next: null };
    }

    // Sort chapters by chapter number to ensure correct navigation
    const sortedChapters = [...chapterList].sort((a, b) => a.chapter - b.chapter);
    
    let currentIndex = -1;
    
    // Find current chapter index
    if (chapterId) {
      currentIndex = sortedChapters.findIndex(chapter => chapter.id === chapterId);
    } else if (chapterNumber) {
      // Fallback to chapter number
      currentIndex = chapterNumber - 1;
    }
    
    if (currentIndex === -1) return { prev: null, next: null };
    
    const prevChapter = currentIndex > 0 ? sortedChapters[currentIndex - 1] : null;
    const nextChapter = currentIndex < sortedChapters.length - 1 ? sortedChapters[currentIndex + 1] : null;
    
    return {
      prev: prevChapter,
      next: nextChapter
    };
  };
  
  const { prev, next } = getChapterNavigation();

  // State for chapter content
  const [chapterContent, setChapterContent] = useState<string | string[]>("");
  const [pictureBookImages, setPictureBookImages] = useState<string[]>([]);
  const [bookType, setBookType] = useState<string>("Novel"); // Default to Novel from BOOK_TYPES
  
  // Reading mode state
  const [readingMode, setReadingMode] = useState<ReadingMode>('scroll');
  
  // Current page for flip mode
  const [currentPage, setCurrentPage] = useState(0);
  const [windowWidth, setWindowWidth] = useState(0);
  
  // State for sidebar visibility
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // State for comments sidebar visibility
  const [commentsOpen, setCommentsOpen] = useState(false);
  
  // Voice reading state - moved up with other state definitions
  const [isVoiceReading, setIsVoiceReading] = useState<boolean>(false);
  const [voiceVolume, setVoiceVolume] = useState<number>(70); // 0-100 scale
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
    if (commentsOpen) setCommentsOpen(false);
  };
  
  const toggleComments = () => {
    setCommentsOpen(!commentsOpen);
    if (sidebarOpen) setSidebarOpen(false);
  };
  
  // Toggle reading mode
  const toggleReadingMode = () => {
    setReadingMode(prev => prev === 'scroll' ? 'flip' : 'scroll');
    // Reset to first page when switching to flip mode
    setCurrentPage(0);
  };
  
  // Calculate appropriate dimensions for the flipbook
  const getFlipbookDimensions = () => {
    // Base dimensions for the book
    const baseWidth = 400;
    const baseHeight = 600;
    
    // Adjust based on screen size
    if (windowWidth < 640) {
      return { width: 280, height: 420 };
    } else if (windowWidth < 768) {
      return { width: 320, height: 480 };
    } else {
      return { width: baseWidth, height: baseHeight };
    }
  };
  
  const { width, height } = getFlipbookDimensions();

  // Use totalChapters from book data or fallback to a default
  const totalChapters = bookData?.totalChapters || 1;

  // Update chapter content when chapter data changes
  useEffect(() => {
    if (chapterData) {
      // Check if this is a manga book
      if (bookData?.bookType?.name === "Manga" && chapterData.content) {
        // For manga books, content is an array of image URLs
        if (Array.isArray(chapterData.content)) {
          setChapterContent(chapterData.content);
          setPictureBookImages(chapterData.content);
        } else if (typeof chapterData.content === 'string') {
          // Handle case where content might be a JSON string of image URLs
          try {
            const parsedContent = JSON.parse(chapterData.content);
            if (Array.isArray(parsedContent)) {
              setChapterContent(parsedContent);
              setPictureBookImages(parsedContent);
            }
          } catch (e) {
            // If parsing fails, just use as a single image URL
            setChapterContent([chapterData.content]);
            setPictureBookImages([chapterData.content]);
          }
        }
      } else {
        // For novels, content is plain text
        setChapterContent(chapterData.content || '');
      }
    }
  }, [bookData, chapterData, chapterNumber]);
  
  // Navigation for flip mode
  const goToNextPage = () => {
    if (flipBookRef.current && typeof flipBookRef.current.pageFlip === 'function' && readingMode === 'flip') {
      flipBookRef.current.pageFlip().flipNext();
    } else {
      const maxPages = bookData?.bookType?.name === "Manga" 
        ? pictureBookImages.length - 1
        : typeof chapterContent === 'string' 
          ? chapterContent.split("\n\n").length - 1
          : Array.isArray(chapterContent) ? chapterContent.length - 1 : 0;
        
      if (currentPage < maxPages) {
        setCurrentPage(prev => prev + 1);
      } else if (next) {
        // Go to next chapter if at the end of current chapter
        router.push(`/books/${bookId}/read?chapter=${next.chapter}&id=${next.id}`);
      }
    }
  };
  
  const goToPrevPage = () => {
    if (flipBookRef.current && typeof flipBookRef.current.pageFlip === 'function' && readingMode === 'flip') {
      flipBookRef.current.pageFlip().flipPrev();
    } else {
      if (currentPage > 0) {
        setCurrentPage(prev => prev - 1);
      } else if (prev) {
        // Go to previous chapter if at the beginning of current chapter
        router.push(`/books/${bookId}/read?chapter=${prev.chapter}&id=${prev.id}`);
      }
    }
  };
  
  // Handle page change event from flipbook
  const handlePageChange = (e: any) => {
    setCurrentPage(e.data);
  };
  
  // Measure window width for responsive design
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    
    // Set initial width
    setWindowWidth(window.innerWidth);
    
    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  useEffect(() => {
    if (bookData?.bookType) {
      // Set the book type from the book data
      setBookType(bookData.bookType.name);
    }
    
    // Reset the current page when changing chapters
    setCurrentPage(0);
  }, [bookData, chapterNumber, chapterId]);
  
  // Check for chapter mismatch
  const isChapterMismatch = () => {
    if (!chapterList || chapterList.length === 0 || !chapterId || !chapterNumber) {
      return false;
    }
    
    // Check if the chapter with this ID exists
    const chapterExists = chapterList.some(chapter => chapter.id === chapterId);
    if (!chapterExists) {
      return true;
    }
    
    // Check if the chapter order matches the ID
    const chapter = chapterList.find(chapter => chapter.id === chapterId);
    return chapter && chapter.chapter !== chapterNumber;
  };
  
  // Update reading history when chapter data is loaded
  useEffect(() => {
    if (chapterId && bookId && !isLoadingChapter && chapterData) {
      // Use the mutation instead of direct API call
      updateReadingHistoryMutation.mutate({
        bookId: Number(bookId),
        chapterId
      });
    }
  }, [bookId, chapterId, isLoadingChapter, chapterData]);
  
  // If loading, show a skeleton UI
  if (isLoadingBook || isLoadingChapter || isLoadingChapterList) {
    return (
      <div className="min-h-screen flex flex-col">
        {/* Skeleton navigation bar */}
        <div className="border-b sticky top-0 bg-background z-10">
          <div className="container flex justify-between items-center py-3 px-4">
            <div className="flex items-center gap-2">
              <Skeleton className="h-9 w-9 rounded-md" />
              <Skeleton className="h-9 w-9 rounded-md" />
            </div>
            
            <div className="flex flex-col items-center">
              <Skeleton className="h-5 w-32 rounded-md mb-1" />
              <Skeleton className="h-3 w-20 rounded-md" />
            </div>
            
            <div className="flex items-center gap-2">
              <Skeleton className="h-9 w-9 rounded-md" />
              <Skeleton className="h-9 w-9 rounded-md" />
            </div>
          </div>
        </div>
        
        {/* Skeleton content */}
        <div className="flex-1 container max-w-4xl mx-auto px-4 py-8">
          {/* Book title skeleton */}
          <div className="flex flex-col items-center mb-8">
            <Skeleton className="h-8 w-60 rounded-md mb-2" />
            <Skeleton className="h-4 w-40 rounded-md" />
          </div>
          
          {/* Content skeleton - alternate between manga (images) and novel (text) layout */}
          <div className="mb-8">
            {/* Manga skeleton - images */}
            <div className="mb-12">
              <Skeleton className="h-[400px] w-full rounded-md mb-4" />
              <div className="flex justify-center">
                <Skeleton className="h-4 w-40 rounded-md" />
              </div>
            </div>
            
            {/* Novel skeleton - text */}
            <div className="space-y-4 mt-12">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-full rounded-md" />
                  <Skeleton className="h-4 w-[95%] rounded-md" />
                  <Skeleton className="h-4 w-[90%] rounded-md" />
                  <Skeleton className="h-4 w-[85%] rounded-md" />
                </div>
              ))}
            </div>
          </div>
          
          {/* Skeleton navigation buttons */}
          <div className="flex justify-between items-center mt-3 mb-8">
            <Skeleton className="h-10 w-32 rounded-md" />
            <Skeleton className="h-10 w-32 rounded-md" />
          </div>
        </div>
        
        {/* Skeleton floating buttons */}
        <div className="fixed bottom-24 right-8 flex flex-col gap-4 z-30">
          <Skeleton className="h-40 w-12 rounded-full" />
          <Skeleton className="h-12 w-12 rounded-full" />
        </div>
      </div>
    );
  }

  // If chapter data is loaded but there's a mismatch or chapter not found, show an error
  if (!isLoadingChapter && (!chapterData || isChapterMismatch())) {
    return (
      <div className="min-h-screen flex flex-col">
        {/* Navigation bar */}
        <div className="border-b sticky top-0 bg-background z-10">
          <div className="container flex justify-between items-center py-3 px-4">
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => router.back()}
              >
                <ChevronLeft size={20} />
              </Button>
            </div>
            
            <div className="flex flex-col items-center">
              <h1 className="text-base font-medium">{bookData?.title || "Book"}</h1>
            </div>
            
            <div className="w-9"></div> {/* Spacer for balanced layout */}
          </div>
        </div>
        
        <div className="container mx-auto px-4 py-12 flex-1 flex flex-col items-center justify-center">
          <h1 className="text-8xl font-bold text-destructive mb-2">404</h1>
          <h2 className="text-2xl font-bold mb-6">Chapter Not Found</h2>
          <p className="text-muted-foreground mb-2">
            The chapter you are looking for doesn't exist or has been removed.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={() => router.back()}
            >
              <ChevronLeft size={16} />
              Go Back
            </Button>
            
            <Link href={`/books/${bookId}`}>
              <Button>
                View Book Details
              </Button>
            </Link>
          </div>
          
          {chapterList && chapterList.length > 0 && (
            <div className="mt-12 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Available Chapters</h3>
              <div className="space-y-2">
                {chapterList.sort((a, b) => a.chapter - b.chapter).slice(0, 5).map(chapter => (
                  <Link 
                    key={chapter.id} 
                    href={`/books/${bookId}/read?chapter=${chapter.chapter}&id=${chapter.id}`}
                  >
                    <div className="border rounded-md p-3 hover:bg-accent transition-colors">
                      Chapter {chapter.chapter}: {chapter.title || `Chapter ${chapter.chapter}`}
                    </div>
                  </Link>
                ))}
                
                {chapterList.length > 5 && (
                  <Link href={`/books/${bookId}`}>
                    <div className="text-center text-primary hover:underline mt-2">
                      View All {chapterList.length} Chapters
                    </div>
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
  
  // If book not found, show an error message
  if (!bookData) {
    return (
      <div className="min-h-screen flex flex-col">
        {/* Navigation bar */}
        <div className="border-b sticky top-0 bg-background z-10">
          <div className="container flex justify-between items-center py-3 px-4">
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => router.back()}
              >
                <ChevronLeft size={20} />
              </Button>
            </div>
            
            <div className="flex flex-col items-center">
              <h1 className="text-base font-medium">Book</h1>
            </div>
            
            <div className="w-9"></div> {/* Spacer for balanced layout */}
          </div>
        </div>
        
        <div className="container mx-auto px-4 py-12 flex-1 flex flex-col items-center justify-center">
          <h1 className="text-3xl font-bold text-destructive mb-2">404</h1>
          <h2 className="text-2xl font-bold mb-6">Book Not Found</h2>
          <p className="text-muted-foreground mb-8">The book you are looking for does not exist.</p>
          
          <div className="flex gap-4">
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={() => router.back()}
            >
              <ChevronLeft size={16} />
              Go Back
            </Button>
            
            <Link href="/books">
              <Button>
                Browse Books
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Make sure we have chapterData before continuing
  if (!chapterData) {
    return null; // This should not happen in practice due to error handling above
  }

  // Parse content for rendering
  const paragraphs = typeof chapterContent === 'string' 
    ? chapterContent.split("\n\n") 
    : [];
  const totalPages = bookType === "Manga" 
    ? pictureBookImages.length 
    : paragraphs.length;
  
  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation bar */}
      <div className="border-b sticky top-0 bg-background z-10">
        <div className="container flex justify-between items-center py-3 px-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggleSidebar}>
              <Menu size={20} />
            </Button>
            <Link href={`/books/${bookData.id}`}>
              <Button variant="ghost" size="icon">
                <ChevronLeft size={20} />
              </Button>
            </Link>
          </div>
          
          <div className="flex flex-col items-center">
            <h1 className="text-base font-medium">{bookData.title}</h1>
            <p className="text-xs text-muted-foreground text-center">
              Chapter {chapterData.chapter}
              {readingMode === 'flip' && ` • Page ${currentPage + 1}/${readingMode === 'flip' && bookType === 'Novel' ? paragraphs.length + 2 : totalPages}`}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {readingMode === 'flip' ? (
              <div className="flex gap-4 items-center">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={goToPrevPage}
                  disabled={readingMode === 'flip' 
                    ? (flipBookRef.current && typeof flipBookRef.current.pageFlip === 'function' 
                      ? flipBookRef.current.pageFlip().getCurrentPageIndex() === 0 && !prev
                      : false) 
                    : currentPage === 0 && !prev}
                  className="h-8 w-8"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={goToNextPage}
                  disabled={readingMode === 'flip' 
                    ? (flipBookRef.current && typeof flipBookRef.current.pageFlip === 'function' 
                      ? flipBookRef.current.pageFlip().getCurrentPageIndex() === totalPages - 1 && !next
                      : false)
                    : currentPage === totalPages - 1 && !next}
                  className="h-8 w-8"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <>
                {prev && (
                  <Link href={`/books/${bookId}/read?chapter=${prev.chapter}&id=${prev.id}`}>
                    <Button variant="ghost" size="icon">
                      <ChevronLeft size={20} />
                    </Button>
                  </Link>
                )}
                
                {next && (
                  <Link href={`/books/${bookId}/read?chapter=${next.chapter}&id=${next.id}`}>
                    <Button variant="ghost" size="icon">
                      <ChevronRight size={20} />
                    </Button>
                  </Link>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Chapter sidebar (conditional) */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-20 flex">
          <div className="w-3/4 sm:w-1/2 md:w-1/3 lg:w-1/4 bg-background border-r p-4 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold">Chapters</h2>
              <Button variant="ghost" size="icon" onClick={toggleSidebar}>
                <X size={18} />
              </Button>
            </div>
            
            <div className="space-y-1">
              {chapterList && chapterList.sort((a, b) => a.chapter - b.chapter).map((chapter) => (
                <Link 
                  key={chapter.id} 
                  href={`/books/${bookId}/read?chapter=${chapter.chapter}&id=${chapter.id}`}
                  onClick={toggleSidebar}
                >
                  <div 
                    className={`p-3 rounded-md text-sm ${
                      chapterId === chapter.id || (!chapterId && chapterNumber === chapter.chapter)
                        ? 'bg-primary text-primary-foreground' 
                        : 'hover:bg-accent'
                    }`}
                  >
                    Chapter {chapter.chapter}
                    {chapter.chapter === 1 && <span className="ml-2 opacity-70">(The Beginning)</span>}
                  </div>
                </Link>
              ))}
            </div>
          </div>
          
          <div 
            className="flex-1 bg-black/20 backdrop-blur-sm"
            onClick={toggleSidebar}
          />
        </div>
      )}
      
      {/* Comments sidebar (conditional) */}
      <div 
        className={`fixed inset-y-0 right-0 z-40 transform transition-transform duration-300 ease-in-out ${
          commentsOpen ? 'translate-x-0 w-full sm:w-96 ' : 'translate-x-full w-0'
        }`}
      >
        <div className="h-full bg-background border-l shadow-md p-4 overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold">Comments</h2>
            <Button variant="ghost" size="icon" onClick={toggleComments}>
              <X size={18} />
            </Button>
          </div>
          
          {chapterId && bookId ? (
            <ChapterComments 
              bookId={Number(bookId)} 
              chapterId={chapterId} 
            />
          ) : (
            <div className="p-4 text-center text-muted-foreground">
              No chapter selected
            </div>
          )}
        </div>
      </div>
      
      {/* Chapter content */}
      <div className={`flex-1 container max-w-4xl mx-auto px-4 py-8 transition-all duration-300 ${
        commentsOpen ? 'pr-[384px] sm:pr-96' : ''
      }`}>
        {bookType === "Manga" ? (
          readingMode === 'scroll' ? (
            <PictureBookReader 
              images={pictureBookImages} 
              captions={pictureBookImages.map((_, index) => `Chapter ${chapterData.chapter} - Page ${index + 1}`)}
            />
          ) : (
            <FlipBook 
              bookData={{
                ...bookData,
                type: 'picture',
                chapters: [{
                  id: chapterData.id,
                  images: pictureBookImages,
                  title: `Chapter ${chapterData.chapter}`
                }]
              }} 
              currentChapterIndex={0} 
              width={width} 
              height={height} 
            />
          )
        ) : (
          readingMode === 'scroll' ? (
            <div className="prose prose-sm sm:prose-base dark:prose-invert mx-auto">
              {paragraphs.map((paragraph: string, index: number) => (
                <p key={index} className="mb-4">{paragraph}</p>
              ))}
            </div>
          ) : (
            <FlipBook 
              bookData={{
                ...bookData,
                type: 'text',
                chapters: [{
                  id: chapterData.id,
                  content: chapterContent,
                  title: `Chapter ${chapterData.chapter}`
                }]
              }} 
              currentChapterIndex={0} 
              width={width} 
              height={height} 
            />
          )
        )}
        
        {/* Chapter navigation - only show for scroll mode */}
        {readingMode === 'scroll' && (
          <div className="flex justify-between items-center mt-3 mb-8">
            {prev ? (
              <Link href={`/books/${bookId}/read?chapter=${prev.chapter}&id=${prev.id}`}>
                <Button variant="link" className="flex items-center gap-2 py-1">
                  <ChevronLeft size={16} />
                  Previous Chapter
                </Button>
              </Link>
            ) : (
              <div />
            )}
            
            {next && (
              <Link href={`/books/${bookId}/read?chapter=${next.chapter}&id=${next.id}`}>
                <Button className="flex items-center gap-2">
                  Next Chapter
                  <ChevronRight size={16} />
                </Button>
              </Link>
            )}
          </div>
        )}
        
        {/* Page navigation instructions for flip mode */}
        {readingMode === 'flip' && (
          <div className="text-center mt-6 text-xs text-muted-foreground">
            <p>Click or swipe edges to turn pages, or use arrow buttons above</p>
          </div>
        )}
      </div>

      {/* Floating buttons */}
      <div className="fixed bottom-24 right-8 flex flex-col gap-4 z-30 transition-all duration-300">
        {/* Comments/Reviews button group */}
        <div className={`bg-background/80 backdrop-blur-sm shadow-lg rounded-full p-1 border ${commentsOpen ? 'mr-[384px] sm:mr-96' : ''} transition-all duration-300`}>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant={commentsOpen ? "default" : "secondary"} 
                  size="icon"
                  className="h-12 w-12 rounded-full"
                  onClick={toggleComments}
                >
                  <MessageCircle className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p>Comments</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        {/* Reading mode group with multiple options - now above voice reader */}
        <div className={`bg-background/80 backdrop-blur-sm shadow-lg items-center rounded-full p-1 border flex flex-col gap-1 ${commentsOpen ? 'mr-[384px] sm:mr-96' : ''} transition-all duration-300`}>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant={readingMode === 'scroll' ? "default" : "ghost"} 
                  size="icon"
                  className="h-12 w-12 rounded-full"
                  onClick={() => setReadingMode('scroll')}
                >
                  <ScrollText className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p>Scroll Mode</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant={readingMode === 'flip' ? "default" : "ghost"} 
                  size="icon"
                  className="h-10 w-10 rounded-full"
                  onClick={() => setReadingMode('flip')}
                >
                  <BookOpen className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p>Flip Mode</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="h-10 w-10 rounded-full"
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p>Focus Mode</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        {/* Voice reading button - Only for novels */}
        {bookType === "Novel" && (
          <div className={`flex flex-col gap-2 items-center ${commentsOpen ? 'mr-[384px] sm:mr-96' : ''} transition-all duration-300`}>
            {/* Reserve space for volume controls to prevent flickering */}
            <div className={`${isVoiceReading ? 'opacity-100' : 'opacity-0 pointer-events-none'} transition-opacity duration-200 bg-background/80 backdrop-blur-sm shadow-lg rounded-full p-2 border`} style={{height: isVoiceReading ? 'auto' : '0'}}>
              <div className="flex flex-col gap-2 items-center py-1">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="h-8 w-8 rounded-full"
                        onClick={() => setVoiceVolume(Math.min(100, voiceVolume + 10))}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left">
                      <p>Increase Volume</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <div className="text-xs font-medium">{voiceVolume}%</div>
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="h-8 w-8 rounded-full"
                        onClick={() => setVoiceVolume(Math.max(0, voiceVolume - 10))}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left">
                      <p>Decrease Volume</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant={isVoiceReading ? "default" : "secondary"} 
                    size="icon"
                    className="h-12 w-12 rounded-full shadow-lg"
                    onClick={() => setIsVoiceReading(!isVoiceReading)}
                  >
                    {voiceVolume === 0 ? (
                      <VolumeX className="h-5 w-5" />
                    ) : voiceVolume < 50 ? (
                      <Volume1 className="h-5 w-5" />
                    ) : (
                      <Volume2 className="h-5 w-5" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">
                  <p>{isVoiceReading ? "Stop Voice Reading" : "Start Voice Reading"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}
      </div>
    </div>
  );
} 