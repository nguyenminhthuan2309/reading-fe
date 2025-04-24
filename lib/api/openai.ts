import { ModerationResponse, OpenAIError } from '@/models/openai';
import { ModerationRequest } from '@/models/openai';
import { OpenAIRequest, OpenAIResponse } from '@/models';
import axios from 'axios';
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

/**
 * Checks text against the OpenAI moderation API to detect harmful content
 */
export async function checkModeration(params: ModerationRequest): Promise<ModerationResponse> {
  try {
    const response = await axios.post<ModerationResponse>('/api/openai/moderation', params);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data) {
      const errorData = error.response.data as OpenAIError;
      throw new Error(errorData.error || 'An error occurred with the moderation API');
    }
    throw error;
  }
} 