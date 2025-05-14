"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Save, Trash2, BookOpen, Loader2, Eye, Home, AlertCircle, Shield, CheckCircle2, Info, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import * as yup from "yup";
import { createBook, updateBook, getGenres, getChaptersByBookId, createChapters, updateChapter, addChapter, deleteChapter, updateBookStatus } from "@/lib/api/books";
import { uploadFile } from "@/lib/api/base";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BOOK_TYPES, AgeRatingEnum, ProgressStatusEnum, AccessStatusEnum, Chapter, ChaptersBatchPayload, ChapterCreateItem, ChapterAccessStatus } from "@/models";
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

// Create extended LocalChapter type that includes chapterAccessStatus
type ExtendedLocalChapter = LocalChapter & {
  chapterAccessStatus?: string;
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
  const [chapters, setChapters] = useState<ExtendedLocalChapter[]>([]);
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
  
  // Get edit permissions
  const { canEditBasicInfo, canEditExistingChapters, canAddNewChapters, canDelete, reasonIfDenied } = useBookEditPermissions(initialData);
  
  // Use our custom hook to warn users when navigating away with unsaved changes
  useNavigationGuard({ when: hasUnsavedChanges });
  
  const [showUnsavedChangesDialog, setShowUnsavedChangesDialog] = useState(false);
  
  // Add state for book type change warning
  const [showBookTypeChangeWarning, setShowBookTypeChangeWarning] = useState(false);
  const [pendingBookType, setPendingBookType] = useState<string | null>(null);
  
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
    enabled: isEditing
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

  // Add state to track draft chapters
  const [hasDraftChapters, setHasDraftChapters] = useState(false);

  // Process chapters data when it's available
  useEffect(() => {
    if (chaptersQuery.data) {
      // Convert API chapters to LocalChapter format
      const formattedChapters: ExtendedLocalChapter[] = chaptersQuery.data.map((chapter: Chapter) => {
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
          images,
          // Add chapterAccessStatus to track chapter status
          chapterAccessStatus: chapter.chapterAccessStatus || 'published'
        };
      });
      
      setChapters(formattedChapters);
      
      // Check if there are any draft chapters
      const draftChapters = formattedChapters.filter(ch => 
        ch.chapterAccessStatus === ChapterAccessStatus.DRAFT
      );
      setHasDraftChapters(draftChapters.length > 0);
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
      } else
      
      
      
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
       if( initialData?.cover) {
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
        
        // Validate that the book has at least one chapter when publishing
        if (chapters.length === 0) {
          setErrors(prev => ({
            ...prev,
            chapters: "You must create at least one chapter before publishing your book."
          }));
          return null;
        }

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
   * Formats chapter data for API submission
   */
  const formatChapterForApi = async (chapter: ExtendedLocalChapter, isManga: boolean, accessStatus: string = 'pending_review'): Promise<ChapterCreateItem> => {
    // Handle different content formats based on book type
    let content = chapter.content;
    
    // For manga books, if we have images
    if (isManga && chapter.images && chapter.images.length > 0) {
      // Process and upload any images that haven't been uploaded yet
      const processedImages = [];
      
      for (const image of chapter.images) {
        if (typeof image === 'string') {
          // If the image is already a URL or base64 string
          if (image.startsWith('blob:')) {
            // Convert blob URL to base64 first
            const base64Data = await blobUrlToBase64(image);
            
            // Upload the base64 image
            try {
              // Convert base64 to a File object for upload
              const response = await fetch(base64Data);
              const blob = await response.blob();
              const file = new File([blob], "image.jpg", { type: 'image/jpeg' });
              
              const uploadResponse = await uploadFile<string>('/upload/image', file);
              if (uploadResponse.status === 200 || uploadResponse.status === 201) {
                processedImages.push(uploadResponse.data);
              } else {
                throw new Error(uploadResponse.msg || 'Failed to upload image');
              }
            } catch (error) {
              console.error("Error uploading image:", error);
              // Still include the original image as fallback
              processedImages.push(base64Data);
            }
          } else {
            // Already a URL or base64 that's been saved
            processedImages.push(image);
          }
        } else if (typeof image === 'object' && 'url' in image) {
          // Handle image object format
          if (image.url.startsWith('blob:')) {
            // Convert blob URL to base64 first
            const base64Data = await blobUrlToBase64(image.url);
            
            // Upload the base64 image
            try {
              // Convert base64 to a File object for upload
              const response = await fetch(base64Data);
              const blob = await response.blob();
              const file = new File([blob], "image.jpg", { type: 'image/jpeg' });
              
              const uploadResponse = await uploadFile<string>('/upload/image', file);
              if (uploadResponse.status === 200 || uploadResponse.status === 201) {
                processedImages.push(uploadResponse.data);
              } else {
                throw new Error(uploadResponse.msg || 'Failed to upload image');
              }
            } catch (error) {
              console.error("Error uploading image:", error);
              // Still include the original image as fallback
              processedImages.push(base64Data);
            }
          } else {
            // Already a URL that's been saved
            processedImages.push(image.url);
          }
        }
      }
      
      // Set content to the JSON string of processed image URLs
      content = JSON.stringify(processedImages);
    }
    
    return {
      title: chapter.title || `Chapter ${chapter.chapter}`,  // Ensure title is never undefined
      chapter: chapter.chapter,
      content: content || '',  // Ensure content is never undefined
      chapterAccessStatus: accessStatus  // Set the chapter access status
    };
  };

  /**
   * Standardized function to handle the book submission process
   * This consolidates all the submission logic in one place
   */
  const processBookSubmission = async (isDraft: boolean = false, isPublishing: boolean = false): Promise<boolean> => {
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
      
      // Prepare book API data
      const bookApiData = {
        title,
        description,
        ageRating,
        cover: coverUrl,
        bookTypeId: bookData.bookType === BOOK_TYPES.NOVEL ? 1 : 2,
        progressStatusId: ProgressStatusEnum.ONGOING,
        accessStatusId: isDraft ? AccessStatusEnum.PRIVATE : (isPublishing ? AccessStatusEnum.PENDING : initialData?.accessStatus?.id),
        categoryIds: bookData.selectedGenres.map((id: string) => parseInt(id)),
        isDraft,
      };
      
      let updatedBookId: number;
      
      // Create or update the book
      if (isEditing) {
        // For published books that are being submitted for review, use updateBookStatus instead
        if (isPublishing && initialData?.accessStatus?.id === AccessStatusEnum.PUBLISHED) {
          // Only update the status, not the other book details
          const updateStatusResponse = await updateBookStatus(initialData.id, {
            accessStatusId: AccessStatusEnum.PENDING,
          });
          
          if (updateStatusResponse.status !== 200 && updateStatusResponse.status !== 201) {
            throw new Error(updateStatusResponse.msg || 'Failed to update book status');
          }
          
          updatedBookId = initialData.id;
        } else {
          // Regular update for other cases
          const updateResponse = await updateBook(initialData.id, bookApiData);
          if (updateResponse.status !== 200 && updateResponse.status !== 201) {
            throw new Error(updateResponse.msg || 'Failed to update book');
          }
          
          updatedBookId = initialData.id;
        }
        
        // Handle chapter updates
        if (chapters.length > 0 || chaptersToDelete.length > 0) {
          try {
            // Pass isDraft flag to determine chapter access status
            await handleExistingBookChapters(updatedBookId, isDraft, isPublishing);
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
            // Pass isDraft flag to determine chapter access status
            await handleNewBookChapters(updatedBookId, isDraft, isPublishing);
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
      } else if (isPublishing) {
        toast.success("Book submitted for review");
      } else if (isEditing) {
        toast.success("Book updated successfully");
      } else {
        toast.success("Book submitted for review");
      }
      
      return true;
    } catch (error) {
      console.error("Error submitting book:", error);
      toast.error("Failed to submit book. Please try again.");
      return false;
    }
  };

  // Update form submission handler to remove moderation checks
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // First validate the form
    const validatedData = await validateForm(false);
    if (!validatedData) return;
    
    // Set UI state for submission
    setIsSubmitting(true);
    
    // Use standardized submission flow with isPublishing=true
    await processBookSubmission(false, true);
    
    // Reset UI state
    setIsSubmitting(false);
  };
  
  // Update save as draft handler
  const handleSaveAsDraft = async () => {
    // First validate the draft (only title is required)
    const validatedData = await validateForm(true);
    if (!validatedData) return;

    setIsSavingDraft(true);
    await processBookSubmission(true, false);
    setIsSavingDraft(false);
  };

  // Add a new handler for saving changes to a published book
  const handleSaveChanges = async () => {
    // We need at least basic validation
    const validatedData = await validateForm(false);
    if (!validatedData) return;

    setIsSavingDraft(true);
    // Save changes without changing to draft status or pending review
    await processBookSubmission(false, false);
    setIsSavingDraft(false);
  };

  // Add a handler for publishing changes to a published book
  const handlePublishChanges = async () => {
    const validatedData = await validateForm(false);
    if (!validatedData) return;

    setIsSubmitting(true);
    // Process with isPublishing=true to set new chapters to pending_review
    await processBookSubmission(false, true);
    setIsSubmitting(false);
  };

  /**
   * Processes image data for a single chapter
   */
  const processChapterImages = async (chapter: ExtendedLocalChapter): Promise<string[]> => {
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
   * Handler for updating chapters of an existing book
   */
  const handleExistingBookChapters = async (bookId: number, isDraft: boolean = false, isPublishing: boolean = false): Promise<boolean> => {
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
      
      // 4. Process existing chapters by updating them individually
      for (const chapter of existingChapters) {
        try {
          // Check if the chapter has been modified
          const originalChapter = chaptersQuery.data?.find(ch => ch.id.toString() === chapter.id);
          
          if (!originalChapter) {
            console.warn(`Original chapter with ID ${chapter.id} not found, skipping update`);
            continue;
          }

          // For published books, ignore any chapters that are not draft
          if (initialData?.accessStatus?.id === AccessStatusEnum.PUBLISHED && 
              !canEditExistingChapters && 
              originalChapter.chapterAccessStatus !== ChapterAccessStatus.DRAFT) {
            continue;
          }
          
          // Compare current chapter data with original
          const contentChanged = chapter.content !== (typeof originalChapter.content === 'string' 
            ? originalChapter.content 
            : JSON.stringify(originalChapter.content));
            
          const titleChanged = chapter.title !== originalChapter.title;
          const isLockedChanged = chapter.isLocked !== originalChapter.isLocked;
          const chapterNumberChanged = chapter.chapter !== originalChapter.chapter;
          
          // Update if something changed
          if (contentChanged || titleChanged || isLockedChanged || chapterNumberChanged) {
            // Process manga images for this chapter if needed
            let chapterContent = chapter.content;
            if (isManga && chapter.images && chapter.images.length > 0) {
              // Format chapter data with manga images processed
              const formattedChapter = await formatChapterForApi(
                chapter, 
                isManga,
                isDraft ? ChapterAccessStatus.DRAFT : 
                  (isPublishing && chapter.chapterAccessStatus === ChapterAccessStatus.DRAFT ? 
                    ChapterAccessStatus.PENDING_REVIEW : chapter.chapterAccessStatus as ChapterAccessStatus)
              );
              chapterContent = formattedChapter.content;
            }
            
            const chapterData = {
              title: chapter.title,
              content: chapterContent,
              isLocked: chapter.isLocked,
              chapter: chapter.chapter,
              chapterAccessStatus: isDraft ? ChapterAccessStatus.DRAFT : 
                (isPublishing && chapter.chapterAccessStatus === ChapterAccessStatus.DRAFT ? 
                  ChapterAccessStatus.PENDING_REVIEW : chapter.chapterAccessStatus as ChapterAccessStatus)
            };
            
            // Use mutation to update the chapter
            await updateChapterMutation.mutateAsync({ 
              chapterId: parseInt(chapter.id), 
              chapterData 
            });
          }
          // Or publish if nothing changed and publishing
          else if (isPublishing) {
            const chapterData = {
              title: chapter.title,
              content: chapter.content,
              isLocked: chapter.isLocked,
              chapter: chapter.chapter,
              chapterAccessStatus: ChapterAccessStatus.PENDING_REVIEW
            };
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
          // Determine access status for new chapters
          const accessStatus = isDraft ? ChapterAccessStatus.DRAFT : 
            (isPublishing ? ChapterAccessStatus.PENDING_REVIEW : ChapterAccessStatus.DRAFT);
          
          // Format new chapters for API with await for each async formatChapterForApi call
          const formattedChaptersPromises = newChapters.map(chapter => 
            formatChapterForApi(chapter, isManga, accessStatus)
          );
          
          // Wait for all chapter formatting to complete
          const formattedNewChapters = await Promise.all(formattedChaptersPromises);
          
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
  const handleNewBookChapters = async (bookId: number, isDraft: boolean = false, isPublishing: boolean = false): Promise<boolean> => {
    if (chapters.length === 0) return true;
    
    try {
      const isManga = bookData.bookType === BOOK_TYPES.MANGA;
      
      // Determine access status for new chapters
      const accessStatus = isDraft ? 'draft' : (isPublishing ? 'pending_review' : 'draft');
      
      // Format chapters data for API with await for each async formatChapterForApi call
      const formattedChaptersPromises = chapters.map(chapter => 
        formatChapterForApi(chapter, isManga, accessStatus)
      );
      
      // Wait for all chapter formatting to complete
      const formattedChapters = await Promise.all(formattedChaptersPromises);
      
      // Use mutation to create chapters
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
  };

  // Update specific handlers to use the generic handler
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFieldChange('title', e.target.value, 'title');
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    handleFieldChange('description', e.target.value, 'description');
  };

  // Update handleBookTypeChange to show warning if needed
  const handleBookTypeChange = (value: string) => {
    // If book is not editable, don't allow changes
    if (isEditing && !canEditBasicInfo) return;

    // If there are existing chapters and book type is changing
    if (chapters.length > 0 && value !== bookData.bookType) {
      setPendingBookType(value);
      setShowBookTypeChangeWarning(true);
    } else {
      // No chapters or same type, proceed with change
      handleFieldChange('bookType', value, 'bookType');
    }
  };

  // Add function to handle book type change confirmation
  const handleBookTypeChangeConfirm = () => {
    if (pendingBookType) {
      handleFieldChange('bookType', pendingBookType, 'bookType');
      // Clear chapters when changing book type
      setChapters([]);
      setEmptyChapters([]);
      setShowBookTypeChangeWarning(false);
      setPendingBookType(null);
    }
  };

  const handleAgeRatingChange = (rating: number) => {
    // Update the age rating in the form data
    handleFieldChange('ageRating', rating, 'ageRating');
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
      const success = await handleExistingBookChapters(successBookId, false, false);
      
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
  const prepareChapterContentForModeration = async (chapter: ExtendedLocalChapter): Promise<{
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

  const handleUpdateChapters = (updatedChapters: ExtendedLocalChapter[]) => {
    setChapters(updatedChapters);
    setHasUnsavedChanges(true);
    if (isEditing) {
      setHasChanges(true);
    }
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

  // Update the canEditChapter function to check for draft status
  const canEditChapter = (chapter: ExtendedLocalChapter): boolean => {
    // If user has general permission to edit existing chapters
    if (canEditExistingChapters) {
      return true;
    }
    
    // For published books, allow editing draft chapters
    if (isEditing && 
        initialData?.accessStatus?.id === AccessStatusEnum.PUBLISHED && 
        chapter.chapterAccessStatus === ChapterAccessStatus.DRAFT) {
      return true;
    }
    
    return false;
  };

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
              { initialData?.accessStatus.id !== AccessStatusEnum.PENDING &&
                <Button
                  type="submit"
                  form="book-form"
                  disabled={isSubmitting || isSavingDraft || (isEditing && !hasChanges)}
                  className="gap-2"
                  onClick={(e) => {
                    if (isEditing) {
                      e.preventDefault(); // Prevent form submission
                      
                      // For published books with canAddNewChapters permission
                      if (initialData?.accessStatus?.id === AccessStatusEnum.PUBLISHED && canAddNewChapters) {
                        handleSaveChanges();
                      } else {
                        handleSaveAsDraft();
                      }
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
                      <Save size={16} />
                      {isEditing ? 'Save Changes' : 'Publish Book'}
                    </>
                  )}
                </Button>
              }

              {/* Publish button for draft books */}
              {isEditing && initialData && initialData.accessStatus && initialData.accessStatus.id === AccessStatusEnum.PRIVATE && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="submit"
                        form="book-form"
                        disabled={isSubmitting || isSavingDraft || !canEditBasicInfo}
                        className="gap-2 bg-green-600 hover:bg-green-700"
                        onClick={(e) => {
                          e.preventDefault();
                          handlePublishChanges();
                        }}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 size={16} className="animate-spin" />
                            Publishing...
                          </>
                        ) : (
                          <>
                            <Shield size={16} />
                            Publish
                          </>
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Submit this draft for review and publishing</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              {/* Publish button for published books */}
              {isEditing && initialData && initialData.accessStatus && initialData.accessStatus.id === AccessStatusEnum.PUBLISHED && canAddNewChapters && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        disabled={isSubmitting || isSavingDraft || !(hasChanges || hasDraftChapters)}
                        className="gap-2 bg-green-600 hover:bg-green-700"
                        onClick={handlePublishChanges}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 size={16} className="animate-spin" />
                            Publishing...
                          </>
                        ) : (
                          <>
                            <Shield size={16} />
                            Publish Chapters
                          </>
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Submit new chapters for review</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </>
          )}
        </div>
      </div>
      
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
                canEditChapter={canEditChapter}
              />
            </div>
          </div>
        </div>
      </form>
      
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

      {/* Book Type Change Warning Dialog */}
      <AlertDialog open={showBookTypeChangeWarning} onOpenChange={setShowBookTypeChangeWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change Book Type</AlertDialogTitle>
            <AlertDialogDescription>
              Changing the book type will remove all existing chapters. This action cannot be undone. Are you sure you want to proceed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowBookTypeChangeWarning(false);
              setPendingBookType(null);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleBookTypeChangeConfirm}>
              Yes, Change Type
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}