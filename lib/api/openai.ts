import { ModerationResponse, OpenAIError, EnhancedModerationRequest, EnhancedModerationResponse, ModerationRequest, ModerationResult, TextModerationInput, ImageModerationInput, ModerationInput } from '@/models/openai';
import { AgeRatingEnum, OpenAIRequest, OpenAIResponse } from '@/models';
import axios from 'axios';
import OpenAI from 'openai'; 
import { OPENAI_MODERATION_SYSTEM_PROMPT, OPENAI_IMAGE_MODERATION_SYSTEM_PROMPT, ENHANCEMENT_PROMPTS } from '../constants/openai-sys';
import { ChatCompletionMessageParam } from 'openai/resources/index.mjs';
import { DisplayModerationModelType } from '../hooks/useOpenAI';

// Age rating thresholds for content moderation
export const AGE_RATING_THRESHOLDS = {
  [AgeRatingEnum.EVERYONE]: 0,            // All ages: no content above 0 score
  [AgeRatingEnum.TEEN]: 0.05,   // 13+: scores below 0.05
  [AgeRatingEnum.MATURE]: 0.1,    // 16+: scores below 0.1
  [AgeRatingEnum.ADULT]: 0.2     // 18+: scores below 0.2
};


// Initialize the OpenAI client
// Note: The API key should be handled securely, this is just for demonstration
// In production, you'd need to use a proxy or secure environment variables
const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // This allows browser usage, but be careful with your API key exposure
});

/**
 * Sends a prompt to the OpenAI API through our server-side endpoint
 */
export async function sendOpenAIRequest(params: OpenAIRequest): Promise<OpenAIResponse> {
  try {
    const response = await axios.post<OpenAIResponse>('/api/openai', params);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data) {
      const errorData = error.response.data as OpenAIError;
      throw new Error(errorData.error || 'An error occurred with OpenAI');
    }
    throw error;
  }
}


// Model pricing info (per million tokens)
export const MODERATION_MODELS = {
  'omni-moderation-latest': { price: 0, description: 'Level 1 - Basic moderation (Free)' },
  'gpt-4o': { price: 2.50, description: 'Level 3 - Advanced moderation ($2.50/1M tokens)' },
  'o4-mini': { price: 1.10, description: 'Level 2 - Balanced moderation ($1.10/1M tokens)' }
} as const;

/**
 * Determines if content is flagged based on age rating and category scores
 * @param scores Category scores from moderation
 * @param ageRating Target age rating for the content
 * @returns Boolean indicating if the content should be flagged
 */
export function isContentFlagged(scores: Record<string, number>, ageRating: AgeRatingEnum = AgeRatingEnum.EVERYONE): boolean {
  if (!scores || Object.keys(scores).length === 0) return false;
  
  const threshold = AGE_RATING_THRESHOLDS[ageRating];
  
  // Content is flagged if any score exceeds the threshold for the given age rating
  return Object.values(scores).some(score => {
    console.log("Score:", score, "Threshold:", threshold, "Result:", score > threshold);
    return score > threshold;
  });
}

/**
 * Enhanced content moderation for books and chapters
 * Supports multiple moderation models with different capabilities and pricing
 * Handles both text and image content (as base64)
 * 
 * @param params Content to moderate (title, description, chapters) and model selection
 * @param options.chapterIds Optional array of chapter IDs to selectively moderate only those chapters
 * @param options.moderateBookInfo Whether to moderate title and description (default true)
 * @returns Moderation results with categories and scores
 */
