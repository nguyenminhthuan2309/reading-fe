'use client';

import { useEffect, useRef, useState } from 'react';
import { Bot, X, Send, User, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useChat } from '@/lib/hooks/useChat';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';
import { useUserStore } from '@/lib/store';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';

const predefinedMessages = [
  "What books do you recommend?",
  "How do I find a specific book?",
  "Tell me about your features"
];

// Helper function to parse book recommendations
function parseBookRecommendations(content: string) {
  const lines = content.split('\n');
  // Pattern for numbered format: "1. Book Title (Author) ::: (123)"
  const numberedPattern = /^(\d+)\.\s+(.+?)\s+\((.+?)\)\s+:::\s+\((\d+)\)$/;
  // Pattern for format with ID prefix: "Book Title (Author) ::: (ID: 123)"
  const idPrefixPattern = /^(.+?)\s+\((.+?)\)\s+:::\s+\(ID:\s*(\d+)\)$/;
  // Pattern for simple format: "Book Title (Author) ::: (123)"
  const simplePattern = /^(.+?)\s+\((.+?)\)\s+:::\s+\((\d+)\)$/;
  
  return lines.map((line, index) => {
    // Try numbered format first
    let match = line.match(numberedPattern);
    if (match) {
      const [, number, title, author, id] = match;
      return {
        type: 'book',
        number,
        title,
        author,
        id,
        original: line
      };
    }
    
    // Try ID prefix format
    match = line.match(idPrefixPattern);
    if (match) {
      const [, title, author, id] = match;
      return {
        type: 'book',
        number: null,
        title,
        author,
        id,
        original: line
      };
    }
    
    // Try simple format
    match = line.match(simplePattern);
    if (match) {
      const [, title, author, id] = match;
      return {
        type: 'book',
        number: null,
        title,
        author,
        id,
        original: line
      };
    }
    
    return {
      type: 'text',
      content: line
    };
  });
}

// Component to render parsed content
function MessageContent({ content }: { content: string }) {
  const parsedContent = parseBookRecommendations(content);
  
  return (
    <div className="space-y-1">
      {parsedContent.map((item, index) => {
        if (item.type === 'book') {
          return (
            <div key={index}>
              {item.number ? `${item.number}. ` : ''}<Link 
                href={`/books/${item.id}`}
                className="text-blue-500 hover:text-blue-400 dark:text-blue-300 dark:hover:text-blue-200 underline font-medium transition-colors"
              >
                {item.title}
              </Link> <span className="text-muted-foreground dark:text-gray-400">({item.author})</span>
            </div>
          );
        }
        return <div key={index}>{item.content}</div>;
      })}
    </div>
  );
}

export function Chat() {
  const pathname = usePathname();
  const { messages, isOpen, isLoading, sendMessage, toggleChat } = useChat();
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showIcon, setShowIcon] = useState(false);
  const { user } = useUserStore();

  // Check if current route is in auth, admin, or payment group
  const isExcludedRoute = pathname.startsWith('/auth') || 
                         pathname.startsWith('/admin') || 
                         pathname.startsWith('/payment');

  // Show chat icon after 5s
  useEffect(() => {
    if (!isExcludedRoute) {
      const timer = setTimeout(() => {
        setShowIcon(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isExcludedRoute]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (isExcludedRoute || !showIcon) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputRef.current?.value) {
      sendMessage(inputRef.current.value);
      inputRef.current.value = '';
    }
  };

  return (
    <div className="fixed bottom-[80px] right-4 z-50">
      {!isOpen ? (
        <Button
          onClick={toggleChat}
          className="h-12 w-12 rounded-full shadow-lg bg-yellow-600 hover:bg-yellow-700 dark:bg-yellow-600 dark:hover:bg-yellow-700 dark:shadow-gray-900/50 transition-all"
          size="icon"
        >
          <Bot className="h-6 w-6 text-white" />
        </Button>
      ) : (
        <div className="flex flex-col w-[400px] h-[600px] bg-background dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900/50 border dark:border-gray-700">
          <div className="flex items-center justify-between p-4 border-b dark:border-gray-700 bg-white dark:bg-gray-800 rounded-t-lg">
            <h3 className="font-semibold dark:text-white">Chat with AI Assistant</h3>
            <Button
              onClick={toggleChat}
              variant="ghost"
              size="icon"
              className="h-8 w-8 dark:hover:bg-gray-700 dark:text-gray-300 hover:text-gray-600 dark:hover:text-white"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex items-start gap-2",
                  message.isUser ? "flex-row-reverse" : "flex-row"
                )}
              >
                <Avatar className="h-8 w-8 shrink-0">
                  {message.isUser ? (
                    user?.avatar ? (
                      <AvatarImage src={user.avatar} alt={user.name || 'User'} />
                    ) : (
                      <AvatarFallback className="bg-amber-100 dark:bg-yellow-600/20">
                        <User className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                      </AvatarFallback>
                    )
                  ) : (
                    <AvatarFallback className="bg-amber-100 dark:bg-yellow-600/20">
                      <Sparkles className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                    </AvatarFallback>
                  )}
                </Avatar>
                <div
                  className={cn(
                    "max-w-[80%] rounded-lg p-3 break-words",
                    message.isUser
                      ? "bg-yellow-600 dark:bg-yellow-600 text-white dark:text-white whitespace-pre-wrap"
                      : "bg-muted dark:bg-gray-700 dark:text-gray-200"
                  )}
                >
                  <MessageContent content={message.content} />
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex items-start gap-2">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className="bg-amber-100 dark:bg-yellow-600/20">
                    <Sparkles className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-muted dark:bg-gray-700 rounded-lg p-3">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-foreground dark:bg-gray-300 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-foreground dark:bg-gray-300 rounded-full animate-bounce delay-100" />
                    <div className="w-2 h-2 bg-foreground dark:bg-gray-300 rounded-full animate-bounce delay-200" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {messages.length === 0 && (
            <div className="p-4 border-t dark:border-gray-700 bg-white dark:bg-gray-800">
              <div className="space-y-2">
                {predefinedMessages.map((message, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="w-full justify-start text-left dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 dark:hover:text-white"
                    onClick={() => sendMessage(message)}
                  >
                    {message}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="p-4 border-t dark:border-gray-700 bg-white dark:bg-gray-800 rounded-b-lg">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                placeholder="Type your message..."
                className="flex-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
              />
              <Button type="submit" size="icon" className="dark:bg-yellow-600 dark:hover:bg-yellow-700">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
} 