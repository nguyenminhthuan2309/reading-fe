import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CheckCircle2,
  Shield,
  AlertCircle,
  Loader2,
  FileText,
  Image,
  BookOpen,
  AlertTriangle,
  ShieldAlert,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

import { MODERATION_MODELS, ModerationModelType, DisplayModerationModelType } from "@/lib/hooks/useOpenAI";
import { EnhancedModerationResult } from "@/models/openai";
import { ContentResult } from "./ContentResults";
import { AGE_RATING_THRESHOLDS } from "@/lib/api/openai";
import { ModerationResultsPayload } from "@/models/openai";
import { useModerationResults, useSaveModerationResults } from "@/lib/hooks/useModerationResults";
import { processAllModerationResults, checkCategoryScores } from "@/lib/utils/moderation";
import { AgeRatingEnum } from "@/models/book";

// Primary numeric type that we now use
export type NumericAgeRating =  AgeRatingEnum;

export interface ModerationResultsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  results: EnhancedModerationResult | null;
  selectedModel: DisplayModerationModelType;
  onModelChange: (model: DisplayModerationModelType) => void;
  onRecheck?: (isEdit: boolean) => void;
  isLoading?: boolean;
  bookAgeRating?: NumericAgeRating;
  bookId?: number;
  isViewing?: boolean;
  isEdit?: boolean;
}

// Helper function to format age rating for display
const formatAgeRating = (rating: NumericAgeRating): string => {
  switch (rating) {
    case AgeRatingEnum.ADULT: return "18+";
    case AgeRatingEnum.MATURE: return "16+";
    case AgeRatingEnum.TEEN: return "13+";
    case AgeRatingEnum.EVERYONE: return "All";
    default: return "All Ages";
  }
};

// Get color for score display based on age rating thresholds
const getScoreColor = (score: number, ageRating: NumericAgeRating = 1): string => {
  
  // Get threshold for chosen age rating
  const threshold = AGE_RATING_THRESHOLDS[ageRating];
  
  // Color based on how far score exceeds threshold
  if (score > threshold * 3) return 'bg-yellow-500';      // Severely exceeds threshold
  if (score > threshold * 2) return 'bg-amber-500';    // Significantly exceeds threshold
  if (score > threshold) return 'bg-yellow-500';       // Exceeds threshold
  return 'bg-green-500';                              // Below threshold
}

// Helper for text color display with age rating threshold
const getTextColorClass = (score: number, ageRating: NumericAgeRating = 1): string => {
  // Get threshold for chosen age rating
  const threshold = AGE_RATING_THRESHOLDS[ageRating];
  
  // Text color based on how far score exceeds threshold
  if (score > threshold * 3) return "text-yellow-600 font-semibold";
  if (score > threshold * 2) return "text-amber-600 font-semibold";
  if (score > threshold) return "text-yellow-600";
  return "text-green-600";
};

// A component to display the rating badge
const RatingBadge = ({ rating }: { rating: NumericAgeRating }) => {
  let bgClass = 'bg-green-200 dark:bg-green-900/30 text-green-800 dark:text-green-300';
  
  switch (rating) {
    case AgeRatingEnum.ADULT: bgClass = 'bg-yellow-200 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'; break;
    case AgeRatingEnum.MATURE: bgClass = 'bg-orange-200 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300'; break;
    case AgeRatingEnum.TEEN: bgClass = 'bg-amber-200 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300'; break;
    case AgeRatingEnum.EVERYONE: bgClass = 'bg-green-200 dark:bg-green-900/30 text-green-800 dark:text-green-300'; break;
  }
  
  return (
    <div className={`px-2.5 py-1 text-xs rounded-full font-medium ${bgClass}`}>
      {formatAgeRating(rating)}
    </div>
  );
};

