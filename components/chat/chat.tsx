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

const predefinedMessages = [
  "What books do you recommend?",
  "How do I find a specific book?",
  "Tell me about your features"
];

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
      }, 5000);
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
          className="h-12 w-12 rounded-full shadow-lg bg-primary hover:bg-primary/90"
          size="icon"
        >
          <Bot className="h-6 w-6" />
        </Button>
      ) : (
        <div className="flex flex-col w-80 h-96 bg-background rounded-lg shadow-lg border">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-semibold">Chat with AI Assistant</h3>
            <Button
              onClick={toggleChat}
              variant="ghost"
              size="icon"
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex items-start gap-2",
                  message.isUser ? "flex-row-reverse" : "flex-row"
                )}
              >
                <Avatar className="h-8 w-8">
                  {message.isUser ? (
                    user?.avatar ? (
                      <AvatarImage src={user.avatar} alt={user.name || 'User'} />
                    ) : (
                      <AvatarFallback>
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    )
                  ) : (
                    <AvatarFallback className="bg-primary/10">
                      <Sparkles className="h-4 w-4 text-primary" />
                    </AvatarFallback>
                  )}
                </Avatar>
                <div
                  className={cn(
                    "max-w-[80%] rounded-lg p-3",
                    message.isUser
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  )}
                >
                  {message.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex items-start gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary/10">
                    <Sparkles className="h-4 w-4 text-primary" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-muted rounded-lg p-3">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-foreground rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-foreground rounded-full animate-bounce delay-100" />
                    <div className="w-2 h-2 bg-foreground rounded-full animate-bounce delay-200" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {messages.length === 0 && (
            <div className="p-4 border-t">
              <div className="space-y-2">
                {predefinedMessages.map((message, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => sendMessage(message)}
                  >
                    {message}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                placeholder="Type your message..."
                className="flex-1"
              />
              <Button type="submit" size="icon">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
} 