export async function moderateContent(
  params: EnhancedModerationRequest, 
  options: { 
    chapterIds?: string[] | number[], 
    moderateBookInfo?: boolean 
  } = { moderateBookInfo: true }
): Promise<EnhancedModerationResponse> {
  try {
    // Default to omni-moderation-latest if no model specified
    const model = params.model || 'omni-moderation-latest';
    const { chapterIds, moderateBookInfo = true } = options;
    
    // For GPT-4o and o4-mini, process everything in a single request
    if (model === 'gpt-4o' || model === 'o4-mini') {
      return await moderateContentWithGPT(params, model, { chapterIds, moderateBookInfo });
    }
    
    // For omni-moderation-latest, continue with separate moderation requests
    // but format the response to match GPT models
    
    // Process content for moderation
    const contentResults: Record<string, any> = {};
    
    // Check title and description if moderateBookInfo is true
    if (moderateBookInfo) {
      // Check title if present
      if (params.title) {
        const titleResult = await checkSingleContent(model, params.title);
        contentResults.title = {
          category_scores: titleResult.category_scores
        };
      }
      
      // Check description if present
      if (params.description) {
        const descriptionResult = await checkSingleContent(model, params.description);
        contentResults.description = {
          category_scores: descriptionResult.category_scores
        };
      }
      
      // Check cover image if available
      if (params.coverImage) {
        const coverImageResult = await checkImageContent(model, params.coverImage);
        contentResults.coverImage = {
          category_scores: coverImageResult.category_scores
        };
      }
    }
    
    // Check chapters with new structure if available
    if (params.chapters && params.chapters.length > 0) {
      contentResults.chapters = [];
      
      for (let i = 0; i < params.chapters.length; i++) {
        const chapter = params.chapters[i];
        
        // Extract chapter ID and check if we should moderate this chapter
        const chapterId = chapter.id?.toString() || i.toString();
        
        // Skip this chapter if selective moderation is enabled and this chapter is not in the list
        if (chapterIds && chapterIds.length > 0 && !chapterIds.some(id => id.toString() === chapterId)) {
          console.log(`Skipping moderation for chapter ${chapterId} as it's not in the selective moderation list`);
          continue;
        }
        
        // Extract title and chapter number
        const chapterNumber = chapter.chapter || i;
        const chapterTitle = chapter.title || `Chapter ${chapterNumber}`;
        
        // Check text content
        if (typeof chapter.content === 'string') {
          const chapterResult = await checkSingleContent(model, chapter.content);
          
          contentResults.chapters.push({
            id: chapterId,
            index: chapterNumber,
            title: chapterTitle,
            result: {
              category_scores: chapterResult.category_scores
            }
          });
        } 
        // Check image content
        else if (Array.isArray(chapter.content) && chapter.content.length > 0) {
          // Process each image individually
          const imageScores: Record<string, number> = {};
          
          for (const imageUrl of chapter.content) {
            if (imageUrl) { 
              const imageResult = await checkImageContent(model, imageUrl);
              
              // Combine scores by taking the maximum for each category
              Object.entries(imageResult.category_scores).forEach(([category, score]) => {
                if (typeof score === 'number' && (!imageScores[category] || score > imageScores[category])) {
                  imageScores[category] = score;
                }
              });
            }
          }
          
          contentResults.chapters.push({
            id: chapterId,
            index: chapterNumber,
            title: chapterTitle,
            result: {
              category_scores: imageScores
            }
          });
        }
      }
    } 
    
    // Return combined results without flagged property
    return {
      model: 'Level 1',
      contentResults,
      timestamp: new Date().toISOString(),
    };
  } catch (error: any) {
    console.error('OpenAI Moderation API error:', error);
    throw new Error(error.message || 'An error occurred while moderating your content');
  }
}

/**
 * Process moderation with GPT-4o or o4-mini in a single request
 */
