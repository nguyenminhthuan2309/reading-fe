import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, ChevronDown, AlertCircle, Pencil, CheckCircle2, Upload, FileText, GripVertical, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PictureImage } from "@/components/books/picture-image";
import { BOOK_TYPES } from "@/models";
import TiptapEditor from "@/components/editor/TiptapEditor";
import { DocumentUploader } from "@/components/books/document-uploader";
import { EnhancementPopover } from "@/components/ui/enhancement-popover";
import { useRecommendation } from "@/lib/hooks/useRecommendation";
import { toast } from "sonner";

// Add Dialog components for confirmation
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Add Accordion components
import {
  Accordion,
  AccordionItem,
} from "@/components/ui/accordion";

// Add Tooltip components
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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

// Define chapter type (for local use)
export type LocalChapter = {
  id: string;
  chapter: number;
  title: string;
  content: string; // Now can contain stringified JSON from WYSIWYG editor
  isLocked: boolean;
  price?: string;
  createdAt: string;
  updatedAt: string;
  images?: Array<string | {url: string, fileName: string}>; // For picture books
  documentUrl?: string; // For uploaded .doc files
  moderated?: string;
};

// Create a sortable item component for the images
const SortableImageItem = ({ 
  imgUrl, 
  imgIndex,
  onRemoveImage,
  chapter,
  isChapterEditable
}: {
  imgUrl: string | {url: string, fileName: string};
  imgIndex: number;
  onRemoveImage: (index: number) => void;
  chapter: LocalChapter;
  isChapterEditable: boolean;
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
      className="flex items-center gap-3 p-2 bg-background dark:bg-gray-700 border dark:border-gray-600 rounded-md"
    >
      <div 
        {...attributes}
        {...listeners}
        className="cursor-grab"
      >
        <GripVertical size={16} className="text-muted-foreground dark:text-gray-400" />
      </div>
      
      <div className="relative h-16 aspect-[4/3] rounded-md overflow-hidden border dark:border-gray-600 flex-shrink-0">
        <PictureImage
          src={url}
          alt={`Page ${imgIndex + 1} - ${fileName}`}
          className="h-16" 
        />
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate flex items-center dark:text-white">
          <span>Page {imgIndex + 1}</span>
        </p>
        <p className="text-xs text-muted-foreground dark:text-gray-400 truncate">
          {fileName}
        </p>
      </div>
      
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground hover:text-yellow-600 dark:text-gray-400 dark:hover:text-yellow-400"
        disabled={!isChapterEditable}
        onClick={() => onRemoveImage(imgIndex)}
      >
        <Trash2 size={16} />
      </Button>
    </div>
  );
};

interface ChapterCreatorProps {
  bookType: string;
  chapters: LocalChapter[];
  setChapters: (chapters: LocalChapter[]) => void;
  emptyChapters: string[];
  errors?: Record<string, string>;
  isLoadingChapters?: boolean;
  onDeleteChapter?: (chapterId: string, chapterNumber: number) => Promise<void>;
  canEditExistingChapters?: boolean;
  canAddNewChapters?: boolean;
  canEditChapter: (chapter: LocalChapter) => boolean;
  // Enhancement context
  bookTitle?: string;
  bookDescription?: string;
  bookGenres?: string[];
}

