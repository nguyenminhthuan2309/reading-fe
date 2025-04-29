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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CheckCircle2,
  Shield,
  AlertCircle,
  Loader2,
  Info,
  AlertTriangle,
  Eye,
  FileText,
  Image,
  BookOpen,
  BarChart,
  ExternalLink,
  Ban,
  ShieldAlert,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

import { MODERATION_MODELS, ModerationModelType } from "@/lib/hooks/useOpenAI";
import { EnhancedModerationResult } from "@/models/openai";
import { ContentResult, TopScoreSummary } from "./ContentResults";

export type AgeRating = "ALL" | "13_PLUS" | "16_PLUS" | "18_PLUS";

export interface ModerationResultsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  results: EnhancedModerationResult | null;
  selectedModel: ModerationModelType;
  onModelChange: (model: ModerationModelType) => void;
  onRecheck?: () => void;
  isLoading?: boolean;
  bookAgeRating?: AgeRating; // The book's intended age rating (optional)
}

// Age rating threshold constants
const AGE_RATING = {
  THRESHOLD_13_PLUS: 0.1,  // 13+ rating threshold
  THRESHOLD_16_PLUS: 0.2,  // 16+ rating threshold
  THRESHOLD_18_PLUS: 0.5   // 18+ rating threshold
};

// Helper function to format age rating for display
const formatAgeRating = (rating: AgeRating | undefined): string => {
  if (!rating) return "All Ages";
  return rating.replace("_", " ");
};

// First fix the type definitions
interface ContentModResult {
  categoryScores?: Record<string, number>;
  [key: string]: any;
}

interface ChapterModResult extends ContentModResult {
  chapter?: number;
}

// Export utility functions
export const extractScoresFromResult = (result: any): Record<string, number> => {
  if (!result) return {};
  
  // Extract only the numeric score fields
  const scores: Record<string, number> = {};
  const moderationCategories = [
    'sexual', 'sexual/minors', 'harassment', 'harassment/threatening',
    'hate', 'hate/threatening', 'illicit', 'illicit/violent',
    'self-harm', 'self-harm/intent', 'self-harm/instructions',
    'violence', 'violence/graphic'
  ];
  
  moderationCategories.forEach(category => {
    if (typeof result[category] === 'number') {
      scores[category] = result[category];
    } else {
      scores[category] = 0; // Default to 0 if missing
    }
  });
  
  return scores;
};

// Export getContentRating and related helper functions
export const getContentRating = (scores: Record<string, number>, bookAgeRating?: AgeRating) => {
  if (!scores || Object.keys(scores).length === 0) {
    // Create default scores with 0 values for all moderation categories
    scores = {
      sexual: 0,
      'sexual/minors': 0,
      harassment: 0,
      'harassment/threatening': 0,
      hate: 0,
      'hate/threatening': 0,
      illicit: 0,
      'illicit/violent': 0,
      'self-harm': 0,
      'self-harm/intent': 0,
      'self-harm/instructions': 0,
      violence: 0,
      'violence/graphic': 0
    };
  }
  
  const highestScore = Math.max(...Object.values(scores));
  
  let rating: AgeRating, label: string;
  
  if (highestScore >= AGE_RATING.THRESHOLD_18_PLUS) {
    rating = "18_PLUS";
    label = "18+";
  } else if (highestScore >= AGE_RATING.THRESHOLD_16_PLUS) {
    rating = "16_PLUS";
    label = "16+";
  } else if (highestScore >= AGE_RATING.THRESHOLD_13_PLUS) {
    rating = "13_PLUS";
    label = "13+";
  } else {
    rating = "ALL";
    label = "All Ages";
  }
  
  const passes = !bookAgeRating || contentPassesForCategory(highestScore, bookAgeRating);
  
  return { rating, label, score: highestScore, passes };
};

