import { CheckCircle2, AlertTriangle, Eye, Info } from "lucide-react";
import { NumericAgeRating } from "./ModerationResults";

interface CategoryScore {
  category: string;
  score: number;
}

// Age rating threshold constants (duplicated from ModerationResults for reference)
const AGE_RATING = {
  THRESHOLD_13_PLUS: 0.1,  // 13+ rating threshold
  THRESHOLD_16_PLUS: 0.2,  // 16+ rating threshold
  THRESHOLD_18_PLUS: 0.5   // 18+ rating threshold
};

interface ContentResultProps {
  title: string;
  result: any; // Using any to accommodate both old and new structures
  content?: string;
  showDetailedScores: boolean;
  bookAgeRating: NumericAgeRating; // The book's intended age rating
}
// Helper function to format age rating for display
const formatAgeRating = (rating: NumericAgeRating): string => {
  switch (rating) {
    case 3: return "18+";
    case 2: return "16+";
    case 1: return "13+";
    case 0: return "All";
    default: return "All Ages";
  }
};

// Helper for text color based on score
const getScoreColorClass = (score: number, bookAgeRating: NumericAgeRating) => {
  if (score >= AGE_RATING.THRESHOLD_18_PLUS) return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300";
  if (score >= AGE_RATING.THRESHOLD_16_PLUS) return "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300";
  if (score >= AGE_RATING.THRESHOLD_13_PLUS) return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300";
  return "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300";
};

const getBgColorClass = (score: number, bookAgeRating: NumericAgeRating) => {
  // If we're 18+, everything passes
  if (bookAgeRating === 3) {
    return score >= AGE_RATING.THRESHOLD_18_PLUS ? "bg-yellow-500" : 
           score >= AGE_RATING.THRESHOLD_16_PLUS ? "bg-amber-500" : 
           score >= AGE_RATING.THRESHOLD_13_PLUS ? "bg-yellow-500" : "bg-green-500";
  }
  
  // If we're 16+, content should be below 18+ threshold
  if (bookAgeRating === 2) {
    return score >= AGE_RATING.THRESHOLD_18_PLUS ? "bg-yellow-500" : 
           score >= AGE_RATING.THRESHOLD_16_PLUS ? "bg-amber-500" : 
           score >= AGE_RATING.THRESHOLD_13_PLUS ? "bg-yellow-500" : "bg-green-500";
  }
  
  // If we're 13+, content should be below 16+ threshold
  if (bookAgeRating === 1) {
    return score >= AGE_RATING.THRESHOLD_16_PLUS ? "bg-yellow-500" : 
           score >= AGE_RATING.THRESHOLD_13_PLUS ? "bg-yellow-500" : "bg-green-500";
  }
  
  // If we're 'ALL', content should be below 13+ threshold
  return score >= AGE_RATING.THRESHOLD_13_PLUS ? "bg-yellow-500" : "bg-green-500";
};

const contentPassesForCategory = (score: number, bookAgeRating: NumericAgeRating) => {
  
  
  if (bookAgeRating === 3) return true;
  if (bookAgeRating === 2) return score < AGE_RATING.THRESHOLD_18_PLUS;
  if (bookAgeRating === 1) return score < AGE_RATING.THRESHOLD_16_PLUS;
  return score < AGE_RATING.THRESHOLD_13_PLUS;
};

// Check if all content would pass for a given age rating
export function wouldPassForAgeRating(result: any, targetRating: NumericAgeRating): boolean {
  // If result has explicit flagged property, use that
  if (result && result.flagged !== undefined) {
    return !result.flagged;
  }
  
  // If no results
  if (!result) return true;
  
  // If no category scores
  if (!result.category_scores) return true;
  
  // Convert to array of scores
  const scores = extractScoresFromResult(result);
  
  // Check if all categories pass for the target rating
  return Object.values(scores).every(score => contentPassesForCategory(score as number, targetRating));
}

// Extract scores from result consistently
const extractScoresFromResult = (result: any): Record<string, number> => {
  if (!result) return {};
  if (result.category_scores) return result.category_scores;
  return {};
};

