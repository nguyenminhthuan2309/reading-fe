import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Shield, Eye, RefreshCcw, Loader2, CheckCircle, XCircle, ChevronDown } from "lucide-react";
import { MODERATION_MODELS, ModerationModelType } from "@/lib/hooks/useOpenAI";
import { Badge } from "@/components/ui/badge";
import { Book } from "@/models/book";
import { getModerationResults } from "@/lib/api/books";
import { toast } from "sonner";
import { ModerationResultsResponse } from "@/models/openai";
import { ExtendedBook } from "@/lib/hooks/useAdminBooks";

interface ModerateButtonProps {
  bookId: number;
  onOpenResults: (model: ModerationModelType,  book: ExtendedBook,isViewing?: boolean, result?: ModerationResultsResponse) => void;
  onRunModeration: (model: ModerationModelType, isEdit?: boolean) => void;
  book: ExtendedBook;
  isLoading?: boolean;
}

interface ModelStatus {
  model: ModerationModelType;
  passed: boolean;
}

export function ModerateButton({
  bookId,
  onOpenResults,
  onRunModeration,
  book,
  isLoading = false,
}: ModerateButtonProps) {
  const [open, setOpen] = useState(false);
  const [isFetchingModeration, setIsFetchingModeration] = useState(false);

  const [moderationResults, setModerationResults] = useState<ModerationResultsResponse[]>([]);
  const [modelStatuses, setModelStatuses] = useState<ModelStatus[]>([]);

  // Parse moderated models from book.moderated string
  const moderatedModels = book.moderated 
    ? book.moderated.split(',').map(m => m.trim()) 
    : [];

  // Helper to check if a model has been run
  const isModelModerated = (model: string) => {
    return moderatedModels.some(m => m.includes(model.toLowerCase()));
  };

  // Helper to check if content is flagged
  const checkContentFlagged = (content: any) => {
    if (!content) return false;
    
    // Check if content has explicit flagged property
    if (content.flagged !== undefined) {
      return content.flagged;
    }
    
    // Check category scores if available
    if (content.category_scores) {
      // If any score is high, consider it flagged
      // This is a simplified check - you may want to use your threshold logic
      const scores = Object.values(content.category_scores) as number[];
      return scores.some(score => score > 0.5);
    }
    
    return false;
  };

  // Function to check if all content passes moderation
  const checkAllContentPasses = (moderationData: any) => {
    if (!moderationData) return false;
    
    try {
      // Parse title, description, and cover image if they're strings
      const title = typeof moderationData.title === 'string' ? 
        JSON.parse(moderationData.title) : moderationData.title;
      
      const description = typeof moderationData.description === 'string' ? 
        JSON.parse(moderationData.description) : moderationData.description;
      
      const coverImage = typeof moderationData.coverImage === 'string' ? 
        JSON.parse(moderationData.coverImage) : moderationData.coverImage;
      
      // Parse chapters
      let chapters = [];
      if (moderationData.chapters) {
        if (typeof moderationData.chapters === 'string') {
          chapters = JSON.parse(moderationData.chapters);
        } else if (Array.isArray(moderationData.chapters)) {
          chapters = moderationData.chapters.map((ch: any) => {
            if (ch.result && typeof ch.result === 'string') {
              return { ...ch, result: JSON.parse(ch.result) };
            }
            return ch;
          });
        }
      }
      
      // Check if any content is flagged
      const titleFlagged = checkContentFlagged(title);
      const descriptionFlagged = checkContentFlagged(description);
      const coverImageFlagged = checkContentFlagged(coverImage);
      
      // Check if any chapter is flagged
      const anyChapterFlagged = chapters.some((ch: any) => {
        const chapterResult = ch.result || ch;
        return checkContentFlagged(chapterResult);
      });
      
      // Content passes if nothing is flagged
      return !(titleFlagged || descriptionFlagged || coverImageFlagged || anyChapterFlagged);
    } catch (error) {
      console.error("Error parsing moderation data:", error);
      return false;
    }
  };

  // Handle moderate button click (main button - runs o4-mini by default)
  const handleModerateClick = async () => {
    // Run moderation with o4-mini by default
    handleRun(MODERATION_MODELS.O4_MINI);
  };

  // Handle dropdown arrow click (shows model selection)
  const handleDropdownClick = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent main button click
    
    // Always open the popover
    setOpen(true);
    
    // If the book has already been moderated, fetch results to check status
    if (book.moderated) {
      setIsFetchingModeration(true);
      try {
        // Get existing moderation results
        const response = await getModerationResults(bookId);
        if (response.code === 200 && response.data) {
          // Determine model status
          const statuses: ModelStatus[] = [];
          
          setModerationResults(response.data);
          response.data.forEach((result) => {
            const model = result.model as ModerationModelType;
            const allPasses = checkAllContentPasses(result);
            statuses.push({
              model: model,
              passed: allPasses
            });
          });
          
          // Update model statuses
          setModelStatuses(statuses);
        }
      } catch (error) {
        console.error("Error fetching moderation results:", error);
        toast.error("Error loading moderation results");
      } finally {
        setIsFetchingModeration(false);
      }
    }
  };

  const handleRun = (model: ModerationModelType) => {
    onRunModeration(model, false);
    setOpen(false);
  };

  const handleRerun = (model: ModerationModelType) => {
    onRunModeration(model, true);
    setOpen(false);
  };

  const handleView = (model: ModerationModelType) => {
    onOpenResults(model, book, true, moderationResults.find(result => result.model === model));
    setOpen(false);
  };

  // Get status for a specific model
  const getModelStatus = (model: ModerationModelType) => {
    return modelStatuses.find(status => status.model === model);
  };

  // Render a model option row
  const ModelOption = ({ model, label }: { model: ModerationModelType; label: string }) => {
    const moderated = isModelModerated(model);
    const status = getModelStatus(model);
    
    return (
      <div className="py-2 px-1 border-b last:border-0 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium dark:text-white">{label}</span>
          {moderated && (
            <Badge 
              variant="outline" 
              className={`text-xs ${status?.passed ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700/50' : 'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700/50'}`}
            >
              {status?.passed ? (
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  <span>Passed</span>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <XCircle className="h-3 w-3" />
                  <span>Failed</span>
                </div>
              )}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          {moderated ? (
            <>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 text-xs" 
                onClick={() => handleView(model)}
              >
                <Eye className="h-3.5 w-3.5 mr-1" />
                View
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 text-xs" 
                onClick={() => handleRerun(model)}
                disabled={isLoading}
              >
                <RefreshCcw className="h-3.5 w-3.5 mr-1" />
                Rerun
              </Button>
            </>
          ) : (
            <Button 
              variant="outline" 
              size="sm" 
              className="h-7 text-xs" 
              onClick={() => handleRun(model)}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Shield className="h-3.5 w-3.5 mr-1" />
                  Run
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    );
  };
      
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className="flex">
        {/* Main Moderate Button */}
        <Button
          variant="outline"
          size="sm"
          className="h-8 px-3 text-xs gap-1.5 rounded-r-none border-r-0"
          disabled={isLoading || isFetchingModeration}
          onClick={handleModerateClick}
        >
          {isLoading || isFetchingModeration ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {isFetchingModeration ? "Loading..." : "Moderating..."}
            </>
          ) : (
            <>
              <Shield className="h-3.5 w-3.5" />
              Moderate
            </>
          )}
        </Button>
        
        {/* Dropdown Arrow Button */}
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-2 rounded-l-none border-l-0"
            disabled={isLoading || isFetchingModeration}
            onClick={handleDropdownClick}
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </Button>
        </PopoverTrigger>
      </div>
      
      <PopoverContent className="w-80 p-0 rounded-lg border shadow-lg" align="end">
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/10 px-4 py-3 border-b rounded-t-lg">
          <h3 className="text-sm font-medium text-amber-700 dark:text-amber-300">Select Moderation Model</h3>
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
            Choose a model to check content against age rating standards
          </p>
        </div>
        <div className="divide-y dark:divide-gray-600 px-4">
          <ModelOption 
            model={MODERATION_MODELS.OMNI} 
            label="Basic Moderation" 
          />
          <ModelOption 
            model={MODERATION_MODELS.GPT4O} 
            label="GPT-4o (Recommended)" 
          />
          <ModelOption 
            model={MODERATION_MODELS.O4_MINI} 
            label="o4-mini (Faster)" 
          />
        </div>
      </PopoverContent>
    </Popover>
  );
} 