import { Button } from "@/components/ui/button";
import { Upload, Sparkles, AlertCircle, PanelLeftOpen, PanelLeftClose, Camera } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MultiSelect } from "@/components/ui/multi-select";
import { EnhancementPopover } from "@/components/ui/enhancement-popover";
import { toast } from "sonner";

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

import { BOOK_TYPES, AGE_RATINGS, AgeRatingEnum, PROGRESS_STATUSES, ProgressStatusEnum } from "@/models";

// Helper function to display error messages
const ErrorMessage = ({ message }: { message: string }) => (
  <div className="flex items-center text-yellow-600 dark:text-yellow-400 text-xs mt-1">
    <AlertCircle size={12} className="mr-1" />
    <span>{message}</span>
  </div>
);

interface Genre {
  id: number;
  name: string;
}

interface BookInfoProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
  errors: Record<string, string>;
  titleInputRef?: React.RefObject<HTMLInputElement>;
  descriptionTextareaRef?: React.RefObject<HTMLTextAreaElement>;
  coverImage: File | null;
  coverImagePreview: string | null;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  bookType: string;
  handleBookTypeChange: (value: string) => void;
  selectedGenres: string[];
  setSelectedGenres: (genres: string[]) => void;
  ageRating: number;
  setAgeRating: (rating: number) => void;
  progressStatus: number;
  setProgressStatus: (status: number) => void;
  genres?: Genre[];
  isEnhancingTitle: boolean;
  enhanceTitle: () => Promise<string>;
  isEnhancingDescription: boolean;
  enhanceDescription: () => Promise<string>;
  isEditing?: boolean;
  canEdit?: boolean;
  canEditProgressStatus?: boolean;
  reasonIfDenied?: string;
  titleValue: string;
  descriptionValue: string;
  onTitleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDescriptionChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  disabled?: boolean;
  onTitleApply?: (enhancedTitle: string) => void;
  onDescriptionApply?: (enhancedDescription: string) => void;
}

