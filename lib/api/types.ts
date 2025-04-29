/**
 * Enhanced moderation request with support for text and image content
 */
export interface EnhancedModerationRequest {
  /** Title of the book or content to moderate */
  title?: string;
  /** Description of the book or content to moderate */
  description?: string;
  /** Plain text content extracted from chapters */
  chaptersContent?: string;
  /** Base64 encoded cover image */
  coverImage?: string;
  /** Array of base64 encoded chapter images */
  chapterImages?: string[];
  /** Moderation model to use (defaults to 'omni-moderation-latest') */
  model?: string;
} 