export const ContentResult = ({ title, result, content, showDetailedScores, bookAgeRating }: ContentResultProps) => {
  const scores = extractScoresFromResult(result);
  const sortedScores: CategoryScore[] = Object.entries(scores)
    .map(([category, score]) => ({ 
      category, 
      score: typeof score === 'number' ? score : Number(score) 
    }))
    .sort((a, b) => b.score - a.score);

  // Use the flagged property directly if available, otherwise calculate it
  const hasFailingCategories = result?.flagged ?? 
    sortedScores.some(({ score }) => !contentPassesForCategory(score, bookAgeRating));

  return (
    <div className="bg-white border rounded-lg overflow-hidden shadow-sm">
      <div className={`p-3 flex justify-between items-center ${
        hasFailingCategories ? 'bg-yellow-50 border-b border-yellow-200' : 'bg-green-50 border-b border-green-200'
      }`}>
        <div className="flex items-center gap-2">
          <h4 className="font-medium">{title}</h4>
          {hasFailingCategories ? (
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          ) : (
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          )}
        </div>
        
        <div className={`text-xs px-2 py-1 rounded ${
          hasFailingCategories ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
        }`}>
          {hasFailingCategories ? `Fails for ${formatAgeRating(bookAgeRating)}` : 'Passes'}
        </div>
      </div>
      
      {/* Flagged categories section */}
      {hasFailingCategories && sortedScores.length > 0 && (
        <div className="p-4 bg-yellow-50/30">
          <h5 className="text-sm font-medium mb-2 flex items-center gap-1.5">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            Categories exceeding {formatAgeRating(bookAgeRating)} rating
          </h5>
          <div className="flex flex-wrap gap-1.5">
            {sortedScores
              .filter(({ score }) => !contentPassesForCategory(score, bookAgeRating))
              .map(({ category, score }) => (
                <div key={`${title}-${category}`} className="text-xs px-2.5 py-1.5 bg-yellow-100 text-yellow-800 rounded inline-block">
                  {category.replace(/[-_]/g, ' ')} ({(score * 100).toFixed(1)}%)
                </div>
              ))}
          </div>
        </div>
      )}
      
      
      {/* Show detailed scores when toggle is enabled - for both flagged and non-flagged content */}
      {showDetailedScores && sortedScores.length > 0 && (
        <div className={`p-4 ${(hasFailingCategories || content) ? 'border-t' : ''}`}>
          <div className="flex items-center justify-between mb-3">
            <h5 className="text-sm font-medium flex items-center gap-1.5">
              <Info className="h-4 w-4 text-slate-500" />
              All Category Scores
            </h5>
            <span className="text-xs text-muted-foreground">
              Showing all {sortedScores.length} categories
            </span>
          </div>
          
          {/* Top 3 highest scores - highlighted */}
          {sortedScores.slice(0, 3).length > 0 && (
            <div className="mb-4">
              <div className="text-xs font-medium mb-2 text-primary">Top Categories:</div>
              <div className="bg-slate-50 rounded-md p-2 border">
                {sortedScores.slice(0, 3).map(({ category, score }) => (
                  <div key={`${title}-top-${category}`} className="flex justify-between items-center text-xs mb-1.5 last:mb-0 pb-1.5 last:pb-0 border-b last:border-0">
                    <span className="text-slate-700 font-medium">{category.replace(/[-_]/g, ' ')}</span>
                    <span className={`px-1.5 py-0.5 rounded ${getScoreColorClass(score, bookAgeRating)}`}>
                      {(score * 100).toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* All categories with progress bars */}
          <div className="text-xs font-medium mb-2">All Categories:</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {sortedScores.map(({ category, score }) => (
              <div key={`${title}-score-${category}`} className="flex flex-col">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-medium">{category.replace(/[-_]/g, ' ')}</span>
                  <span className={`text-xs ${getScoreColorClass(score, bookAgeRating)}`}>
                    {(score * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className={`h-1.5 rounded-full ${getBgColorClass(score, bookAgeRating)}`} 
                    style={{ width: `${Math.max(score * 100, 3)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

interface ContentResultDetailedProps {
  title: string;
  scores: CategoryScore[];
  chapterTitle?: string;
  bookAgeRating: NumericAgeRating;
}

export function TopScoreSummary({ 
  title, 
  scores, 
  chapterTitle, 
  bookAgeRating = 0 
}: ContentResultDetailedProps) {
  return (
    <div className="bg-white p-3 rounded-md border shadow-sm">
      <h4 className="text-xs font-semibold mb-2 flex items-center gap-1">
        <span className="w-2 h-2 rounded-full bg-amber-500"></span>
        {title}
      </h4>
      {scores.slice(0, 3).map((item, idx) => {
        // Check if this individual score passes for the given age rating
        const passes = contentPassesForCategory(item.score, bookAgeRating);
        return (
          <div key={`top-${title}-${idx}`} className="flex justify-between items-center text-xs mb-1.5 pb-1.5 border-b last:border-0 last:mb-0 last:pb-0">
            <span className="line-clamp-1 mr-2">
              {item.category.replace(/[-_]/g, ' ')}
              {chapterTitle && <span className="text-muted-foreground"> ({chapterTitle})</span>}
            </span>
            <span className={`px-1.5 py-0.5 rounded ${
              passes ? 'bg-green-50 text-green-600' : 'bg-yellow-50 text-yellow-600 font-medium'
            }`}>
              {(item.score * 100).toFixed(1)}%
            </span>
          </div>
        );
      })}
      {scores.length === 0 && (
        <div className="text-xs text-muted-foreground">No significant scores detected</div>
      )}
    </div>
  );
} 