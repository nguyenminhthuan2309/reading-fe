import { useState } from "react";
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

import { MODERATION_MODELS, ModerationModelType } from "@/lib/hooks/useOpenAI";
import { EnhancedModerationResult } from "@/models/openai";
import { ContentResult } from "./ContentResults";
import { AGE_RATING_THRESHOLDS } from "@/lib/api/openai";

export type AgeRating = "ALL" | "13_PLUS" | "16_PLUS" | "18_PLUS";

export interface ModerationResultsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  results: EnhancedModerationResult | null;
  selectedModel: ModerationModelType;
  onModelChange: (model: ModerationModelType) => void;
  onRecheck?: () => void;
  isLoading?: boolean;
  bookAgeRating?: AgeRating;
}

// Helper function to format age rating for display
const formatAgeRating = (rating: AgeRating | undefined): string => {
  if (!rating) return "All Ages";
  return rating.replace("_", " ");
};

// Get color for score display based on age rating thresholds
const getScoreColor = (score: number, ageRating: AgeRating = "ALL"): string => {
  // Get threshold for chosen age rating
  const threshold = AGE_RATING_THRESHOLDS[ageRating];
  
  // Color based on how far score exceeds threshold
  if (score > threshold * 3) return 'bg-red-500';      // Severely exceeds threshold
  if (score > threshold * 2) return 'bg-amber-500';    // Significantly exceeds threshold
  if (score > threshold) return 'bg-yellow-500';       // Exceeds threshold
  return 'bg-green-500';                              // Below threshold
}

// Helper for text color display with age rating threshold
const getTextColorClass = (score: number, ageRating: AgeRating = "ALL"): string => {
  // Get threshold for chosen age rating
  const threshold = AGE_RATING_THRESHOLDS[ageRating];
  
  // Text color based on how far score exceeds threshold
  if (score > threshold * 3) return "text-red-600 font-semibold";
  if (score > threshold * 2) return "text-amber-600 font-semibold";
  if (score > threshold) return "text-yellow-600";
  return "text-green-600";
};

// A component to display the rating badge
const RatingBadge = ({ rating }: { rating: AgeRating }) => (
  <div className={`px-2.5 py-1 text-xs rounded-full font-medium ${
    rating === "ALL" ? 'bg-green-100 text-green-700' :
    rating === "13_PLUS" ? 'bg-yellow-100 text-yellow-700' :
    rating === "16_PLUS" ? 'bg-amber-100 text-amber-700' :
    'bg-red-100 text-red-700'
  }`}>
    {formatAgeRating(rating)}
  </div>
);

