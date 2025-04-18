"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Save, Upload, FileText, Sparkles, AlertCircle, Plus, Trash2, Book, ChevronDown, GripVertical, CheckCircle2, XCircle, Pencil, ChevronRight, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MultiSelect } from "@/components/ui/multi-select";
import { featuredBooks } from "@/lib/mock-data";
import { currentUser } from "@/lib/mock-user";
import { useRouter, usePathname } from "next/navigation";
import * as yup from "yup";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { PictureImage } from "@/components/books/picture-image";

// Add Accordion components import
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// Add Dialog components for confirmation
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Add Select components for dropdown
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Add Radio Group components
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

// Add Tooltip components
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Define chapter type
type Chapter = {
  id: string;
  title: string;
  content: string;
  images?: Array<string | {url: string, fileName: string}>; // For picture books, supports both string URLs and object format
  wordContent?: string; // For word books
  documentUrl?: string; // For uploaded .doc files
};

// Create a sortable item component for the images - MOVED OUTSIDE OF THE MAIN COMPONENT
const SortableImageItem = ({ 
  imgUrl, 
  imgIndex,
  onRemoveImage,
  chapter
}: {
  imgUrl: string | {url: string, fileName: string};
  imgIndex: number;
  onRemoveImage: (index: number) => void;
  chapter: Chapter;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({
    id: `image-${chapter.id}-${imgIndex}`,
  });
  
  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    transition,
  };

  const url = typeof imgUrl === 'string' ? imgUrl : imgUrl.url;
  const fileName = typeof imgUrl === 'string' ? `Image ${imgIndex + 1}` : imgUrl.fileName;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-2 bg-background border rounded-md"
    >
      <div 
        {...attributes}
        {...listeners}
        className="cursor-grab"
      >
        <GripVertical size={16} className="text-muted-foreground" />
      </div>
      
      <div className="relative h-16 aspect-[4/3] rounded-md overflow-hidden border flex-shrink-0">
        <PictureImage
          src={url}
          alt={`Page ${imgIndex + 1} - ${fileName}`}
          className="h-16" 
        />
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate flex items-center">
          <span>Page {imgIndex + 1}</span>
          
        </p>
        <p className="text-xs text-muted-foreground truncate">
          {fileName}
        </p>
      </div>
      
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground hover:text-destructive"
        onClick={() => onRemoveImage(imgIndex)}
      >
        <Trash2 size={16} />
      </Button>
    </div>
  );
};

// Define book types
const BOOK_TYPES = {
  PICTURE_BOOK: "picture_book",
  WORD_BOOK: "word_book"
};

// Define validation schema with yup
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
    .required("Cover image is required")
    .test(
      "fileFormat", 
      "Unsupported file format. Please upload a JPG, JPEG, PNG or WebP image", 
      (value: any) => value && ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(value.type)
    )
    .test(
      "fileSize", 
      "File too large. Maximum size is 1MB", 
      (value: any) => value && value.size <= 1024 * 1024
    ),
  
  genres: yup
    .array()
    .of(yup.string())
    .min(1, "At least one genre is required"),
    
  bookType: yup
    .string()
    .required("Book type is required")
    .oneOf([BOOK_TYPES.PICTURE_BOOK, BOOK_TYPES.WORD_BOOK], "Invalid book type")
});

