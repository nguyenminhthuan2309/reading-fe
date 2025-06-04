"use client";

import { useParams, useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Menu, X, Volume2, VolumeX, Volume1, MessageCircle, ScrollText, BookOpen, Square, Lock, Play } from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { PictureBookReader } from "@/components/books/picture-book-reader";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getChapterDetail, getBookById, getChaptersByBookId, updateReadingHistory } from "@/lib/api/books";
import { Book, Chapter, ChapterAccessStatus } from "@/models/book";
import { Skeleton } from "@/components/ui/skeleton";
import { ChapterComments } from "@/components/books/chapter-comments";
import { BOOK_KEYS, CHAPTER_KEYS } from "@/lib/constants/query-keys";
import { NovelBookReader } from "@/components/books/novel-book-reader";
import { PurchaseChapterDialog } from "@/components/books/purchase-chapter-dialog";
import { useTextToSpeech } from "@/lib/hooks/useTextToSpeak";
import { useUserStore } from "@/lib/store";

// Define reading mode type for type safety (keep for reference)
type ReadingMode = 'scroll' | 'flip';

// Update ReadPage - remove references to readingMode and related state
export default function ReadPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const bookId = params.id as string;
  const queryClient = useQueryClient();
  // Get chapter parameters from query params
  const chapterParam = searchParams.get("chapter");
  const chapterNumber = chapterParam ? parseInt(chapterParam) : 1;
  const chapterIdParam = searchParams.get("id");
  const chapterId = chapterIdParam ? parseInt(chapterIdParam) : undefined;
  const bookReaderRef = useRef<HTMLDivElement>(null);
  const {user} = useUserStore();
  
  const { play, isPlaying, isPaused, pause, resume, voices, updateSettings, settings } =
  useTextToSpeech(bookReaderRef,{ pitch: 1, rate: 1, volume: 0.5 });

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
    data: chapterList = [],
    isLoading: isLoadingChapterList,
    error: chapterListError
  } = useQuery({
    queryKey: CHAPTER_KEYS.LIST(bookId),
    queryFn: async () => {
      const response = await getChaptersByBookId(Number(bookId), isAdminOrModerator ? undefined : ChapterAccessStatus.PUBLISHED);
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
  const [windowWidth, setWindowWidth] = useState(0);
  
  // State for sidebar visibility
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // State for comments sidebar visibility
  const [commentsOpen, setCommentsOpen] = useState(false);

  const isOwner = bookData?.author.id === user?.id;
  
  // Add state for purchase dialog
  const [isPurchaseDialogOpen, setIsPurchaseDialogOpen] = useState(false);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
    if (commentsOpen) setCommentsOpen(false);
  };
  
  const toggleComments = () => {
    setCommentsOpen(!commentsOpen);
    if (sidebarOpen) setSidebarOpen(false);
  };
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
  useEffect(() => {
    if (bookData?.bookType) {
      // Set the book type from the book data
      setBookType(bookData.bookType.name);
    }
  }, [bookData, chapterNumber, chapterId]);
  
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

  const isAdminOrModerator = user && (user.role.id === 1 || user.role.id === 2);
  const isPendingChapter = chapterData?.chapterAccessStatus === ChapterAccessStatus.PENDING_REVIEW || chapterData?.chapterAccessStatus === ChapterAccessStatus.DRAFT;
  const isCurrentChapterLocked = chapterData?.isLocked && !isAdminOrModerator;
  const unreadableChapter = isPendingChapter && !isAdminOrModerator;

  
  // Update reading history when chapter data is loaded
  useEffect(() => {
    if (chapterId && bookId && !isLoadingChapter && chapterData && !isCurrentChapterLocked && !!user && !isOwner && !isPendingChapter) {
      
      updateReadingHistoryMutation.mutate({
        bookId: Number(bookId),
        chapterId
      });
    }
  }, [bookId, chapterId, isLoadingChapter, chapterData, isPendingChapter]);
  
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
  if (!isLoadingChapter && (!chapterData || isChapterMismatch() || unreadableChapter)) {
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
            <Link href={`/books/${bookData?.id}`}>
              <Button variant="ghost" size="icon">
                <ChevronLeft size={20} />
              </Button>
            </Link>
          </div>
          
          <div className="flex flex-col items-center">
            <h1 className="text-base font-medium">{bookData?.title}</h1>
            <p className="text-xs text-muted-foreground text-center">
              Chapter {chapterData?.chapter}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
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
                <div key={chapter.id} className="flex items-center">
                  {chapter.isLocked ? (
                    // For locked chapters
                    <div className="flex-1 p-2 rounded-md text-sm flex items-center justify-between group">
                      <div className="flex flex-col gap-0.5 text-muted-foreground">
                        <span className="text-xs font-semibold">Chapter {chapter.chapter}</span>
                        <span className="text-sm flex items-center gap-1">
                          <Lock size={12} className="text-amber-500" />
                          {chapter.title || `Chapter ${chapter.chapter}`}
                        </span>
                      </div>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        className="h-7 text-xs opacity-0 group-hover:opacity-100 transition-opacity text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                        onClick={() => {
                          setSelectedChapter(chapter);
                          setIsPurchaseDialogOpen(true);
                          toggleSidebar();
                        }}
                      >
                        Unlock
                      </Button>
                    </div>
                  ) : (
                    // For unlocked chapters
                    <Link 
                      href={`/books/${bookId}/read?chapter=${chapter.chapter}&id=${chapter.id}`}
                      onClick={toggleSidebar}
                      className="flex-1"
                    >
                      <div 
                        className={`p-2 rounded-md text-sm ${
                          chapterId === chapter.id || (!chapterId && chapterNumber === chapter.chapter)
                            ? 'bg-primary text-primary-foreground' 
                            : 'hover:bg-accent'
                        }`}
                      >
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold">Chapter {chapter.chapter}</span>
                          <span>{chapter.title || `Chapter ${chapter.chapter}`}</span>
                        </div>
                      </div>
                    </Link>
                  )}
                </div>
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
        {isCurrentChapterLocked ? (
          // Show locked chapter message
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mb-6">
              <Lock className="h-10 w-10 text-amber-500" />
            </div>
            <h2 className="text-2xl font-bold mb-3">This Chapter is Locked</h2>
            <p className="text-gray-600 max-w-md mb-6">
              You need to unlock this chapter before you can read it. 
              Unlock it now to continue reading the story.
            </p>
            <Button 
              onClick={() => setIsPurchaseDialogOpen(true)}
              className="px-8 bg-amber-500 hover:bg-amber-600 text-white"
            >
              Unlock Chapter {chapterData?.chapter}
            </Button>
          </div>
        ) : bookType === "Manga" ? (
          <PictureBookReader 
            bookData={bookData}
            currentChapter={chapterData}
            nextChapter={chapterList?.find(chapter => chapter.chapter === chapterData?.chapter + 1)}
            images={pictureBookImages}
            captions={pictureBookImages.map((_, index) => `Chapter ${chapterData?.chapter} - Page ${index + 1}`)}
            isFlipMode={readingMode === 'flip'}
          />
        ) : (

          <div ref={bookReaderRef}>

            <NovelBookReader
              bookData={bookData}
              currentChapter={chapterData}
              nextChapter={chapterList?.find(chapter => chapter.chapter === chapterData?.chapter + 1)}
              content={typeof chapterContent === 'string' ? chapterContent : ''}
              isFlipMode={readingMode === 'flip'}
              className="mx-auto"
             
            />
          </div>
        )}
      </div>

      {/* Floating buttons */}
      {!isCurrentChapterLocked && (
      <div className="fixed bottom-36 right-2 flex flex-col gap-4 z-30 transition-all duration-300">
        {/* Comments/Reviews button group */}
        <div className={`bg-background/80 dark:bg-gray-800/90 backdrop-blur-sm shadow-lg rounded-full p-1 border dark:border-gray-700 ${commentsOpen ? 'mr-[384px] sm:mr-96' : ''} transition-all duration-300`}>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant={commentsOpen ? "default" : "secondary"} 
                  size="icon"
                  className="h-12 w-12 rounded-full dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white"
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
        <div className={`bg-background/80 dark:bg-gray-800/90 backdrop-blur-sm shadow-lg items-center rounded-full p-1 border dark:border-gray-700 flex flex-col gap-1 ${commentsOpen ? 'mr-[384px] sm:mr-96' : ''} transition-all duration-300`}>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant={readingMode === 'scroll' ? "default" : "ghost"} 
                  size="icon"
                  className="h-12 w-12 rounded-full dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white"
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
                  className="h-12 w-12 rounded-full dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white"
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
        </div>
        
        {/* Voice reading button - Only for novels */}
        {bookType === "Novel" && (
          <div className={`${commentsOpen ? 'mr-[384px] sm:mr-96' : ''} transition-all duration-300`}>
            <div className="group relative">
              {/* TTS options popover - positioned to the left side with a corridor for mouse movement */}
              <div className="absolute bottom-[-30px] right-[calc(100%)] pb-3 pr-3 pt-3 w-[calc(64px+16rem)] flex justify-end opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 ease-in-out z-50 group-hover:pointer-events-auto pointer-events-none">
                <div className="bg-background/95 backdrop-blur-sm shadow-xl rounded-lg p-4 border relative w-64">
                  {/* Directional arrow pointing to button - centered with the button */}
                  <div className="absolute bottom-[25px] right-[-8px] h-4 w-4 rotate-45 border-r border-t bg-background/95 border-border transform -translate-y-1/2"></div>
                  
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between border-b pb-2">
                      <h4 className="text-sm font-medium">Text-to-Speech Options</h4>
                    </div>
                    
                    {/* Voice selection dropdown */}
                    <div className="space-y-1.5">
                      <label htmlFor="voice-select" className="text-xs font-medium">Voice</label>
                      <select 
                        id="voice-select"
                        className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs shadow-sm focus:ring-1 focus:ring-primary"
                        onChange={(e) => {
                          const selected = voices.find(voice => voice.name === e.target.value);
                          if (selected) {
                            updateSettings({ voiceName: selected.name });
                          }
                        }}
                      >
                        {voices.map(voice => (
                          <option key={voice.name} value={voice.name}>
                            {voice.name.length > 30 ? `${voice.name.substring(0, 30)}...` : voice.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    {/* Speech rate control */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label htmlFor="speed-range" className="text-xs font-medium">Reading Speed</label>
                        <span className="text-xs bg-secondary/50 px-1.5 py-0.5 rounded-md">
                          {settings.rate}x
                        </span>
                      </div>
                      <input 
                        id="speed-range"
                        type="range" 
                        min="0.5" 
                        max="2" 
                        step="0.1" 
                        className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                        value={settings.rate}
                        onChange={(e) => updateSettings({ rate: parseFloat(e.target.value) })}
                      />
                      <div className="flex justify-between text-[10px] text-muted-foreground px-0.5">
                        <span>Slow</span>
                        <span>Normal</span>
                        <span>Fast</span>
                      </div>
                    </div>
                    
                    {/* Volume control */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label htmlFor="volume-range" className="text-xs font-medium">Volume</label>
                        <span className="text-xs bg-secondary/50 px-1.5 py-0.5 rounded-md">
                          {settings.volume ? settings.volume * 100 : 50}%
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          type="button"
                          className="text-muted-foreground hover:text-foreground transition-colors" 
                          aria-label="Mute"
                          onClick={() => updateSettings({ volume: 0 })}
                        >
                          <VolumeX size={14} />
                        </button>
                        <input 
                          id="volume-range"
                          type="range" 
                          min="0" 
                          max="100" 
                          step="5" 
                          className="flex-1 h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                          value={settings.volume ? settings.volume * 100 : 50}
                          onChange={(e) => updateSettings({ volume: parseInt(e.target.value) / 100 })}
                        />
                        <button 
                          type="button"
                          className="text-muted-foreground hover:text-foreground transition-colors" 
                          aria-label="Maximum volume"
                          onClick={() => updateSettings({ volume: 100 })}
                        >
                          <Volume2 size={14} />
                        </button>
                      </div>
                    </div>
                    
                    {/* Current paragraph indicator if reading */}
                    {isPlaying && (
                      <div className="text-xs text-muted-foreground text-center mt-1 border-t pt-2">
                        Reading entire chapter ({paragraphs.length} paragraphs)
                      </div>
                    )}
                    
                    {/* Resume indicator */}
                    {!isPlaying && (
                      <div className="text-xs text-muted-foreground text-center mt-1 border-t pt-2">
                        Will resume from word 
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* TTS control buttons */}
              <div className="flex gap-2 flex-col">
                {/* Play/Pause button */}
                <Button 
                  variant={isPlaying ? "default" : "secondary"} 
                  size="icon"
                  className="h-12 w-12 rounded-full shadow-lg hover:shadow-md transition-all"
                  onClick={() => {
                    if (isPlaying && !isPaused) {
                      pause();
                    } else if (isPaused) {
                      resume();
                    } else {
                      play();
                    }
                  }}
                  aria-label={isPlaying ? "Stop Voice Reading" : "Start Voice Reading"}
                >
                  {isPlaying ? (
                    isPaused ? (
                      <Play className="h-4 w-4" />
                    ) : (
                      <Square className="h-4 w-4" /> // Use Square icon for Stop
                    )
                  ) : (
                    settings.volume === 0 ? (
                      <VolumeX className="h-5 w-5" />
                    ) : settings.volume && settings.volume < 50 ? (
                      <Volume1 className="h-5 w-5" />
                    ) : (
                      <Volume2 className="h-5 w-5" />
                    )
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>)}

      {/* Purchase Chapter Dialog */}
      {(selectedChapter || chapterData) && (
        <PurchaseChapterDialog
          chapter={selectedChapter || chapterData}
          open={isPurchaseDialogOpen}
          onOpenChange={(open) => {
            setIsPurchaseDialogOpen(open);
            if (!open) {
              // Reset selected chapter when dialog closes
              setSelectedChapter(null);
            }
          }}
          onSuccess={() => {
            // Refresh chapter data after purchase
            queryClient.invalidateQueries({ queryKey: CHAPTER_KEYS.DETAIL(chapterId || 0, chapterNumber) });
            queryClient.invalidateQueries({ queryKey: CHAPTER_KEYS.LIST(bookId) });
            // Reset selected chapter
            setSelectedChapter(null);
          }}
        />
      )}
    </div>
  );
} 