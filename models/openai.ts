

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

export interface ModerationResult {
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

export interface ModerationResponse {
  id: string;
  model: string;
  results: ModerationResult[];
}

export interface OpenAIError {
  error: string;
}
