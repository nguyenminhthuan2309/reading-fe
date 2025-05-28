import { useMutation } from '@tanstack/react-query';
import { 
  enhanceTitle, 
  enhanceDescription, 
  enhanceChapterTitle,
  EnhanceContentRequest,
  EnhancementType 
} from '@/lib/api/openai';
import { toast } from 'sonner';

// Hook for enhancing book title
export function useEnhanceTitle() {
  return useMutation({
    mutationFn: async (params: {
      title: string;
      context?: {
        bookDescription?: string;
        bookGenres?: string[];
        bookType?: string;
      };
    }) => {
      if (!params.title.trim()) {
        throw new Error('Title cannot be empty');
      }
      return await enhanceTitle(params.title, params.context);
    },
    onError: (error: Error) => {
      toast.error(`Failed to enhance title: ${error.message}`);
    },
  });
}

// Hook for enhancing book description
export function useEnhanceDescription() {
  return useMutation({
    mutationFn: async (params: {
      description: string;
      context?: {
        bookTitle?: string;
        bookGenres?: string[];
        bookType?: string;
      };
    }) => {
      if (!params.description.trim()) {
        throw new Error('Description cannot be empty');
      }
      return await enhanceDescription(params.description, params.context);
    },
    onError: (error: Error) => {
      toast.error(`Failed to enhance description: ${error.message}`);
    },
  });
}

// Hook for enhancing chapter title
export function useEnhanceChapterTitle() {
  return useMutation({
    mutationFn: async (params: {
      chapterTitle: string;
      context?: {
        bookTitle?: string;
        bookDescription?: string;
        bookGenres?: string[];
        chapterNumber?: number;
        bookType?: string;
      };
    }) => {
      if (!params.chapterTitle.trim()) {
        throw new Error('Chapter title cannot be empty');
      }
      return await enhanceChapterTitle(params.chapterTitle, params.context);
    },
    onError: (error: Error) => {
      toast.error(`Failed to enhance chapter title: ${error.message}`);
    },
  });
}

// Generic hook for any content enhancement
export function useEnhanceContent() {
  return useMutation({
    mutationFn: async (params: EnhanceContentRequest) => {
      if (!params.content.trim()) {
        throw new Error('Content cannot be empty');
      }
      
      switch (params.type) {
        case 'title':
          return await enhanceTitle(params.content, params.context);
        case 'description':
          return await enhanceDescription(params.content, params.context);
        case 'chapter_title':
          return await enhanceChapterTitle(params.content, params.context);
        default:
          throw new Error('Invalid enhancement type');
      }
    },
    onError: (error: Error) => {
      toast.error(`Failed to enhance content: ${error.message}`);
    },
  });
}

// Combined hook that provides all enhancement functions
export function useRecommendation() {
  const enhanceTitle = useEnhanceTitle();
  const enhanceDescription = useEnhanceDescription();
  const enhanceChapterTitle = useEnhanceChapterTitle();
  const enhanceContent = useEnhanceContent();

  return {
    // Individual enhancement functions
    enhanceTitle: {
      mutate: enhanceTitle.mutate,
      mutateAsync: enhanceTitle.mutateAsync,
      isLoading: enhanceTitle.isPending,
      isError: enhanceTitle.isError,
      error: enhanceTitle.error,
      data: enhanceTitle.data,
      reset: enhanceTitle.reset,
    },
    enhanceDescription: {
      mutate: enhanceDescription.mutate,
      mutateAsync: enhanceDescription.mutateAsync,
      isLoading: enhanceDescription.isPending,
      isError: enhanceDescription.isError,
      error: enhanceDescription.error,
      data: enhanceDescription.data,
      reset: enhanceDescription.reset,
    },
    enhanceChapterTitle: {
      mutate: enhanceChapterTitle.mutate,
      mutateAsync: enhanceChapterTitle.mutateAsync,
      isLoading: enhanceChapterTitle.isPending,
      isError: enhanceChapterTitle.isError,
      error: enhanceChapterTitle.error,
      data: enhanceChapterTitle.data,
      reset: enhanceChapterTitle.reset,
    },
    // Generic enhancement function
    enhanceContent: {
      mutate: enhanceContent.mutate,
      mutateAsync: enhanceContent.mutateAsync,
      isLoading: enhanceContent.isPending,
      isError: enhanceContent.isError,
      error: enhanceContent.error,
      data: enhanceContent.data,
      reset: enhanceContent.reset,
    },
    // Utility functions
    isAnyLoading: enhanceTitle.isPending || enhanceDescription.isPending || enhanceChapterTitle.isPending || enhanceContent.isPending,
    resetAll: () => {
      enhanceTitle.reset();
      enhanceDescription.reset();
      enhanceChapterTitle.reset();
      enhanceContent.reset();
    },
  };
} 