export default function ChapterCreator({
  bookType,
  chapters,
  emptyChapters,
  setChapters,
  errors = {},
  isLoadingChapters = false,
  onDeleteChapter,
  canEditExistingChapters = true,
  canAddNewChapters = true,
  canEditChapter,
  bookTitle,
  bookDescription,
  bookGenres,
}: ChapterCreatorProps) {
  const [newChapterTitle, setNewChapterTitle] = useState("");
  const [expandedChapter, setExpandedChapter] = useState<string | null>(null);
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null);
  const [editingChapterTitle, setEditingChapterTitle] = useState<string>("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [chapterToDelete, setChapterToDelete] = useState<string | null>(null);
  
  const newChapterInputRef = useRef<HTMLInputElement>(null);
  const editableInputRef = useRef<HTMLInputElement>(null);
  
  // Initialize recommendation hook for chapter title enhancement
  const recommendation = useRecommendation();
  
  // Initialize sensors for drag-and-drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Enhanced AI-powered chapter title enhancement for new chapters
  const enhanceNewChapterTitle = async (): Promise<string> => {
    if (!newChapterTitle.trim()) {
      throw new Error('Please enter a chapter title first');
    }

    try {
      const enhancedTitle = await recommendation.enhanceChapterTitle.mutateAsync({
        chapterTitle: newChapterTitle,
        context: {
          bookTitle: bookTitle || undefined,
          bookDescription: bookDescription || undefined,
          bookGenres: bookGenres && bookGenres.length > 0 ? bookGenres : undefined,
          chapterNumber: chapters.length + 1,
          bookType: bookType,
        }
      });

      return enhancedTitle;
    } catch (error) {
      console.error('Error enhancing new chapter title:', error);
      throw error;
    }
  };

  // Enhanced AI-powered chapter title enhancement
  const enhanceChapterTitleForChapter = async (chapter: LocalChapter): Promise<string> => {
    // Use the editing title if we're in edit mode, otherwise use the chapter's current title
    const titleToEnhance = editingChapterId === chapter.id ? editingChapterTitle : chapter.title;
    
    if (!titleToEnhance.trim()) {
      throw new Error('Please enter a chapter title first');
    }

    try {
      const enhancedTitle = await recommendation.enhanceChapterTitle.mutateAsync({
        chapterTitle: titleToEnhance,
        context: {
          bookTitle: bookTitle || undefined,
          bookDescription: bookDescription || undefined,
          bookGenres: bookGenres && bookGenres.length > 0 ? bookGenres : undefined,
          chapterNumber: chapter.chapter,
          bookType: bookType,
        }
      });

      return enhancedTitle;
    } catch (error) {
      console.error('Error enhancing chapter title:', error);
      throw error;
    }
  };

  const handleAddChapter = () => {    
    // Create a new chapter with an auto-generated title
    const newChapter: LocalChapter = {
      id: `chapter-${Date.now()}`,
      chapter: chapters.length + 1,
      title: newChapterTitle ? newChapterTitle : `Chapter ${chapters.length + 1}`,
      content: '',
      isLocked: false,
      // price: "0",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      // Initialize appropriate fields based on book type
      images: bookType === BOOK_TYPES.MANGA ? [] : undefined,
      documentUrl: undefined
    };
    
    // Add the new chapter to the chapters array
    setChapters([...chapters, newChapter]);
    
    // Automatically expand the new chapter
    setExpandedChapter(newChapter.id);

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
  
  const handleRemoveChapter = async (id: string) => {
    const chapter = chapters.find(ch => ch.id === id);
    if (!chapter) return;
    
    // If we have an external delete handler, use it
    if (onDeleteChapter) {
      await onDeleteChapter(id, chapter.chapter);
    } else {
      // Default behavior - just update local state
      setChapters(chapters.filter(chapter => chapter.id !== id));
    }
    
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
      content: bookType === BOOK_TYPES.MANGA ? 
        `Picture book with ${(updatedChapters[chapterIndex].images?.length || 0) + imageObjects.length} images` : 
        updatedChapters[chapterIndex].content || "",
    };

    updatedChapters[chapterIndex] = updatedChapter;

    // Remove this chapter from empty chapters if it now has images
    if (updatedChapter.images && updatedChapter.images.length > 0 && emptyChapters.includes(chapterId)) {
      // No longer calling setEmptyChapters as it's handled in parent
    }

    setChapters(updatedChapters);

    // Reset file input
    e.target.value = "";
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

  // Toggle chapter expansion
  const toggleChapter = (chapterId: string) => {
    if (expandedChapter === chapterId) {
      setExpandedChapter(null);
    } else {
      setExpandedChapter(chapterId);
    }
  };

  // Helper function for error messages
  const ErrorMessage = ({ message }: { message: string }) => (
    <div className="flex items-center text-yellow-600 dark:text-yellow-400 text-xs mt-1">
      <AlertCircle size={12} className="mr-1.5" />
      <span>{message}</span>
    </div>
  );

  // Function to handle chapter title edit completion
  const handleChapterTitleUpdate = (chapterId: string, newTitle: string) => {
    const updatedChapters = chapters.map(ch => 
      ch.id === chapterId ? {...ch, title: newTitle || `Chapter ${chapters.findIndex(c => c.id === chapterId) + 1}`} : ch
    );
    setChapters(updatedChapters);
  };

  // Function to start editing a chapter title
  const startEditingChapterTitle = (chapterId: string, currentTitle: string) => {
    setEditingChapterId(chapterId);
    setEditingChapterTitle(currentTitle);
    setTimeout(() => {
      editableInputRef.current?.focus();
    }, 0);
  };

  // Function to save chapter title changes
  const saveChapterTitleEdit = () => {
    if (editingChapterId) {
      handleChapterTitleUpdate(editingChapterId, editingChapterTitle);
      setEditingChapterId(null);
      setEditingChapterTitle("");
    }
  };

  // Function to cancel chapter title editing
  const cancelChapterTitleEdit = () => {
    setEditingChapterId(null);
    setEditingChapterTitle("");
  };

  // Handle escape key globally when editing
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && editingChapterId) {
        cancelChapterTitleEdit();
      }
    };

    if (editingChapterId) {
      document.addEventListener('keydown', handleEscapeKey);
      return () => document.removeEventListener('keydown', handleEscapeKey);
    }
  }, [editingChapterId]);

  const handleRemoveImage = (chapterId: string, imageIndex: number) => {
    const chapter = chapters.find(ch => ch.id === chapterId);
    if (!chapter || !chapter.images) return;
    
    // Remove the image at the specified index
    const updatedImages = [...chapter.images];
    updatedImages.splice(imageIndex, 1);
    
    // Update the chapters state
    const updatedChapters = chapters.map(ch => 
      ch.id === chapterId ? { ...ch, images: updatedImages } : ch
    );
    
    setChapters(updatedChapters);
    
    // Only remove from empty chapters list if images are added, not adding to it when removed
    if (updatedImages.length > 0 && emptyChapters.includes(chapterId)) {
      // No longer calling setEmptyChapters as it's handled in parent
    }
  };

  // Handle document upload
  const handleDocumentUpload = async (
    docUrl: string, 
    docContent: string | null,
    fileName: string,
    chapterId: string
  ) => {
    // Update the chapter with the document URL and content
    const updatedChapters = chapters.map(ch => {
      if (ch.id === chapterId) {
        return {
          ...ch,
          documentUrl: docUrl,
          content: docContent || ch.content
        };
      }
      return ch;
    });
    
    setChapters(updatedChapters);
    
    // If this chapter was in the empty chapters list, remove it since it now has content
    if (emptyChapters.includes(chapterId)) {
      // No longer calling setEmptyChapters as it's handled in parent
    }
  };

  // Update chapter content
  const handleContentChange = (chapterId: string, content: string) => {
    const updatedChapters = chapters.map(ch => {
      if (ch.id === chapterId) {
        return {
          ...ch,
          content: content || "",
          updatedAt: new Date().toISOString(),
        };
      }
      return ch;
    });
    
    setChapters(updatedChapters);
    
    // If the chapter now has content, remove it from the empty chapters list
    if (content && emptyChapters.includes(chapterId)) {
      // No longer calling setEmptyChapters as it's handled in parent
    }
  };

  // Add helper function to determine if a chapter is editable
  const isChapterEditable = (chapter: LocalChapter): boolean => {
    if (chapter.id.startsWith('chapter-')) {
      return canAddNewChapters;
    }
    return canEditChapter(chapter);
  };

  return (
    <div className="ChapterCreator">
      <div className="px-6 py-4 bg-secondary/30 dark:bg-gray-700/50 border-b border-secondary/90 dark:border-gray-600 flex items-center justify-between">
        <h3 className="text-lg font-medium flex items-center gap-3 dark:text-white">
          Chapters
          {chapters.length > 0 && (
            <span className="text-sm bg-secondary dark:bg-gray-600 text-secondary-foreground dark:text-gray-200 rounded-full px-3 py-1 font-medium">
              {chapters.length}
            </span>
          )}
        </h3>
        {errors.chapters && (
          <div className="text-xs p-1.5 bg-yellow-100/10 dark:bg-yellow-900/20 border border-yellow-500 dark:border-yellow-600 rounded-md flex-shrink-0">
            <p className="flex items-center text-yellow-600 dark:text-yellow-400">
              <Trash2 size={12} className="mr-1.5 flex-shrink-0" />
              <span className="line-clamp-1">{errors.chapters}</span>
            </p>
          </div>
        )}
      </div>

      <div className="p-6">
        {isLoadingChapters ? (
          <div className="text-center py-8">
            <div className="flex items-center justify-center gap-2">
              <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full"></div>
              <span className="text-muted-foreground dark:text-gray-400">Loading chapters...</span>
            </div>
          </div>
        ) : (
          <>
            {/* Chapter list with accordion */}
            {chapters.length > 0 && (
              <div className="mb-6">
                <Accordion type="single" value={expandedChapter || undefined} className="mb-6">
                  {chapters.map((chapter, index) => (
                    <AccordionItem 
                      key={chapter.id} 
                      value={chapter.id}
                      className={`bg-white dark:bg-gray-800 border rounded-lg mb-3 overflow-hidden ${emptyChapters.includes(chapter.id) ? 'border-yellow-500 dark:border-yellow-500' : 'border-border dark:border-gray-700'}`}
                    >
                      <div className="px-4 py-3 flex items-center border-b dark:border-gray-700">
                        <h3 
                          className={`text-md font-medium flex-1 dark:text-white ${
                            chapter.id === editingChapterId 
                              ? 'hidden' 
                              : 'block'
                          }`}
                          onClick={() => toggleChapter(chapter.id)}
                        >
                          {`Chapter ${chapter.chapter}: ${chapter.title}`}
                        </h3>
                        
                        {/* Editable title field */}
                        {chapter.id === editingChapterId && (
                          <div className="flex-1 mr-2" onClick={(e) => e.stopPropagation()}>
                            <div className="relative bg-muted/30 dark:bg-gray-700/50 rounded-md border border-input dark:border-gray-600">
                              <Input
                                ref={editableInputRef}
                                value={editingChapterTitle}
                                onChange={(e) => setEditingChapterTitle(e.target.value)}
                                className="pr-[100px] border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 dark:text-white"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    saveChapterTitleEdit();
                                  } else if (e.key === 'Escape') {
                                    cancelChapterTitleEdit();
                                  }
                                }}
                                disabled={!isChapterEditable(chapter)}
                                onClick={(e) => e.stopPropagation()}
                                placeholder="Enter chapter title"
                              />
                              
                              {/* Action buttons - positioned inside input on the right */}
                              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                {/* Enhancement button - no background */}
                                <EnhancementPopover
                                  onEnhance={() => enhanceChapterTitleForChapter(chapter)}
                                  onApply={(enhancedTitle) => {
                                    setEditingChapterTitle(enhancedTitle);
                                    toast.success('Chapter title enhanced successfully!');
                                    // Update the input value and focus it so user can see the change
                                    setTimeout(() => {
                                      if (editableInputRef.current) {
                                        editableInputRef.current.value = enhancedTitle;
                                        editableInputRef.current.focus();
                                      }
                                    }, 100);
                                  }}
                                  disabled={!isChapterEditable(chapter)}
                                  placeholder="Enhanced chapter title will appear here..."
                                  triggerClassName="relative right-0 top-0 translate-y-0 h-6 w-6 hover:bg-transparent"
                                >
                                  <div></div>
                                </EnhancementPopover>
                                
                                {/* Save button */}
                                <Button
                                  type="button"
                                  size="sm"
                                  onClick={saveChapterTitleEdit}
                                  disabled={!isChapterEditable(chapter)}
                                  className="h-6 w-6 p-0"
                                  title="Save changes (Enter)"
                                >
                                  <CheckCircle2 size={14} />
                                </Button>
                                
                                {/* Cancel button */}
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={cancelChapterTitleEdit}
                                  className="h-6 w-6 p-0"
                                  title="Cancel changes (Escape)"
                                >
                                  <X size={14} />
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-1">
                          {/* Edit button */}
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 dark:text-gray-400 dark:hover:text-gray-200"
                            onClick={(e) => {
                              e.stopPropagation();
                              startEditingChapterTitle(chapter.id, chapter.title);
                            }}
                            disabled={!isChapterEditable(chapter)}
                          >
                        <Pencil size={16} />
                          </Button>
                          
                          {/* Delete button */}
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-yellow-600 dark:text-gray-400 dark:hover:text-yellow-400"
                            onClick={(e) => {
                              e.stopPropagation();
                              confirmDeleteChapter(chapter.id);
                            }}
                            disabled={!isChapterEditable(chapter)}
                          >
                            <Trash2 size={16} />
                          </Button>
                          
                          {/* Expand/collapse button */}
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 dark:text-gray-400 dark:hover:text-gray-200"
                            onClick={() => toggleChapter(chapter.id)}
                          >
                            <ChevronDown 
                              size={16} 
                              className={`transform transition-transform ${
                                expandedChapter === chapter.id ? 'rotate-180' : ''
                              }`}
                            />
                          </Button>
                        </div>
                      </div>
                      {expandedChapter === chapter.id && (
                        <div className="px-4 py-3 border-t dark:border-gray-700">
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor={`chapter-content-${chapter.id}`} className="dark:text-white">Chapter Content</Label>
                              {bookType === BOOK_TYPES.NOVEL ? (
                                <div className="space-y-4">
                                  <div className="flex flex-col gap-2">
                                    <div className="inline-flex w-full border-b dark:border-gray-700">
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
                                            : 'border-transparent text-muted-foreground dark:text-gray-400 hover:text-foreground dark:hover:text-gray-200'
                                        }`}
                                      >
                                        Write Content
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          // Always allow switching to document upload tab
                                          const updatedChapters = chapters.map(ch => 
                                            ch.id === chapter.id ? {...ch, documentUrl: 'pending'} : ch
                                          );
                                          setChapters(updatedChapters);
                                        }}
                                        className={`px-4 py-2 font-medium text-sm flex-1 border-b-2 transition-colors ${
                                          chapter.documentUrl 
                                            ? 'border-primary text-primary' 
                                            : 'border-transparent text-muted-foreground dark:text-gray-400 hover:text-foreground dark:hover:text-gray-200'
                                        }`}
                                      >
                                        Upload Document
                                      </button>
                                    </div>
                                    
                                    {/* Option 1: Write content directly */}
                                    {!chapter.documentUrl && (
                                      <div className="border dark:border-gray-600 rounded-md p-4">
                                        <TiptapEditor 
                                          content={chapter.content}
                                          onChange={(newContent) => {
                                            const updatedChapters = chapters.map(ch => 
                                              ch.id === chapter.id ? {
                                                ...ch, 
                                                content: newContent
                                              } : ch
                                            );
                                            setChapters(updatedChapters);
                                            
                                            // Only remove from empty chapters if content is added
                                            if (newContent.trim() !== "" && emptyChapters.includes(chapter.id)) {
                                              // No longer calling setEmptyChapters as it's handled in parent
                                            }
                                          }}
                                          className={emptyChapters.includes(chapter.id) ? 'border-yellow-500 focus-visible:ring-yellow-500/40' : ''}
                                          editable={isChapterEditable(chapter)}
                                        />
                                      </div>
                                    )}
                                    
                                    {/* Option 2: Upload document */}
                                    {chapter.documentUrl && (
                                      <div className="border dark:border-gray-600 rounded-md p-4">
                                        {chapter.documentUrl === 'pending' ? (
                                          <DocumentUploader 
                                            onContentConverted={(jsonContent) => {
                                              const updatedChapters = chapters.map(ch => 
                                                ch.id === chapter.id ? {
                                                  ...ch, 
                                                  documentUrl: 'converted',  // Mark as converted instead of using a fake URL
                                                  content: jsonContent
                                                } : ch
                                              );
                                              setChapters(updatedChapters);
                                              
                                              // Remove from empty chapters list if document was converted successfully
                                              if (emptyChapters.includes(chapter.id)) {
                                                // No longer calling setEmptyChapters as it's handled in parent
                                              }
                                            }}
                                            disabled={!isChapterEditable(chapter)}
                                          />
                                        ) : (
                                          <div className="flex items-center gap-2 text-sm p-2 dark:text-gray-200">
                                            <FileText size={16} className="text-primary" />
                                            <span className="font-medium">Document converted to editor format</span>
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
                                              disabled={!isChapterEditable(chapter)}
                                            >
                                              Remove
                                            </Button>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                /* Picture Book UI */
                                <div className="space-y-4">
                                  <div className="border dark:border-gray-600 rounded-md p-4">
                                    <h4 className="text-sm font-medium mb-4 flex justify-between items-center dark:text-white">
                                      <span>Chapter Images</span>
                                      <span className="text-xs text-muted-foreground dark:text-gray-400">{chapter.images?.length || 0} images</span>
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
                                            disabled={!isChapterEditable(chapter)}
                                          >
                                            {chapter.images?.map((img, imgIndex) => (
                                              <SortableImageItem
                                                key={`image-${chapter.id}-${imgIndex}`}
                                                chapter={chapter}
                                                imgUrl={img}
                                                imgIndex={imgIndex}
                                                onRemoveImage={(index) => {
                                                  handleRemoveImage(chapter.id, index);
                                                }}
                                                isChapterEditable={isChapterEditable(chapter)}
                                              />
                                            ))}
                                          </SortableContext>
                                        </DndContext>
                                      </div>
                                    ) : (
                                      <div className="text-center mb-4 text-sm text-muted-foreground dark:text-gray-400 py-4">
                                        No images added yet
                                      </div>
                                    )}
                                    
                                    {/* For manga books, upload images */}
                                    <div className={`border-2 border-dashed rounded-lg ${emptyChapters.includes(chapter.id) ? 'border-yellow-500 dark:border-yellow-500 bg-yellow-50/5 dark:bg-yellow-900/10' : 'border-yellow-500 dark:border-yellow-500'} p-6 text-center relative`}>
                                      <div className="flex flex-col items-center">
                                        <Upload size={16} className="mb-2 text-yellow-600 dark:text-yellow-400" />
                                        <p className="text-sm text-yellow-600 dark:text-yellow-400">
                                          Click to upload images
                                        </p>
                                        <p className="text-xs text-muted-foreground dark:text-gray-500 mt-1">
                                          JPG, PNG or WebP (max 5MB each)
                                        </p>
                                        {emptyChapters.includes(chapter.id) && (
                                          <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-3 font-medium">
                                            Please add at least one image to this chapter
                                          </p>
                                        )}
                                      </div>

                                      
                                      <Input
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        onChange={(e) => handleImageUpload(e, chapter.id)}
                                        disabled={!isChapterEditable(chapter)}
                                      />
                                    </div>
                                  </div>
                                </div>
                              )}
                              
                              {emptyChapters.includes(chapter.id) && (
                                <ErrorMessage message={
                                  bookType === BOOK_TYPES.NOVEL ? 
                                    "Please add content or upload a document" : 
                                    "Please upload at least one image"
                                } />
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            )}

            {/* Add new chapter */}
            <div className="pt-4 pb-2 border-t border-secondary/50 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <EnhancementPopover
                    onEnhance={enhanceNewChapterTitle}
                    onApply={(enhancedTitle) => {
                      setNewChapterTitle(enhancedTitle);
                      toast.success('Chapter title enhanced successfully!');
                    }}
                    disabled={!canAddNewChapters}
                    placeholder="Enhanced chapter title will appear here..."
                  >
                    <Input 
                      type="text"
                      ref={newChapterInputRef}
                      placeholder="Enter chapter title (optional)"
                      value={newChapterTitle}
                      onChange={(e) => setNewChapterTitle(e.target.value)}
                      className="w-full pr-10"
                      disabled={!canAddNewChapters}
                    />
                  </EnhancementPopover>
                </div>
                <Button
                  type="button"
                  onClick={handleAddChapter}
                  className="gap-1.5"
                  disabled={!canAddNewChapters}
                >
                  <Plus size={16} />
                  Add Chapter
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
      
      {/* Delete confirmation dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this chapter?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. The chapter will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => {
                if (chapterToDelete) {
                  handleRemoveChapter(chapterToDelete);
                }
              }}
            >
              Delete Chapter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 