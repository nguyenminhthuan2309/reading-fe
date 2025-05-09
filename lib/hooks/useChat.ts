'use client';

import { useState, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { sendChatMessage } from '@/lib/api/chat';
import { useMutation } from '@tanstack/react-query';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  isTyping?: boolean;
}

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [sessionId] = useState(() => uuidv4());

  const { mutate: sendMessageMutation, isPending: isLoading } = useMutation({
    mutationFn: sendChatMessage,
    onSuccess: (response) => {
      if (response.status === 201) {
        // Add bot response with typing effect
        const botMessage: Message = {
          id: uuidv4(),
          content: response.data.data,
          isUser: false,
          isTyping: true,
        };
        setMessages(prev => [...prev, botMessage]);

        // Simulate typing effect
        const fullText = response.data.data?.split('-')[0];
        let currentText = '';
        let currentIndex = 0;

        const typingInterval = setInterval(() => {
          if (currentIndex < fullText.length) {
            // Add multiple characters at once for faster typing
            const chunkSize = 3;
            const endIndex = Math.min(currentIndex + chunkSize, fullText.length);
            currentText += fullText.slice(currentIndex, endIndex);
            currentIndex = endIndex;
            
            setMessages(prev => 
              prev.map(msg => 
                msg.id === botMessage.id 
                  ? { ...msg, content: currentText }
                  : msg
              )
            );
          } else {
            clearInterval(typingInterval);
            setMessages(prev => 
              prev.map(msg => 
                msg.id === botMessage.id 
                  ? { ...msg, isTyping: false }
                  : msg
              )
            );
          }
        }, 15); // Faster interval (10ms instead of 30ms)
      }
    },
    onError: (error) => {
      console.error('Error sending message:', error);
      // Add error message
      const errorMessage: Message = {
        id: uuidv4(),
        content: 'Sorry, I encountered an error. Please try again.',
        isUser: false,
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  });

  const sendMessage = useCallback((content: string) => {
    if (!content.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: uuidv4(),
      content,
      isUser: true,
    };
    setMessages(prev => [...prev, userMessage]);

    // Send message to API
    sendMessageMutation({
      sessionId,
      content,
    });
  }, [sessionId, sendMessageMutation]);

  const toggleChat = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  return {
    messages,
    isOpen,
    isLoading,
    sendMessage,
    toggleChat,
  };
} 