import { ModerationResultsResponse, EnhancedModerationResult } from "@/models/openai";
import { NumericAgeRating } from "@/components/moderation/ModerationResults";
import { isContentFlagged } from "@/lib/api/openai";

/**
 * Parses a stored moderation result into an enhanced format
 * @param storedResult The moderation result from the server
 * @param ageRating The age rating to use for threshold checking
 * @returns An enhanced moderation result with flags determined
 */
export function parseStoredModerationResult(
  storedResult: ModerationResultsResponse, 
  ageRating: NumericAgeRating = 1
): EnhancedModerationResult {
  // Parse the stored JSON data
  let parsedTitle = null;
  let parsedDescription = null;
  let parsedCoverImage = null;
  let parsedChapters = [];
  
  try {
    if (storedResult.title) {
      parsedTitle = JSON.parse(storedResult.title);
    }
    
    if (storedResult.description) {
      parsedDescription = JSON.parse(storedResult.description);
    }
    
    if (storedResult.coverImage) {
      parsedCoverImage = JSON.parse(storedResult.coverImage);
    }
    
    if (storedResult.chapters) {
      if (typeof storedResult.chapters === 'string') {
        parsedChapters = JSON.parse(storedResult.chapters);
      } else {
        parsedChapters = storedResult.chapters.map((ch) => ({
          id: ch.chapterId,
          result: JSON.parse(ch.result)
        }));
      }
    }
  } catch (error) {
    console.error("Error parsing moderation data:", error);
  }
  
  // Create a structured result object from stored data
  const enhancedResult: EnhancedModerationResult = {
    model: storedResult.model,
    timestamp: storedResult.updatedAt || storedResult.createdAt || new Date().toISOString(),
    flagged: false, // Will be determined based on content
    passed: true,  // Default to true, will update based on flagged content
    contentResults: {
      title: parsedTitle,
      description: parsedDescription,
      coverImage: parsedCoverImage,
      chapters: parsedChapters
    }
  };
  
  // Check all content and determine overall flagged status
  const flaggingResult = checkContentForFlagging(enhancedResult, ageRating);
  
  // Set the flags
  enhancedResult.flagged = flaggingResult.anyContentFlagged;
  enhancedResult.passed = !flaggingResult.anyContentFlagged;
  
  return enhancedResult;
}

/**
 * Checks if any content in the moderation result is flagged
 * @param result The moderation result to check
 * @param ageRating The age rating to use for threshold checking
 * @returns Object with flagging status for each content type and overall
 */
export function checkContentForFlagging(
  result: EnhancedModerationResult, 
  ageRating: NumericAgeRating = 1
): {
  titleFlagged: boolean;
  descriptionFlagged: boolean;
  coverImageFlagged: boolean;
  chaptersFlagged: boolean;
  anyContentFlagged: boolean;
} {
  // Initialize with default values
  const flaggingStatus = {
    titleFlagged: false,
    descriptionFlagged: false,
    coverImageFlagged: false,
    chaptersFlagged: false,
    anyContentFlagged: false
  };
  
  // Check title
  if (result.contentResults?.title) {
    const title = result.contentResults.title;
    flaggingStatus.titleFlagged = (title.flagged === true) || 
      (title.category_scores && checkCategoryScores(title.category_scores, ageRating));
  }
  
  // Check description
  if (result.contentResults?.description) {
    const description = result.contentResults.description;
    flaggingStatus.descriptionFlagged = (description.flagged === true) || 
      (description.category_scores && checkCategoryScores(description.category_scores, ageRating));
  }
  
  // Check cover image
  if (result.contentResults?.coverImage) {
    const coverImage = result.contentResults.coverImage;
    flaggingStatus.coverImageFlagged = (coverImage.flagged === true) || 
      (coverImage.category_scores && checkCategoryScores(coverImage.category_scores, ageRating));
  }
  
  // Check chapters
  if (result.contentResults?.chapters && result.contentResults.chapters.length > 0) {
    flaggingStatus.chaptersFlagged = result.contentResults.chapters.some(chapter => {
      const chapterResult = chapter.result || chapter;
      return (chapterResult.flagged === true) || 
        (chapterResult.category_scores && checkCategoryScores(chapterResult.category_scores, ageRating));
    });
  }
  
  // Determine overall flagging status
  flaggingStatus.anyContentFlagged = 
    flaggingStatus.titleFlagged || 
    flaggingStatus.descriptionFlagged || 
    flaggingStatus.coverImageFlagged || 
    flaggingStatus.chaptersFlagged;
  
  return flaggingStatus;
}

/**
 * Checks if category scores exceed threshold for the given age rating
 * @param scores The category scores to check
 * @param ageRating The age rating to use for threshold checking
 * @returns Whether any score exceeds the threshold
 */
export function checkCategoryScores(
  scores: Record<string, number>, 
  ageRating: NumericAgeRating = 1
): boolean {
  return isContentFlagged(scores, ageRating);
}

/**
 * Checks if a single moderation result passed moderation
 * @param moderationResult The moderation result to check
 * @param ageRating The age rating to use for threshold checking
 * @returns Boolean indicating if the moderation passed (true) or failed (false)
 */
export function checkModerationPassed(
  moderationResult: ModerationResultsResponse, 
  ageRating: NumericAgeRating = 1
): boolean {
  try {
    // Parse and check the moderation data
    const enhancedResult = parseStoredModerationResult(moderationResult, ageRating);
    return enhancedResult.passed || false;
  } catch (error) {
    console.error("Error checking moderation result:", error);
    return false; // Default to failed if we can't parse
  }
}

/**
 * Processes moderation results from an array of responses
 * @param results Array of moderation results from the server
 * @param ageRating The age rating to use for threshold checking
 * @returns Map of moderation results by model
 */
export function processAllModerationResults(
  results: ModerationResultsResponse[], 
  ageRating: NumericAgeRating = 1
): Record<string, EnhancedModerationResult> {
  const processedResults: Record<string, EnhancedModerationResult> = {};
  
  if (!results || !Array.isArray(results)) return processedResults;
  
  results.forEach(result => {
    try {
      const enhancedResult = parseStoredModerationResult(result, ageRating);
      processedResults[result.model] = enhancedResult;
    } catch (error) {
      console.error(`Error processing moderation result for model ${result.model}:`, error);
    }
  });
  
  return processedResults;
} 