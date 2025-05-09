import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, ChevronDown, AlertCircle, Pencil, CheckCircle2, Upload, FileText, GripVertical } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PictureImage } from "@/components/books/picture-image";
import { BOOK_TYPES } from "@/models";
import TiptapEditor from "@/components/editor/TiptapEditor";
import { DocumentUploader } from "@/components/books/document-uploader";

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

  console.log("isChapterEditable", isChapterEditable);
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
}: ChapterCreatorProps) {
  const [newChapterTitle, setNewChapterTitle] = useState("");
  const [expandedChapter, setExpandedChapter] = useState<string | null>(null);
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [chapterToDelete, setChapterToDelete] = useState<string | null>(null);
  
  const newChapterInputRef = useRef<HTMLInputElement>(null);
  const editableInputRef = useRef<HTMLInputElement>(null);
  
  // Initialize sensors for drag-and-drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );


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
              <span className="text-muted-foreground">Loading chapters...</span>
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
                      className={`bg-white border rounded-lg mb-3 overflow-hidden ${emptyChapters.includes(chapter.id) ? 'border-destructive' : 'border-border'}`}
                    >
                      <div className="px-4 py-3 flex items-center border-b">
                        <h3 
                          className={`text-md font-medium flex-1 ${
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
                          <Input
                            ref={editableInputRef}
                            defaultValue={chapter.title}
                            className="flex-1 mr-2"
                            onBlur={(e) => {
                              handleChapterTitleUpdate(chapter.id, e.target.value);
                              setEditingChapterId(null);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleChapterTitleUpdate(chapter.id, (e.target as HTMLInputElement).value);
                                setEditingChapterId(null);
                              } else if (e.key === 'Escape') {
                                setEditingChapterId(null);
                              }
                            }}
                            disabled={!isChapterEditable(chapter)}
                          />
                        )}
                        
                        <div className="flex items-center gap-1">
                          {/* Edit button */}
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingChapterId(chapter.id);
                              setTimeout(() => {
                                editableInputRef.current?.focus();
                              }, 0);
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
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
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
                            className="h-8 w-8"
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
                        <div className="px-4 py-3 border-t">
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor={`chapter-content-${chapter.id}`}>Chapter Content</Label>
                              {bookType === BOOK_TYPES.NOVEL ? (
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
                                          // Always allow switching to document upload tab
                                          const updatedChapters = chapters.map(ch => 
                                            ch.id === chapter.id ? {...ch, documentUrl: 'pending'} : ch
                                          );
                                          setChapters(updatedChapters);
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
                                          className={emptyChapters.includes(chapter.id) ? 'border-destructive focus-visible:ring-destructive/40' : ''}
                                          editable={isChapterEditable(chapter)}
                                        />
                                      </div>
                                    )}
                                    
                                    {/* Option 2: Upload document */}
                                    {chapter.documentUrl && (
                                      <div className="border rounded-md p-4">
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
                                          <div className="flex items-center gap-2 text-sm p-2">
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
                                      <div className="text-center mb-4 text-sm text-muted-foreground py-4">
                                        No images added yet
                                      </div>
                                    )}
                                    
                                    {/* For manga books, upload images */}
                                    <div className={`border-2 border-dashed rounded-lg ${emptyChapters.includes(chapter.id) ? 'border-destructive bg-destructive/5' : 'border-border'} p-6 text-center relative`}>
                                      <div className="flex flex-col items-center">
                                        <Upload size={16} className="mb-2 text-muted-foreground" />
                                        <p className="text-sm text-muted-foreground">
                                          Click to upload images
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                          JPG, PNG or WebP (max 5MB each)
                                        </p>
                                        {emptyChapters.includes(chapter.id) && (
                                          <p className="text-xs text-destructive mt-3 font-medium">
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
            <div className="pt-4 pb-2 border-t border-secondary/50">
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <Input 
                    type="text"
                    ref={newChapterInputRef}
                    placeholder="Enter chapter title (optional)"
                    value={newChapterTitle}
                    onChange={(e) => setNewChapterTitle(e.target.value)}
                    className="w-full"
                    disabled={!canAddNewChapters}
                  />
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