export default function CreateBookPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [bookType, setBookType] = useState<string>(BOOK_TYPES.WORD_BOOK);
  const [isEnhancingTitle, setIsEnhancingTitle] = useState(false);
  const [isEnhancingDescription, setIsEnhancingDescription] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [newChapterTitle, setNewChapterTitle] = useState("");
  const [expandedChapter, setExpandedChapter] = useState<string | null>(null);
  const [emptyChapters, setEmptyChapters] = useState<string[]>([]);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [isBookInfoCollapsed, setIsBookInfoCollapsed] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Dialog state for delete confirmation
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [chapterToDelete, setChapterToDelete] = useState<string | null>(null);
  
  // Create refs for form elements
  const titleInputRef = useRef<HTMLInputElement>(null);
  const descriptionTextareaRef = useRef<HTMLTextAreaElement>(null);
  const newChapterInputRef = useRef<HTMLInputElement>(null);
  
  // Initialize sensors for drag-and-drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Create a comprehensive list of genres with both English and Vietnamese names
  const genreOptions = [
    { label: "Adventure", value: "Adventure" }, // Phiêu lưu
    { label: "Comedy", value: "Comedy" }, // Hài hước
    { label: "Drama", value: "Drama" }, // Chính kịch
    { label: "Fantasy", value: "Fantasy" }, // Giả tưởng
    { label: "Historical", value: "Historical" }, // Lịch sử
    { label: "Horror", value: "Horror" }, // Kinh dị
    { label: "Mystery", value: "Mystery" }, // Bí ẩn
    { label: "Romance", value: "Romance" }, // Lãng mạn
    { label: "Sci-fi", value: "Sci-fi" }, // Khoa học viễn tưởng
    { label: "Slice of Life", value: "Slice of Life" }, // Đời thường
    { label: "Thriller", value: "Thriller" }, // Gay cấn
    { label: "Tragedy", value: "Tragedy" }, // Bi kịch
    { label: "Crime", value: "Crime" }, // Tội phạm
    { label: "Supernatural", value: "Supernatural" }, // Siêu nhiên
    { label: "Psychological", value: "Psychological" }, // Tâm lý
    { label: "Martial Arts", value: "Martial Arts" }, // Võ thuật
    { label: "Post-Apocalyptic", value: "Post-Apocalyptic" }, // Hậu tận thế
    { label: "Survival", value: "Survival" }, // Sinh tồn
    { label: "Reincarnation", value: "Reincarnation" }, // Luân hồi
    { label: "Time Travel", value: "Time Travel" }, // Du hành thời gian
    { label: "Steampunk", value: "Steampunk" }, // Steampunk
    { label: "Cyberpunk", value: "Cyberpunk" }, // Cyberpunk
    { label: "Magic", value: "Magic" }, // Ma thuật
    { label: "Military", value: "Military" }, // Quân sự
    { label: "Philosophical", value: "Philosophical" }, // Triết lý
    { label: "Wuxia", value: "Wuxia" }, // Võ hiệp (Wuxia)
    { label: "Xianxia", value: "Xianxia" }, // Tiên hiệp (Xianxia)
    { label: "Xuanhuan", value: "Xuanhuan" }, // Huyền huyễn (Xuanhuan)
    { label: "Sports", value: "Sports" }, // Thể thao
    { label: "Mecha", value: "Mecha" }, // Robot khổng lồ (Mecha)
    { label: "Vampires", value: "Vampires" }, // Ma cà rồng
    { label: "Zombies", value: "Zombies" }, // Xác sống
    { label: "Detective", value: "Detective" }, // Trinh thám
    { label: "School Life", value: "School Life" }, // Học đường
    { label: "Medical", value: "Medical" }, // Y khoa
    { label: "Music", value: "Music" }, // Âm nhạc
    { label: "Cooking", value: "Cooking" }, // Ẩm thực
    { label: "Game", value: "Game" }, // Trò chơi
    { label: "Virtual Reality", value: "Virtual Reality" }, // Thực tế ảo
    { label: "Politics", value: "Politics" }, // Chính trị
    { label: "Science", value: "Science" } // Khoa học
  ];

  const [editingChapterId, setEditingChapterId] = useState<string | null>(null);
  const editableInputRef = useRef<HTMLInputElement>(null);

  const validateForm = async (isDraft = false) => {
    try {
      // Create an object with the form data
      const formData = {
        title: titleInputRef.current?.value || "",
        description: descriptionTextareaRef.current?.value || "",
        coverImage: coverImage,
        genres: selectedGenres,
        bookType: bookType
      };

      // Create a local errors object
      let validationErrors: Record<string, string> = {};

      // Check individual fields for validation before using yup
      // This ensures we show all errors at once
      
      // Title validation
      if (!formData.title.trim()) {
        validationErrors.title = "Title is required";
      }
      
      // Description validation
      if (!formData.description.trim() && !isDraft) {
        validationErrors.description = "Description is required";
      }
      
      // Genre validation
      if (formData.genres.length === 0 && !isDraft) {
        validationErrors.genres = "At least one genre is required";
      }

      // Book type validation
      if (!formData.bookType && !isDraft) {
        validationErrors.bookType = "Book type is required";
      }

      // Check for required cover image
      if (!formData.coverImage && !isDraft) {
        validationErrors.coverImage = "Cover image is required";
      }

      // Check for empty chapter content
      const emptyChapterIds = chapters
        .filter(chapter => chapter.content.trim() === "")
        .map(chapter => chapter.id);

      // If there are chapters with no content and we're not saving as draft, show error
      if (emptyChapterIds.length > 0 && !isDraft) {
        // Expand the first empty chapter for visibility
        setExpandedChapter(emptyChapterIds[0]);
        
        // Add an error message
        validationErrors.chapters = `${emptyChapterIds.length} chapter${emptyChapterIds.length > 1 ? 's' : ''} ${emptyChapterIds.length > 1 ? 'have' : 'has'} no content`;
        
        // Set empty chapters state
        setEmptyChapters(emptyChapterIds);
      } else {
        // Clear any previous chapter errors
        setEmptyChapters([]);
      }
      
      // If we have any validation errors, update the errors state and return false
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        return false;
      }
      
      // Clear any previous errors if no validation errors found
      setErrors({});
      
      // If we're in draft mode, we don't need to do further validation
      if (isDraft) {
        return true;
      }

      // For publishing, validate everything with yup
      await bookSchema.validate(formData, { abortEarly: false });
      return true;
    } catch (error) {
      if (error instanceof yup.ValidationError) {
        // Convert Yup errors to a more usable format
        const validationErrors: Record<string, string> = {};
        
        error.inner.forEach(err => {
          if (err.path) {
            validationErrors[err.path] = err.message;
          }
        });
        
        setErrors(validationErrors);
      } else {
        // Handle other types of errors
        setErrors({ form: "An unexpected error occurred" });
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Validate the form
    const isValid = await validateForm();
    if (!isValid) {
      // Focus on the first field with an error
      if (errors.title && titleInputRef.current) {
        titleInputRef.current.focus();
      } else if (errors.description && descriptionTextareaRef.current) {
        descriptionTextareaRef.current.focus();
      }
      
      // Scroll to the first error
      document.querySelector('.border-destructive')?.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
      
      return;
    }
    
    setIsSubmitting(true);

    const bookData = {
      id: `book-${Date.now()}`, // Generate a temporary ID
      title: titleInputRef.current?.value as string,
      author: currentUser.name, // Use the current logged-in user's name
      genres: selectedGenres,
      description: descriptionTextareaRef.current?.value as string,
      chapters: chapters, // Use created chapters array
      rating: 0, // New books start with no rating
      progress: 0, // New books start with no reading progress
      coverImage: coverImagePreview || "/book-placeholder.jpg",
      status: "published",
      authorId: currentUser.id, // Store reference to the user
      bookType: bookType
    };

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // For now, we're just simulating a successful submission
    // In a real app, you would send this data to an API endpoint
    console.log("Book created:", bookData);
    
    // Redirect to the books page
    router.push("/books");
  };

  const handleSaveAsDraft = async () => {
    // Validate the form with draft rules
    const isValid = await validateForm(true);
    if (!isValid) {
      // Focus on the first field with an error
      if (errors.title && titleInputRef.current) {
        titleInputRef.current.focus();
      } else if (errors.description && descriptionTextareaRef.current) {
        descriptionTextareaRef.current.focus();
      }
      
      // Scroll to the first error
      document.querySelector('.border-destructive')?.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
      
      return;
    }
    
    // Clear any empty chapter errors when saving as draft
    setEmptyChapters([]);
    
    setIsSavingDraft(true);
    
    const draftData = {
      id: `draft-${Date.now()}`,
      title: titleInputRef.current?.value || "Untitled",
      author: currentUser.name, // Use the current logged-in user's name
      genres: selectedGenres,
      description: descriptionTextareaRef.current?.value || "",
      chapters: chapters, // Use created chapters array
      rating: 0,
      progress: 0,
      coverImage: coverImagePreview || "/book-placeholder.jpg",
      status: "draft",
      authorId: currentUser.id, // Store reference to the user
      bookType: bookType
    };
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Save draft data (in a real app, this would be stored in a database)
    console.log("Draft saved:", draftData);
    
    // Show success message and redirect
    alert("Draft saved successfully!");
    router.push("/books");
  };

  const handleAddChapter = () => {    
    // Create a new chapter with an auto-generated title
    const newChapter: Chapter = {
      id: `chapter-${Date.now()}`,
      title: newChapterTitle ? newChapterTitle : `Chapter ${chapters.length + 1}`,
      content: '',
      // Initialize appropriate fields based on book type
      images: bookType === BOOK_TYPES.PICTURE_BOOK ? [] : undefined,
      wordContent: bookType === BOOK_TYPES.WORD_BOOK ? '' : undefined,
      documentUrl: undefined
    };
    
    // Add the new chapter to the chapters array
    setChapters(prev => [...prev, newChapter]);
    
    // Automatically expand the new chapter
    setExpandedChapter(newChapter.id);

    // Clear any chapter-related validation errors
    if (errors.chapters) {
      setErrors(prev => {
        const newErrors = {...prev};
        delete newErrors.chapters;
        return newErrors;
      });
      setEmptyChapters([]);
    }

    // Reset the chapter title input
    setNewChapterTitle("");
  };
  
  const confirmDeleteChapter = (id: string) => {
    const chapter = chapters.find(ch => ch.id === id);
    
    // If chapter has content, show confirmation dialog
    if (chapter && chapter.content.trim().length > 0) {
      setChapterToDelete(id);
      setShowDeleteDialog(true);
    } else {
      // If no content, delete immediately
      handleRemoveChapter(id);
    }
  };
  
  const handleRemoveChapter = (id: string) => {
    setChapters(prev => prev.filter(chapter => chapter.id !== id));
    if (expandedChapter === id) {
      setExpandedChapter(null);
    }
    // Reset dialog state
    setShowDeleteDialog(false);
    setChapterToDelete(null);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, chapterId: string) => {
    e.preventDefault();
    const files = e.target.files;

    if (!files || files.length === 0) {
      return;
    }

    // Generate object URLs for each file
    const imageObjects = Array.from(files).map((file) => ({
      url: URL.createObjectURL(file),
      fileName: file.name
    }));

    // Special handling for cover image
    if (chapterId === "cover-image") {
      // Set cover image preview using the first image
      setCoverImagePreview(imageObjects[0].url);
      // Set the actual file for form submission
      setCoverImage(files[0]);
      // Reset file input
      e.target.value = "";
      return;
    }

    // Find the chapter to update
    const updatedChapters = [...chapters];
    const chapterIndex = updatedChapters.findIndex(
      (chapter) => chapter.id === chapterId
    );

    if (chapterIndex === -1) {
      console.error("Chapter not found");
      return;
    }

    // Update the chapter with the new images
    const updatedChapter = {
      ...updatedChapters[chapterIndex],
      images: [...(updatedChapters[chapterIndex].images || []), ...imageObjects],
      content: updatedChapters[chapterIndex].content || "",
    };

    updatedChapters[chapterIndex] = updatedChapter;

    // Remove this chapter from empty chapters if it now has images
    if (updatedChapter.images.length > 0) {
      setEmptyChapters((prev) => prev.filter((id) => id !== chapterId));
    }

    setChapters(updatedChapters);

    // Reset file input
    e.target.value = "";
  };

  const enhanceTitle = async () => {
    setIsEnhancingTitle(true);
    
    const currentTitle = titleInputRef.current?.value || "";
    
    if (!currentTitle || currentTitle.trim() === "") {
      alert("Please enter a title to enhance");
      setIsEnhancingTitle(false);
      return;
    }
    
    // Simulate API call to AI enhancement service
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    // Generate an enhanced title based on current title and genres
    const genreText = selectedGenres.length > 0 ? 
      ` - ${selectedGenres.join(", ")}` : "";
    
    const enhancementOptions = [
      `The Epic Tale of ${currentTitle}${genreText}`,
      `${currentTitle}: A Journey Begins${genreText}`,
      `${currentTitle} - The Awakening${genreText}`,
      `Beyond ${currentTitle}${genreText}`,
      `${currentTitle}: Destiny Unveiled${genreText}`
    ];
    
    // Pick a random enhancement
    const enhancedTitle = enhancementOptions[
      Math.floor(Math.random() * enhancementOptions.length)
    ];
    
    // Check if the enhanced title exceeds the character limit
    if (enhancedTitle.length > 100) {
      // Truncate the title to 97 characters and add "..."
      const truncatedTitle = enhancedTitle.substring(0, 97) + "...";
      if (titleInputRef.current) {
        titleInputRef.current.value = truncatedTitle;
      }
    } else {
      // Update the title input with the full enhanced title
      if (titleInputRef.current) {
        titleInputRef.current.value = enhancedTitle;
      }
    }
    
    setIsEnhancingTitle(false);
  };
  
  const enhanceDescription = async () => {
    setIsEnhancingDescription(true);
    
    const currentDescription = descriptionTextareaRef.current?.value || "";
    
    if (!currentDescription || currentDescription.trim() === "") {
      alert("Please enter a description to enhance");
      setIsEnhancingDescription(false);
      return;
    }
    
    // Simulate API call to AI enhancement service
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Generate an enhanced description
    const genreWords = selectedGenres.length > 0 ? 
      selectedGenres.map(g => `${g.toLowerCase()}`).join(", ") : "storytelling";
    
    // Add some flourish to the description
    let enhancedDescription = `${currentDescription}\n\nThis captivating ${genreWords} saga will take readers on an unforgettable journey through a richly detailed world of complex characters and unexpected twists. With its unique blend of immersive narrative and thought-provoking themes, this book promises to be an unforgettable experience for readers of all tastes.`;
    
    // Check if the enhanced description exceeds the character limit
    if (enhancedDescription.length > 1000) {
      // Truncate to stay within limit
      enhancedDescription = enhancedDescription.substring(0, 997) + "...";
    }
    
    // Update the description textarea
    if (descriptionTextareaRef.current) {
      descriptionTextareaRef.current.value = enhancedDescription;
    }
    
    setIsEnhancingDescription(false);
  };

  // Function to handle image reordering
  const reorderImages = (chapterId: string, startIndex: number, endIndex: number) => {
    // Find the chapter
    const chapter = chapters.find(ch => ch.id === chapterId);
    if (!chapter || !chapter.images) return;
    
    // Create a copy of the images array
    const reorderedImages = arrayMove(chapter.images, startIndex, endIndex);
    
    // Update the chapters with the new order
    const updatedChapters = chapters.map(ch => 
      ch.id === chapterId 
        ? { ...ch, images: reorderedImages }
        : ch
    );
    
    setChapters(updatedChapters);
  };

  // Add this function to directly control accordion state
  const toggleChapter = (chapterId: string) => {
    if (expandedChapter === chapterId) {
      setExpandedChapter(null);
    } else {
      setExpandedChapter(chapterId);
    }
  };

  // Helper function to display error messages
  const ErrorMessage = ({ message }: { message: string }) => (
    <div className="flex items-center text-destructive text-xs mt-1">
      <AlertCircle size={12} className="mr-1" />
      <span>{message}</span>
    </div>
  );

  // Function to handle chapter title edit completion
  const handleChapterTitleUpdate = (chapterId: string, newTitle: string) => {
    const updatedChapters = chapters.map(ch => 
      ch.id === chapterId ? {...ch, title: newTitle || `Chapter ${chapters.findIndex(c => c.id === chapterId) + 1}`} : ch
    );
    setChapters(updatedChapters);
    setEditingChapterId(null);
  };

  // Add scroll effect
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      if (scrollPosition > 10) {
        setHasScrolled(true);
      } else {
        setHasScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Add this new function to check for form data changes
  const checkForChanges = () => {
    const title = titleInputRef.current?.value || "";
    const description = descriptionTextareaRef.current?.value || "";
    
    // Consider the form modified if any of these conditions are true
    const isModified = 
      title.trim() !== "" || 
      description.trim() !== "" || 
      selectedGenres.length > 0 || 
      coverImage !== null || 
      chapters.length > 0;
    
    setHasUnsavedChanges(isModified);
  };

  // Listen for input changes to detect unsaved changes
  useEffect(() => {
    const handleInputChange = () => checkForChanges();
    
    // Add event listeners to form elements
    const form = document.getElementById('book-create-form');
    form?.addEventListener('input', handleInputChange);
    
    return () => {
      form?.removeEventListener('input', handleInputChange);
    };
  }, []);

  // Update unsaved changes when any of these state values change
  useEffect(() => {
    checkForChanges();
  }, [selectedGenres, coverImage, chapters]);

  // Handle beforeunload event for browser refreshes and closes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        // Chrome requires returnValue to be set
        e.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Handle history navigation for browser back/forward buttons
  useEffect(() => {
    // This handles browser's back button navigation attempts
    const handlePopState = (e: PopStateEvent) => {
      if (hasUnsavedChanges) {
        // Save the current URL
        const currentUrl = window.location.href;
        
        // Prevent the default navigation
        window.history.pushState(null, '', currentUrl);
        
        // Ask for confirmation
        const confirmation = window.confirm(
          "You have unsaved changes that will be lost if you leave. Are you sure you want to continue?"
        );
        
        // If confirmed, allow navigation
        if (confirmation) {
          window.history.back();
        }
      }
    };

    // Add a dummy history entry to make the back button trigger our handler
    window.history.pushState(null, '', window.location.href);
    
    // Listen for popstate events (back/forward buttons)
    window.addEventListener('popstate', handlePopState);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [hasUnsavedChanges]);

  // Handle navigation within the Next.js app
  useEffect(() => {
    const handleWindowClose = (e: any) => {
      if (!hasUnsavedChanges) return;
      
      // Display confirmation dialog
      const confirmation = window.confirm(
        "You have unsaved changes that will be lost if you leave. Are you sure you want to continue?"
      );
      
      // If the user doesn't confirm, prevent navigation
      if (!confirmation) {
        e.preventDefault();
      }
    };

    // Custom handler for link clicks
    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a');
      
      if (link && !link.getAttribute('href')?.startsWith('#') && hasUnsavedChanges) {
        e.preventDefault();
        
        const confirmation = window.confirm(
          "You have unsaved changes that will be lost if you leave. Are you sure you want to continue?"
        );
        
        if (confirmation) {
          router.push(link.getAttribute('href') || '/');
        }
      }
    };

    document.addEventListener('click', handleLinkClick);
    return () => document.removeEventListener('click', handleLinkClick);
  }, [hasUnsavedChanges, router]);

  // Override back button to prompt the user before going back
  const handleBack = () => {
    if (hasUnsavedChanges) {
      const confirmation = window.confirm(
        "You have unsaved changes that will be lost if you leave. Are you sure you want to continue?"
      );
      
      if (confirmation) {
        router.back();
      }
    } else {
      router.back();
    }
  };

  return (
    <div className="container mx-auto px-4 pb-8 pt-2">
      {/* Back button */}
      <div className="mb-3">
        <Button 
          variant="link" 
          className="flex items-center gap-2 py-1 pl-0"
          onClick={handleBack}
        >
          <ChevronLeft size={16} />
          Back
        </Button>
      </div>

      {/* Header with action buttons */}
      <div className={`sticky top-6 z-10 pt-2 pb-4 mb-3 transition-all duration-200 ${
        hasScrolled ? 'bg-white rounded-lg shadow-[0_4px_12px_rgba(0,0,0,0.08)]' : ''
      }`}>
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h1 className="text-3xl font-bold pl-6">Create New Book</h1>
            
            {/* Action buttons - Desktop */}
            <div className="hidden md:flex gap-4 pr-6">
              <Button
                type="button"
                variant="outline"
                className="flex items-center gap-2"
                onClick={handleSaveAsDraft}
                disabled={isSavingDraft || isSubmitting}
                form="book-create-form"
              >
                <FileText size={16} />
                {isSavingDraft ? "Saving..." : "Save as Draft"}
              </Button>
              
              <Button
                type="submit"
                className="flex items-center gap-2"
                disabled={isSubmitting || isSavingDraft}
                form="book-create-form"
              >
                <Save size={16} />
                {isSubmitting ? "Creating..." : "Create Book"}
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Form-level error */}
      {errors.form && <ErrorMessage message={errors.form} />}
      
      {/* Book creation form */}
      <form id="book-create-form" onSubmit={handleSubmit} className="space-y-6 mb-3" noValidate>
        {/* Main container box with both sections */}
        <div className="bg-white border border-secondary/90 rounded-lg shadow-sm overflow-hidden pb-6">
          <div className="flex flex-col md:flex-row">
            {/* Left column - Book Info */}
            <div className={`w-full md:w-[30%] relative transition-all duration-300 ${isBookInfoCollapsed ? 'md:w-[48px]' : ''}`}>
              <div className={`px-6 py-4 bg-secondary/30 border-b border-secondary/90 flex items-center justify-between ${isBookInfoCollapsed ? 'md:px-0' : ''}`}>
                <h3 className={`text-lg font-medium ${isBookInfoCollapsed ? 'md:hidden' : ''}`}>Book Info</h3>
                <div className={`flex items-center space-x-1 ${isBookInfoCollapsed ? 'mx-auto' : ''}`}>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                    onClick={() => setIsBookInfoCollapsed(!isBookInfoCollapsed)}
                    title={isBookInfoCollapsed ? "Expand" : "Collapse"}
                  >
                    {isBookInfoCollapsed ? (
                      <PanelLeftOpen size={18} />
                    ) : (
                      <PanelLeftClose size={18} />
                    )}
                  </Button>
                </div>
              </div>
              {!isBookInfoCollapsed && (
                <div className="p-6 space-y-4">
                  {/* Cover Image */}
                  <div className="space-y-2">
                    <Label htmlFor="cover-upload" className="flex items-center">
                      Cover Image
                      <span className="text-destructive ml-1">*</span>
                    </Label>
                    <div className={`border-2 border-dashed rounded-lg p-4 text-center relative ${errors.coverImage ? 'border-destructive bg-destructive/5' : 'border-border'}`}>
                      {coverImagePreview ? (
                        <div className="relative aspect-[2/3] w-full rounded-lg overflow-hidden mb-2">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img 
                            src={coverImagePreview} 
                            alt="Book cover preview" 
                            className="object-cover w-full h-full"
                          />
                        </div>
                      ) : (
                        <div className="py-10 flex flex-col items-center">
                          <Upload size={48} className={`mb-2 ${errors.coverImage ? 'text-destructive' : 'text-muted-foreground'}`} />
                          <p className={`text-sm ${errors.coverImage ? 'text-destructive' : 'text-muted-foreground'}`}>
                            Click or drag to upload cover image
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            JPG, JPEG, PNG or WebP, max 1MB
                          </p>
                        </div>
                      )}
                      <Input
                        id="cover-upload"
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={(e) => handleImageUpload(e, "cover-image")}
                      />
                    </div>
                    {errors.coverImage ? (
                      <ErrorMessage message={errors.coverImage} />
                    ) : (
                      <p className="text-xs text-muted-foreground mt-1">
                        Upload a cover image for your book
                      </p>
                    )}
                  </div>

                  {/* Book Type Dropdown - Replaced with Radio Buttons */}
                  <div className="space-y-2">
                    <Label className="flex items-center">
                      Book Type
                      <span className="text-destructive ml-1">*</span>
                    </Label>
                    <RadioGroup
                      value={bookType}
                      onValueChange={(value: string) => {
                        setBookType(value);
                        if (errors.bookType) {
                          setErrors(prev => ({...prev, bookType: ""}));
                        }
                      }}
                      className={`space-y-3 ${errors.bookType ? 'border-destructive' : ''}`}
                    >
                      <div className={`flex items-center space-x-2 border p-3 rounded-md transition-all ${
                        bookType === BOOK_TYPES.WORD_BOOK 
                          ? 'border-primary bg-primary/5 shadow-sm' 
                          : 'border-border hover:border-muted-foreground/20'
                      }`}>
                        <RadioGroupItem value={BOOK_TYPES.WORD_BOOK} id="word-book" />
                        <Label htmlFor="word-book" className="font-normal cursor-pointer">
                          <div className="flex flex-col">
                            <span className="font-medium">Word Book</span>
                            <span className="text-xs text-muted-foreground">Text-based book with written content</span>
                          </div>
                        </Label>
                      </div>
                      
                      <div className={`flex items-center space-x-2 border p-3 rounded-md transition-all ${
                        bookType === BOOK_TYPES.PICTURE_BOOK 
                          ? 'border-primary bg-primary/5 shadow-sm' 
                          : 'border-border hover:border-muted-foreground/20'
                      }`}>
                        <RadioGroupItem value={BOOK_TYPES.PICTURE_BOOK} id="picture-book" />
                        <Label htmlFor="picture-book" className="font-normal cursor-pointer">
                          <div className="flex flex-col">
                            <span className="font-medium">Picture Book</span>
                            <span className="text-xs text-muted-foreground">Image-based book with illustration uploads and captions</span>
                          </div>
                        </Label>
                      </div>
                    </RadioGroup>
                    {errors.bookType ? (
                      <ErrorMessage message={errors.bookType} />
                    ) : (
                      <p className="text-xs text-muted-foreground mt-1">
                        Select whether this is primarily a word-based or picture-based book
                      </p>
                    )}
                  </div>

                  {/* Title */}
                  <div className="space-y-2">
                    <Label htmlFor="title" className="flex items-center">
                      Title
                      <span className="text-destructive ml-1">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="title"
                        name="title"
                        ref={titleInputRef}
                        placeholder="Enter book title"
                        className={`pr-12 ${errors.title ? 'border-destructive' : ''}`}
                        maxLength={100}
                        onChange={() => {
                          if (errors.title) {
                            setErrors(prev => ({...prev, title: ""}));
                          }
                        }}
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center">
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon"
                          className="h-full rounded-l-none rounded-r-md text-xs flex items-center justify-center w-10 text-primary"
                          onClick={enhanceTitle}
                          disabled={isEnhancingTitle}
                          title="AI Enhance"
                        >
                          {isEnhancingTitle ? 
                            <div className="animate-pulse">
                              <Sparkles size={16} />
                            </div> : 
                            <Sparkles size={16} />
                          }
                        </Button>
                      </div>
                    </div>
                    {errors.title ? (
                      <ErrorMessage message={errors.title} />
                    ) : (
                      <p className="text-xs text-muted-foreground mt-1">
                        Maximum 100 characters
                      </p>
                    )}
                  </div>

                  {/* Genres */}
                  <div className="space-y-2">
                    <Label htmlFor="genres" className="flex items-center">
                      Genres
                      <span className="text-destructive ml-1">*</span>
                    </Label>
                    <MultiSelect
                      options={genreOptions}
                      selected={selectedGenres}
                      onChange={(selected) => {
                        setSelectedGenres(selected);
                        if (errors.genres) {
                          setErrors(prev => ({...prev, genres: ""}));
                        }
                      }}
                      placeholder="Select genres (multiple)"
                      className={`w-full ${errors.genres ? 'border-destructive' : ''}`}
                    />
                    {errors.genres ? (
                      <ErrorMessage message={errors.genres} />
                    ) : (
                      selectedGenres.length === 0 && (
                        <p className="text-xs text-muted-foreground mt-1">Please select at least one genre</p>
                      )
                    )}
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label htmlFor="description" className="flex items-center">
                      Description
                      <span className="text-destructive ml-1">*</span>
                    </Label>
                    <div className="relative">
                      <Textarea
                        id="description"
                        name="description"
                        ref={descriptionTextareaRef}
                        placeholder="Enter book description"
                        rows={6}
                        className={`resize-none pr-12 ${errors.description ? 'border-destructive' : ''}`}
                        maxLength={1000}
                        onChange={() => {
                          if (errors.description) {
                            setErrors(prev => ({...prev, description: ""}));
                          }
                        }}
                      />
                      <div className="absolute right-2 top-2">
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 flex items-center justify-center rounded-full bg-background/70 hover:bg-background"
                          onClick={enhanceDescription}
                          disabled={isEnhancingDescription}
                          title="AI Enhance"
                        >
                          {isEnhancingDescription ? 
                            <div className="animate-pulse">
                              <Sparkles size={16} />
                            </div> : 
                            <Sparkles size={16} />
                          }
                        </Button>
                      </div>
                      {errors.description ? (
                        <ErrorMessage message={errors.description} />
                      ) : (
                        <div className="flex justify-between">
                          <p className="text-xs text-muted-foreground mt-1">
                            Describe your book's plot and themes
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Maximum 1000 characters
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              {isBookInfoCollapsed && (
                <div 
                  className={`h-full flex items-center justify-center cursor-pointer hover:bg-secondary/30 transition-colors ${
                    (errors.title || errors.description || errors.genres || errors.coverImage || errors.bookType) 
                      ? 'bg-destructive/10 border-r border-destructive' 
                      : ''
                  }`}
                  onClick={() => setIsBookInfoCollapsed(false)}
                  title={
                    (errors.title || errors.description || errors.genres || errors.coverImage || errors.bookType)
                      ? "Book Info has errors" 
                      : "Expand Book Info"
                  }
                >
                  <span 
                    className={`py-6 font-medium tracking-wide ${
                      (errors.title || errors.description || errors.genres || errors.coverImage || errors.bookType)
                        ? 'text-destructive'
                        : 'text-muted-foreground'
                    }`}
                    style={{
                      writingMode: 'vertical-rl',
                      transform: 'rotate(180deg)'
                    }}
                  >
                    Book Info
                  </span>
                </div>
              )}
            </div>
            
            {/* Vertical separator */}
            <div className="hidden md:block w-px bg-secondary/60"></div>
            
            {/* Right column - Chapters */}
            <div className={`w-full md:w-[70%] relative transition-all duration-300 ${isBookInfoCollapsed ? 'md:w-[calc(100%-48px)]' : ''}`}>
              <div className="px-6 py-4 bg-secondary/30 border-b border-secondary/90 flex items-center justify-between">
                <h3 className="text-lg font-medium flex items-center gap-3">
                  Chapters
                  {chapters.length > 0 && (
                    <span className="text-sm bg-secondary text-secondary-foreground rounded-full px-3 py-1 font-medium">
                      {chapters.length}
                    </span>
                  )}
                </h3>
                {errors.chapters && (
                  <div className="text-xs p-1.5 bg-destructive/10 border border-destructive rounded-md flex-shrink-0">
                    <p className="flex items-center text-destructive">
                      <AlertCircle size={12} className="mr-1.5 flex-shrink-0" />
                      <span className="line-clamp-1">{errors.chapters}</span>
                    </p>
                  </div>
                )}
              </div>
              
              <div className="p-6">
                {chapters.length > 0 ? (
                  <div className="pr-2 mb-3">
                    <Accordion 
                      type="single" 
                      collapsible 
                      value={expandedChapter || undefined}
                      className="space-y-3"
                    >
                      {chapters.map((chapter, index) => (
                        <AccordionItem 
                          key={chapter.id} 
                          value={chapter.id}
                          className={`border rounded-md overflow-hidden ${
                            emptyChapters.includes(chapter.id) ? 'border-destructive' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between pr-2">
                            <div 
                              className="flex items-center flex-1 px-4 py-3 cursor-pointer hover:bg-muted/50"
                              onClick={() => toggleChapter(chapter.id)}
                            >
                              <ChevronDown 
                                className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 mr-2 ${
                                  expandedChapter === chapter.id ? 'transform rotate-180' : ''
                                }`}
                              />
                              
                              {editingChapterId === chapter.id ? (
                                // Editing mode
                                <div 
                                  className="flex-1"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Input
                                    ref={editableInputRef}
                                    defaultValue={chapter.title}
                                    autoFocus
                                    className="h-7 px-2 py-1 font-medium"
                                    onBlur={(e) => handleChapterTitleUpdate(chapter.id, e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        handleChapterTitleUpdate(chapter.id, e.currentTarget.value);
                                      } else if (e.key === 'Escape') {
                                        setEditingChapterId(null);
                                      }
                                    }}
                                  />
                                </div>
                              ) : (
                                // Display mode
                                <span className="font-medium truncate max-w-[400px] text-left flex items-center">
                                  <span>
                                    {chapter.title || `Chapter ${index + 1}`}
                                    {emptyChapters.includes(chapter.id) && (
                                      <span className="text-xs text-destructive ml-2">(empty)</span>
                                    )}
                                  </span>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-5 w-5 ml-2 text-muted-foreground hover:text-primary"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingChapterId(chapter.id);
                                      // Focus will be set by autoFocus on the input
                                    }}
                                  >
                                    <Pencil size={12} />
                                  </Button>
                                </span>
                              )}
                            </div>
                            
                            {/* Content status indicator */}
                            <div className="flex items-center mr-2">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    {emptyChapters.includes(chapter.id) || chapter.content.trim() === '' ? (
                                      <CheckCircle2 size={16} className="text-gray-400" aria-label="No content added" />
                                    ) : (
                                      <CheckCircle2 size={16} className="text-green-500" aria-label="Content added" />
                                    )}
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>
                                      {emptyChapters.includes(chapter.id) || chapter.content.trim() === '' 
                                        ? "No content added yet" 
                                        : "Content has been added"}
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                            
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive/90 hover:bg-destructive/10 mr-2"
                              onClick={() => confirmDeleteChapter(chapter.id)}
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>
                          {expandedChapter === chapter.id && (
                            <div className="px-4 py-3 border-t">
                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <Label htmlFor={`chapter-content-${chapter.id}`}>Chapter Content</Label>
                                  {bookType === BOOK_TYPES.WORD_BOOK ? (
                                    <div className="space-y-4">
                                      <div className="flex flex-col gap-2">
                                        <div className="inline-flex w-full border-b">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const updatedChapters = chapters.map(ch => 
                                                ch.id === chapter.id ? {...ch, documentUrl: undefined} : ch
                                              );
                                              setChapters(updatedChapters);
                                            }}
                                            className={`px-4 py-2 font-medium text-sm flex-1 border-b-2 transition-colors ${
                                              !chapter.documentUrl 
                                                ? 'border-primary text-primary' 
                                                : 'border-transparent text-muted-foreground hover:text-foreground'
                                            }`}
                                          >
                                            Write Content
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              // If there's already content, we should preserve it rather than overwrite
                                              if (!chapter.documentUrl && !chapter.wordContent) {
                                                const updatedChapters = chapters.map(ch => 
                                                  ch.id === chapter.id ? {...ch, documentUrl: 'pending'} : ch
                                                );
                                                setChapters(updatedChapters);
                                              }
                                            }}
                                            className={`px-4 py-2 font-medium text-sm flex-1 border-b-2 transition-colors ${
                                              chapter.documentUrl 
                                                ? 'border-primary text-primary' 
                                                : 'border-transparent text-muted-foreground hover:text-foreground'
                                            }`}
                                          >
                                            Upload Document
                                          </button>
                                        </div>
                                        
                                        {/* Option 1: Write content directly */}
                                        {!chapter.documentUrl && (
                                          <div className="border rounded-md p-4">
                                            <Textarea 
                                              id={`chapter-content-${chapter.id}`}
                                              value={chapter.wordContent || ''}
                                              onChange={(e) => {
                                                const updatedChapters = chapters.map(ch => 
                                                  ch.id === chapter.id ? {...ch, wordContent: e.target.value, content: e.target.value} : ch
                                                );
                                                setChapters(updatedChapters);
                                                
                                                // Remove from empty chapters list if content is added
                                                if (e.target.value.trim() !== "" && emptyChapters.includes(chapter.id)) {
                                                  setEmptyChapters(prev => prev.filter(id => id !== chapter.id));
                                                }
                                              }}
                                              placeholder="Write your chapter content here..."
                                              className={`min-h-[200px] ${emptyChapters.includes(chapter.id) ? 'border-destructive' : ''}`}
                                            />
                                          </div>
                                        )}
                                        
                                        {/* Option 2: Upload document */}
                                        {chapter.documentUrl && (
                                          <div className="border rounded-md p-4">
                                            <div className={`border-2 border-dashed rounded-lg p-4 text-center relative ${emptyChapters.includes(chapter.id) && chapter.documentUrl === 'pending' ? 'border-destructive bg-destructive/5' : 'border-border'}`}>
                                              {chapter.documentUrl && chapter.documentUrl !== 'pending' ? (
                                                <div className="flex items-center gap-2 text-sm">
                                                  <FileText size={16} className="text-primary" />
                                                  <span className="font-medium">Document uploaded</span>
                                                  <Button 
                                                    type="button" 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    className="ml-auto h-8"
                                                    onClick={() => {
                                                      const updatedChapters = chapters.map(ch => 
                                                        ch.id === chapter.id ? {...ch, documentUrl: undefined, content: ''} : ch
                                                      );
                                                      setChapters(updatedChapters);
                                                    }}
                                                  >
                                                    Remove
                                                  </Button>
                                                </div>
                                              ) : (
                                                <>
                                                  <div className="py-4 flex flex-col items-center">
                                                    <Upload size={24} className="mb-2 text-muted-foreground" />
                                                    <p className="text-sm text-muted-foreground">
                                                      Click or drag to upload document
                                                    </p>
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                      Word or PDF documents
                                                    </p>
                                                  </div>
                                                  <Input
                                                    id={`chapter-document-${chapter.id}`}
                                                    type="file"
                                                    accept=".doc,.docx,.pdf"
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                    onChange={(e) => {
                                                      if (e.target.files && e.target.files[0]) {
                                                        // In a real app, you would upload this file to storage
                                                        // Here we'll just simulate it with a fake URL
                                                        const fileName = e.target.files[0].name;
                                                        const fakeUrl = `uploaded:/${fileName}`;
                                                        
                                                        const updatedChapters = chapters.map(ch => 
                                                          ch.id === chapter.id ? {...ch, documentUrl: fakeUrl, content: 'Document content: ' + fileName} : ch
                                                        );
                                                        setChapters(updatedChapters);
                                                        
                                                        // Remove from empty chapters list if document is uploaded
                                                        if (emptyChapters.includes(chapter.id)) {
                                                          setEmptyChapters(prev => prev.filter(id => id !== chapter.id));
                                                        }
                                                      }
                                                    }}
                                                  />
                                                </>
                                              )}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ) : (
                                    /* Picture Book UI */
                                    <div className="space-y-4">
                                      <div className="border rounded-md p-4">
                                        <h4 className="text-sm font-medium mb-4 flex justify-between items-center">
                                          <span>Chapter Images</span>
                                          <span className="text-xs text-muted-foreground">{chapter.images?.length || 0} images</span>
                                        </h4>
                                        
                                        {/* Image gallery with drag-and-drop */}
                                        {chapter.images?.length ? (
                                          <div className="space-y-2 mb-4">
                                            <DndContext
                                              sensors={sensors}
                                              collisionDetection={closestCenter}
                                              onDragEnd={(event: DragEndEvent) => {
                                                const { active, over } = event;
                                                
                                                if (over && active.id !== over.id) {
                                                  // Extract indices from IDs
                                                  const activeId = active.id.toString();
                                                  const overId = over.id.toString();
                                                  
                                                  const activeMatch = activeId.match(/-(\d+)$/);
                                                  const overMatch = overId.match(/-(\d+)$/);
                                                  
                                                  if (activeMatch && overMatch) {
                                                    const activeIndex = parseInt(activeMatch[1]);
                                                    const overIndex = parseInt(overMatch[1]);
                                                    
                                                    reorderImages(
                                                      chapter.id,
                                                      activeIndex,
                                                      overIndex
                                                    );
                                                  }
                                                }
                                              }}
                                            >
                                              <SortableContext
                                                items={chapter.images?.map((_, index) => `image-${chapter.id}-${index}`) || []}
                                                strategy={verticalListSortingStrategy}
                                              >
                                                {chapter.images?.map((img, imgIndex) => (
                                                  <SortableImageItem
                                                    key={`image-${chapter.id}-${imgIndex}`}
                                                    chapter={chapter}
                                                    imgUrl={img}
                                                    imgIndex={imgIndex}
                                                    onRemoveImage={(index) => {
                                                      const updatedImages = [...(chapter.images || [])];
                                                      updatedImages.splice(index, 1);
                                                      
                                                      const updatedChapters = chapters.map(ch => 
                                                        ch.id === chapter.id ? {
                                                          ...ch, 
                                                          images: updatedImages,
                                                          content: updatedImages.length > 0 ? `Picture book with ${updatedImages.length} images` : ''
                                                        } : ch
                                                      );
                                                      setChapters(updatedChapters as Chapter[]);
                                                      
                                                      // Add to empty chapters list if no images
                                                      if (updatedImages.length === 0 && !emptyChapters.includes(chapter.id)) {
                                                        setEmptyChapters(prev => [...prev, chapter.id]);
                                                      }
                                                    }}
                                                  />
                                                ))}
                                              </SortableContext>
                                            </DndContext>
                                          </div>
                                        ) : (
                                          <div className="text-center mb-4 text-sm text-muted-foreground py-4">
                                            No images added yet
                                          </div>
                                        )}
                                        
                                        {/* Upload image button */}
                                        <div className={`border-2 border-dashed rounded-lg p-4 text-center relative ${emptyChapters.includes(chapter.id) ? 'border-destructive bg-destructive/5' : 'border-border'}`}>
                                          <div className="py-2 flex flex-col items-center">
                                            <Upload size={24} className="mb-2 text-muted-foreground" />
                                            <p className="text-sm text-muted-foreground">
                                              Click or drag to upload images
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                              JPG, JPEG, PNG or WebP, max 1MB each
                                            </p>
                                          </div>
                                          <Input
                                            id={`chapter-images-${chapter.id}`}
                                            type="file"
                                            accept="image/jpeg,image/jpg,image/png,image/webp"
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            multiple
                                            onChange={(e) => {
                                              if (e.target.files && e.target.files.length > 0) {
                                                // In a real app, you would upload these files to storage
                                                // Here we'll just simulate it with fake URLs
                                                const newImages = Array.from(e.target.files).map(file => {
                                                  // Create object URLs for preview and store the original filename
                                                  return {
                                                    url: URL.createObjectURL(file),
                                                    fileName: file.name
                                                  };
                                                });
                                                
                                                const updatedImages = [...(chapter.images || []), ...newImages];
                                                
                                                const updatedChapters = chapters.map(ch => 
                                                  ch.id === chapter.id ? {
                                                    ...ch, 
                                                    images: updatedImages,
                                                    content: `Picture book with ${updatedImages.length} images`
                                                  } : ch
                                                );
                                                setChapters(updatedChapters as Chapter[]);
                                                
                                                // Remove from empty chapters list if images are added
                                                if (emptyChapters.includes(chapter.id)) {
                                                  setEmptyChapters(prev => prev.filter(id => id !== chapter.id));
                                                }
                                              }
                                            }}
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                  
                                  {emptyChapters.includes(chapter.id) && (
                                    <div className="flex items-center text-destructive text-xs mt-1">
                                      <AlertCircle size={12} className="mr-1" />
                                      <span>
                                        {bookType === BOOK_TYPES.WORD_BOOK ? 
                                          "Please add content or upload a document" : 
                                          "Please upload at least one image"
                                        }
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Book size={48} className="mx-auto mb-3 text-muted-foreground/50" />
                    <p className="text-muted-foreground mb-4">No chapters added yet</p>
                    <div className="bg-white border border-dashed border-secondary/90 p-6 rounded-lg hover:border-secondary/80 transition-colors">
                      <p className="text-sm mb-3 text-muted-foreground">Start by creating your first chapter</p>
                      
                      <div className="flex gap-2 max-w-md mx-auto">
                        <Input
                          placeholder="Chapter title"
                          value={newChapterTitle}
                          onChange={(e) => setNewChapterTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault(); // Prevent form submission
                              handleAddChapter();
                            }
                          }}
                          ref={newChapterInputRef}
                        />
                        <Button 
                          type="button" 
                          onClick={handleAddChapter} 
                          className="flex-shrink-0"
                        >
                          <Plus size={16} className="mr-2" />
                          Add
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
                
                {chapters.length > 0 && (
                  <div className="bg-white border border-dashed border-secondary/90 p-4 rounded-lg mt-4 hover:border-secondary/80 transition-colors">
                    <div className="flex gap-2">
                      <Input
                        placeholder="New chapter title"
                        value={newChapterTitle}
                        onChange={(e) => setNewChapterTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault(); // Prevent form submission
                            handleAddChapter();
                          }
                        }}
                        ref={newChapterInputRef}
                      />
                      <Button 
                        type="button" 
                        onClick={handleAddChapter} 
                        className="flex-shrink-0"
                      >
                        <Plus size={16} className="mr-2" />
                        Add Chapter
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile-only buttons - Only shown on small screens */}
        <div className="flex justify-end gap-4 md:hidden">
          <Button
            type="button"
            variant="outline"
            className="flex items-center gap-2"
            onClick={handleSaveAsDraft}
            disabled={isSavingDraft || isSubmitting}
          >
            <FileText size={16} />
            {isSavingDraft ? "Saving..." : "Save as Draft"}
          </Button>
          
          <Button
            type="submit"
            className="flex items-center gap-2"
            disabled={isSubmitting || isSavingDraft}
          >
            <Save size={16} />
            {isSubmitting ? "Creating..." : "Create Book"}
          </Button>
        </div>
      </form>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Chapter</DialogTitle>
            <DialogDescription>
              This chapter contains content that will be permanently deleted. Are you sure you want to continue?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-between sm:justify-between">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button 
              type="button" 
              variant="destructive" 
              onClick={() => chapterToDelete && handleRemoveChapter(chapterToDelete)}
            >
              Delete Chapter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 