async function moderateContentWithGPT(
  params: EnhancedModerationRequest, 
  model: string,
  options: { 
    chapterIds?: string[] | number[], 
    moderateBookInfo?: boolean 
  } = { moderateBookInfo: true }
): Promise<EnhancedModerationResponse> {
  try {
    // Prepare the messages array
    const messages: ChatCompletionMessageParam[] = [
      {
        role: "system" as const,
        content: OPENAI_MODERATION_SYSTEM_PROMPT
      }
    ];

    // Build content array
    const contentParts: Array<any> = [];
    
    // Add title
    if (params.title) {
      contentParts.push({ 
        type: "text" as const,
        text: `Title is: ${params.title}` 
      });
    }
    
    // Add description
    if (params.description) {
      contentParts.push({ 
        type: "text" as const,
        text: `Description is: ${params.description}` 
      });
    }
    
    // Add cover image if available
    if (params.coverImage) {
      contentParts.push({
        type: "image_url" as const, 
        image_url: {
          url: params.coverImage
        }
      });
    } 
    
    const chapters: any[] = [];
    let chapterImageGroups: Record<number, string[]> = {};
    
    // Process chapterImages and group them by chapter number if available
    if (params.chapterImages && params.chapterImages.length > 0 && params.chapters && params.chapters.length > 0) {
      // Calculate images per chapter (rounded down)
      const imagesPerChapter = Math.floor(params.chapterImages.length / params.chapters.length);
      
      // Create groups of images for each chapter
      params.chapters.forEach((chapter, index) => {
        const startIdx = index * imagesPerChapter;
        const endIdx = (index === params.chapters!.length - 1) 
          ? params.chapterImages!.length  // Last chapter gets all remaining images
          : startIdx + imagesPerChapter;
          
        chapterImageGroups[chapter.chapter] = params.chapterImages!.slice(startIdx, endIdx);
      });
    }
    
    // Process chapters with new structure if available
    // Add each chapter with its number and title
    if (params.chapters && params.chapters.length > 0) {
      for (const chapter of params.chapters) {
        const chapterContent = [];
        
        // Add chapter title
        chapterContent.push({
          type: "text" as const,
          text: `Chapter ${chapter.chapter}: ${chapter.title}`
        });
        
        // Add chapter content
        if (chapter.content) {
          if (typeof chapter.content === 'string') {
            // Handle text content for novels
            chapterContent.push({
              type: "text" as const,
              text: chapter.content
            });
          } else if (Array.isArray(chapter.content)) {
            // Handle array of image URLs
            chapter.content.forEach((imageUrl: string) => {
              chapterContent.push({
                type: "image_url" as const,
                image_url: {
                  url: imageUrl
                }
              });
            });
          }
        }
        
        // Add associated chapter images from chapterImages if available
        if (chapterImageGroups[chapter.chapter]) {
          chapterImageGroups[chapter.chapter].forEach(imageUrl => {
            chapterContent.push({
              type: "image_url" as const,
              image_url: {
                url: imageUrl
              }
            });
          });
        }
        
        // Add all chapter content to chapters array
        chapters.push(...chapterContent);
      }
    } else if (params.chapterImages && params.chapterImages.length > 0) {
      // If we have chapter images but no chapters, just add them directly
      const images = params.chapterImages.map(imageUrl => ({
        type: "image_url" as const,
        image_url: {
          url: imageUrl
        }
      }));
      chapters.push(...images);
    }
    
    // Add user message with all content
    messages.push({
      role: "user",
      content: [...contentParts, ...chapters]
    });
    
    const completion = await openai.chat.completions.create({
      model,
      messages,
      response_format: { type: "json_object" },
      max_completion_tokens: 2048
    });
    
    // Parse the response
    const rawResult = completion.choices[0].message.content || '{}';
    let result;
    
    try {
      result = JSON.parse(rawResult);
      console.log("GPT moderation raw result:", result);
    } catch (e) {
      console.error('Failed to parse GPT moderation result:', e);
      throw new Error('Failed to parse moderation result');
    }

    // Define all possible categories for OpenAI moderation
    const allCategories = [
      "sexual", "hate", "harassment", "self-harm", "sexual/minors", 
      "hate/threatening", "violence", "violence/graphic", "self-harm/intent", 
      "self-harm/instructions", "harassment/threatening", "sexual/explicit"
    ];
    
    // Process the results into our standard format
    const contentResults: Record<string, any> = {};
    
    // Helper function to normalize content results
    const normalizeContentResult = (contentResult: any): any => { 
      // Ensure category_scores object exists
      const category_scores = contentResult?.category_scores || {};
      
      // Ensure all categories have a value (default to 0 for missing)
      const normalized_scores = allCategories.reduce((acc, category) => {
        acc[category] = category_scores[category] || 0;
        return acc;
      }, {} as Record<string, number>);
      
      // Remove flagged property - let the component handle flagging based on age rating
      return {
        category_scores: normalized_scores,
        ...(contentResult?.reason ? { reason: contentResult.reason } : {})
      };
    };
    
    
    contentResults.title = normalizeContentResult(result.title);
    contentResults.description = normalizeContentResult(result.description);
    contentResults.coverImage = normalizeContentResult(result.coverImage);
    contentResults.chapters = [];

    if (params.chapters && params.chapters.length > 0) {
      // Handle chapter structure with scores
      params.chapters.forEach((chapter) => {
        // Map result to chapter
        const chapterResult = result.chapters?.find((c: any) => c.chapter === chapter.chapter) || {};
        // Normalize chapter result
        const normalizedChapterResult = normalizeContentResult(chapterResult);
        
        // Convert results to chapter moderation format
        const chapterModeration: Record<string, any> = {
          id: chapter.id?.toString(),
          chapter: chapter.chapter,
          title: chapter.title,
          result: normalizedChapterResult
        };
        
        contentResults.chapters.push(chapterModeration);
      });
    }
    
    // Return combined results without flagged property
    return {
      model: model === 'o4-mini' ? 'Level 2' : 'Level 3',
      contentResults,
      timestamp: new Date().toISOString(),
    };
  } catch (error: any) {
    console.error('GPT Moderation API error:', error);
    throw new Error(error.message || 'An error occurred while moderating content with GPT');
  }
}