export default function BookInfo({
  isCollapsed,
  setIsCollapsed,
  errors,
  coverImagePreview,
  handleImageUpload,
  bookType,
  handleBookTypeChange,
  selectedGenres,
  setSelectedGenres,
  ageRating,
  setAgeRating,
  progressStatus,
  setProgressStatus,
  genres = [],
  isEnhancingTitle,
  enhanceTitle,
  isEnhancingDescription,
  enhanceDescription,
  isEditing = false,
  canEdit = false,
  canEditProgressStatus = true,
  titleValue = "",
  descriptionValue = "",
  onTitleChange,
  onDescriptionChange,
  onTitleApply,
  onDescriptionApply,
}: BookInfoProps) {
  return (
    <div className="w-full relative">
      <div className="space-y-4">
        {/* Cover and Info Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          {/* Left Column - Cover Image (25% width) */}
          <div className="lg:col-span-1 h-full">
            {/* Cover Image */}
            <div className="space-y-2 h-full flex flex-col">
              <Label htmlFor="cover-upload" className="flex items-center dark:text-white">
                Cover Image
                <span className="text-yellow-600 dark:text-yellow-400 ml-1">*</span>
              </Label>
              <div className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center flex-1 min-h-[400px] w-full ${errors.coverImage ? 'border-yellow-500 dark:border-yellow-500 bg-yellow-50/5 dark:bg-yellow-900/10' : 'border-yellow-500 dark:border-yellow-500'} relative`}>
                {coverImagePreview ? (
                  <div className="relative w-full h-full min-h-[300px] rounded-lg overflow-hidden mb-2 hover:cursor-pointer group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={coverImagePreview} 
                      alt="Book cover preview" 
                      className="object-cover w-full h-full"
                    />
                    
                    {/* Overlay for edit mode - removed z-10 and made pointer-events-none */}
                    {isEditing && (
                      <div className="absolute inset-x-0 inset-y-[8px] bg-black/50 opacity-0 group-hover:opacity-80 flex flex-col items-center justify-center text-white pointer-events-none">
                        <Camera className="h-8 w-8 mb-2" />
                        <p className="text-sm font-medium">Update Cover</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center py-10 w-full">
                    <Upload size={48} className={`mb-2 ${errors.coverImage ? 'text-yellow-600 dark:text-yellow-400' : 'text-yellow-600 dark:text-yellow-400'}`} />
                    <p className={`text-sm ${errors.coverImage ? 'text-yellow-600 dark:text-yellow-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
                      Click or drag to upload cover image
                    </p>
                    <p className="text-xs text-muted-foreground dark:text-gray-500 mt-1">
                      JPG, JPEG, PNG or WebP, max 1MB
                    </p>
                  </div>
                )}
                <Input
                  id="cover-upload"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                  onChange={handleImageUpload}
                  disabled={!canEdit}
                />
              </div>
              {errors.coverImage ? (
                <ErrorMessage message={errors.coverImage} />
              ) : (
                <p className="text-xs text-muted-foreground dark:text-gray-400 mt-1">
                  {isEditing && coverImagePreview ? (canEdit ? 'Click image to update cover' : 'Cover image cannot be updated') : 'Upload a cover image for your book'}
                </p>
              )}
            </div>
          </div>

          {/* Right Column - All Other Info (75% width) */}
          <div className="lg:col-span-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title" className="flex items-center dark:text-white">
                  Book Title
                  <span className="text-yellow-600 dark:text-yellow-400 ml-1">*</span>
                </Label>
                <div className="relative">
                  <EnhancementPopover
                    onEnhance={enhanceTitle}
                    onApply={(enhancedTitle) => {
                      if (onTitleApply) {
                        onTitleApply(enhancedTitle);
                      } else {
                        // Create a synthetic event to update the title
                        const syntheticEvent = {
                          target: { value: enhancedTitle }
                        } as React.ChangeEvent<HTMLInputElement>;
                        onTitleChange(syntheticEvent);
                      }
                      toast.success('Title enhanced successfully!');
                    }}
                    disabled={!canEdit}
                    placeholder="Enhanced title will appear here..."
                  >
                    <Input
                      id="title"
                      className={errors.title ? 'border-yellow-500 pr-10' : 'pr-10'}
                      placeholder="Enter book title"
                      disabled={!canEdit}
                      value={titleValue}
                      onChange={onTitleChange}
                    />
                  </EnhancementPopover>
                </div>
                {errors.title && <ErrorMessage message={errors.title} />}
                {!errors.title && (
                  <p className="text-xs text-muted-foreground dark:text-gray-400 mt-1">
                    Create a compelling title that captures your book's essence
                  </p>
                )}
              </div>

              {/* Genres */}
              <div className="space-y-2">
                <Label htmlFor="genres" className="flex items-center dark:text-white">
                  Genres
                  <span className="text-yellow-600 dark:text-yellow-400 ml-1">*</span>
                </Label>
                <MultiSelect
                  options={genres?.map(genre => ({
                    label: genre.name,
                    value: genre.id.toString()
                  })) || []}
                  selected={selectedGenres}
                  onChange={(selected) => {
                    setSelectedGenres(selected);
                  }}
                  placeholder="Select genres (multiple)"
                  className={`w-full ${errors.genres ? 'border-yellow-500' : ''}`}
                  disabled={!canEdit}
                />
                {errors.genres ? (
                  <ErrorMessage message={errors.genres} />
                ) : (
                  <p className="text-xs text-muted-foreground dark:text-gray-400 mt-1">
                    Select at least one genre
                  </p>
                )}
              </div>

              {/* Age Rating and Progress Status */}
              <div className="space-y-4">
                {/* Age Rating */}
                <div className="space-y-2">
                  <Label htmlFor="age-rating" className="flex items-center dark:text-white">
                    Age Rating
                    <span className="text-yellow-600 dark:text-yellow-400 ml-1">*</span>
                  </Label>
                  <Select
                    value={ageRating.toString()}
                    onValueChange={(value) => {
                      setAgeRating(parseInt(value));
                    }}
                    disabled={!canEdit}
                  >
                    <SelectTrigger id="age-rating" className={errors.ageRating ? 'border-yellow-500' : ''}>
                      <SelectValue placeholder="Select age rating" />
                    </SelectTrigger>
                    <SelectContent>
                      {AGE_RATINGS.map((rating) => (
                        <SelectItem key={rating.id} value={rating.id.toString()}>
                          {rating.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.ageRating ? (
                    <ErrorMessage message={errors.ageRating} />
                  ) : (
                    <p className="text-xs text-muted-foreground dark:text-gray-400 mt-1">
                      Select appropriate age rating for your content
                    </p>
                  )}
                </div>

                {/* Progress Status */}
                <div className="space-y-2">
                  <Label htmlFor="progress-status" className="flex items-center dark:text-white">
                    Progress Status
                    <span className="text-yellow-600 dark:text-yellow-400 ml-1">*</span>
                  </Label>
                  <Select
                    value={progressStatus.toString()}
                    onValueChange={(value) => {
                      setProgressStatus(parseInt(value));
                    }}
                    disabled={!canEditProgressStatus}
                  >
                    <SelectTrigger id="progress-status" className={errors.progressStatus ? 'border-yellow-500' : ''}>
                      <SelectValue placeholder="Select progress status" />
                    </SelectTrigger>
                    <SelectContent>
                      {PROGRESS_STATUSES.map((status) => (
                        <SelectItem key={status.id} value={status.id.toString()} disabled={status.id === ProgressStatusEnum.DROPPED}>
                          {status.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.progressStatus ? (
                    <ErrorMessage message={errors.progressStatus} />
                  ) : (
                    <p className="text-xs text-muted-foreground dark:text-gray-400 mt-1">
                      {!canEditProgressStatus 
                        ? "Progress status cannot be changed" 
                        : "Select the current progress status of your book"}
                    </p>
                  )}
                </div>
              </div>

              {/* Book Type */}
              <div className="space-y-2">
                <Label className="flex items-center dark:text-white">
                  Book Type
                  <span className="text-yellow-600 dark:text-yellow-400 ml-1">*</span>
                </Label>
                <RadioGroup
                  value={bookType}
                  onValueChange={handleBookTypeChange}
                  className={`space-y-3 ${errors.bookType ? 'border-yellow-500' : ''}`}
                  disabled={!canEdit}
                >
                  <div className={`flex items-center space-x-2 border p-3 rounded-md transition-all ${
                    bookType === BOOK_TYPES.NOVEL 
                      ? 'border-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 shadow-sm' 
                      : 'border-border dark:border-gray-600 hover:border-muted-foreground/20 dark:hover:border-gray-500'
                  }`}>
                    <RadioGroupItem value={BOOK_TYPES.NOVEL} id="word-book" />
                    <Label htmlFor="word-book" className="font-normal cursor-pointer dark:text-white">
                      <div className="flex flex-col">
                        <span className="font-medium">{BOOK_TYPES.NOVEL}</span>
                        <span className="text-xs text-muted-foreground dark:text-gray-400">Text-based book with written content</span>
                      </div>
                    </Label>
                  </div>
                  
                  <div className={`flex items-center space-x-2 border p-3 rounded-md transition-all ${
                    bookType === BOOK_TYPES.MANGA 
                      ? 'border-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 shadow-sm' 
                      : 'border-border dark:border-gray-600 hover:border-muted-foreground/20 dark:hover:border-gray-500'
                  }`}>
                    <RadioGroupItem value={BOOK_TYPES.MANGA} id="picture-book" />
                    <Label htmlFor="picture-book" className="font-normal cursor-pointer dark:text-white">
                      <div className="flex flex-col">
                        <span className="font-medium">{BOOK_TYPES.MANGA}</span>
                        <span className="text-xs text-muted-foreground dark:text-gray-400">Image-based book with illustration uploads and captions</span>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
                {errors.bookType ? (
                  <ErrorMessage message={errors.bookType} />
                ) : (
                  <p className="text-xs text-muted-foreground dark:text-gray-400 mt-1">
                    Select whether this is primarily a word-based or picture-based book
                  </p>
                )}
              </div>
            </div>

            {/* Description - Full Width */}
            <div className="space-y-2 mt-4">
              <Label htmlFor="description" className="flex items-center dark:text-white">
                Description
                <span className="text-yellow-600 dark:text-yellow-400 ml-1">*</span>
              </Label>
              <div className="relative">
                <EnhancementPopover
                  onEnhance={enhanceDescription}
                  onApply={(enhancedDescription) => {
                    if (onDescriptionApply) {
                      onDescriptionApply(enhancedDescription);
                    } else {
                      // Create a synthetic event to update the description
                      const syntheticEvent = {
                        target: { value: enhancedDescription }
                      } as React.ChangeEvent<HTMLTextAreaElement>;
                      onDescriptionChange(syntheticEvent);
                    }
                    toast.success('Description enhanced successfully!');
                  }}
                  disabled={!canEdit}
                  placeholder="Enhanced description will appear here..."
                  triggerClassName="top-4"
                >
                  <Textarea
                    id="description"
                    className={errors.description ? 'border-yellow-500 resize-none min-h-[120px] pr-10' : 'resize-none min-h-[120px] pr-10'}
                    placeholder="Enter book description"
                    rows={5}
                    disabled={!canEdit}
                    value={descriptionValue}
                    onChange={onDescriptionChange}
                  />
                </EnhancementPopover>
              </div>
              {errors.description && <ErrorMessage message={errors.description} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 