// Export helper functions
export const contentPassesForIntendedAudience = (contentRating: { rating: AgeRating, label: string, score: number } | null, bookAgeRating?: AgeRating) => {
  if (!contentRating) return true;
  if (!bookAgeRating) return contentRating.rating === "ALL";
  
  const ratingValues = {
    "ALL": 0,
    "13_PLUS": 1,
    "16_PLUS": 2,
    "18_PLUS": 3
  };
  
  return ratingValues[contentRating.rating] <= ratingValues[bookAgeRating];
};

// Export helper for category checking
export const contentPassesForCategory = (score: number, bookAgeRating?: AgeRating) => {
  if (!bookAgeRating || bookAgeRating === "18_PLUS") return true;
  if (bookAgeRating === "16_PLUS") return score < AGE_RATING.THRESHOLD_18_PLUS;
  if (bookAgeRating === "13_PLUS") return score < AGE_RATING.THRESHOLD_16_PLUS;
  return score < AGE_RATING.THRESHOLD_13_PLUS;
};

// Helper to determine if a result is flagged based on scores
const isResultFlagged = (result: any, bookAgeRating: AgeRating): boolean => {
  // If it has a flagged property, use that
  if (result && typeof result.flagged === 'boolean') {
    return result.flagged;
  }
  
  // Otherwise determine based on scores
  const scores = extractScoresFromResult(result);
  const highestScore = Object.values(scores).length > 0 ? Math.max(...Object.values(scores)) : 0;
  
  if (bookAgeRating === "ALL") return highestScore >= AGE_RATING.THRESHOLD_13_PLUS;
  if (bookAgeRating === "13_PLUS") return highestScore >= AGE_RATING.THRESHOLD_16_PLUS;
  if (bookAgeRating === "16_PLUS") return highestScore >= AGE_RATING.THRESHOLD_18_PLUS;
  return false; // For 18+ nothing is flagged
};

// A component to display the moderation status badge
const StatusBadge = ({ passed, label }: { passed: boolean; label: string }) => (
  <div className={`px-2.5 py-1 text-xs rounded-full font-medium ${
    passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
  }`}>
    {label}
  </div>
);

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

interface ContentSummaryCardProps {
  title: string
  icon: React.ReactNode
  result: ContentModResult | ChapterModResult
  bookAgeRating: AgeRating
  onClick: () => void
  showDetailedScores: boolean
}

// Fix the ContentSummaryCard component to handle type annotations
const ContentSummaryCard = ({ 
  title, 
  icon, 
  result, 
  bookAgeRating,
  onClick,
  showDetailedScores 
}: ContentSummaryCardProps) => {
  const contentRating = getContentRating(result?.categoryScores || {}, bookAgeRating);
  const passes = contentRating.passes;
  
  return (
    <div 
      className={`
        rounded-lg border p-3 hover:shadow-sm transition-all cursor-pointer
        ${passes ? 'bg-white' : 'bg-red-50 border-red-200'}
      `}
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-1.5">
          <span className="text-slate-500">{icon}</span>
          <h4 className="font-medium text-sm">{title}</h4>
        </div>
        
        <div className={`flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full font-medium ${
          contentRating.rating === "ALL" ? 'bg-green-100 text-green-800' :
          contentRating.rating === "13_PLUS" ? 'bg-yellow-100 text-yellow-800' :
          contentRating.rating === "16_PLUS" ? 'bg-amber-100 text-amber-800' :
          'bg-red-100 text-red-800'
        }`}>
          <div className={`w-2 h-2 rounded-full ${
            contentRating.rating === "ALL" ? 'bg-green-500' :
            contentRating.rating === "13_PLUS" ? 'bg-yellow-500' :
            contentRating.rating === "16_PLUS" ? 'bg-amber-500' :
            'bg-red-500'
          }`}></div>
          {contentRating.label}
        </div>
      </div>
      
      {showDetailedScores && result?.categoryScores && (
        <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 mt-3 text-xs">
          {Object.entries(result.categoryScores)
            .filter(([_, score]) => typeof score === 'number' && score > 0)
            .sort(([_, a], [__, b]) => (Number(b) - Number(a)))
            .slice(0, 4)
            .map(([category, score]) => (
              <div key={category} className="flex items-center gap-1.5">
                <div className={`w-1.5 h-1.5 rounded-full ${getScoreColor(Number(score))}`}></div>
                <span className="truncate capitalize">
                  {category.replace('/', ' ')}
                </span>
                <span className="text-slate-400 ml-auto">{Number(score).toFixed(2)}</span>
              </div>
            ))}
        </div>
      )}
      
      {!showDetailedScores && (
        <div className="flex justify-between items-center mt-2 text-xs text-slate-500">
          <span>
            {passes ? 'Content approved' : 'Needs review'}
          </span>
          <span className="text-primary flex items-center">
            View details 
            <ExternalLink size={12} className="ml-1" />
          </span>
        </div>
      )}
    </div>
  );
};