export function ModerationResults({
  open,
  onOpenChange,
  results,
  selectedModel,
  onModelChange,
  onRecheck,
  isLoading = false,
  bookAgeRating = "ALL"
}: ModerationResultsProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [selectedContent, setSelectedContent] = useState<{ type: string; data: any } | null>(null);

  // Use flagged property directly from results
  const contentPasses = results ? !results.flagged : true;

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
    // Use flagged property directly from result
    const passes = !result.flagged;
    const isExpanded = expandedSections[id] || false;
    
    // If no category scores exist, return early
    if (!result.category_scores) {
      return (
        <div className="rounded-lg border p-3 bg-gray-50 text-slate-600">
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
        ${passes ? 'bg-white' : 'bg-red-50/30 border-red-200'}
      `}>
        <div 
          className="p-3 border-b cursor-pointer hover:bg-slate-50/50"
          onClick={() => toggleSection(id)}
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-md ${passes ? 'bg-slate-100' : 'bg-red-100'}`}>
                {passes ? icon : <ShieldAlert className="h-4 w-4 text-red-600" />}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="font-medium text-sm">{title}</h4>
                  {!passes && (
                    <span className="text-xs text-red-600 font-medium">{violationReason}</span>
                  )}
                </div>
                {!passes && (
                  <div className="text-xs mt-0.5 text-red-600 flex items-center gap-1">
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
                className="h-7 w-7 p-0" 
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
          <div className="p-3 bg-slate-50/70 border-t border-slate-100">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {sortedScores.map(([category, score]) => (
                <div key={category} className="flex flex-col">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-medium truncate mr-1">{String(category).replace(/[-/]/g, ' ')}</span>
                    <span className={`text-xs ${getTextColorClass(Number(score), bookAgeRating)}`}>
                      {(Number(score) * 100).toFixed(2)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div 
                      className={`h-1.5 rounded-full ${getScoreColor(Number(score), bookAgeRating)}`} 
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
      <DialogContent className="sm:max-w-[95vw] w-[1200px] max-h-[90vh] flex flex-col overflow-hidden p-0">
        <DialogHeader className="pb-0 border-b sticky top-0 z-10 bg-white flex-shrink-0">
          <DialogTitle className="sr-only">Content Moderation Results</DialogTitle>
          <div className="flex flex-col">
            {/* Top Banner with status */}
            {results && (
              <div className={`w-full px-6 py-4 ${
                contentPasses ? 'bg-gradient-to-r from-green-50 to-emerald-50' : 
                'bg-gradient-to-r from-red-50 to-red-100'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`rounded-full p-2 ${
                      contentPasses ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                    }`}>
                      {contentPasses ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                    </div>
                    <div>
                      <h2 className="font-semibold text-lg flex items-center gap-2">
                        <Shield className="h-4 w-4 text-primary" />
                        Content Moderation
                      </h2>
                      <p className="text-sm opacity-80">
                        {contentPasses 
                          ? `Suitable for ${formatAgeRating(bookAgeRating)} audience` 
                          : `Content requires review for ${formatAgeRating(bookAgeRating)} rating`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-end">
                      <div className="text-sm font-medium">Book Age Rating</div>
                      <div className="text-xs opacity-80">Moderation target</div>
                    </div>
                    <RatingBadge rating={bookAgeRating} />
                  </div>
                </div>
              </div>
            )}
            
            {/* Controls Bar */}
            <div className="px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="text-xs font-medium text-slate-600">Model:</div>
                <div className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                  {selectedModel}
                </div>
                
                {/* Add age rating badge in control bar */}
                <div className="ml-3 flex items-center gap-2">
                  <div className="text-xs font-medium text-slate-600">Rating:</div>
                  <RatingBadge rating={bookAgeRating} />
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Select
                  value={selectedModel}
                  onValueChange={(value: ModerationModelType) => onModelChange(value)}
                >
                  <SelectTrigger className="h-8 text-xs w-[180px]" id="model-select">
                    <SelectValue placeholder="Select model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={MODERATION_MODELS.OMNI}>Basic Moderation</SelectItem>
                    <SelectItem value={MODERATION_MODELS.GPT4O}>GPT-4o</SelectItem>
                    <SelectItem value={MODERATION_MODELS.O4_MINI}>o4-mini</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex gap-2">
                  <Button 
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs px-3 gap-1"
                    onClick={() => {
                      // Toggle all sections
                      if (Object.keys(expandedSections).length === 0) {
                        // Expand all sections
                        const allSections: Record<string, boolean> = {};
                        if (results?.contentResults) {
                          if (results.contentResults.title) allSections['title-section'] = true;
                          if (results.contentResults.description) allSections['description-section'] = true;
                          if (results.contentResults.coverImage) allSections['coverImage-section'] = true;
                          if (results.contentResults.chapters) {
                            results.contentResults.chapters.forEach((_, idx) => {
                              allSections[`chapter-${idx}`] = true;
                            });
                          }
                        }
                        setExpandedSections(allSections);
                      } else {
                        // Collapse all sections
                        setExpandedSections({});
                      }
                    }}
                  >
                    {Object.keys(expandedSections).length > 0 ? (
                      <>
                        <ChevronUp className="h-3.5 w-3.5" />
                        Collapse All
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-3.5 w-3.5" />
                        Expand All
                      </>
                    )}
                  </Button>

                  {onRecheck && (
                    <Button 
                      variant="outline"
                      size="sm"
                      disabled={isLoading}
                      onClick={onRecheck}
                      className="h-8 text-xs px-3"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 size={14} className="mr-1 animate-spin" />
                          Checking...
                        </>
                      ) : "Recheck"}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </DialogHeader>

        {!results ? (
          <div className="py-8 text-center text-muted-foreground flex-1 overflow-auto">
            {isLoading ? (
              <div className="flex flex-col items-center">
                <Loader2 size={28} className="animate-spin mb-3 text-primary" />
                <p className="text-base font-medium">Analyzing content...</p>
                <p className="text-xs text-muted-foreground mt-1">This may take a moment depending on content volume</p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <Shield size={36} className="mb-3 text-muted-foreground opacity-20" />
                <p className="text-base font-medium">No moderation results available</p>
                <p className="text-xs text-muted-foreground mt-1">Run moderation check first to see content analysis</p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col flex-1 overflow-auto">
            {selectedContent ? (
              // Detailed view of selected content
              <div className="p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-medium flex items-center gap-2">
                    {selectedContent.type === 'title' && <FileText className="h-5 w-5 text-primary" />}
                    {selectedContent.type === 'description' && <FileText className="h-5 w-5 text-primary" />}
                    {selectedContent.type === 'coverImage' && <Image className="h-5 w-5 text-primary" />}
                    {selectedContent.type === 'chapter' && <BookOpen className="h-5 w-5 text-primary" />}
                    
                    {selectedContent.type === 'chapter' 
                      ? `Chapter ${(selectedContent.data as any).chapter || (selectedContent.data as any).index}` 
                      : selectedContent.type.charAt(0).toUpperCase() + selectedContent.type.slice(1)}
                  </h2>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setSelectedContent(null)}
                    className="text-xs"
                  >
                    Back to Overview
                  </Button>
                </div>
                
                {/* Content result from external component */}
                <ContentResult
                  title=""
                  result={selectedContent.data}
                  showDetailedScores={true}
                  bookAgeRating={bookAgeRating}
                />
              </div>
            ) : (
              // Main content view with 50/50 layout
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Book Metadata Section */}
                  <div className="space-y-4">
                    <h3 className="text-base font-medium">Book Metadata</h3>
                    
                    <div className="space-y-4">
                      {results.contentResults?.title && (
                        <ContentCard
                          title="Title"
                          icon={<FileText className="h-4 w-4" />}
                          result={results.contentResults.title}
                          id="title-section"
                        />
                      )}
                      
                      {results.contentResults?.description && (
                        <ContentCard
                          title="Description"
                          icon={<FileText className="h-4 w-4" />}
                          result={results.contentResults.description}
                          id="description-section"
                        />
                      )}
                      
                      {results.contentResults?.coverImage && (
                        <ContentCard
                          title="Cover Image"
                          icon={<Image className="h-4 w-4" />}
                          result={results.contentResults.coverImage}
                          id="coverImage-section"
                        />
                      )}
                    </div>
                  </div>
                  
                  {/* Chapters Section */}
                  <div className="space-y-4">
                    <h3 className="text-base font-medium">Chapters</h3>
                    
                    <div className="space-y-4">
                      {results.contentResults?.chapters && results.contentResults.chapters.map((chapter, idx) => {
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
                      
                      {(!results.contentResults?.chapters || results.contentResults.chapters.length === 0) && (
                        <div className="text-center p-4 border rounded-lg bg-slate-50 text-slate-500">
                          No chapters available
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="px-6 border-t sticky bottom-0 z-10 bg-white flex items-center py-3 flex-shrink-0">
          <div className="flex-1 flex items-center text-xs text-muted-foreground">
            {results && (
              <div className="flex items-center">
                <span className="mr-1">Analyzed:</span>
                <span className="font-mono">{new Date(results.timestamp).toLocaleString()}</span>
              </div>
            )}
          </div>
          
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="gap-1 h-8 text-xs px-3"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 