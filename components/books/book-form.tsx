"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Save, Trash2, BookOpen, Loader2, Eye, Home, AlertCircle, Shield, CheckCircle2, Info, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import * as yup from "yup";
import { createBook, updateBook, getGenres, getChaptersByBookId, createChapters, updateChapter, addChapter, deleteChapter } from "@/lib/api/books";
import { uploadFile } from "@/lib/api/base";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BOOK_TYPES, AgeRatingEnum, ProgressStatusEnum, AccessStatusEnum, Chapter, ChaptersBatchPayload, ChapterCreateItem } from "@/models";
import { toast } from "sonner";
import { useUserStore } from "@/lib/store";
import { useNavigationGuard } from "@/lib/hooks/useUnsavedChangesWarning";
import { useBookEditPermissions } from "@/lib/hooks/useBookEditPermissions";
import BookInfo from "@/components/books/book-info";
import ChapterCreator, { LocalChapter } from "@/components/books/chapter-creator";
import { CATEGORY_KEYS, CHAPTER_KEYS } from "@/lib/constants/query-keys";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useOpenAI, MODERATION_MODELS, ModerationModelType } from "@/lib/hooks/useOpenAI";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { extractChapterContent } from "@/lib/utils";
import { ModerationResults, ModerateButton } from "@/components/moderation";
import { isContentFlagged, AGE_RATING_THRESHOLDS, AgeRating } from "@/lib/api/openai";

// Basic error message component
const ErrorMessage = ({ message }: { message: string }) => (
  <p className="text-sm text-destructive mt-1 flex items-center gap-1">
    <span className="text-xs">•</span> {message}
  </p>
);

export interface BookFormProps {
  initialData?: any; // Will be filled with book data for editing
  isEditing?: boolean;
  onSuccess?: (bookId: number) => void;
}

// Update component props with correct RefObject types
type BookInfoProps = Parameters<typeof BookInfo>[0];

// Define the interface for our consolidated bookData state
interface BookData {
  title: string;
  description: string;
  coverImage: File | null;
  coverImagePreview: string | null;
  selectedGenres: string[];
  bookType: string;
  ageRating: number;
}

// Map AgeRatingEnum to API's AgeRating type
const ageRatingMap: Record<number, AgeRating> = {
  [AgeRatingEnum.EVERYONE]: "ALL",
  [AgeRatingEnum.TEEN]: "13_PLUS",
  [AgeRatingEnum.MATURE]: "16_PLUS",
  [AgeRatingEnum.ADULT]: "18_PLUS",
};