/**
 * Helper function to check a single piece of text content
 */
async function checkSingleContent(model: string, content: string): Promise<any> {
  try {
    if (model === 'omni-moderation-latest') {
      // Use standard moderation API for text
      const moderation = await openai.moderations.create({
        model,
        input: content,
      });
      
      const result = moderation.results[0];
      
      // Return only category scores without flagged property
      return {
        category_scores: Object.entries(result.category_scores).reduce((acc, [key, value]) => {
          acc[key] = value ?? 0;
          return acc;
        }, {} as Record<string, number>)
      };
    } else {
      // Use GPT models for more detailed analysis
      const completion = await openai.chat.completions.create({
        model,
        messages: [
          {
            role: "system",
            content: OPENAI_MODERATION_SYSTEM_PROMPT
          },
          {
            role: "user",
            content: `${content}`
          }
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 4098
      });
      
      // Parse the JSON response
      try {
        const scores = JSON.parse(completion.choices[0].message.content || '{}');
        console.log("Text moderation raw scores:", scores);
        
        // If the response is an object with 'title' property, it's using the new format
        // Extract just the direct scores (most likely from the 'title' property)
        const contentScores = scores.title || scores;
        
        // Return only scores
        return {
          category_scores: contentScores
        };
      } catch (e) {
        console.error('Failed to parse text moderation result:', e);
        throw new Error('Failed to parse moderation result');
      }
    }
  } catch (error) {
    console.error('Error checking content:', error);
    throw error;
  }
}

/**
 * Helper function to check image content
 */
async function checkImageContent(model: string, imageUrl: string): Promise<any> {
  try {
    // Check if model supports images
    if (model === 'omni-moderation-latest') {
      // Use standard moderation API for images
      const moderation = await openai.moderations.create({
        model,
        input: [{
          type: "image_url",
          image_url: {
            url: imageUrl
          }
        }],
      });
      
      const result = moderation.results[0];
      
      // Return only category scores without flagged property
      return {
        category_scores: Object.entries(result.category_scores).reduce((acc, [key, value]) => {
          acc[key] = value ?? 0;
          return acc;
        }, {} as Record<string, number>)
      };
    }
  } catch (error) {
    console.error('Error checking image content:', error);
    throw error;
  }
}

// Enhancement types and interfaces
export type EnhancementType = 'title' | 'description' | 'chapter_title';

export interface EnhanceContentRequest {
  type: EnhancementType;
  content: string;
  context?: {
    bookTitle?: string;
    bookDescription?: string;
    bookGenres?: string[];
    chapterNumber?: number;
    bookType?: string;
  };
  model?: string;
}

export interface EnhanceContentResponse {
  originalContent: string;
  enhancedContent: string;
  type: EnhancementType;
  model: string;
  timestamp: string;
}


/**
 * Enhance content using OpenAI API directly from the frontend
 * @param params Enhancement request parameters
 * @returns Enhanced content response
 */
export async function enhanceContent(params: EnhanceContentRequest): Promise<EnhanceContentResponse> {
  try {
    const { type, content, context = {}, model = 'gpt-4o-mini' } = params;
    
    // Validate required fields
    if (!type || !content) {
      throw new Error('Type and content are required');
    }

    // Validate enhancement type
    if (!['title', 'description', 'chapter_title'].includes(type)) {
      throw new Error('Invalid enhancement type. Must be title, description, or chapter_title');
    }

    // Validate model
    const allowedModels = ['gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo'];
    if (!allowedModels.includes(model)) {
      throw new Error('Invalid model. Allowed models: ' + allowedModels.join(', '));
    }

    // Build context information for the prompt
    let contextInfo = '';
    if (context.bookTitle) {
      contextInfo += `Book Title: ${context.bookTitle}\n`;
    }
    if (context.bookDescription) {
      contextInfo += `Book Description: ${context.bookDescription}\n`;
    }
    if (context.bookGenres && context.bookGenres.length > 0) {
      contextInfo += `Genres: ${context.bookGenres.join(', ')}\n`;
    }
    if (context.bookType) {
      contextInfo += `Book Type: ${context.bookType}\n`;
    }
    if (type === 'chapter_title' && context.chapterNumber) {
      contextInfo += `Chapter Number: ${context.chapterNumber}\n`;
    }

    // Build the user prompt
    let userPrompt = '';
    if (contextInfo) {
      userPrompt += `Context:\n${contextInfo}\n`;
    }
    
    if (type === 'title') {
      userPrompt += `Please enhance this book title: "${content}"`;
    } else if (type === 'description') {
      userPrompt += `Please enhance this book description:\n\n${content}`;
    } else if (type === 'chapter_title') {
      userPrompt += `Please enhance this chapter title: "${content}"`;
    }

    // Call OpenAI Chat Completion API directly
    const completion = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content: ENHANCEMENT_PROMPTS[type]
        },
        {
          role: "user",
          content: userPrompt
        }
      ],
      max_tokens: type === 'description' ? 500 : 100,
      temperature: 0.7,
    });

    let enhancedContent = completion.choices[0].message.content?.trim() || content;

    // Post-process the response based on type
    if (type === 'title' || type === 'chapter_title') {
      // Remove quotes from title if present
      enhancedContent = enhancedContent.replace(/^["']|["']$/g, '');
    }
    
    // Ensure we return clean text without extra formatting
    enhancedContent = enhancedContent.trim();

    // Return the enhanced content
    return {
      originalContent: content,
      enhancedContent,
      type,
      model,
      timestamp: new Date().toISOString(),
    };
  } catch (error: any) {
    console.error('OpenAI Enhancement error:', error);
    throw new Error(error.message || 'An error occurred while enhancing your content');
  }
}

