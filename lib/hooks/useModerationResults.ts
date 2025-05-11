import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  getModerationResults, 
  createModerationResults, 
  updateModerationResults,
} from '@/lib/api/books';
import { toast } from 'sonner';
import { ModerationResultsPayload, ModerationResultsResponse } from '@/models/openai';

// Query key factory for moderation results
const moderationKeys = {
  all: ['moderationResults'] as const,
  details: (bookId: number) => [...moderationKeys.all, bookId] as const,
};

// Hook to fetch moderation results
export function useModerationResults(bookId: number | undefined) {
  return useQuery({
    queryKey: bookId ? moderationKeys.details(bookId) : ['moderationResults', 'empty'],
    queryFn: () => bookId ? getModerationResults(bookId).then(res => res.data) : null,
    enabled: !!bookId, // Only fetch if bookId is provided
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
    retry: 1,
  });
}

// Hook to create new moderation results
export function useCreateModerationResults() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ 
      bookId, 
      data 
    }: { 
      bookId: number, 
      data: ModerationResultsPayload 
    }) => createModerationResults(bookId, data),
    onSuccess: (response, { bookId }) => {
      // Invalidate query to refetch the moderation results
      queryClient.invalidateQueries({
        queryKey: moderationKeys.details(bookId),
      });
      
      if (response.code === 200) {
        toast.success("Moderation results saved successfully");
      } else {
        toast.error("Failed to save moderation results");
      }
    },
    onError: (error) => {
      console.error("Error creating moderation results:", error);
      toast.error("Failed to save moderation results");
    },
  });
}

// Hook to update existing moderation results
export function useUpdateModerationResults() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ 
      bookId, 
      data 
    }: { 
      bookId: number, 
      data: ModerationResultsPayload 
    }) => updateModerationResults(bookId, data),
    onSuccess: (response, { bookId }) => {
      // Invalidate query to refetch the moderation results
      queryClient.invalidateQueries({
        queryKey: moderationKeys.details(bookId),
      });
      
      if (response.code === 200) {
        toast.success("Moderation results updated successfully");
      } else {
        toast.error("Failed to update moderation results");
      }
    },
    onError: (error) => {
      console.error("Error updating moderation results:", error);
      toast.error("Failed to update moderation results");
    },
  });
}

// Hook to check if moderation results exist and save or update accordingly
export function useSaveModerationResults() {
  const createMutation = useCreateModerationResults();
  const updateMutation = useUpdateModerationResults();
  
  const saveModerationResults = async (bookId: number, data: ModerationResultsPayload, isEdit: boolean = false) => {
    // First check if results exist
    if (isEdit) {
      return updateMutation.mutate({ bookId, data });
    } else {
      return createMutation.mutate({ bookId, data });
    }
  };
  
  return {
    saveModerationResults,
    isLoading: createMutation.isPending || updateMutation.isPending,
  };
}

// Static version of the saveModerationResults function that can be used outside of React components
export async function saveModerateResultsStatic(bookId: number, data: ModerationResultsPayload, isEdit: boolean = false) {
  try {
    // Use the appropriate API function based on whether we're editing or creating
    const response = isEdit 
      ? await updateModerationResults(bookId, data)
      : await createModerationResults(bookId, data);
    
    // Handle response
    if (response.code === 200) {
      return response.data;
    } else {
      throw new Error("Failed to save moderation results");
    }
  } catch (error) {
    console.error(`Error ${isEdit ? "updating" : "creating"} moderation results:`, error);
    throw error;
  }
} 