const getScoreColor = (score: number): string => {
  if (score >= 0.7) return 'bg-red-500'
  if (score >= 0.4) return 'bg-amber-500'
  if (score >= 0.2) return 'bg-yellow-500'
  return 'bg-green-500'
}

const getTextColorClass = (score: number, bookAgeRating: AgeRating): string => {
  // If we're 18+, everything passes
  if (bookAgeRating === "18_PLUS") {
    return score >= AGE_RATING.THRESHOLD_18_PLUS ? "text-red-600" : 
           score >= AGE_RATING.THRESHOLD_16_PLUS ? "text-amber-600" : 
           score >= AGE_RATING.THRESHOLD_13_PLUS ? "text-yellow-600" : "text-green-600";
  }
  
  // If we're 16+, content should be below 18+ threshold
  if (bookAgeRating === "16_PLUS") {
    return score >= AGE_RATING.THRESHOLD_18_PLUS ? "text-red-600 font-semibold" : 
           score >= AGE_RATING.THRESHOLD_16_PLUS ? "text-amber-600" : 
           score >= AGE_RATING.THRESHOLD_13_PLUS ? "text-yellow-600" : "text-green-600";
  }
  
  // If we're 13+, content should be below 16+ threshold
  if (bookAgeRating === "13_PLUS") {
    return score >= AGE_RATING.THRESHOLD_16_PLUS ? "text-red-600 font-semibold" : 
           score >= AGE_RATING.THRESHOLD_13_PLUS ? "text-yellow-600" : "text-green-600";
  }
  
  // If we're 'ALL', content should be below 13+ threshold
  return score >= AGE_RATING.THRESHOLD_13_PLUS ? "text-red-600 font-semibold" : "text-green-600";
};

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
  const [showDetailedScores, setShowDetailedScores] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [selectedContent, setSelectedContent] = useState<{ type: string; data: any } | null>(null);

  // Get content rating if results are available
  const contentRating = results?.contentResults 
    ? getContentRating(
        Object.entries(results.contentResults)
          .flatMap(([key, value]) => {
            if (key === 'chapters' && Array.isArray(value)) {
              return value.map(chapter => extractScoresFromResult(chapter));
            } else if (value) {
              return [extractScoresFromResult(value)];
            }
            return [];
          })
          .reduce((acc, scores) => {
            Object.entries(scores).forEach(([category, score]) => {
              if (typeof score === 'number' && (!acc[category] || score > acc[category])) {
                acc[category] = score;
              }
            });
            return acc;
          }, {} as Record<string, number>)
      )
    : null;

  // Check if content passes for the intended audience
  const contentPasses = contentPassesForIntendedAudience(contentRating, bookAgeRating);
  
  // Toggle expanded section
  const toggleSection = (id: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Handle view detailed content (replaces tabs)
  const handleViewContent = (type: string, data: any) => {
    setSelectedContent(selectedContent?.type === type ? null : { type, data });
  };

  // A component to display a content card with expand/collapse
  const ContentCard = ({ 
    title, 
    icon, 
    result, 
    id,
    bookAgeRating
  }: { 
    title: string; 
    icon: React.ReactNode;
    result: ContentModResult;
    id: string;
    bookAgeRating: AgeRating;
  }) => {
    const contentRating = getContentRating(result?.categoryScores || {}, bookAgeRating);
    const passes = contentRating.passes;
    const isExpanded = expandedSections[id] || false;
    
    // Get all moderation categories regardless of score
    const moderationCategories = [
      'sexual', 'sexual/minors', 'harassment', 'harassment/threatening',
      'hate', 'hate/threatening', 'illicit', 'illicit/violent',
      'self-harm', 'self-harm/intent', 'self-harm/instructions',
      'violence', 'violence/graphic'
    ];
    
    // Create scores map with all categories including zeros
    const scores = extractScoresFromResult(result);
    
    // Sort scores by value (highest first), but include all categories
    const sortedScores = moderationCategories.map(category => [
      category, 
      scores[category] || 0
    ]).sort(([_, a], [__, b]) => (Number(b) - Number(a)));

    // Get highest scoring category for violation reason
    const highestCategory = sortedScores[0];
    const violationReason = highestCategory && Number(highestCategory[1]) > 0 ? 
      `${String(highestCategory[0]).replace(/[-/]/g, ' ')} (${(Number(highestCategory[1]) * 100).toFixed(1)}%)` : 
      'Content violation';
    
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
              <div className={`flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full font-medium ${
                passes ? (
                  contentRating.rating === "ALL" ? 'bg-green-100 text-green-800' :
                  contentRating.rating === "13_PLUS" ? 'bg-yellow-100 text-yellow-800' :
                  contentRating.rating === "16_PLUS" ? 'bg-amber-100 text-amber-800' :
                  'bg-red-100 text-red-800'
                ) : 'bg-red-100 text-red-800'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  passes ? (
                    contentRating.rating === "ALL" ? 'bg-green-500' :
                    contentRating.rating === "13_PLUS" ? 'bg-yellow-500' :
                    contentRating.rating === "16_PLUS" ? 'bg-amber-500' :
                    'bg-red-500'
                  ) : 'bg-red-500'
                }`}></div>
                {contentRating.label}
              </div>
              
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
                      {(Number(score) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div 
                      className={`h-1.5 rounded-full ${getScoreColor(Number(score))}`} 
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
            {results && contentRating && (
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
                          : `Content rated ${contentRating.label} exceeds ${formatAgeRating(bookAgeRating)} rating`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-end">
                      <div className="text-sm font-medium">Content Rating</div>
                      <div className="text-xs opacity-80">Based on highest scores</div>
                    </div>
                    <RatingBadge rating={contentRating.rating} />
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
                      ? `Chapter ${(selectedContent.data as any).chapter}` 
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
                          bookAgeRating={bookAgeRating}
                        />
                      )}
                      
                      {results.contentResults?.description && (
                        <ContentCard
                          title="Description"
                          icon={<FileText className="h-4 w-4" />}
                          result={results.contentResults.description}
                          id="description-section"
                          bookAgeRating={bookAgeRating}
                        />
                      )}
                      
                      {results.contentResults?.coverImage && (
                        <ContentCard
                          title="Cover Image"
                          icon={<Image className="h-4 w-4" />}
                          result={results.contentResults.coverImage}
                          id="coverImage-section"
                          bookAgeRating={bookAgeRating}
                        />
                      )}
                    </div>
                  </div>
                  
                  {/* Chapters Section */}
                  <div className="space-y-4">
                    <h3 className="text-base font-medium">Chapters</h3>
                    
                    <div className="space-y-4">
                      {results.contentResults?.chapters && results.contentResults.chapters.map((chapter, idx) => (
                        <ContentCard
                          key={`chapter-${idx}`}
                          title={`Chapter ${chapter.chapter}`}
                          icon={<BookOpen className="h-4 w-4" />}
                          result={chapter}
                          id={`chapter-${idx}`}
                          bookAgeRating={bookAgeRating}
                        />
                      ))}
                      
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