/**
 * Enhance book title
 * @param title Current title
 * @param context Book context for better enhancement
 * @returns Enhanced title
 */
export async function enhanceTitle(
  title: string, 
  context?: {
    bookDescription?: string;
    bookGenres?: string[];
    bookType?: string;
  }
): Promise<string> {
  const response = await enhanceContent({
    type: 'title',
    content: title,
    context,
    model: 'gpt-4o-mini'
  });
  return response.enhancedContent;
}

/**
 * Enhance book description
 * @param description Current description
 * @param context Book context for better enhancement
 * @returns Enhanced description
 */
export async function enhanceDescription(
  description: string,
  context?: {
    bookTitle?: string;
    bookGenres?: string[];
    bookType?: string;
  }
): Promise<string> {
  const response = await enhanceContent({
    type: 'description',
    content: description,
    context,
    model: 'gpt-4o-mini'
  });
  return response.enhancedContent;
}

/**
 * Enhance chapter title
 * @param chapterTitle Current chapter title
 * @param context Book and chapter context for better enhancement
 * @returns Enhanced chapter title
 */
export async function enhanceChapterTitle(
  chapterTitle: string,
  context?: {
    bookTitle?: string;
    bookDescription?: string;
    bookGenres?: string[];
    chapterNumber?: number;
    bookType?: string;
  }
): Promise<string> {
  const response = await enhanceContent({
    type: 'chapter_title',
    content: chapterTitle,
    context,
    model: 'gpt-4o-mini'
  });
  return response.enhancedContent;
} 