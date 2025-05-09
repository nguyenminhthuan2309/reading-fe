"use client";

import { useParams, useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Menu, X, Volume2, VolumeX, Volume1, MessageCircle, Plus, Minus, Maximize2, ScrollText, BookOpen, SlidersHorizontal, Square, SkipForward } from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useMemo, useRef } from "react";
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
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { BOOK_KEYS, CHAPTER_KEYS } from "@/lib/constants/query-keys";
import NovelContent, { extractTextContent } from "@/components/novel/NovelContent";
import { NovelBookReader } from "@/components/books/novel-book-reader";

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
      const response = await getChaptersByBookId(Number(bookId), ChapterAccessStatus.PUBLISHED);
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
  
  // Voice reading state - moved up with other state definitions
  const [isVoiceReading, setIsVoiceReading] = useState<boolean>(false);
  const [voiceVolume, setVoiceVolume] = useState<number>(70); // 0-100 scale
  
  // Speech synthesis states
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [currentVoice, setCurrentVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [currentSpeechRate, setCurrentSpeechRate] = useState<number>(1);
  const [currentPitch, setCurrentPitch] = useState<number>(1);
  const [currentReadingParagraph, setCurrentReadingParagraph] = useState<number>(-1);
  const speechSynthesisRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const paragraphsRef = useRef<string[]>([]);
  
  // Text to be read aloud - now we'll keep paragraphs separate
  const textParagraphs = useMemo(() => {
    if (typeof chapterContent === 'string') {
      const paragraphs = extractTextContent(chapterContent);
      paragraphsRef.current = paragraphs;
      return paragraphs;
    }
    return [];
  }, [chapterContent]);
  
  // Update the text to read - merge all paragraphs into one
  const fullText = useMemo(() => {
    if (textParagraphs.length === 0) return "";
    // Join all paragraphs with spaces between them
    return textParagraphs.join(" ");
  }, [textParagraphs]);
  
  // Add a ref to remember the last read paragraph
  const lastReadParagraphRef = useRef<number>(0);
  
  // Add a state to track if there's a saved position to resume from
  const [hasResumePosition, setHasResumePosition] = useState<boolean>(false);
  
  // Add a ref to track the last word position
  const lastReadWordPositionRef = useRef<number>(0);
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
    if (commentsOpen) setCommentsOpen(false);
  };
  
  const toggleComments = () => {
    setCommentsOpen(!commentsOpen);
    if (sidebarOpen) setSidebarOpen(false);
  };

  // Initialize speech synthesis
  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      speechSynthesisRef.current = window.speechSynthesis;
      
      // Get available voices
      const loadVoices = () => {
        const voices = speechSynthesisRef.current?.getVoices() || [];
        setAvailableVoices(voices);
        
        // Set default voice (prefer Google US English voices)
        if (voices.length > 0) {
          // Look for Google US English voice first
          const googleUSVoice = voices.find(
            voice => voice.name.includes('Google US English') || 
                    (voice.name.includes('Google') && voice.lang.includes('en-US'))
          );
          
          // Next preference is any US English voice
          const usEnglishVoice = voices.find(
            voice => voice.lang.includes('en-US')
          );
          
          // Then any English voice
          const englishVoice = voices.find(
            voice => voice.lang.includes('en-')
          );
          
          // Set the voice in order of preference
          setCurrentVoice(googleUSVoice || usEnglishVoice || englishVoice || voices[0]);
        }
      };
      
      // Chrome loads voices asynchronously
      if (speechSynthesisRef.current.onvoiceschanged !== undefined) {
        speechSynthesisRef.current.onvoiceschanged = loadVoices;
      }
      
      loadVoices();
    }
    
    return () => {
      stopSpeech();
    };
  }, []);
  
  // Add a function to get text starting from a specific word
  const getTextFromPosition = (text: string, startWordPosition: number): string => {
    if (!text || startWordPosition <= 0) return text;
    
    const words = text.split(' ');
    if (startWordPosition >= words.length) return "";
    
    return words.slice(startWordPosition).join(' ');
  };
  
  // Keep the function to get paragraph index from global word position
  const getWordPosition = (globalWordIndex: number): { paragraphIndex: number, localWordIndex: number } => {
    if (!textParagraphs || textParagraphs.length === 0 || globalWordIndex < 0) {
      return { paragraphIndex: -1, localWordIndex: -1 };
    }
    
    let wordCount = 0;
    for (let i = 0; i < textParagraphs.length; i++) {
      const paragraph = textParagraphs[i];
      const paragraphWordCount = paragraph.split(' ').length;
      
      // If the global word index falls within this paragraph
      if (globalWordIndex < wordCount + paragraphWordCount) {
        return {
          paragraphIndex: i,
          localWordIndex: globalWordIndex - wordCount
        };
      }
      
      wordCount += paragraphWordCount;
      // Add 1 for the space between paragraphs that we added when joining
      wordCount += 1;
    }
    
    // If we get here, the index is beyond our text
    return { 
      paragraphIndex: textParagraphs.length - 1, 
      localWordIndex: textParagraphs[textParagraphs.length - 1].split(' ').length - 1 
    };
  };
  
  // Modify startSpeech to ensure it uses the most current settings
  const startSpeech = (resumeFromLastPosition: boolean = false) => {
    if (!speechSynthesisRef.current || !fullText || !currentVoice) {
      console.error('Cannot start speech: missing requirements', {
        synthesisAvailable: !!speechSynthesisRef.current,
        textAvailable: !!fullText,
        voiceAvailable: !!currentVoice
      });
      return;
    }
    
    console.log('Starting speech with settings:', {
      voice: currentVoice.name,
      rate: currentSpeechRate,
      pitch: currentPitch,
      volume: voiceVolume,
      fromPosition: resumeFromLastPosition ? lastReadWordPositionRef.current : 0
    });
    
    // Stop any existing speech
    if (speechSynthesisRef.current) {
      speechSynthesisRef.current.cancel();
    }
    
    // Determine the text to read - either full text or from last position
    const startWordPosition = resumeFromLastPosition ? lastReadWordPositionRef.current : 0;
    const textToRead = getTextFromPosition(fullText, startWordPosition);
    
    // Calculate which paragraph we're in based on the word position
    const { paragraphIndex } = getWordPosition(startWordPosition);
    
    // Create a new utterance for the text to read
    const utterance = new SpeechSynthesisUtterance(textToRead);
    
    // Apply current settings from state
    utterance.voice = currentVoice;
    utterance.volume = voiceVolume / 100;
    utterance.rate = currentSpeechRate;
    utterance.pitch = currentPitch;
    
    // Store global position for tracking
    let wordsSoFar = startWordPosition;
    
    // Track word position during speech
    utterance.onboundary = (event) => {
      // Only track word boundaries
      if (event.name === 'word') {
        wordsSoFar++;
        lastReadWordPositionRef.current = wordsSoFar;
        
        // Determine which paragraph contains this word
        const wordPosition = getWordPosition(wordsSoFar);
        
        // Update current reading paragraph if needed
        if (wordPosition.paragraphIndex !== -1) {
          setCurrentReadingParagraph(wordPosition.paragraphIndex);
        }
      }
    };
    
    // Add event handlers
    utterance.onend = () => {
      console.log("Speech complete");
      setIsVoiceReading(false);
      setCurrentReadingParagraph(-1);
      lastReadWordPositionRef.current = 0; // Reset on complete reading
    };
    
    utterance.onpause = () => {
      console.log("Speech paused at word:", lastReadWordPositionRef.current);
    };
    
    utterance.onerror = (event) => {
      if (event.error === "interrupted") {
        console.warn("Speech interrupted intentionally.");
      } else {
        console.error("Speech synthesis error:", event.error || event);
      }
      setIsVoiceReading(false);
      setCurrentReadingParagraph(-1);
    };
    
    // Store reference to current utterance
    utteranceRef.current = utterance;
    
    // Update UI state before starting
    setIsVoiceReading(true);
    setCurrentReadingParagraph(paragraphIndex);
    
    // Start speaking
    speechSynthesisRef.current.speak(utterance);
  };
  
  // Update the existing updateVoiceSettings function 
  const updateVoiceSettings = (
    newVoice?: SpeechSynthesisVoice,
    newRate?: number,
    newPitch?: number,
    newVolume?: number
  ) => {
    // Log the current values before changes
    console.log('BEFORE update - Current settings:', {
      voice: currentVoice?.name,
      rate: currentSpeechRate,
      pitch: currentPitch,
      volume: voiceVolume
    });
    
    console.log('Updating to:', {
      voice: newVoice?.name || 'unchanged',
      rate: newRate !== undefined ? newRate : 'unchanged',
      pitch: newPitch !== undefined ? newPitch : 'unchanged',
      volume: newVolume !== undefined ? newVolume : 'unchanged'
    });

    // First update all state variables immediately for UI
    if (newVoice) setCurrentVoice(newVoice);
    if (newRate !== undefined) setCurrentSpeechRate(newRate);
    if (newPitch !== undefined) setCurrentPitch(newPitch);
    if (newVolume !== undefined) setVoiceVolume(newVolume);
    
    // If not reading, we're done
    if (!isVoiceReading || !speechSynthesisRef.current) {
      return;
    }
    
    // Decide if we need to restart speech
    // For voice changes we always need to restart
    const needRestart = newVoice !== undefined;
    
    // Capture the current position before any changes
    const currentPosition = lastReadWordPositionRef.current;
    
    // If we can update directly without restarting, do so
    if (!needRestart && utteranceRef.current) {
      // Apply changes directly to the active utterance
      if (newRate !== undefined) {
        utteranceRef.current.rate = newRate;
        console.log('Directly applied rate change to:', newRate);
      }
      if (newPitch !== undefined) utteranceRef.current.pitch = newPitch;
      if (newVolume !== undefined) utteranceRef.current.volume = newVolume / 100;
      
      // We're done - no need to restart
      return;
    }
    
    // For changes requiring restart:
    // 1. Stop current speech
    speechSynthesisRef.current.cancel();
    
    // 2. Clear the current utterance ref to prevent confusion
    utteranceRef.current = null;
    
    // 3. Store the reading state flag but don't change UI yet
    const wasReading = isVoiceReading;
    
    // 4. Start new speech with updated settings
    // Use a small timeout to ensure state updates have propagated
    setTimeout(() => {
      if (wasReading) {
        // Log right before starting with new settings
        console.log('AFTER update - Current settings before restart:', {
          voice: currentVoice?.name,
          rate: currentSpeechRate, 
          pitch: currentPitch,
          volume: voiceVolume
        });
        
        // Create fresh utterance with current state values
        startSpeech(true);
      }
    }, 50);
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
  
  // In the effect for chapter changes, update to clear resume state
  useEffect(() => {
    stopSpeech();
    resetSpeechPosition();
    setIsVoiceReading(false);
    setCurrentReadingParagraph(-1);
  }, [chapterId, chapterNumber]);
  
  // Restore the stopSpeech function
  const stopSpeech = () => {
    console.log("stopSpeech", speechSynthesisRef);
    if (speechSynthesisRef.current) {
      speechSynthesisRef.current.cancel();
    }
    utteranceRef.current = null;
    setIsVoiceReading(false);
    setCurrentReadingParagraph(-1);
    // Don't reset word position to allow resuming
  };

  // Restore the resetSpeechPosition function
  const resetSpeechPosition = () => {
    lastReadWordPositionRef.current = 0;
    setCurrentReadingParagraph(-1);
  };

  // Restore the toggleVoiceReading function
  const toggleVoiceReading = () => {
    console.log("toggleVoiceReading", isVoiceReading);
    if (isVoiceReading) {
      stopSpeech();
    } else {
      // Check if we should resume from last position
      const hasLastPosition = lastReadWordPositionRef.current > 0;
      startSpeech(hasLastPosition);
    }
  };
  
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
          <PictureBookReader 
            bookData={bookData}
            currentChapter={chapterData}
            nextChapter={chapterList?.find(chapter => chapter.chapter === chapterData.chapter + 1)}
            images={pictureBookImages}
            captions={pictureBookImages.map((_, index) => `Chapter ${chapterData.chapter} - Page ${index + 1}`)}
            isFlipMode={readingMode === 'flip'}
          />
        ) : (
          <NovelBookReader
            bookData={bookData}
            currentChapter={chapterData}
            nextChapter={chapterList?.find(chapter => chapter.chapter === chapterData.chapter + 1)}
            content={typeof chapterContent === 'string' ? chapterContent : ''}
            isFlipMode={readingMode === 'flip'}
            className="mx-auto"
            highlightParagraph={currentReadingParagraph}
            onParagraphClick={(index) => {
              // Save clicked paragraph position regardless of reading state
              lastReadParagraphRef.current = index;
              
              if (isVoiceReading) {
                // If already reading, start from the clicked paragraph
                startSpeech();
              } else {
                // If not reading, just save the position for future use
                setCurrentReadingParagraph(index);
              }
            }}
          />
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
                        value={currentVoice?.name || ''}
                        onChange={(e) => {
                          const selected = availableVoices.find(voice => voice.name === e.target.value);
                          if (selected) {
                            updateVoiceSettings(selected);
                          }
                        }}
                      >
                        {availableVoices.map(voice => (
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
                          {currentSpeechRate}x
                        </span>
                      </div>
                      <input 
                        id="speed-range"
                        type="range" 
                        min="0.5" 
                        max="2" 
                        step="0.1" 
                        value={currentSpeechRate}
                        className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                        onChange={(e) => {
                          const rate = parseFloat(e.target.value);
                          console.log(`Slider changed to: ${rate}`);
                          updateVoiceSettings(undefined, rate);
                        }}
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
                          {voiceVolume}%
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          type="button"
                          className="text-muted-foreground hover:text-foreground transition-colors" 
                          aria-label="Mute"
                          onClick={() => updateVoiceSettings(undefined, undefined, undefined, 0)}
                        >
                          <VolumeX size={14} />
                        </button>
                        <input 
                          id="volume-range"
                          type="range" 
                          min="0" 
                          max="100" 
                          step="5" 
                          value={voiceVolume}
                          className="flex-1 h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                          onChange={(e) => {
                            const volume = parseInt(e.target.value);
                            updateVoiceSettings(undefined, undefined, undefined, volume);
                          }}
                        />
                        <button 
                          type="button"
                          className="text-muted-foreground hover:text-foreground transition-colors" 
                          aria-label="Maximum volume"
                          onClick={() => updateVoiceSettings(undefined, undefined, undefined, 100)}
                        >
                          <Volume2 size={14} />
                        </button>
                      </div>
                    </div>
                    
                    {/* Current paragraph indicator if reading */}
                    {isVoiceReading && currentReadingParagraph >= 0 && (
                      <div className="text-xs text-muted-foreground text-center mt-1 border-t pt-2">
                        Reading entire chapter ({textParagraphs.length} paragraphs)
                      </div>
                    )}
                    
                    {/* Resume indicator */}
                    {!isVoiceReading && lastReadWordPositionRef.current > 0 && (
                      <div className="text-xs text-muted-foreground text-center mt-1 border-t pt-2">
                        Will resume from word {lastReadWordPositionRef.current}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* TTS control buttons */}
              <div className="flex gap-2 flex-col">
                {/* Play/Pause button */}
                <Button 
                  variant={isVoiceReading ? "default" : "secondary"} 
                  size="icon"
                  className="h-12 w-12 rounded-full shadow-lg hover:shadow-md transition-all"
                  onClick={toggleVoiceReading}
                  aria-label={isVoiceReading ? "Stop Voice Reading" : "Start Voice Reading"}
                >
                  {isVoiceReading ? (
                    <Square className="h-4 w-4" /> // Use Square icon for Stop
                  ) : (
                    voiceVolume === 0 ? (
                      <VolumeX className="h-5 w-5" />
                    ) : voiceVolume < 50 ? (
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
      </div>
    </div>
  );
} 