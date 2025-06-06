"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Check, X } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Typing effect component
const TypingEffect = () => {
  const [dots, setDots] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => {
        if (prev === "...") return "";
        return prev + ".";
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center justify-center py-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Sparkles size={16} className="animate-pulse text-primary" />
        <span className="text-sm">AI is thinking{dots}</span>
      </div>
    </div>
  );
};

interface EnhancementPopoverProps {
  children: React.ReactNode;
  onEnhance: () => Promise<string>;
  onApply: (enhancedContent: string) => void;
  disabled?: boolean;
  triggerClassName?: string;
  contentClassName?: string;
  placeholder?: string;
}

export function EnhancementPopover({
  children,
  onEnhance,
  onApply,
  disabled = false,
  triggerClassName = "",
  contentClassName = "",
  placeholder = "Enhanced content will appear here..."
}: EnhancementPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [enhancedContent, setEnhancedContent] = useState<string>("");
  const [error, setError] = useState<string>("");

  const handleEnhance = async () => {
    if (disabled) return;
    
    setIsOpen(true);
    setIsLoading(true);
    setError("");
    setEnhancedContent("");

    try {
      const result = await onEnhance();
      setEnhancedContent(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to enhance content");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = () => {
    if (enhancedContent) {
      onApply(enhancedContent);
      handleClose();
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setEnhancedContent("");
    setError("");
    setIsLoading(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <div className="relative">
        {children}
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={`absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground hover:text-primary ${triggerClassName}`}
            onClick={(e) => {
              e.stopPropagation();
              handleEnhance();
            }}
            disabled={disabled}
            title="Enhance with AI"
          >
            <Sparkles size={14} />
          </Button>
        </PopoverTrigger>
      </div>
      
      <PopoverContent 
        className={`w-80 p-0 rounded-lg border shadow-lg ${contentClassName}`}
        align="end"
        side="bottom"
      >
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/10 p-4 rounded-t-lg">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-amber-600 dark:text-amber-400" />
            <h4 className="font-medium text-sm text-amber-700 dark:text-amber-300">AI Enhancement</h4>
          </div>
        </div>
        
        <div className="p-4 space-y-3">
          {isLoading && <TypingEffect />}
          
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-2 rounded-md">
              {error}
            </div>
          )}
          
          {enhancedContent && !isLoading && (
            <div className="space-y-3">
              <div className="text-sm bg-muted p-3 rounded-md max-h-32 overflow-y-auto">
                {enhancedContent}
              </div>
              
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleApply}
                  className="flex-1"
                >
                  <Check size={14} className="mr-1" />
                  Apply
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1"
                >
                  <X size={14} className="mr-1" />
                  Cancel
                </Button>
              </div>
            </div>
          )}
          
          {!isLoading && !enhancedContent && !error && (
            <div className="text-sm text-muted-foreground text-center py-2">
              {placeholder}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
} 