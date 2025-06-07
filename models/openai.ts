import { DisplayModerationModelType } from "@/lib/hooks/useOpenAI";

export interface OpenAIRequest {
  prompt: string;
  model?: string;
  max_tokens?: number;
}

export interface OpenAIResponse {
  content: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface ModerationRequest {
  input: string;
  model?: string;
}

export interface EnhancedModerationRequest {
  title?: string;
  description?: string;
  chaptersContent?: string;
  coverImage?: string;
  chapterImages?: string[];
  model?: 'omni-moderation-latest' | 'gpt-4o' | 'o4-mini';
  ageRating?: 'ALL' | '13_PLUS' | '16_PLUS' | '18_PLUS';
  chapters?: Array<{
    id?: string | number;
    chapter: number;
    title: string;
    content: string | string[];
  }>;
}

export interface ModerationResultItem {
  flagged: boolean;
  categories: {
    sexual: boolean;
    'sexual/minors': boolean;
    harassment: boolean;
    'harassment/threatening': boolean;
    hate: boolean;
    'hate/threatening': boolean;
    illicit: boolean;
    'illicit/violent': boolean;
    'self-harm': boolean;
    'self-harm/intent': boolean;
    'self-harm/instructions': boolean;
    violence: boolean;
    'violence/graphic': boolean;
  };
  category_scores: {
    sexual: number;
    'sexual/minors': number;
    harassment: number;
    'harassment/threatening': number;
    hate: number;
    'hate/threatening': number;
    illicit: number;
    'illicit/violent': number;
    'self-harm': number;
    'self-harm/intent': number;
    'self-harm/instructions': number;
    violence: number;
    'violence/graphic': number;
  };
  category_applied_input_types: Record<string, string[]>;
}

export interface ModerationResult {
  id: string;
  model: string;
  results: ModerationResultItem[];
  timestamp: string;
}

export interface ShortenModerationResult{
  reason?: string;
  sexual?: number;
  'sexual/minors'?: number;
  harassment?: number;
  'harassment/threatening'?: number;
  hate?: number;
  'hate/threatening'?: number;
  illicit?: number;
  'illicit/violent'?: number;
  'self-harm'?: number;
  'self-harm/intent'?: number;
  'self-harm/instructions'?: number;
  violence?: number;
  'violence/graphic'?: number;
}

export interface EnhancedModerationResult {
  model: DisplayModerationModelType;
  timestamp: string;
  flagged?: boolean;
  passed?: boolean;
  contentResults?: {
    title?: any;
    description?: any;
    coverImage?: any;
    chapters?: any[];
  };
}

export interface ModerationResponse {
  id: string;
  model: string;
  results: ModerationResult[];
}

export interface EnhancedModerationResponse extends EnhancedModerationResult {}

export interface OpenAIError {
  error: string;
}

export interface TextModerationInput {
  type: "text";
  text: string;
}

export interface ImageModerationInput {
  type: "image_url";
  image_url: {
    url: string;
  };
}

export type ModerationInput = TextModerationInput | ImageModerationInput;

export interface ModerationResultsPayload {
  bookId: number;
  title: string | null;
  description: string | null;
  coverImage: string | null;
  chapters: string | null;
  model: DisplayModerationModelType;
}

export interface ModerationResultsResponse {
  id: number;
  book: {id: number, title: string};
  title: string | null;
  description: string | null;
  coverImage: string | null;
  chapters: string | {
    chapterId: number;
    result: string;
  }[];
  model: DisplayModerationModelType;
  createdAt: string;
  updatedAt: string;
}