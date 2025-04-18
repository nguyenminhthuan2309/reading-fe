"use client";

import { useParams, useSearchParams, useRouter } from "next/navigation";
import { featuredBooks } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Menu, X, BookOpen, ScrollText, Maximize2, Volume2, VolumeX, Volume1, Plus, Minus } from "lucide-react";
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
import "./page-flip.css"; // Import CSS for page flip styling

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

// Mock picture book images
const generatePictureBookImages = (bookId: string, chapterNum: number): string[] => {
  // In a real app, these would be actual image URLs from a database
  // Here we're using placeholders
  return [
    `https://picsum.photos/seed/${bookId}-${chapterNum}-1/800/600`,
    `https://picsum.photos/seed/${bookId}-${chapterNum}-2/800/600`,
    `https://picsum.photos/seed/${bookId}-${chapterNum}-3/800/600`,
    `https://picsum.photos/seed/${bookId}-${chapterNum}-4/800/600`
  ];
};

// Mock chapter content
const generateChapterContent = (bookTitle: string, chapterNum: number) => {
  const paragraphs = [
    `The first rays of dawn crept through the window, casting long shadows across the room. ${bookTitle} was just beginning, and already the world seemed different.`,
    `Characters moved through the narrative with purpose, each step bringing them closer to their destiny. The author's words painted vivid pictures in the reader's mind.`,
    `"There's no turning back now," whispered the protagonist, eyes fixed on the horizon. The journey ahead would test them in ways they could never imagine.`,
    `Dialogue flowed naturally, revealing character motivations and advancing the plot. Each interaction was a puzzle piece, fitting together to form a complete picture.`,
    `The setting came alive through detailed descriptions of sight, sound, and smell. Readers could almost feel the texture of the world beneath their fingertips.`,
    `Conflict arose, challenging the characters and raising the stakes. This was the heart of storytelling – the struggle against obstacles both external and internal.`,
    `Themes emerged organically, woven into the fabric of the narrative. The author's message resonated with universal truths about human experience.`,
    `Plot twists kept readers engaged, subverting expectations and creating memorable moments. Nothing was quite as it seemed on the surface.`,
    `Character development occurred gradually, each decision and consequence shaping who they would become. Growth was inevitable, but not always in expected ways.`,
    `The chapter concluded with a sense of momentum, propelling the reader forward into the next part of the story. The journey was just beginning.`,
  ];
  
  // Randomize paragraph order but keep first and last paragraph fixed
  const middleParagraphs = [...paragraphs.slice(1, -1)];
  for (let i = middleParagraphs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [middleParagraphs[i], middleParagraphs[j]] = [middleParagraphs[j], middleParagraphs[i]];
  }
  
  // Return content with chapter-specific modifications
  return [
    paragraphs[0].replace("The first rays of dawn", `Chapter ${chapterNum}: The first rays of dawn`),
    ...middleParagraphs,
    paragraphs[9]
  ].join("\n\n");
};

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
    ? generatePictureBookImages(bookData.id, currentChapterIndex + 1) 
    : generateChapterContent(bookData.title, currentChapterIndex + 1).split("\n\n");
    
  useEffect(() => {
    if (flipBookRef.current && typeof flipBookRef.current.pageFlip === 'function') {
      setTotalPages(flipBookRef.current.pageFlip().getPageCount());
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
  const id = params.id as string;
  const flipBookRef = useRef<FlipBookRef>(null);
  
  // Move the chapter parsing to client-side using useEffect
  const [chapterNumber, setChapterNumber] = useState(1);
  const [chapterContent, setChapterContent] = useState("");
  const [book, setBook] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pictureBookImages, setPictureBookImages] = useState<string[]>([]);
  const [bookType, setBookType] = useState<string>("word_book"); // Default to word book
  
  // Reading mode state
  const [readingMode, setReadingMode] = useState<ReadingMode>('scroll');
  
  // Current page for flip mode
  const [currentPage, setCurrentPage] = useState(0);
  const [windowWidth, setWindowWidth] = useState(0);
  
  // State for sidebar visibility
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Voice reading state - moved up with other state definitions
  const [isVoiceReading, setIsVoiceReading] = useState<boolean>(false);
  const [voiceVolume, setVoiceVolume] = useState<number>(70); // 0-100 scale
  
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  
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
  
  // Navigation for flip mode
  const goToNextPage = () => {
    if (flipBookRef.current && typeof flipBookRef.current.pageFlip === 'function' && readingMode === 'flip') {
      flipBookRef.current.pageFlip().flipNext();
    } else {
      const maxPages = bookType === "picture_book" 
        ? pictureBookImages.length - 1
        : chapterContent.split("\n\n").length - 1;
        
      if (currentPage < maxPages) {
        setCurrentPage(prev => prev + 1);
      } else if (chapterNumber < (book?.chapters || 1)) {
        // Go to next chapter if at the end of current chapter
        window.location.href = `/read/${id}?chapter=${chapterNumber + 1}`;
      }
    }
  };
  
  const goToPrevPage = () => {
    if (flipBookRef.current && typeof flipBookRef.current.pageFlip === 'function' && readingMode === 'flip') {
      flipBookRef.current.pageFlip().flipPrev();
    } else {
      if (currentPage > 0) {
        setCurrentPage(prev => prev - 1);
      } else if (chapterNumber > 1) {
        // Go to previous chapter if at the beginning of current chapter
        window.location.href = `/read/${id}?chapter=${chapterNumber - 1}`;
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
    // Find the book with the matching ID
    const foundBook = featuredBooks.find(book => book.id === id);
    setBook(foundBook);
    
    // Get chapter number from query params
    const chapterParam = searchParams.get("chapter");
    const parsedChapter = chapterParam ? parseInt(chapterParam) : 1;
    setChapterNumber(parsedChapter);
    
    if (foundBook) {
      // For this demo, we're randomly assigning some books as picture books
      // In a real app, this would come from the database
      const isPictureBook = Number(foundBook.id) % 2 === 0; // Even IDs are picture books
      setBookType(isPictureBook ? "picture_book" : "word_book");
      
      if (isPictureBook) {
        // Generate picture book images
        setPictureBookImages(generatePictureBookImages(foundBook.id, parsedChapter));
      } else {
        // Generate text content
        setChapterContent(generateChapterContent(foundBook.title, parsedChapter));
      }
    }
    
    // Reset the current page when changing chapters
    setCurrentPage(0);
    
    setIsLoading(false);
  }, [id, searchParams]);
  
  // If loading, show a simple loading message
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12 flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }
  
  // If book not found, show an error message
  if (!book) {
    return (
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold">Book not found</h1>
        <p className="mt-2">The book you are looking for does not exist.</p>
        <div className="mt-3">
          <Button 
            variant="link" 
            className="flex items-center gap-2 py-1"
            onClick={() => router.back()}
          >
            <ChevronLeft size={16} />
            Back
          </Button>
        </div>
      </div>
    );
  }
  
  // Check if chapter is valid
  if (chapterNumber < 1 || chapterNumber > book.chapters) {
    return (
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold">Chapter not found</h1>
        <p className="mt-2">This chapter does not exist.</p>
        <div className="mt-3">
          <Button 
            variant="link" 
            className="flex items-center gap-2 py-1"
            onClick={() => router.back()}
          >
            <ChevronLeft size={16} />
            Back
          </Button>
        </div>
      </div>
    );
  }
  
  // Parse content for rendering
  const paragraphs = chapterContent.split("\n\n");
  const totalPages = bookType === "picture_book" ? pictureBookImages.length : paragraphs.length;
  
  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation bar */}
      <div className="border-b sticky top-0 bg-background z-10">
        <div className="container flex justify-between items-center py-3 px-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggleSidebar}>
              <Menu size={20} />
            </Button>
            <Link href={`/books/${book.id}`}>
              <Button variant="ghost" size="icon">
                <ChevronLeft size={20} />
              </Button>
            </Link>
          </div>
          
          <div className="flex flex-col items-center">
            <h1 className="text-base font-medium">{book.title}</h1>
            <p className="text-xs text-muted-foreground text-center">
              Chapter {chapterNumber}
              {readingMode === 'flip' && ` • Page ${currentPage + 1}/${readingMode === 'flip' && bookType === 'word_book' ? paragraphs.length + 2 : totalPages}`}
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
                      ? flipBookRef.current.pageFlip().getCurrentPageIndex() === 0 && chapterNumber === 1
                      : false) 
                    : currentPage === 0 && chapterNumber === 1}
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
                      ? flipBookRef.current.pageFlip().getCurrentPageIndex() === totalPages - 1 && chapterNumber === book.chapters
                      : false)
                    : currentPage === totalPages - 1 && chapterNumber === book.chapters}
                  className="h-8 w-8"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <>
                {chapterNumber > 1 && (
                  <Link href={`/read/${book.id}?chapter=${chapterNumber - 1}`}>
                    <Button variant="ghost" size="icon">
                      <ChevronLeft size={20} />
                    </Button>
                  </Link>
                )}
                
                {chapterNumber < book.chapters && (
                  <Link href={`/read/${book.id}?chapter=${chapterNumber + 1}`}>
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
              {Array.from({ length: book.chapters }, (_, index) => (
                <Link 
                  key={index} 
                  href={`/read/${book.id}?chapter=${index + 1}`}
                  onClick={toggleSidebar}
                >
                  <div 
                    className={`p-3 rounded-md text-sm ${
                      index + 1 === chapterNumber 
                        ? 'bg-primary text-primary-foreground' 
                        : 'hover:bg-accent'
                    }`}
                  >
                    Chapter {index + 1}
                    {index === 0 && <span className="ml-2 opacity-70">(The Beginning)</span>}
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
      
      {/* Chapter content */}
      <div className="flex-1 container max-w-4xl mx-auto px-4 py-8">
        {bookType === "picture_book" ? (
          readingMode === 'scroll' ? (
            <PictureBookReader 
              images={pictureBookImages} 
              captions={[
                `Chapter ${chapterNumber} - Page 1`,
                `Chapter ${chapterNumber} - Page 2`,
                `Chapter ${chapterNumber} - Page 3`,
                `Chapter ${chapterNumber} - Page 4`
              ]}
            />
          ) : (
            <FlipBook 
              bookData={book} 
              currentChapterIndex={chapterNumber - 1} 
              width={width} 
              height={height} 
            />
          )
        ) : (
          readingMode === 'scroll' ? (
            <div className="prose prose-sm sm:prose-base dark:prose-invert mx-auto">
              {paragraphs.map((paragraph, index) => (
                <p key={index} className="mb-4">{paragraph}</p>
              ))}
            </div>
          ) : (
            <FlipBook 
              bookData={book} 
              currentChapterIndex={chapterNumber - 1} 
              width={width} 
              height={height} 
            />
          )
        )}
        
        {/* Chapter navigation - only show for scroll mode */}
        {readingMode === 'scroll' && (
          <div className="flex justify-between items-center mt-3 mb-8">
            {chapterNumber > 1 ? (
              <Link href={`/read/${book.id}?chapter=${chapterNumber - 1}`}>
                <Button variant="link" className="flex items-center gap-2 py-1">
                  <ChevronLeft size={16} />
                  Previous Chapter
                </Button>
              </Link>
            ) : (
              <div />
            )}
            
            {chapterNumber < book.chapters && (
              <Link href={`/read/${book.id}?chapter=${chapterNumber + 1}`}>
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

      {/* Remove floating buttons from center */}
      <div className="fixed bottom-24 right-8 flex flex-col gap-4 z-30">
        {/* Reading mode group with multiple options - now above voice reader */}
        <div className="bg-background/80 backdrop-blur-sm shadow-lg rounded-full p-1 border flex flex-col gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant={readingMode === 'scroll' ? "default" : "ghost"} 
                  size="icon"
                  className="h-10 w-10 rounded-full"
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
        
        {/* Voice reading button - Only for word books */}
        {bookType === "word_book" && (
          <div className="flex flex-col gap-2 items-center">
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