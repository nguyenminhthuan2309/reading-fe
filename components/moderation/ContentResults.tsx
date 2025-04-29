import { CheckCircle2, AlertTriangle, Eye, Info } from "lucide-react";
import { AgeRating } from "./ModerationResults";

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
  bookAgeRating: AgeRating; // The book's intended age rating
}

// Helper function to format age rating for display
const formatAgeRating = (rating: AgeRating): string => {
  if (!rating) return "All Ages";
  return rating.replace("_", " ");
};

// Helper functions to determine coloring based on book age rating and score
const getScoreColorClass = (score: number, bookAgeRating: AgeRating) => {
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

const getBgColorClass = (score: number, bookAgeRating: AgeRating) => {
  // If we're 18+, everything passes
  if (bookAgeRating === "18_PLUS") {
    return score >= AGE_RATING.THRESHOLD_18_PLUS ? "bg-red-500" : 
           score >= AGE_RATING.THRESHOLD_16_PLUS ? "bg-amber-500" : 
           score >= AGE_RATING.THRESHOLD_13_PLUS ? "bg-yellow-500" : "bg-green-500";
  }
  
  // If we're 16+, content should be below 18+ threshold
  if (bookAgeRating === "16_PLUS") {
    return score >= AGE_RATING.THRESHOLD_18_PLUS ? "bg-red-500" : 
           score >= AGE_RATING.THRESHOLD_16_PLUS ? "bg-amber-500" : 
           score >= AGE_RATING.THRESHOLD_13_PLUS ? "bg-yellow-500" : "bg-green-500";
  }
  
  // If we're 13+, content should be below 16+ threshold
  if (bookAgeRating === "13_PLUS") {
    return score >= AGE_RATING.THRESHOLD_16_PLUS ? "bg-red-500" : 
           score >= AGE_RATING.THRESHOLD_13_PLUS ? "bg-yellow-500" : "bg-green-500";
  }
  
  // If we're 'ALL', content should be below 13+ threshold
  return score >= AGE_RATING.THRESHOLD_13_PLUS ? "bg-red-500" : "bg-green-500";
};

const contentPassesForCategory = (score: number, bookAgeRating: AgeRating) => {
  if (!bookAgeRating || bookAgeRating === "18_PLUS") return true;
  if (bookAgeRating === "16_PLUS") return score < AGE_RATING.THRESHOLD_18_PLUS;
  if (bookAgeRating === "13_PLUS") return score < AGE_RATING.THRESHOLD_16_PLUS;
  return score < AGE_RATING.THRESHOLD_13_PLUS;
};

// Helper to extract scores from a moderation result (works with both old and new structure)
const extractScoresFromResult = (result: any): Record<string, number> => {
  if (!result) return {};
  
  // If it has the old structure with category_scores, use that
  if (result.category_scores) {
    return result.category_scores;
  }
  
  // Otherwise extract scores directly from the result properties
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

export function ContentResult({ title, result, content, showDetailedScores, bookAgeRating = "ALL" }: ContentResultProps) {
  const scores = extractScoresFromResult(result);
  const sortedScores: CategoryScore[] = Object.entries(scores)
    .map(([category, score]) => ({ 
      category, 
      score: typeof score === 'number' ? score : Number(score) 
    }))
    .sort((a, b) => b.score - a.score);

  // Determine if any categories fail based on book age rating
  const hasFailingCategories = sortedScores.some(({ score }) => !contentPassesForCategory(score, bookAgeRating));

  return (
    <div className="bg-white border rounded-lg overflow-hidden shadow-sm">
      <div className={`p-3 flex justify-between items-center ${
        hasFailingCategories ? 'bg-red-50 border-b border-red-200' : 'bg-green-50 border-b border-green-200'
      }`}>
        <div className="flex items-center gap-2">
          <h4 className="font-medium">{title}</h4>
          {hasFailingCategories ? (
            <AlertTriangle className="h-4 w-4 text-red-600" />
          ) : (
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          )}
        </div>
        
        <div className={`text-xs px-2 py-1 rounded ${
          hasFailingCategories ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
        }`}>
          {hasFailingCategories ? `Fails for ${formatAgeRating(bookAgeRating)}` : 'Passes'}
        </div>
      </div>
      
      {/* Flagged categories section */}
      {hasFailingCategories && sortedScores.length > 0 && (
        <div className="p-4 bg-red-50/30">
          <h5 className="text-sm font-medium mb-2 flex items-center gap-1.5">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            Categories exceeding {formatAgeRating(bookAgeRating)} rating
          </h5>
          <div className="flex flex-wrap gap-1.5">
            {sortedScores
              .filter(({ score }) => !contentPassesForCategory(score, bookAgeRating))
              .map(({ category, score }) => (
                <div key={`${title}-${category}`} className="text-xs px-2.5 py-1.5 bg-red-100 text-red-800 rounded inline-block">
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
}

interface TopScoreSummaryProps {
  title: string;
  scores: CategoryScore[];
  chapterTitle?: string;
  bookAgeRating: AgeRating;
}

export function TopScoreSummary({ title, scores, chapterTitle, bookAgeRating = "ALL" }: TopScoreSummaryProps) {
  return (
    <div className="bg-white p-3 rounded-md border shadow-sm">
      <h4 className="text-xs font-semibold mb-2 flex items-center gap-1">
        <span className="w-2 h-2 rounded-full bg-amber-500"></span>
        {title}
      </h4>
      {scores.slice(0, 3).map((item, idx) => {
        const passes = contentPassesForCategory(item.score, bookAgeRating);
        return (
          <div key={`top-${title}-${idx}`} className="flex justify-between items-center text-xs mb-1.5 pb-1.5 border-b last:border-0 last:mb-0 last:pb-0">
            <span className="line-clamp-1 mr-2">
              {item.category.replace(/[-_]/g, ' ')}
              {chapterTitle && <span className="text-muted-foreground"> ({chapterTitle})</span>}
            </span>
            <span className={`px-1.5 py-0.5 rounded ${
              passes ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600 font-medium'
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