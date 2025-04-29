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

export function BookForm({ initialData, isEditing = false, onSuccess }: BookFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(initialData?.cover || null);
  const [selectedGenres, setSelectedGenres] = useState<string[]>(
    initialData?.categories?.map((cat: any) => cat.id.toString()) || []
  );
  const [bookType, setBookType] = useState<string>(
    initialData?.bookType?.name || BOOK_TYPES.NOVEL
  );
  const [ageRating, setAgeRating] = useState<number>(
    initialData?.ageRating || AgeRatingEnum.EVERYONE
  );
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
  
  // Form refs
  const titleInputRef = useRef<HTMLInputElement>(null);
  const descriptionTextareaRef = useRef<HTMLTextAreaElement>(null);
  
  const [showUnsavedChangesDialog, setShowUnsavedChangesDialog] = useState(false);
  
  useEffect(() => {
    // Initialize form with initial data if editing
    if (isEditing && initialData) {
      if (titleInputRef.current) {
        titleInputRef.current.value = initialData.title || '';
      }
      
      if (descriptionTextareaRef.current) {
        descriptionTextareaRef.current.value = initialData.description || '';
      }
      
      // Initialize chapters if available
      if (initialData.chapters && initialData.chapters.length > 0) {
        const mappedChapters = initialData.chapters.map((chapter: any) => {
          // Determine if chapter has images (for manga books)
          let images: Array<string | {url: string; fileName: string}> = [];
          
          if (bookType === BOOK_TYPES.MANGA) {
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
                    images = parsedContent.map((url: string) => typeof url === 'string' ? url : url);
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
            title: chapter.title,
            content: chapter.content || '',
            images: images,
            chapter: chapter.chapterNumber || chapter.chapter,
            isLocked: chapter.isLocked || false,
            price: chapter.price?.toString() || "0",
            createdAt: chapter.createdAt || new Date().toISOString(),
            updatedAt: chapter.updatedAt || new Date().toISOString(),
          };
        });
        
        setChapters(mappedChapters);
      }
    }
  }, [isEditing, initialData, bookType]);
  
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

  // Process chapters data when it's available
  useEffect(() => {
    if (chaptersQuery.data) {
      // Convert API chapters to LocalChapter format
      const formattedChapters: LocalChapter[] = chaptersQuery.data.map((chapter: Chapter) => {
        // Determine if chapter has images (for manga books)
        let images: Array<string | {url: string; fileName: string}> = [];
        
        if (bookType === BOOK_TYPES.MANGA) {
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
          // Set images array for manga books
          images
        };
      });
      
      setChapters(formattedChapters);
    }
  }, [chaptersQuery.data, bookType]);

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
        return (isEditing && initialData?.cover) || coverImage !== null;
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
        title: titleInputRef.current?.value || '',
        description: descriptionTextareaRef.current?.value || '',
        coverImage: coverImage,
        genres: selectedGenres,
        bookType: bookType,
        ageRating: ageRating,
        hasCoverImage: isEditing && initialData?.cover // Flag to indicate existing cover image
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
      
      // Validate chapters - check for empty content only during form submission
      const chaptersWithNoContent = chapters.filter(chapter => 
        (!chapter.content || chapter.content.trim() === '') && 
        (!chapter.images || chapter.images.length === 0) &&
        (!chapter.documentUrl || chapter.documentUrl === 'pending')
      );
      
      // Update the empty chapters state - but only during form validation
      if (chaptersWithNoContent.length > 0) {
        // Set the empty chapters - this will highlight them in the UI
        setEmptyChapters(chaptersWithNoContent.map(ch => ch.id));
        
        if (!isDraft) {
          const chapterWord = chaptersWithNoContent.length === 1 ? 'chapter' : 'chapters';
          setErrors(prev => ({
            ...prev,
            chapters: `${chaptersWithNoContent.length} ${chapterWord} with no content. Please add content or remove them.`
          }));
        }
      } else {
        // Clear empty chapters state since all chapters have content
        setEmptyChapters([]);
        if (errors.chapters) {
          const { chapters, ...rest } = errors;
          setErrors(rest);
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
      
      // If there are empty chapters and it's not a draft, return null
      if (chaptersWithNoContent.length > 0 && !isDraft) {
        return null;
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

  // Handle book submission
  const handleBookSubmission = async (isDraft: boolean) => {
    const validatedData = await validateForm(isDraft);
    if (!validatedData) {
      // For drafts, only show an error if title is missing
      if (isDraft) {
        toast.error("Please provide a title for your draft.");
        return false;
      }
      
      // Check specifically for empty chapters for regular submissions
      if (emptyChapters.length > 0 && !isDraft) {
        // Scroll to the chapters section if there are empty chapters
        document.querySelector('.ChapterCreator, [id^="chapter-content"]')?.scrollIntoView({ behavior: 'smooth' });
        toast.error(`${emptyChapters.length} chapter(s) found with no content. Please add content or remove them.`);
      }
      return false;
    }
    
    try {
      // Get form values
      const title = titleInputRef.current?.value || '';
      const description = descriptionTextareaRef.current?.value || '';
      
      // Handle cover image
      let coverUrl = initialData?.cover || '';
      
      if (coverImage) {
        // For a new book, or if the cover has changed in edit mode
        if (!isEditing) {
          // Upload new cover for new book
          const uploadResponse = await uploadFile<string>('/upload/image', coverImage);
          if (uploadResponse.status !== 200 && uploadResponse.status !== 201) {
            throw new Error(uploadResponse.msg || 'Failed to upload cover image');
          }
          coverUrl = uploadResponse.data;
        } else {
          // For editing with a new cover image, we'll handle upload after book update
          try {
            // Only upload new cover if it has changed
            const uploadCoverResponse = await uploadFile<string>('/upload/image', coverImage);
            if (uploadCoverResponse.status !== 200 && uploadCoverResponse.status !== 201) {
              throw new Error(uploadCoverResponse.msg || 'Failed to upload cover image');
            }
            coverUrl = uploadCoverResponse.data;
          } catch (error) {
            throw new Error('Error uploading cover image. Please try again.');
          }
        }
      } else if (!isEditing && !coverUrl) {
        // For new books without a cover (should be caught by validation, but just in case)
        throw new Error('Cover image is required for new books');
      }
      
      // Prepare book data
      const bookData = {
        title,
        description,
        cover: coverUrl,
        ageRating: ageRating,
        bookTypeId: bookType === BOOK_TYPES.NOVEL ? 1 : 2,
        progressStatusId: ProgressStatusEnum.ONGOING,
        accessStatusId: isDraft ? AccessStatusEnum.PRIVATE : AccessStatusEnum.PENDING,
        categoryIds: selectedGenres.map(id => parseInt(id)),
        isDraft
      };
      
      let updatedBookId: number;
      
      if (isEditing) {
        // Update existing book
        const updateResponse = await updateBook(initialData.id, bookData);
        if (updateResponse.status !== 200 && updateResponse.status !== 201) {
          throw new Error(updateResponse.msg || 'Failed to update book');
        }
        
        updatedBookId = initialData.id;
        
        // Handle chapter updates for existing book
        if (chapters.length > 0 || chaptersToDelete.length > 0) {
          try {
            await handleExistingBookChapters(updatedBookId);
          } catch (error) {
            console.error("Error creating chapters:", error);
            setChapterUploadFailed(true);
            toast.error(`Book updated but there was an issue with saving chapters: ${(error as Error).message}. Please try again.`);
          }
        }
      } else {
        // Create new book
        const createResponse = await createBook(bookData);
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
      
      // Reset form state
      setHasUnsavedChanges(false);
      setSuccessBookId(updatedBookId);
      
      // Call the success callback if provided
      if (onSuccess) {
        onSuccess(updatedBookId);
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

  // Form submission handler
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Check if content has been moderated
    if (!moderationResults) {
      // Show alert dialog to run moderation first
      setShowNoModerationDialog(true);
      return;
    } else if (moderationResults && moderationStatus === 'flagged') {
      // Content has been moderated but has issues
      setShowModerationIssuesDialog(true);
      return;
    }
    
    // Continue with submission
    setPendingPublishAction(true);
    setIsSubmitting(true);
    await handleBookSubmission(false);
    setIsSubmitting(false);
    setPendingPublishAction(false);
  };
  
  // Save as draft handler
  const handleSaveAsDraft = async () => {
    setIsSavingDraft(true);
    const success = await handleBookSubmission(true);
    
    // If validation failed for a draft, focus on the title field
    if (!success && errors.title) {
      titleInputRef.current?.focus();
    }
    
    setIsSavingDraft(false);
  };

  // Handle chapter updates for existing book
  const handleExistingBookChapters = async (bookId: number) => {
    if (chapters.length === 0 && chaptersToDelete.length === 0) return true;
    
    try {
      // Process deletion queue first
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
      
      // Continue with normal processing (separating chapters into new and existing)
      const existingChapters = chapters.filter(ch => !ch.id.startsWith('chapter-'));
      const newChapters = chapters.filter(ch => ch.id.startsWith('chapter-'));
      
      // Track which chapters have been processed
      let processedChapters = 0;
      let failedChapters = 0;
      
      // For manga books, process images first
      if (bookType === BOOK_TYPES.MANGA) {
        // Process both existing and new chapters to upload images
        const allChapters = [...existingChapters, ...newChapters];
        
        for (const chapter of allChapters) {
          if (chapter.images && chapter.images.length > 0) {
            const imageUrls: string[] = [];
            
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
            
            // Update the chapter with the collected image URLs
            chapter.content = JSON.stringify(imageUrls);
          }
        }
      }
      
      // Process existing chapters by updating them individually using mutation
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
            const chapterData = {
              title: chapter.title,
              content: chapter.content,
              isLocked: chapter.isLocked,
              chapter: chapter.chapter
            };
            
            // Use mutation to update the chapter
            await updateChapterMutation.mutateAsync({ 
              chapterId: parseInt(chapter.id), 
              chapterData 
            });
            
            processedChapters++;
          } else {
            // Chapter hasn't changed, just count it as processed
            processedChapters++;
          }
        } catch (error) {
          console.error(`Error updating chapter ${chapter.id}:`, error);
          failedChapters++;
        }
      }
      
      // Process new chapters as a batch using mutation
      if (newChapters.length > 0) {
        try {
          // Format new chapters for API according to ChapterCreateItem type
          const formattedNewChapters: ChapterCreateItem[] = newChapters.map(chapter => {
            return {
              title: chapter.title,
              chapter: chapter.chapter,
              content: chapter.content || ''  // Ensure content is never undefined
            };
          });
          
          // Use mutation to create new chapters
          await createChaptersMutation.mutateAsync({
            bookId,
            chaptersData: { chapters: formattedNewChapters }
          });
          
          processedChapters += newChapters.length;
        } catch (error) {
          console.error("Error creating new chapters:", error);
          failedChapters += newChapters.length;
        }
      }
      
      // Report result
      if (failedChapters > 0) {
        setChapterUploadFailed(true);
        toast.error(`${failedChapters} chapters couldn't be saved. You can retry later.`);
      }
      
      return failedChapters === 0;
    } catch (error) {
      console.error("Error processing chapters:", error);
      setChapterUploadFailed(true);
      toast.error(`Book updated but there was an issue with saving chapters: ${(error as Error).message}. Please try again.`);
      return false;
    }
  };

  // Handle creation of chapters for new book
  const handleNewBookChapters = async (bookId: number) => {
    if (chapters.length === 0) return true;
    
    try {
      // For manga books, we need to upload all images first
      if (bookType === BOOK_TYPES.MANGA) {
        setIsSubmitting(true);
        // Track upload progress
        let uploadedChapters = 0;
        
        // Process chapters sequentially to upload images
        for (const chapter of chapters) {
          if (chapter.images && chapter.images.length > 0) {
            const imageUrls: string[] = [];
            
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
            
            // Update the chapter with the collected image URLs
            chapter.content = JSON.stringify(imageUrls);
          }
          
          uploadedChapters++;
        }
      }
      
      // Format chapters data for API after all uploads are complete
      const formattedChapters: ChapterCreateItem[] = chapters.map(chapter => {
        // Handle different content formats based on book type
        let content = chapter.content;
        
        // For manga books, if we have images and the content wasn't already set during upload,
        // then convert images array to content
        if (bookType === BOOK_TYPES.MANGA && chapter.images && chapter.images.length > 0 && !content) {
          content = JSON.stringify(chapter.images.map(img => 
            typeof img === 'string' ? img : img.url
          ));
        }
        
        return {
          title: chapter.title || `Chapter ${chapter.chapter}`,  // Ensure title is never undefined
          chapter: chapter.chapter,
          content: content || ''  // Ensure content is never undefined
        };
      });
      
      // Use mutation to create chapters
      await createChaptersMutation.mutateAsync({
        bookId,
        chaptersData: { chapters: formattedChapters }
      });
      
      return true;
    } catch (error) {
      console.error("Error creating chapters:", error);
      setChapterUploadFailed(true);
      toast.error(`Book created but there was an issue with saving chapters: ${(error as Error).message}. Please try again.`);
      return false;
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
  
  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    const maxSize = 1024 * 1024; // 1MB
    
    // Check file size
    if (file.size > maxSize) {
      setErrors({
        ...errors,
        coverImage: 'Image size should be less than 1MB'
      });
      return;
    }
    
    // Check file type
    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
      setErrors({
        ...errors,
        coverImage: 'Unsupported file type. Please use JPEG, PNG or WebP.'
      });
      return;
    }
    
    // Clear any previous error
    if (errors.coverImage) {
      const { coverImage, ...rest } = errors;
      setErrors(rest);
    }
    
    // Set the file and create a preview
    setCoverImage(file);
    setCoverImagePreview(URL.createObjectURL(file));
    setHasUnsavedChanges(true);
    if (isEditing) {
      setHasChanges(true);
    }
  };

  // Check for changes when in edit mode
  useEffect(() => {
    if (isEditing) {
      const currentTitle = titleInputRef.current?.value || '';
      const currentDescription = descriptionTextareaRef.current?.value || '';
      const currentGenres = selectedGenres;
      const currentBookType = bookType;
      const currentAgeRating = ageRating;
      
      // Compare current values with initial data
      const titleChanged = currentTitle !== (initialData?.title || '');
      const descriptionChanged = currentDescription !== (initialData?.description || '');
      const genresChanged = JSON.stringify(currentGenres.sort()) !== 
        JSON.stringify((initialData?.categories?.map((cat: any) => cat.id.toString()) || []).sort());
      const bookTypeChanged = currentBookType !== (initialData?.bookType?.name || BOOK_TYPES.NOVEL);
      const ageRatingChanged = currentAgeRating !== (initialData?.ageRating || AgeRatingEnum.EVERYONE);
      const coverChanged = coverImage !== null;
      
      // Check if chapters have changed
      let chaptersChanged = false;
      
      // Only check chapter changes if we have initial chapters data to compare against
      if (initialData?.chapters?.length > 0 || chapters.length > 0) {
        // Check if chapter count has changed
        if ((initialData?.chapters?.length || 0) !== chapters.length) {
          chaptersChanged = true;
        } else {
          // Check if any chapter content has changed
          chaptersChanged = chapters.some((chapter, index) => {
            const initialChapter = initialData?.chapters?.[index];
            if (!initialChapter) return true;
            
            // Check title, content, and other properties
            return (
              chapter.title !== initialChapter.title ||
              chapter.content !== initialChapter.content ||
              chapter.isLocked !== initialChapter.isLocked 
              // chapter.price?.toString() !== initialChapter.price?.toString()
            );
          });
        }
      }
      
      // Set hasChanges if any field has changed
      setHasChanges(
        titleChanged || 
        descriptionChanged || 
        genresChanged || 
        bookTypeChanged || 
        ageRatingChanged || 
        coverChanged ||
        chaptersChanged
      );
    }
  }, [
    isEditing, 
    initialData, 
    titleInputRef.current?.value, 
    descriptionTextareaRef.current?.value, 
    selectedGenres, 
    bookType, 
    ageRating, 
    coverImage,
    chapters // Add chapters to the dependency array
  ]);

  // Add event listeners to detect changes in text fields
  useEffect(() => {
    if (isEditing) {
      const handleInputChange = () => {
        const titleChanged = (titleInputRef.current?.value || '') !== (initialData?.title || '');
        const descriptionChanged = (descriptionTextareaRef.current?.value || '') !== (initialData?.description || '');
        
        if (titleChanged || descriptionChanged) {
          setHasChanges(true);
        }
      };
      
      // Add listeners
      titleInputRef.current?.addEventListener('input', handleInputChange);
      descriptionTextareaRef.current?.addEventListener('input', handleInputChange);
      
      // Cleanup
      return () => {
        titleInputRef.current?.removeEventListener('input', handleInputChange);
        descriptionTextareaRef.current?.removeEventListener('input', handleInputChange);
      };
    }
  }, [isEditing, initialData]);

  const handleBack = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedChangesDialog(true);
    } else {
      router.back();
    }
  };
  
  // Handle book type change
  const handleBookTypeChange = (value: string) => {
    setBookType(value);
    // Clear type-specific errors when changing book type
    if (errors.bookType) {
      const { bookType, ...rest } = errors;
      setErrors(rest);
    }
    setHasUnsavedChanges(true);
  };
  
  // Handle age rating change
  const handleAgeRatingChange = (value: string) => {
    setAgeRating(parseInt(value));
    // Clear age rating errors when changing selection
    if (errors.ageRating) {
      const { ageRating, ...rest } = errors;
      setErrors(rest);
    }
    setHasUnsavedChanges(true);
  };

  // Placeholder for AI enhancement functions
  const enhanceTitle = () => {
    setIsEnhancingTitle(true);
    // This would be an actual API call to enhance the title
    setTimeout(() => {
      setIsEnhancingTitle(false);
    }, 1000);
  };

  const enhanceDescription = () => {
    setIsEnhancingDescription(true);
    // This would be an actual API call to enhance the description
    setTimeout(() => {
      setIsEnhancingDescription(false);
    }, 1000);
  };
  
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

  // Helper function to convert a blob URL to base64
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

  // Update content moderation function to handle base64 images and proper content extraction
  const handleModerateContent = async () => {
    setModerationResults(null);
    setModerationStatus('pending');
    
    try {
      // Collect all content to moderate
      const title = titleInputRef.current?.value || '';
      const description = descriptionTextareaRef.current?.value || '';
      
      // Format chapters based on the new structure
      const formattedChapters = await Promise.all(chapters.map(async (chapter) => {
        let chapterContent: string | string[] = '';
        
        // For novel books with text content
        if (bookType === BOOK_TYPES.NOVEL && chapter.content) {
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
        else if (bookType === BOOK_TYPES.MANGA && chapter.images && chapter.images.length > 0) {
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
      }));
      
      // Prepare cover image - use URL if saved, base64 if new
      let coverImageData = '';
      
      if (coverImage) {
        // If we have a direct file reference, convert it to base64
        try {
          const reader = new FileReader();
          await new Promise<void>((resolve, reject) => {
            reader.onload = () => {
              coverImageData = reader.result as string;
              resolve();
            };
            reader.onerror = reject;
            reader.readAsDataURL(coverImage);
          });
        } catch (error) {
          console.error("Error converting cover image to base64:", error);
        }
      } else if (coverImagePreview) {
        // If it's a blob URL, convert to base64
        if (coverImagePreview.startsWith('blob:')) {
          coverImageData = await blobUrlToBase64(coverImagePreview);
        } else {
          // Use the preview URL directly (could be URL or base64)
          coverImageData = coverImagePreview;
        }
      } else if (initialData?.cover) {
        // Use the saved cover image URL
        coverImageData = initialData.cover;
      }
      
      console.log("Formatted chapters for moderation:", formattedChapters);
      console.log("Cover image type:", typeof coverImageData, coverImageData?.substring(0, 30) + '...');
      
      // Use the hook to moderate content with the new structure
      const result = await moderateContent({
        title,
        description,
        coverImage: coverImageData,
        chapters: formattedChapters,
        model: selectedModel
      });
      
      if (result) {
        console.log("Moderation results:", result);
        setModerationResults(result);
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

  // Add a publish book handler
  const handlePublishBook = async () => {
    try {
      // Prepare book data with published status
      const bookData = {
        accessStatusId: AccessStatusEnum.PENDING, // Change from PRIVATE to PENDING
      };
      
      // Update the book status
      const updateResponse = await updateBook(initialData.id, bookData);
      if (updateResponse.status !== 200 && updateResponse.status !== 201) {
        throw new Error(updateResponse.msg || 'Failed to publish book');
      }
      
      toast.success("Book submitted for review successfully");
      
      // Call the success callback if provided
      if (onSuccess) {
        onSuccess(initialData.id);
      }
    } catch (error) {
      toast.error((error as Error).message || 'Failed to publish book');
    }
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
                  // onClick={handleSaveAsDraft}
                  // disabled={isSavingDraft || isSubmitting}
                  disabled={true}
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
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    {isEditing ? 'Updating...' : 'Submitting...'}
                  </>
                ) : (
                  <>
                    <BookOpen size={16} />
                    {isEditing ? 'Update Book' : 'Submit for Review'}
                  </>
                )}
              </Button>

              {/* Publish button for draft books */}
              {isEditing && initialData && initialData.accessStatus && initialData.accessStatus.id === AccessStatusEnum.PRIVATE && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="default"
                        onClick={handlePublishBook}
                        disabled={isSubmitting || isSavingDraft || !canEditBasicInfo}
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
              titleInputRef={titleInputRef as React.RefObject<HTMLInputElement>}
              descriptionTextareaRef={descriptionTextareaRef as React.RefObject<HTMLTextAreaElement>}
              coverImage={coverImage}
              coverImagePreview={coverImagePreview}
              handleImageUpload={handleImageUpload}
              bookType={bookType}
              handleBookTypeChange={handleBookTypeChange}
              selectedGenres={selectedGenres}
              setSelectedGenres={setSelectedGenres}
              ageRating={ageRating}
              setAgeRating={setAgeRating}
              genres={genresQuery.data || []}
              isEnhancingTitle={isEnhancingTitle}
              enhanceTitle={enhanceTitle}
              isEnhancingDescription={isEnhancingDescription}
              enhanceDescription={enhanceDescription}
              isEditing={isEditing}
              canEdit={canEditBasicInfo}
              reasonIfDenied={reasonIfDenied}
            />
            
            {/* Right column - Chapters using ChapterCreator Component */}
            <div className="w-full md:flex-1 lg:pl-6 border-t md:border-t-0 md:border-l border-secondary/90">
              <ChapterCreator
                bookType={bookType}
                chapters={chapters}
                setChapters={setChapters}
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
                handleBookSubmission(false).finally(() => {
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
                handleBookSubmission(false).finally(() => {
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