export function ModerationResults({
  open,
  onOpenChange,
  results,
  selectedModel,
  onModelChange,
  onRecheck,
  isLoading = false,
  bookAgeRating = AgeRatingEnum.EVERYONE,
  bookId,
  isEdit = false,
}: ModerationResultsProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [selectedContent, setSelectedContent] = useState<{ type: string; data: any } | null>(null);
  const [currentResults, setCurrentResults] = useState<EnhancedModerationResult | null>(results);
  
  // React Query for fetching and saving moderation results
  const { data: existingResults, isLoading: isLoadingResults } = useModerationResults(bookId);
  const { saveModerationResults, isLoading: isSavingResults } = useSaveModerationResults();

  // Keep track of all available model results
  const [availableModelResults, setAvailableModelResults] = useState<Record<string, EnhancedModerationResult>>({});
  
  // When results or existingResults change, update available model results
  useEffect(() => {
    const newAvailableResults: Record<string, EnhancedModerationResult> = {};
    
    // Add current result
    if (results) {
      newAvailableResults[results.model] = results;
    }
    
    // Parse and add existing results if available
    if (existingResults && Array.isArray(existingResults)) {
      // Use the utility function to process all existing results
      const processedResults = processAllModerationResults(existingResults, bookAgeRating as NumericAgeRating);
      
      // Merge with newAvailableResults, but prioritize current results
      Object.entries(processedResults).forEach(([model, result]) => {
        // Only add if we don't already have this model from current results
        if (!newAvailableResults[model]) {
          newAvailableResults[model] = result;
        }
      });
    }
    
    setAvailableModelResults(newAvailableResults);
    
    // Set current results to match selected model if available
    if (selectedModel && newAvailableResults[selectedModel]) {
      setCurrentResults(newAvailableResults[selectedModel]);
    } else if (results) {
      // Otherwise use the provided results
      setCurrentResults(results);
    }
  }, [results, existingResults, selectedModel, bookAgeRating]);
  
  // When model changes, update current results if available
  useEffect(() => {
    if (selectedModel) {
      if (availableModelResults[selectedModel]) {
        setCurrentResults(availableModelResults[selectedModel]);
      } else {
        setCurrentResults(null);
      }
    }
  }, [selectedModel, availableModelResults]);

  // Determine overall content pass status - a book passes if ALL sections pass
  // The result should have an explicit 'passed' property now, but we also check individual flags
  const contentPasses = currentResults ? 
    (currentResults as any).passed ?? (!(currentResults as any).flagged) : true;

  // Save the moderation results to the backend
  const handleSaveResults = async () => {
    if (!currentResults || !bookId) return;

    try {
      // Prepare the moderation data
      const moderationData: ModerationResultsPayload = {
        title: currentResults.contentResults?.title 
          ? JSON.stringify(currentResults.contentResults.title) 
          : null,
        description: currentResults.contentResults?.description 
          ? JSON.stringify(currentResults.contentResults.description) 
          : null,
        coverImage: currentResults.contentResults?.coverImage 
          ? JSON.stringify(currentResults.contentResults.coverImage) 
          : null,
        chapters: currentResults.contentResults?.chapters 
          ? JSON.stringify(currentResults.contentResults.chapters)
          : null,
        model: currentResults.model,
        bookId: bookId,
      };

      // Use the saveModerationResults function from our hook, passing hasExistingResults
      await saveModerationResults(bookId, moderationData, isEdit);
    } catch (error) {
      console.error("Error saving moderation results:", error);
      toast.error("Failed to save moderation results");
    }
  };

  // Toggle expanded section
  const toggleSection = (id: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // A component to display a content card with expand/collapse
  const ContentCard = ({ 
    title, 
    icon,
    result,
    id,
  }: { 
    title: string; 
    icon: React.ReactNode;
    result: any;
    id: string;
  }) => {
    // Get flagged status from the result directly
    const passes = result ? !(result.flagged) : true;
    const isExpanded = expandedSections[id] || false;
    
    // If no category scores exist, return early
    if (!result || !result.category_scores) {
      return (
        <div className="rounded-lg border p-3 bg-gray-50 dark:bg-gray-800 text-slate-600 dark:text-gray-300 dark:border-gray-700">
          <div className="flex items-center gap-2">
            {icon}
            <span>{title}</span>
          </div>
          <div className="text-xs mt-2">No moderation data available</div>
        </div>
      );
    }
    
    // Get scores for display
    const sortedScores = Object.entries(result.category_scores)
      .filter(([_, score]) => typeof score === 'number')
      .sort(([_, a], [__, b]) => (Number(b) - Number(a)));
    
    // Get reason from result or use highest score category
    const violationReason = result.reason || (
      sortedScores.length > 0 ? 
      `${String(sortedScores[0][0]).replace(/[-/]/g, ' ')} (${(Number(sortedScores[0][1]) * 100).toFixed(2)}%)` : 
      'Content violation'
    );
    
    return (
      <div className={`
        rounded-lg border overflow-hidden transition-all
        ${passes ? 'bg-white dark:bg-gray-800 dark:border-gray-700' : 'bg-yellow-50/30 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'}
      `}>
        <div 
          className="p-3 border-b cursor-pointer hover:bg-slate-50/50 dark:hover:bg-gray-700/50 dark:border-gray-700"
          onClick={() => toggleSection(id)}
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-md ${passes ? 'bg-slate-100 dark:bg-gray-700' : 'bg-yellow-100 dark:bg-yellow-900/50'}`}>
                {passes ? icon : <ShieldAlert className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="font-medium text-sm dark:text-white">{title}</h4>
                  {!passes && (
                    <span className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">{violationReason}</span>
                  )}
                </div>
                {!passes && (
                  <div className="text-xs mt-0.5 text-yellow-600 dark:text-yellow-400 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    <span>Needs review</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 w-7 p-0 dark:hover:bg-gray-600" 
                onClick={(e) => {
                  e.stopPropagation();
                  toggleSection(id);
                }}
              >
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
        
        {isExpanded && (
          <div className="p-3 bg-slate-50/70 dark:bg-gray-700/50 border-t border-slate-100 dark:border-gray-600">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {sortedScores.map(([category, score]) => (
                <div key={category} className="flex flex-col">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-medium truncate mr-1 dark:text-gray-300">{String(category).replace(/[-/]/g, ' ')}</span>
                    <span className={`text-xs ${getTextColorClass(Number(score), bookAgeRating as NumericAgeRating)}`}>
                      {(Number(score) * 100).toFixed(2)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-600 rounded-full h-1.5">
                    <div 
                      className={`h-1.5 rounded-full ${getScoreColor(Number(score), bookAgeRating as NumericAgeRating)}`} 
                      style={{ width: `${Math.max(Number(score) * 100, 1)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <span className="hidden">Open Moderation Dialog</span>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[95vw] w-[1200px] max-h-[90vh] flex flex-col overflow-hidden p-0 dark:bg-gray-900 dark:border-gray-700">
        <DialogHeader className="pb-0 border-b dark:border-gray-700 sticky top-0 z-10 bg-white dark:bg-gray-900 flex-shrink-0">
          <DialogTitle className="sr-only">Content Moderation Results</DialogTitle>
          <div className="flex flex-col">
            {/* Top Banner with status - show placeholder when no results */}
            <div className={`w-full px-6 py-4 ${
              currentResults 
                ? (contentPasses ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20' : 'bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20')
                : 'bg-gradient-to-r from-slate-50 to-slate-100 dark:from-gray-800 dark:to-gray-700'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`rounded-full p-2 ${
                    currentResults 
                      ? (contentPasses ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400')
                      : 'bg-slate-200 dark:bg-gray-700 text-slate-500 dark:text-gray-400'
                  }`}>
                    {currentResults 
                      ? (contentPasses ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />)
                      : <Shield className="h-5 w-5" />}
                  </div>
                  <div>
                    <h2 className="font-semibold text-lg flex items-center gap-2 dark:text-white">
                      <Shield className="h-4 w-4 text-primary dark:text-red-400" />
                       Content Moderation
                    </h2>
                    <p className="text-sm opacity-80 dark:text-gray-300">
                      {currentResults 
                        ? (contentPasses 
                            ? `Suitable for ${formatAgeRating(bookAgeRating as NumericAgeRating)} audience` 
                            : `Content requires review for ${formatAgeRating(bookAgeRating as NumericAgeRating)} rating`)
                        : `No moderation results available for ${selectedModel}`}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Controls Bar */}
            <div className="px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 dark:bg-gray-900">
              <div className="flex items-center gap-2">
                <div className="text-xs font-medium text-slate-600 dark:text-gray-400">Model:</div>
                <div className="text-xs bg-primary/10 dark:bg-red-900/20 text-primary dark:text-red-400 px-2 py-1 rounded">
                  {selectedModel}
                </div>
                
                {/* Add age rating badge in control bar */}
                <div className="ml-3 flex items-center gap-2">
                  <div className="text-xs font-medium text-slate-600 dark:text-gray-400">Rating:</div>
                  <RatingBadge rating={bookAgeRating as NumericAgeRating} />
                </div>
                
              </div>
              
              <div className="flex items-center gap-3">
                {/* Expand/Collapse All button - only show when there are results */}
                {currentResults && (
                  <div className="text-xs">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 text-xs px-2 gap-1 dark:hover:bg-gray-700 dark:text-gray-300"
                      onClick={() => {
                        if (Object.keys(expandedSections).length > 0) {
                          // Collapse all sections
                          setExpandedSections({});
                        } else {
                          // Expand all sections - get all available section keys
                          const allSections: Record<string, boolean> = {};
                          if (currentResults.contentResults?.title) allSections['title-section'] = true;
                          if (currentResults.contentResults?.description) allSections['description-section'] = true;
                          if (currentResults.contentResults?.coverImage) allSections['coverImage-section'] = true;
                          if (currentResults.contentResults?.chapters) {
                            currentResults.contentResults.chapters.forEach((_, idx) => {
                              allSections[`chapter-${idx}`] = true;
                            });
                          }
                          setExpandedSections(allSections);
                        }
                      }}
                    >
                      {Object.keys(expandedSections).length > 0 ? (
                        <>
                          <ChevronUp className="h-3.5 w-3.5" />
                          Collapse Details Scores
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-3.5 w-3.5" />
                          Expand Details Scores
                        </>
                      )}
                    </Button>
                  </div>
                )}

                <Select
                  value={selectedModel}
                  onValueChange={(value: DisplayModerationModelType) => onModelChange(value)}
                >
                  <SelectTrigger className="h-8 text-xs w-[180px] dark:border-gray-600 dark:bg-gray-800 dark:text-white" id="model-select">
                    <SelectValue placeholder="Select model" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                    <SelectItem value='Level 1' className="dark:text-white dark:hover:bg-gray-700">Level 1</SelectItem>
                    <SelectItem value='Level 2' className="dark:text-white dark:hover:bg-gray-700">Level 2</SelectItem>
                    <SelectItem value='Level 3' className="dark:text-white dark:hover:bg-gray-700">Level 3</SelectItem>
                  </SelectContent>
                </Select>

                {onRecheck && (
                  <Button 
                    size="sm"
                    disabled={isLoading}
                    onClick={() => onRecheck(availableModelResults[selectedModel] ? true : false)}
                    className="h-8 text-xs px-3 dark:bg-red-600 dark:hover:bg-red-700 dark:text-white"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 size={14} className="mr-1 animate-spin" />
                        Checking...
                      </>
                    ) : availableModelResults[selectedModel] ? "Recheck" : "Run"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-col flex-1 overflow-auto">
          {!currentResults ? (
            // No results state - maintain same layout structure
            <div className="p-6 dark:bg-gray-900">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Book Metadata Section */}
                <div className="space-y-4">
                  <h3 className="text-base font-medium dark:text-white">Book Metadata</h3>
                  
                  <div className="flex flex-col items-center justify-center p-8 border dark:border-gray-700 rounded-lg bg-slate-50 dark:bg-gray-800 h-56">
                    {isLoading ? (
                      <div className="flex flex-col items-center">
                        <Loader2 size={28} className="animate-spin mb-3 text-primary dark:text-red-400" />
                        <p className="text-base font-medium dark:text-white">Analyzing content...</p>
                        <p className="text-xs text-muted-foreground dark:text-gray-400 mt-1">This may take a moment</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <Shield size={36} className="mb-3 text-muted-foreground dark:text-gray-500 opacity-20" />
                        <p className="text-base font-medium text-center dark:text-white">No moderation results available for {selectedModel}</p>
                        {onRecheck && (
                          <Button 
                            variant="outline"
                            size="sm"
                            className="gap-1.5 mt-4 dark:border-gray-600 dark:text-white dark:hover:bg-gray-700"
                            onClick={() => onRecheck(false)}
                            disabled={isLoading}
                          >
                            {isLoading ? (
                              <>
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                Running...
                              </>
                            ) : (
                              <>
                                <Shield className="h-3.5 w-3.5" />
                                Run Moderation
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Chapters Section - placeholder */}
                <div className="space-y-4">
                  <h3 className="text-base font-medium dark:text-white">Chapters</h3>
                  
                  <div className="text-center p-8 border dark:border-gray-700 rounded-lg bg-slate-50 dark:bg-gray-800 h-56 flex items-center justify-center">
                    <p className="text-slate-500 dark:text-gray-400">No chapter data available</p>
                  </div>
                </div>
              </div>
            </div>
          ) : selectedContent ? (
            // Detailed view of selected content
            <div className="p-6 space-y-5 dark:bg-gray-900">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-medium flex items-center gap-2 dark:text-white">
                  {selectedContent.type === 'title' && <FileText className="h-5 w-5 text-primary dark:text-red-400" />}
                  {selectedContent.type === 'description' && <FileText className="h-5 w-5 text-primary dark:text-red-400" />}
                  {selectedContent.type === 'coverImage' && <Image className="h-5 w-5 text-primary dark:text-red-400" />}
                  {selectedContent.type === 'chapter' && <BookOpen className="h-5 w-5 text-primary dark:text-red-400" />}
                  
                  {selectedContent.type === 'chapter' 
                    ? `Chapter ${(selectedContent.data as any).chapter || (selectedContent.data as any).index}` 
                    : selectedContent.type.charAt(0).toUpperCase() + selectedContent.type.slice(1)}
                </h2>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setSelectedContent(null)}
                  className="text-xs dark:border-gray-600 dark:text-white dark:hover:bg-gray-700"
                >
                  Back to Overview
                </Button>
              </div>
              
              {/* Content result from external component */}
              <ContentResult
                title=""
                result={selectedContent.data}
                showDetailedScores={true}
                bookAgeRating={bookAgeRating as NumericAgeRating}
              />
            </div>
          ) : (
            // Main content view with 50/50 layout
            <div className="p-6 dark:bg-gray-900">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Book Metadata Section */}
                <div className="space-y-4">
                  <h3 className="text-base font-medium dark:text-white">Book Metadata</h3>
                  
                  <div className="space-y-4">
                    {currentResults.contentResults?.title && (
                      <ContentCard
                        title="Title"
                        icon={<FileText className="h-4 w-4" />}
                        result={currentResults.contentResults.title}
                        id="title-section"
                      />
                    )}
                    
                    {currentResults.contentResults?.description && (
                      <ContentCard
                        title="Description"
                        icon={<FileText className="h-4 w-4" />}
                        result={currentResults.contentResults.description}
                        id="description-section"
                      />
                    )}
                    
                    {currentResults.contentResults?.coverImage && (
                      <ContentCard
                        title="Cover Image"
                        icon={<Image className="h-4 w-4" />}
                        result={currentResults.contentResults.coverImage}
                        id="coverImage-section"
                      />
                    )}
                  </div>
                </div>
                
                {/* Chapters Section */}
                <div className="space-y-4">
                  <h3 className="text-base font-medium dark:text-white">Chapters</h3>
                  
                  <div className="space-y-4">
                    {currentResults.contentResults?.chapters && currentResults.contentResults.chapters.map((chapter, idx) => {
                      // Check if chapter has new structure (with result property) or old structure
                      const isNewStructure = 'result' in chapter;
                      // Use type assertion to safely access properties
                      const chapterNumber = isNewStructure 
                        ? ((chapter as any).index || idx+1) 
                        : ((chapter as any).chapter || idx+1);
                      const chapterContent = isNewStructure 
                        ? (chapter as any).result 
                        : chapter;
                      
                      return (
                        <ContentCard
                          key={`chapter-${idx}`}
                          title={`Chapter ${chapterNumber}`}
                          icon={<BookOpen className="h-4 w-4" />}
                          result={chapterContent}
                          id={`chapter-${idx}`}
                        />
                      );
                    })}
                    
                    {(!currentResults.contentResults?.chapters || currentResults.contentResults.chapters.length === 0) && (
                      <div className="text-center p-8 border dark:border-gray-700 rounded-lg bg-slate-50 dark:bg-gray-800 flex items-center justify-center">
                        <p className="text-slate-500 dark:text-gray-400">No chapters analyzed</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="px-6 border-t dark:border-gray-700 sticky bottom-0 z-10 bg-white dark:bg-gray-900 flex items-center py-3 flex-shrink-0">
          <div className="flex-1 flex items-center text-xs text-muted-foreground dark:text-gray-400">
            {currentResults ? (
              <div className="flex items-center">
                <span className="mr-1">Analyzed:</span>
                <span className="font-mono">{new Date(currentResults.timestamp).toLocaleString()}</span>
              </div>
            ) : (
              <div className="flex items-center opacity-50">
                <span className="mr-1">No results available</span>
              </div>
            )}
          </div>
          
          <div className="flex gap-2">
          <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="gap-1 h-8 text-xs px-3 dark:border-gray-600 dark:text-white dark:hover:bg-gray-700"
            >
              Close
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 