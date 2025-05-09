import { post } from './base';
import { ApiResponse } from '@/models/api';

interface ChatMessage {
  sessionId: string;
  content: string;
}


interface ChatResponse {
  success: boolean;
  data: string;
}

export async function sendChatMessage(message: ChatMessage): Promise<ApiResponse<ChatResponse>> {
  return post<ChatResponse>('/chat/completion', message);
} 