export function BookForm({ initialData, isEditing = false, onSuccess }: BookFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  
  // Consolidated book data state
  const [bookData, setBookData] = useState<BookData>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    coverImage: null,
    coverImagePreview: initialData?.cover || null,
    selectedGenres: initialData?.categories?.map((cat: any) => cat.id.toString()) || [],
    bookType: initialData?.bookType?.name || BOOK_TYPES.NOVEL,
    ageRating: initialData?.ageRating || AgeRatingEnum.EVERYONE,
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [chapters, setChapters] = useState<LocalChapter[]>([]);
  const [emptyChapters, setEmptyChapters] = useState<string[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isBookInfoCollapsed, setIsBookInfoCollapsed] = useState(false);
  const [isEnhancingTitle, setIsEnhancingTitle] = useState(false);
  const [isEnhancingDescription, setIsEnhancingDescription] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [isLoadingChapters, setIsLoadingChapters] = useState(false);
  const [successBookId, setSuccessBookId] = useState<number | null>(null);
  const [chapterUploadFailed, setChapterUploadFailed] = useState(false);
  const [chaptersToDelete, setChaptersToDelete] = useState<number[]>([]);
  
  // Moderation state
  const [moderationResults, setModerationResults] = useState<any | null>(null);
  const [selectedModel, setSelectedModel] = useState<ModerationModelType>(MODERATION_MODELS.OMNI);
  const [moderationDialogOpen, setModerationDialogOpen] = useState(false);
  const [moderationStatus, setModerationStatus] = useState<'pending' | 'passed' | 'flagged' | null>(null);
  
  // Get edit permissions
  const { canEditBasicInfo, canEditExistingChapters, canAddNewChapters, canDelete, reasonIfDenied } = useBookEditPermissions(initialData);
  
  // Alert dialog states
  const [showNoModerationDialog, setShowNoModerationDialog] = useState(false);
  const [showModerationIssuesDialog, setShowModerationIssuesDialog] = useState(false);
  const [pendingPublishAction, setPendingPublishAction] = useState(false);
  
  // Use the OpenAI hook
  const { moderateContent, isLoading: isModeratingContent } = useOpenAI();
  
  // Use our custom hook to warn users when navigating away with unsaved changes
  useNavigationGuard({ when: hasUnsavedChanges });
  
  const [showUnsavedChangesDialog, setShowUnsavedChangesDialog] = useState(false);
  
  
  // Use React Query to fetch genres
  const genresQuery = useQuery({
    queryKey: CATEGORY_KEYS.CATEGORIES,
    queryFn: async () => {
      const response = await getGenres();
      if (response.status !== 200) {
        throw new Error(response.msg || 'Failed to fetch genres');
      }
      return response.data;
    }
  });
  
  // Use React Query to fetch chapters when editing with properly typed hooks
  const chaptersQuery = useQuery<Chapter[]>({
    queryKey: ['chapters', initialData?.id],
    queryFn: async () => {
      const response = await getChaptersByBookId(initialData.id);
      if (response.status !== 200) {
        throw new Error(response.msg || 'Failed to fetch chapters');
      }
      return response.data;
    },
    enabled: isEditing && initialData?.totalChapters > 0
  });

  // Create mutation for updating a chapter
  const updateChapterMutation = useMutation({
    mutationFn: async ({ 
      chapterId, 
      chapterData 
    }: { 
      chapterId: number, 
      chapterData: Partial<Chapter> 
    }) => {
      const response = await updateChapter(chapterId, chapterData);
      if (response.status !== 200 && response.status !== 201) {
        throw new Error(response.msg || 'Failed to update chapter');
      }
      return response.data;
    },
  });

  // Create mutation for creating chapters in batch
  const createChaptersMutation = useMutation({
    mutationFn: async ({ 
      bookId, 
      chaptersData 
    }: { 
      bookId: number, 
      chaptersData: ChaptersBatchPayload 
    }) => {
      const response = await createChapters(bookId, chaptersData);
      if (response.status !== 200 && response.status !== 201) {
        throw new Error(response.msg || 'Failed to create chapters');
      }
      return response.data;
    },
  });
  
  // Add scroll effect
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      if (scrollPosition > 60) {
        setHasScrolled(true);
      } else {
        setHasScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Process chapters data when it's available
  useEffect(() => {
    if (chaptersQuery.data) {
      // Convert API chapters to LocalChapter format
      const formattedChapters: LocalChapter[] = chaptersQuery.data.map((chapter: Chapter) => {
        // Determine if chapter has images (for manga books)
        let images: Array<string | {url: string; fileName: string}> = [];
        
        if (bookData.bookType === BOOK_TYPES.MANGA) {
          try {
            // If the content is not a string, it's likely a JSON array of image URLs
            if (typeof chapter.content !== 'string') {
              if (Array.isArray(chapter.content)) {
                images = chapter.content;
              }
            } else {
              // Try to parse the content as JSON
              try {
                const parsedContent = JSON.parse(chapter.content);
                if (Array.isArray(parsedContent)) {
                  images = parsedContent;
                }
              } catch (e) {
                // Content is not valid JSON, so it's probably just text content
                console.log("Content is not a valid JSON array of images:", e);
              }
            }
          } catch (error) {
            console.error("Error processing chapter content as images:", error);
          }
        }
        
        return {
          id: chapter.id.toString(),
          chapter: chapter.chapter,
          title: chapter.title,
          content: typeof chapter.content === 'string' ? chapter.content : JSON.stringify(chapter.content),
          isLocked: chapter.isLocked,
          createdAt: chapter.createdAt,
          updatedAt: chapter.updatedAt,
          moderated: chapter.moderated || '',
          // Set images array for manga books
          images
        };
      });
      
      setChapters(formattedChapters);
    }
  }, [chaptersQuery.data, bookData.bookType]);

  // Show error toast when chapter fetching fails
  useEffect(() => {
    if (chaptersQuery.error) {
      console.error("Error fetching chapters:", chaptersQuery.error);
      toast.error("Failed to load chapters. Please try again.");
    }
  }, [chaptersQuery.error]);
  
  // Add validation schema
  const bookSchema = yup.object().shape({
    title: yup
      .string()
      .required("Title is required")
      .max(100, "Title must be at most 100 characters"),
    
    description: yup
      .string()
      .required("Description is required")
      .max(1000, "Description must be at most 1000 characters"),
    
    coverImage: yup
      .mixed()
      .test('hasImage', 'Cover image is required', function() {
        // If we're editing and already have a cover, or if we have a new cover image
        return (isEditing && initialData?.cover) || bookData.coverImage !== null;
      }),
    
    genres: yup
      .array()
      .of(yup.string())
      .min(1, "At least one genre is required"),
      
    bookType: yup
      .string()
      .required("Book type is required")
      .oneOf([BOOK_TYPES.NOVEL, BOOK_TYPES.MANGA], "Invalid book type"),
      
    ageRating: yup
      .number()
      .required("Age rating is required")
      .oneOf([AgeRatingEnum.EVERYONE, AgeRatingEnum.TEEN, AgeRatingEnum.MATURE, AgeRatingEnum.ADULT], "Invalid age rating")
  });

  // Add a simpler draft schema that only requires title
  const draftSchema = yup.object().shape({
    title: yup
      .string()
      .required("Title is required for drafts")
      .max(100, "Title must be at most 100 characters"),
  });

  // Validation function
  const validateForm = async (isDraft = false) => {
    try {
      const formData = {
        title: bookData.title,
        description: bookData.description,
        coverImage: bookData.coverImage,
        genres: bookData.selectedGenres,
        bookType: bookData.bookType,
        ageRating: bookData.ageRating,
        hasCoverImage: isEditing && initialData?.cover 
      };
      
      // For drafts, only validate title using draft schema
      if (isDraft) {
        try {
          await draftSchema.validate({ title: formData.title }, { abortEarly: false });
          
          // Clear any previous errors since we're saving as draft
          setErrors({});
          
          // Clear empty chapters list for drafts
          setEmptyChapters([]);
          
          return formData;
        } catch (error) {
          if (error instanceof yup.ValidationError) {
            // Map errors to fields
            const fieldErrors: Record<string, string> = {};
            error.inner.forEach(err => {
              if (err.path) {
                fieldErrors[err.path] = err.message;
              }
            });
            setErrors(fieldErrors);
          }
          return null;
        }
      }
      
      // Validate that the book has at least one chapter when publishing
      if (chapters.length === 0 && !isDraft) {
        setErrors(prev => ({
          ...prev,
          chapters: "You must create at least one chapter before publishing your book."
        }));
        return null;
      }
      
      // For drafts, clear any chapter validation errors and proceed
      if (isDraft) {
        // Clear empty chapters state for drafts
        setEmptyChapters([]);
        
        // Remove any chapter-related errors
        if (errors.chapters) {
          const { chapters, ...rest } = errors;
          setErrors(rest);
        }
      } 
      // For publishing, validate that chapters have content
      else {
        const chaptersWithNoContent = chapters.filter(chapter => 
          (!chapter.content || chapter.content.trim() === '') && 
          (!chapter.images || chapter.images.length === 0) &&
          (!chapter.documentUrl || chapter.documentUrl === 'pending')
        );
        
        // Update the empty chapters state
        if (chaptersWithNoContent.length > 0) {
          // Set the empty chapters - this will highlight them in the UI
          setEmptyChapters(chaptersWithNoContent.map(ch => ch.id));
          
          const chapterWord = chaptersWithNoContent.length === 1 ? 'chapter' : 'chapters';
          setErrors(prev => ({
            ...prev,
            chapters: `${chaptersWithNoContent.length} ${chapterWord} with no content. Please add content or remove them.`
          }));
        } else {
          // Clear empty chapters state since all chapters have content
          setEmptyChapters([]);
          if (errors.chapters) {
            const { chapters, ...rest } = errors;
            setErrors(rest);
          }
        }
        
        // If there are empty chapters for a non-draft book, return null
        if (chaptersWithNoContent.length > 0) {
          return null;
        }
      }
      
      // Create a modified schema for edit mode if there's an existing cover
      if (isEditing && initialData?.cover) {
        // If editing and has existing cover, create a modified schema that doesn't require new cover upload
        const editSchema = yup.object().shape({
          title: bookSchema.fields.title,
          description: bookSchema.fields.description,
          genres: bookSchema.fields.genres,
          bookType: bookSchema.fields.bookType,
          ageRating: bookSchema.fields.ageRating,
          // Skip coverImage validation since we already have a cover
        });
        
        await editSchema.validate(formData, { abortEarly: false });
      } else {
        // Regular validation for new books or books without covers
        await bookSchema.validate(formData, { abortEarly: false });
      }
      
      return formData;
    } catch (error) {
      if (error instanceof yup.ValidationError) {
        // Map errors to fields
        const fieldErrors: Record<string, string> = {};
        error.inner.forEach(err => {
          if (err.path) {
            fieldErrors[err.path] = err.message;
          }
        });
        setErrors(fieldErrors);
      } else {
        setErrors({ form: "Validation failed, please check your inputs" });
      }
      return null;
    }
  };

  /**
   * Standardized function to handle the book submission process
   * This consolidates all the submission logic in one place
   */
  const processBookSubmission = async (isDraft: boolean = false): Promise<boolean> => {
    // We've already validated the form data before calling this function
    try {
      // Prepare basic book data from state
      const { title, description, coverImage, ageRating } = bookData;
      
      // Handle cover image upload
      let coverUrl = initialData?.cover || '';
      if (coverImage) {
        try {
          // Upload new cover image
          const uploadResponse = await uploadFile<string>('/upload/image', coverImage);
          if (uploadResponse.status !== 200 && uploadResponse.status !== 201) {
            throw new Error(uploadResponse.msg || 'Failed to upload cover image');
          }
          coverUrl = uploadResponse.data;
        } catch (error) {
          throw new Error('Error uploading cover image. Please try again.');
        }
      } else if (!isEditing && !coverUrl) {
        throw new Error('Cover image is required for new books');
      }
      
      // Prepare moderation data if available
      let moderationData = {};

      // For a book to be marked as moderated, both the book content and all chapters must pass moderation
      if (moderationResults && moderationStatus === 'passed') {
        // Make sure all chapters have been moderated too
        let allContentModerated = true;
        
        // Check that we have chapter moderation results for all chapters
        if (chapters.length > 0) {
          // For each chapter, check if it has moderation data and passed
          chapters.forEach(chapter => {
            // Try to find moderation data for this chapter
            let chapterPassed = false;
            
            if (moderationResults.contentResults?.chapters) {
              const chapterModeration = moderationResults.contentResults.chapters.find(
                (c: any) => {
                  if ('index' in c && c.index == chapter.chapter) return true;
                  if ('chapter' in c && c.chapter == chapter.chapter) return true;
                  return false;
                }
              );
              
              if (chapterModeration) {
                const result = 'result' in chapterModeration ? chapterModeration.result : chapterModeration;
                chapterPassed = !result.flagged;
              } else {
                // No moderation data found for this chapter
                chapterPassed = false;
              }
            }
            
            // If any chapter didn't pass moderation, the book can't be marked as moderated
            if (!chapterPassed) {
              allContentModerated = false;
            }
          });
        }
        
        // Only mark as moderated if all content (including all chapters) passed moderation
        if (allContentModerated) {
          moderationData = { moderated: selectedModel };
        }
      } else if (isEditing && initialData?.moderated && !hasChanges) {
        // If we're editing and the book was already moderated and no changes were made,
        // preserve the existing moderation status
        moderationData = { moderated: initialData.moderated };
      }
      
      // Prepare book API data
      const bookApiData = {
        title,
        description,
        ageRating,
        cover: coverUrl,
        bookTypeId: bookData.bookType === BOOK_TYPES.NOVEL ? 1 : 2,
        progressStatusId: ProgressStatusEnum.ONGOING,
        accessStatusId: isDraft ? AccessStatusEnum.PRIVATE : AccessStatusEnum.PENDING,
        categoryIds: bookData.selectedGenres.map((id: string) => parseInt(id)),
        isDraft,
        // Add moderation data if available
        ...moderationData
      };
      
      let updatedBookId: number;
      
      // Create or update the book
      if (isEditing) {
        // Update existing book
        const updateResponse = await updateBook(initialData.id, bookApiData);
        if (updateResponse.status !== 200 && updateResponse.status !== 201) {
          throw new Error(updateResponse.msg || 'Failed to update book');
        }
        
        updatedBookId = initialData.id;
        
        // Handle chapter updates
        if (chapters.length > 0 || chaptersToDelete.length > 0) {
          try {
            await handleExistingBookChapters(updatedBookId);
          } catch (error) {
            console.error("Error updating chapters:", error);
            setChapterUploadFailed(true);
            toast.error(`Book updated but there was an issue with saving chapters: ${(error as Error).message}. Please try again.`);
          }
        }
      } else {
        // Create new book
        const createResponse = await createBook(bookApiData);
        if (createResponse.status !== 201 && createResponse.status !== 200) {
          throw new Error(createResponse.msg || 'Failed to create book');
        }
        
        updatedBookId = createResponse.data;
        
        // Create chapters for new book
        if (chapters.length > 0) {
          try {
            await handleNewBookChapters(updatedBookId);
          } catch (error) {
            console.error("Error creating chapters:", error);
            setChapterUploadFailed(true);
            toast.error(`Book created but there was an issue with saving chapters: ${(error as Error).message}. Please try again.`);
          }
        }
      }
      
      // Reset form state and set success
      setHasUnsavedChanges(false);
      setSuccessBookId(updatedBookId);
      
      // Call the success callback if provided
      if (onSuccess) {
        onSuccess(updatedBookId);
      }
      
      // Show appropriate success message
      if (isDraft) {
        toast.success("Draft saved successfully");
      } else if (isEditing) {
        toast.success("Book updated successfully");
      } else {
        toast.success("Book submitted for review");
      }
      
      return true;
    } catch (error) {
      toast.error((error as Error).message || 'An error occurred');
      setErrors({ 
        form: (error as Error).message || 'Failed to save book'
      });
      return false;
    }
  };

  // Update form submission handler to use the standardized flow
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // First validate the form
    const validatedData = await validateForm(false);
    if (!validatedData) {
      // Show error for empty chapters
      if (emptyChapters.length > 0) {
        document.querySelector('.ChapterCreator, [id^="chapter-content"]')?.scrollIntoView({ behavior: 'smooth' });
        toast.error(`${emptyChapters.length} chapter(s) found with no content. Please add content or remove them.`);
      }
      return;
    }
    
    // Then check for moderation status
    if (!moderationResults) {
      // Show alert dialog to run moderation first
      setShowNoModerationDialog(true);
      return;
    } else if (moderationResults && moderationStatus === 'flagged') {
      // Content has been moderated but has issues
      setShowModerationIssuesDialog(true);
      return;
    }
    
    // Set UI state for submission
    setPendingPublishAction(true);
    setIsSubmitting(true);
    
    // Use standardized submission flow
    await processBookSubmission(false);
    
    // Reset UI state
    setIsSubmitting(false);
    setPendingPublishAction(false);
  };
  
  // Update save as draft handler
  const handleSaveAsDraft = async () => {
    // First validate the draft (only title is required)
    const validatedData = await validateForm(true);
    if (!validatedData) {
      toast.error("Please provide a title for your draft.");
      return;
    }

    setIsSavingDraft(true);
    await processBookSubmission(true);
    setIsSavingDraft(false);
  };

  /**
   * Processes image data for a single chapter
   */
  const processChapterImages = async (chapter: LocalChapter): Promise<string[]> => {
    const imageUrls: string[] = [];
    
    if (!chapter.images || chapter.images.length === 0) {
      return imageUrls;
    }
    
    // Process each image - some might be strings (already uploaded URLs) and some might be objects
    for (const image of chapter.images) {
      let imageUrl = '';
      
      if (typeof image === 'string') {
        // Direct string URL or base64
        imageUrl = image;
      } else if (typeof image === 'object' && 'url' in image) {
        // Get URL from image object
        imageUrl = image.url;
      }
      
      // Add the processed image URL to our collection
      if (imageUrl) {
        // If it's an unsaved image (blob URL), we need to convert it to base64
        if (imageUrl.startsWith('blob:')) {
          try {
            // Fetch the blob URL
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            
            // Create a promise to handle the async file reader
            const base64Data = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            });
            
            imageUrls.push(base64Data);
          } catch (error) {
            console.error("Error converting image to base64:", error);
            // Still include the original URL if conversion fails
            imageUrls.push(imageUrl);
          }
        } else {
          // For already saved images (http URLs) or already base64 encoded
          imageUrls.push(imageUrl);
        }
      }
    }
    
    return imageUrls;
  };

  /**
   * Formats chapter data for API submission
   */
  const formatChapterForApi = (chapter: LocalChapter, isManga: boolean): ChapterCreateItem => {
    // Handle different content formats based on book type
    let content = chapter.content;
    
    // For manga books, if we have images and the content wasn't already set during upload,
    // then convert images array to content
    if (isManga && chapter.images && chapter.images.length > 0 && !content) {
      content = JSON.stringify(chapter.images.map(img => 
        typeof img === 'string' ? img : img.url
      ));
    }
    
    // Add moderation data if available and this chapter has been moderated
    let moderationData = {};
    if (moderationResults && moderationResults.contentResults?.chapters) {
      // Try to find moderation data for this chapter
      const chapterModeration = moderationResults.contentResults.chapters.find(
        (c: any) => {
          if ('index' in c && c.index == chapter.chapter) return true;
          if ('chapter' in c && c.chapter == chapter.chapter) return true;
          return false;
        }
      );
      
      if (chapterModeration) {
        const result = 'result' in chapterModeration ? chapterModeration.result : chapterModeration;
        
        // Only include moderated property if the content passed moderation
        if (!result.flagged) {
          moderationData = { moderated: selectedModel };
        }
      }
    }
    
    return {
      title: chapter.title || `Chapter ${chapter.chapter}`,  // Ensure title is never undefined
      chapter: chapter.chapter,
      content: content || '',  // Ensure content is never undefined
      ...moderationData  // Add moderation data if available
    };
  };

  /**
   * Handler for updating chapters of an existing book
   */
  const handleExistingBookChapters = async (bookId: number): Promise<boolean> => {
    if (chapters.length === 0 && chaptersToDelete.length === 0) return true;
    
    try {
      // 1. Process deletion queue first
      if (chaptersToDelete.length > 0) {
        setIsSubmitting(true);
        
        // Process each chapter for deletion
        for (const chapterId of chaptersToDelete) {
          try {
            // Delete the chapter
            const deleteResponse = await deleteChapter(chapterId);
            if (!(deleteResponse.status >= 200 && deleteResponse.status < 300)) {
              throw new Error(deleteResponse.msg || 'Failed to delete chapter');
            }
          } catch (deleteError) {
            console.error(`Error deleting chapter ${chapterId}:`, deleteError);
            throw new Error(`Failed to delete chapter ${chapterId}: ${(deleteError as Error).message}`);
          }
        }
        
        // Clear the deletion queue after processing
        setChaptersToDelete([]);
      }
      
      // 2. Separate chapters into new and existing
      const existingChapters = chapters.filter(ch => !ch.id.startsWith('chapter-'));
      const newChapters = chapters.filter(ch => ch.id.startsWith('chapter-'));
      
      // 3. Process manga book images if needed
      const isManga = bookData.bookType === BOOK_TYPES.MANGA;
      if (isManga) {
        // Process both existing and new chapters to upload images
        const allChapters = [...existingChapters, ...newChapters];
        
        for (const chapter of allChapters) {
          if (chapter.images && chapter.images.length > 0) {
            const imageUrls = await processChapterImages(chapter);
            
            // Update the chapter with the collected image URLs
            chapter.content = JSON.stringify(imageUrls);
          }
        }
      }
      
      // 4. Process existing chapters by updating them individually
      for (const chapter of existingChapters) {
        try {
          // Check if the chapter has been modified
          const originalChapter = chaptersQuery.data?.find(ch => ch.id.toString() === chapter.id);
          
          if (!originalChapter) {
            console.warn(`Original chapter with ID ${chapter.id} not found, skipping update`);
            continue;
          }
          
          // Compare current chapter data with original
          const contentChanged = chapter.content !== (typeof originalChapter.content === 'string' 
            ? originalChapter.content 
            : JSON.stringify(originalChapter.content));
            
          const titleChanged = chapter.title !== originalChapter.title;
          const isLockedChanged = chapter.isLocked !== originalChapter.isLocked;
          const chapterNumberChanged = chapter.chapter !== originalChapter.chapter;
          
          // Only update if something changed
          if (contentChanged || titleChanged || isLockedChanged || chapterNumberChanged) {
            // Add moderation data if available for this chapter
            let moderationData = {};
            if (moderationResults && moderationResults.contentResults?.chapters) {
              // Try to find moderation data for this chapter
              const chapterModeration = moderationResults.contentResults.chapters.find(
                (c: any) => {
                  if ('index' in c && c.index == chapter.chapter) return true;
                  if ('chapter' in c && c.chapter == chapter.chapter) return true;
                  return false;
                }
              );
              
              if (chapterModeration) {
                const result = 'result' in chapterModeration ? chapterModeration.result : chapterModeration;
                
                // Only include moderated property if the content passed moderation
                if (!result.flagged) {
                  moderationData = { moderated: selectedModel };
                }
              }
            }
            
            const chapterData = {
              title: chapter.title,
              content: chapter.content,
              isLocked: chapter.isLocked,
              chapter: chapter.chapter,
              ...moderationData
            };
            
            // Use mutation to update the chapter
            await updateChapterMutation.mutateAsync({ 
              chapterId: parseInt(chapter.id), 
              chapterData 
            });
          }
        } catch (error) {
          console.error(`Error updating chapter ${chapter.id}:`, error);
          throw error;
        }
      }
      
      // 5. Process new chapters as a batch
      if (newChapters.length > 0) {
        try {
          // Format new chapters for API
          const formattedNewChapters = newChapters.map(chapter => 
            formatChapterForApi(chapter, isManga)
          );
          
          // Use mutation to create new chapters
          await createChaptersMutation.mutateAsync({
            bookId,
            chaptersData: { chapters: formattedNewChapters }
          });
        } catch (error) {
          console.error("Error creating new chapters:", error);
          throw error;
        }
      }
      
      return true;
    } catch (error) {
      console.error("Error processing chapters:", error);
      setChapterUploadFailed(true);
      throw error;
    }
  };

  /**
   * Handler for creating chapters for a new book
   */
  const handleNewBookChapters = async (bookId: number): Promise<boolean> => {
    if (chapters.length === 0) return true;
    
    try {
      const isManga = bookData.bookType === BOOK_TYPES.MANGA;
      
      // 1. For manga books, process images first
      if (isManga) {
        setIsSubmitting(true);
        
        // Process chapters sequentially to upload images
        for (const chapter of chapters) {
          if (chapter.images && chapter.images.length > 0) {
            const imageUrls = await processChapterImages(chapter);
            
            // Update the chapter with the collected image URLs
            chapter.content = JSON.stringify(imageUrls);
          }
        }
      }
      
      // 2. Format chapters data for API
      const formattedChapters = chapters.map(chapter => 
        formatChapterForApi(chapter, isManga)
      );
      
      // 3. Use mutation to create chapters
      await createChaptersMutation.mutateAsync({
        bookId,
        chaptersData: { chapters: formattedChapters }
      });
      
      return true;
    } catch (error) {
      console.error("Error creating chapters:", error);
      setChapterUploadFailed(true);
      throw error;
    }
  };

  // Navigation handlers after successful submission
  const handleViewBook = () => {
    if (successBookId) 
      router.push(`/books/${successBookId}`);
    
  };
  
  const handleGoToHome = () => {
    router.push('/');
  };
  
  /**
   * Validates an image file for size and type
   */
  const validateImageFile = (file: File, maxSizeInMB: number = 1): { valid: boolean; error?: string } => {
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
    
    // Check file size
    if (file.size > maxSizeInBytes) {
      return { 
        valid: false, 
        error: `Image size should be less than ${maxSizeInMB}MB` 
      };
    }
    
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return { 
        valid: false, 
        error: 'Unsupported file type. Please use JPEG, PNG or WebP.' 
      };
    }
    
    return { valid: true };
  };

  /**
   * Processes a blob URL and returns a base64 string
   */
  const blobUrlToBase64 = async (blobUrl: string): Promise<string> => {
    try {
      const response = await fetch(blobUrl);
      const blob = await response.blob();
      
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error("Error converting blob URL to base64:", error);
      return blobUrl; // Return original URL on error
    }
  };

  // Update image upload handler to use the validation helper
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    
    // Validate the image file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setErrors(prev => ({
        ...prev,
        coverImage: validation.error || ''
      }));
      return;
    }
    
    // Clear any previous error
    if (errors.coverImage) {
      setErrors(prev => {
        const { coverImage, ...rest } = prev;
        return rest;
      });
    }
    
    // Update bookData state with new cover image
    handleFieldChange('coverImage', file);
    
    // Set the preview URL
    const previewUrl = URL.createObjectURL(file);
    handleFieldChange('coverImagePreview', previewUrl);
  };

  const handleBack = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedChangesDialog(true);
    } else {
      router.back();
    }
  };
  
  // Generic form field change handler with moderation status update
  const handleFieldChange = <T extends keyof BookData>(
    field: T,
    value: BookData[T],
    clearErrorField?: string
  ) => {
    // Update the field in bookData
    setBookData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear any related error
    if (clearErrorField && errors[clearErrorField]) {
      setErrors(prev => {
        const { [clearErrorField]: _, ...rest } = prev;
        return rest;
      });
    }
    
    // Mark form as having unsaved changes
    setHasUnsavedChanges(true);
    
    // If in edit mode, mark as having changes for the update button
    if (isEditing) {
      setHasChanges(true);
    }
    
    // If we have moderation results, mark them as outdated since content changed
    if (moderationResults) {
      setModerationStatus(null);
      toast.info("Content changed. Please run moderation again before submitting.", {
        id: "moderation-outdated",
        duration: 3000
      });
    }
  };

  // Update specific handlers to use the generic handler
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFieldChange('title', e.target.value, 'title');
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    handleFieldChange('description', e.target.value, 'description');
  };

  const handleBookTypeChange = (value: string) => {
    handleFieldChange('bookType', value, 'bookType');
  };

  const handleAgeRatingChange = (rating: number) => {
    // Update the age rating in the form data
    handleFieldChange('ageRating', rating, 'ageRating');
    
    // If we have moderation results, re-evaluate flagging based on new age rating
    if (moderationResults) {
      updateModerationFlagsForAgeRating(rating);
      
      // Show toast notification that moderation flags were updated based on new age rating
      toast.info("Moderation flags updated for new age rating", {
        id: "age-rating-updated",
        duration: 3000
      });
    }
  };

  const handleGenresChange = (newGenres: string[]) => {
    handleFieldChange('selectedGenres', newGenres, 'genres');
  };

  // Update placeholder for AI enhancement functions to use state updates
  const enhanceTitle = () => {
    setIsEnhancingTitle(true);
    // This would be an actual API call to enhance the title
    // Example of what the implementation would do with state:
    // const enhancedTitle = await someAIService.enhanceTitle(bookData.title);
    // setBookData(prev => ({ ...prev, title: enhancedTitle }));
    
    setTimeout(() => {
      setIsEnhancingTitle(false);
    }, 1000);
  };

  const enhanceDescription = () => {
    setIsEnhancingDescription(true);
    // This would be an actual API call to enhance the description
    // Example of what the implementation would do with state:
    // const enhancedDescription = await someAIService.enhanceDescription(bookData.description);
    // setBookData(prev => ({ ...prev, description: enhancedDescription }));
    
    setTimeout(() => {
      setIsEnhancingDescription(false);
    }, 1000);
  };
  
  
  // Handle retrying chapter upload
  const handleRetryChapterUpload = async () => {
    if (!successBookId) return;
    
    setIsSubmitting(true);
    try {
      const success = await handleExistingBookChapters(successBookId);
      
      if (success) {
        // Reset chapter upload failed state
        setChapterUploadFailed(false);
      }
    } catch (error) {
      console.error("Error retrying chapter upload:", error);
      toast.error(`Failed to save chapters: ${(error as Error).message}. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Prepares chapter content for moderation
   */
  const prepareChapterContentForModeration = async (chapter: LocalChapter): Promise<{
    chapter: number;
    title: string;
    content: string | string[];
  }> => {
    let chapterContent: string | string[] = '';
    
    // For novel books with text content
    if (bookData.bookType === BOOK_TYPES.NOVEL && chapter.content) {
      try {
        // Extract just the text content using the utility function
        chapterContent = extractChapterContent(chapter.content);
      } catch (error) {
        console.error("Error extracting chapter content:", error);
        // Fallback to raw content if extraction fails
        chapterContent = chapter.content;
      }
    } 
    // For manga books with images
    else if (bookData.bookType === BOOK_TYPES.MANGA && chapter.images && chapter.images.length > 0) {
      // Process all images in the chapter
      const processedImages: string[] = [];
      
      // Process each image sequentially
      for (const image of chapter.images) {
        let imageUrl = '';
        
        if (typeof image === 'string') {
          // Direct string URL or base64
          imageUrl = image;
        } else if (typeof image === 'object' && 'url' in image) {
          // Get URL from image object
          imageUrl = image.url;
        }
        
        if (imageUrl) {
          // If it's a blob URL, convert to base64
          if (imageUrl.startsWith('blob:')) {
            const base64Data = await blobUrlToBase64(imageUrl);
            processedImages.push(base64Data);
          } else {
            // Already a URL or base64
            const base64Data = await blobUrlToBase64(imageUrl);
            processedImages.push(base64Data);
          }
        }
      }
      
      chapterContent = processedImages;
    }
    
    return {
      chapter: chapter.chapter,
      title: chapter.title || `Chapter ${chapter.chapter}`,
      content: chapterContent
    };
  };

  /**
   * Prepares cover image for moderation
   */
  const prepareCoverImageForModeration = async (): Promise<string> => {
    let coverImageData = '';
    
    if (bookData.coverImage) {
      // If we have a direct file reference, convert it to base64
      try {
        const reader = new FileReader();
        await new Promise<void>((resolve, reject) => {
          reader.onload = () => {
            coverImageData = reader.result as string;
            resolve();
          };
          reader.onerror = reject;
          // Only read if coverImage is not null
          if (bookData.coverImage) {
            reader.readAsDataURL(bookData.coverImage);
          } else {
            resolve(); // Resolve anyway if null
          }
        });
      } catch (error) {
        console.error("Error converting cover image to base64:", error);
      }
    } else if (bookData.coverImagePreview) {
      // If it's a blob URL, convert to base64
      if (bookData.coverImagePreview.startsWith('blob:')) {
        coverImageData = await blobUrlToBase64(bookData.coverImagePreview);
      } else {
        // Use the preview URL directly (could be URL or base64)
        coverImageData = bookData.coverImagePreview;
      }
    } else if (initialData?.cover) {
      // Use the saved cover image URL
      coverImageData = initialData.cover;
    }
    
    return coverImageData;
  };

  // Add function to update moderation flags based on age rating
  const updateModerationFlagsForAgeRating = (rating: number) => {
    if (!moderationResults || !moderationResults.contentResults) return;
    
    // Map AgeRatingEnum to API's AgeRating type
    const apiAgeRating = ageRatingMap[rating];
    
    // Create a deep copy of the moderation results to modify
    const updatedResults = JSON.parse(JSON.stringify(moderationResults));
    let hasAnyFlagged = false;
    
    // Check title
    if (updatedResults.contentResults.title?.category_scores) {
      const titleFlagged = isContentFlagged(
        updatedResults.contentResults.title.category_scores,
        apiAgeRating
      );
      updatedResults.contentResults.title.flagged = titleFlagged;
      if (titleFlagged) hasAnyFlagged = true;
    }
    
    // Check description
    if (updatedResults.contentResults.description?.category_scores) {
      const descriptionFlagged = isContentFlagged(
        updatedResults.contentResults.description.category_scores,
        apiAgeRating
      );
      updatedResults.contentResults.description.flagged = descriptionFlagged;
      if (descriptionFlagged) hasAnyFlagged = true;
    }
    
    // Check cover image
    if (updatedResults.contentResults.coverImage?.category_scores) {
      const coverFlagged = isContentFlagged(
        updatedResults.contentResults.coverImage.category_scores,
        apiAgeRating
      );
      updatedResults.contentResults.coverImage.flagged = coverFlagged;
      if (coverFlagged) hasAnyFlagged = true;
    }
    
    // Check chapters
    if (updatedResults.contentResults.chapters && Array.isArray(updatedResults.contentResults.chapters)) {
      updatedResults.contentResults.chapters.forEach((chapter: any) => {
        if (chapter.result?.category_scores) {
          const chapterFlagged = isContentFlagged(
            chapter.result.category_scores,
            apiAgeRating
          );
          chapter.result.flagged = chapterFlagged;
          if (chapterFlagged) hasAnyFlagged = true;
        }
      });
    }
    
    // Update global flagged status
    updatedResults.flagged = hasAnyFlagged;

    console.log("Updated results:", updatedResults);
    
    // Update moderation status
    setModerationStatus(hasAnyFlagged ? 'flagged' : 'passed');
    
    // Update moderation results with new flags
    setModerationResults(updatedResults);
  };

  /**
   * Streamlined moderation handler
   */
  const handleModerateContent = async () => {
    setModerationResults(null);
    setModerationStatus('pending');
    
    try {
      // Get content to moderate from state
      const { title, description, ageRating } = bookData;
      
      // Map AgeRatingEnum to API's AgeRating type
      const apiAgeRating = ageRatingMap[ageRating];
      
      // 1. Process chapters for moderation
      const formattedChapters = await Promise.all(
        chapters.map(prepareChapterContentForModeration)
      );
      
      // 2. Process cover image for moderation
      const coverImageData = await prepareCoverImageForModeration();
      
      // 3. Send content for moderation
      const result = await moderateContent({
        title,
        description,
        coverImage: coverImageData,
        chapters: formattedChapters,
        model: selectedModel,
        ageRating: apiAgeRating
      });
      
      // 4. Handle moderation results
      if (result) {
        console.log("Moderation results:", result);
        
        // Add flagged status to each content item based on age rating
        const processedResults = addFlagsToModerationResults(result, apiAgeRating);
        
        setModerationResults(processedResults);
        
        // Determine if any content is flagged
        const hasIssues = processedResults.flagged;

        console.log("Has issues:", hasIssues);
        
        setModerationStatus(hasIssues ? 'flagged' : 'passed');
        
        // Show moderation dialog
        setModerationDialogOpen(true);
      } else {
        setModerationStatus(null);
      }
    } catch (error) {
      console.error("Error moderating content:", error);
      setModerationStatus(null);
      toast.error("Failed to run content moderation. Please try again.");
    }
  };

  // Helper function to add flags to moderation results
  const addFlagsToModerationResults = (results: any, ageRating: AgeRating) => {
    if (!results || !results.contentResults) return results;
    
    // Create a deep copy of the results to modify
    const processedResults = JSON.parse(JSON.stringify(results));
    let hasAnyFlagged = false;
    
    // Check title
    if (processedResults.contentResults.title?.category_scores) {
      const titleFlagged = isContentFlagged(
        processedResults.contentResults.title.category_scores,
        ageRating
      );
      processedResults.contentResults.title.flagged = titleFlagged;
      if (titleFlagged) hasAnyFlagged = true;
    }
    
    // Check description
    if (processedResults.contentResults.description?.category_scores) {
      const descriptionFlagged = isContentFlagged(
        processedResults.contentResults.description.category_scores,
        ageRating
      );
      processedResults.contentResults.description.flagged = descriptionFlagged;
      if (descriptionFlagged) hasAnyFlagged = true;
    }
    
    // Check cover image
    if (processedResults.contentResults.coverImage?.category_scores) {
      const coverFlagged = isContentFlagged(
        processedResults.contentResults.coverImage.category_scores,
        ageRating
      );
      processedResults.contentResults.coverImage.flagged = coverFlagged;
      if (coverFlagged) hasAnyFlagged = true;
    }
    
    // Check chapters
    if (processedResults.contentResults.chapters && Array.isArray(processedResults.contentResults.chapters)) {
      processedResults.contentResults.chapters.forEach((chapter: any) => {
        if (chapter.result?.category_scores) {
          const chapterFlagged = isContentFlagged(
            chapter.result.category_scores,
            ageRating
          );
          chapter.result.flagged = chapterFlagged;
          if (chapterFlagged) hasAnyFlagged = true;
        }
      });
    }
    
    // Update global flagged status
    processedResults.flagged = hasAnyFlagged;
    
    return processedResults;
  };

  // Function to be passed to ChapterCreator for handling deletion
  const onDeleteChapter = async (chapterId: string, chapterNumber: number) => {
    try {
      // Get all chapters for reordering
      const updatedChapters = [...chapters];
      
      // Case 1: New chapters (not yet saved to server)
      if (chapterId.startsWith('chapter-')) {
        // Remove the chapter from local state
        const filteredChapters = updatedChapters.filter(ch => ch.id !== chapterId);
        
        // Update chapter numbers for all chapters (both created and non-created)
        // with a higher chapter number than the deleted chapter
        const reorderedChapters = filteredChapters.map(ch => {
          if (ch.chapter > chapterNumber) {
            return { ...ch, chapter: ch.chapter - 1 };
          }
          return ch;
        });
        
        setChapters(reorderedChapters);
      } 
      // Case 2: Existing chapters (saved to server)
      else if (isEditing) {
        // Add chapter to the deletion queue
        const chapterIdNumber = parseInt(chapterId);
        setChaptersToDelete(prev => [...prev, chapterIdNumber]);
        
        // Remove the deleted chapter from local state
        const filteredChapters = updatedChapters.filter(ch => ch.id !== chapterId);
        
        // Update chapter numbers for all chapters with a higher chapter number
        // than the deleted chapter - both server chapters and local chapters
        const reorderedChapters = filteredChapters.map(ch => {
          if (ch.chapter > chapterNumber) {
            return { ...ch, chapter: ch.chapter - 1 };
          }
          return ch;
        });
        
        setChapters(reorderedChapters);
        // Signal that we have unsaved changes
        setHasUnsavedChanges(true);
        setHasChanges(true);
      }
    } catch (error) {
      console.error("Error handling chapter deletion:", error);
      toast.error("Failed to prepare chapter deletion. Please try again.");
    }
  };

  // Update chapters handler to use common form change tracking and moderation reset
  const handleUpdateChapters = (updatedChapters: LocalChapter[]) => {
    setChapters(updatedChapters);
    setHasUnsavedChanges(true);
    if (isEditing) {
      setHasChanges(true);
    }
    
    // If we have moderation results, mark them as outdated since chapters changed
    if (moderationResults) {
      setModerationStatus(null);
      toast.info("Chapters updated. Please run moderation again before submitting.", {
        id: "moderation-outdated",
        duration: 3000
      });
    }
  };

  // Add this function to check for book moderation status when loading initial data
  useEffect(() => {
    // Check if we're in edit mode and have initial data
    if (isEditing && initialData) {
      // Check if the book has been moderated
      if (initialData.moderated) {
        // If the book is already moderated, we need to check if all chapters have moderation data too
        if (chapters && chapters.length > 0) {
          const allChaptersModerated = chapters.every(
            (chapter: LocalChapter) => chapter.moderated
          );
          
          if (allChaptersModerated) {
            // Mark book as already moderated - we'll keep this status until content changes
            setModerationStatus('passed');
            
            // Create a simplified version of moderation results to allow UI to show moderation status
            setModerationResults({
              flagged: false,
              timestamp: new Date().toISOString(),
              contentResults: {
                title: { flagged: false },
                description: { flagged: false },
                coverImage: { flagged: false },
                chapters: chapters.map((_) => ({
                  result: { flagged: false }
                }))
              }
            });
            
            // Infer the model that was used for moderation (default to OMNI if unknown)
            if (typeof initialData.moderated === 'string' && 
                Object.values(MODERATION_MODELS).includes(initialData.moderated as ModerationModelType)) {
              setSelectedModel(initialData.moderated as ModerationModelType);
            }
          }
        }
      }
    }
  }, [isEditing, initialData, chapters]);

  return (
    <div className="w-full">
      {/* Back button in its own container */}
      <div className="mb-1">
        <Button type="button" variant="ghost" className="p-0" onClick={handleBack}>
          <ChevronLeft className="h-5 w-5" />
          Back
        </Button>
      </div>

      {/* Title and actions in a separate container below - sticky on scroll */}
      <div className={`flex flex-col md:flex-row justify-between items-start md:items-center pb-4 mb-6 sticky top-0 z-10 transition-all duration-200 px-4 ${
        hasScrolled ? 'bg-white shadow-md px-4 py-3 -mx-4 rounded-b-lg' : ''
      }`}>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold mb-4 md:mb-0">
            {isEditing ? 'Edit Book' : 'Submit Book'}
          </h1>
          
          {/* Moderation Status Badge */}
          {moderationStatus && (
            <div 
              className={`px-2 py-1 text-xs rounded-full font-medium cursor-pointer ${
                moderationStatus === 'pending' ? 'bg-blue-100 text-blue-700' : 
                moderationStatus === 'passed' ? 'bg-green-100 text-green-700' : 
                'bg-amber-100 text-amber-700'
              }`}
              onClick={() => setModerationDialogOpen(true)}
            >
              <div className="flex items-center gap-1">
                {moderationStatus === 'pending' ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : moderationStatus === 'passed' ? (
                  <CheckCircle2 className="h-3 w-3" />
                ) : (
                  <AlertCircle className="h-3 w-3" />
                )}
                <span>
                  {moderationStatus === 'pending' ? 'Moderating...' : 
                   moderationStatus === 'passed' ? 'Passed Moderation' : 
                   'Review Required'}
                </span>
              </div>
            </div>
          )}
          {moderationStatus === null && moderationResults && (
            <div 
              className="px-2 py-1 text-xs rounded-full font-medium cursor-pointer bg-gray-100 text-gray-700"
              onClick={() => setModerationDialogOpen(true)}
            >
              <div className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                <span>Moderation Outdated</span>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex space-x-2">
          {successBookId ? (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={handleGoToHome}
                className="gap-2"
              >
                <Home size={16} />
                Home
              </Button>
              <Button
                type="button"
                onClick={handleViewBook}
                className="gap-2"
              >
                <Eye size={16} />
                View Book
              </Button>
            </>
          ) : (
            <>
              {/* Moderation Button Group */}
              <ModerateButton
                selectedModel={selectedModel}
                onModelSelect={setSelectedModel}
                onModerate={handleModerateContent}
                isLoading={isModeratingContent}
              />
              
              {!isEditing && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSaveAsDraft}
                  disabled={isSavingDraft || isSubmitting}
                  className="gap-2"
                >
                  {isSavingDraft ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      Save as Draft
                    </>
                  )}
                </Button>
              )}
              <Button
                type="submit"
                form="book-form"
                disabled={isSubmitting || isSavingDraft || (isEditing && !hasChanges) || !canEditBasicInfo}
                className="gap-2"
                onClick={(e) => {
                  if (isEditing) {
                    e.preventDefault(); // Prevent form submission
                    handleSaveAsDraft();
                  }
                }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    {isEditing ? 'Saving...' : 'Publishing...'}
                  </>
                ) : (
                  <>
                    <BookOpen size={16} />
                    {isEditing ? 'Save Changes' : 'Publish Book'}
                  </>
                )}
              </Button>

              {/* Publish button for draft books */}
              {isEditing && initialData && initialData.accessStatus && initialData.accessStatus.id === AccessStatusEnum.PRIVATE && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="submit"
                        form="book-form"
                        disabled={isSubmitting || isSavingDraft || !canEditBasicInfo || (isEditing && !hasChanges)}
                        className="gap-2 bg-green-600 hover:bg-green-700"
                      >
                        <Shield size={16} />
                        Publish
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Submit this draft for review and publishing</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </>
          )}
        </div>
      </div>
      
      {/* Moderation Results Dialog */}
      <ModerationResults
        open={moderationDialogOpen}
        onOpenChange={setModerationDialogOpen}
        results={moderationResults}
        selectedModel={selectedModel}
        onModelChange={setSelectedModel}
        onRecheck={handleModerateContent}
        isLoading={isModeratingContent}
        bookAgeRating={ageRatingMap[bookData.ageRating]}
      />
      
      {errors.form && (
        <div className="mb-6 p-4 bg-destructive/10 border border-destructive rounded-md">
          <p className="flex items-center text-destructive">
            <Trash2 size={16} className="mr-2" />
            <span>{errors.form}</span>
          </p>
        </div>
      )}

      {!canEditBasicInfo && reasonIfDenied && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <p className="flex items-center text-blue-600">
            <AlertCircle size={16} className="mr-2 flex-shrink-0" />
            <span>{reasonIfDenied}</span>
          </p>
        </div>
      )}

      {chapterUploadFailed && successBookId && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-md">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <p className="flex items-center text-amber-700">
              <Trash2 size={16} className="mr-2 flex-shrink-0" />
              <span>Some chapters couldn't be uploaded. You can retry uploading them.</span>
            </p>
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={handleRetryChapterUpload}
              disabled={isSubmitting}
              className="whitespace-nowrap"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={14} className="mr-2 animate-spin" />
                  Retrying...
                </>
              ) : (
                'Retry Upload'
              )}
            </Button>
          </div>
        </div>
      )}
      
      <form id="book-form" onSubmit={handleSubmit} className="space-y-6 mb-3" noValidate>
        {/* Main container box with both sections */}
        <div className="bg-white border border-secondary/90 rounded-lg shadow-sm overflow-hidden pb-6">
          <div className="flex flex-col md:flex-row">
            {/* Left column - Book Info Component */}
            <BookInfo
              isCollapsed={isBookInfoCollapsed}
              setIsCollapsed={setIsBookInfoCollapsed}
              errors={errors}
              coverImage={bookData.coverImage}
              coverImagePreview={bookData.coverImagePreview}
              handleImageUpload={handleImageUpload}
              bookType={bookData.bookType}
              handleBookTypeChange={handleBookTypeChange}
              selectedGenres={bookData.selectedGenres}
              setSelectedGenres={handleGenresChange}
              ageRating={bookData.ageRating}
              setAgeRating={handleAgeRatingChange}
              genres={genresQuery.data || []}
              isEnhancingTitle={isEnhancingTitle}
              enhanceTitle={enhanceTitle}
              isEnhancingDescription={isEnhancingDescription}
              enhanceDescription={enhanceDescription}
              isEditing={isEditing}
              canEdit={canEditBasicInfo}
              reasonIfDenied={reasonIfDenied}
              titleValue={bookData.title}
              descriptionValue={bookData.description}
              onTitleChange={handleTitleChange}
              onDescriptionChange={handleDescriptionChange}
            />
            
            {/* Right column - Chapters using ChapterCreator Component */}
            <div className="w-full md:flex-1 lg:pl-6 border-t md:border-t-0 md:border-l border-secondary/90">
              <ChapterCreator
                bookType={bookData.bookType}
                chapters={chapters}
                setChapters={handleUpdateChapters}
                errors={errors}
                emptyChapters={emptyChapters}
                isLoadingChapters={isLoadingChapters}
                onDeleteChapter={onDeleteChapter}
                canEditExistingChapters={canEditExistingChapters}
                canAddNewChapters={canAddNewChapters}
                reasonIfDenied={reasonIfDenied}
              />
            </div>
          </div>
        </div>
      </form>
      
      {/* Alert dialogs for moderation confirmations */}
      <AlertDialog open={showNoModerationDialog} onOpenChange={setShowNoModerationDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Content Moderation Recommended</AlertDialogTitle>
            <AlertDialogDescription>
              Your content hasn't been moderated yet. Running moderation before submission can improve approval chances. Would you like to run moderation now?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowNoModerationDialog(false);
              if (pendingPublishAction) {
                setPendingPublishAction(true);
                setIsSubmitting(true);
                processBookSubmission(false).finally(() => {
                  setIsSubmitting(false);
                  setPendingPublishAction(false);
                });
              }
            }}>
              No, Submit Without Moderation
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              setShowNoModerationDialog(false);
              handleModerateContent();
            }}>
              Yes, Run Moderation First
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <AlertDialog open={showModerationIssuesDialog} onOpenChange={setShowModerationIssuesDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Moderation Issues Detected</AlertDialogTitle>
            <AlertDialogDescription>
              Your content has moderation issues that may cause it to be rejected. Would you like to review these issues before submitting?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowModerationIssuesDialog(false);
              if (pendingPublishAction) {
                setPendingPublishAction(true);
                setIsSubmitting(true);
                processBookSubmission(false).finally(() => {
                  setIsSubmitting(false);
                  setPendingPublishAction(false);
                });
              }
            }}>
              No, Submit Anyway
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              setShowModerationIssuesDialog(false);
              setModerationDialogOpen(true);
            }}>
              Yes, Review Issues
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showUnsavedChangesDialog} onOpenChange={setShowUnsavedChangesDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Are you sure you want to leave this page?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Stay on Page</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                setShowUnsavedChangesDialog(false);
                router.back();
              }}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Leave Page
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}