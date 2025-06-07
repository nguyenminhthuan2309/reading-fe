import { useState } from 'react';
import { toast } from 'sonner';
import { moderateContent as apiModerateContent, MODERATION_MODELS as API_MODERATION_MODELS } from '@/lib/api/openai';
import { EnhancedModerationRequest, EnhancedModerationResponse } from '@/models/openai';

// Export models from the API for consistency
export const MODERATION_MODELS = {
  OMNI: 'omni-moderation-latest',
  GPT4O: 'gpt-4o',
  O4_MINI: 'o4-mini'
} as const;

export type ModerationModelType = typeof MODERATION_MODELS[keyof typeof MODERATION_MODELS];
export type DisplayModerationModelType = 'Level 1' | 'Level 2' | 'Level 3';

// Types for the moderation response
export interface ModerationResult extends EnhancedModerationResponse {}

// Types for the moderation request
export interface ModerationRequest extends EnhancedModerationRequest {}

export function useOpenAI() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Function to moderate content
  const moderateContent = async (data: ModerationRequest): Promise<ModerationResult | null> => {
    console.log(' ModerationRequest', data);
    setIsLoading(true);
    setError(null);
    
    try {
      // Use the API function instead of calling fetch directly
      const result = await apiModerateContent(data);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred during content moderation';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  
  return {
    moderateContent,
    isLoading,
    error,
  };
}

export default useOpenAI; 