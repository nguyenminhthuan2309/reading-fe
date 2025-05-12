import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { purchaseChapter } from "@/lib/api/payment";
import { CHAPTER_KEYS, AUTH_KEYS } from "@/lib/constants/query-keys";
import { useMe } from "@/lib/hooks/useUsers";
/**
 * Hook for purchasing a chapter
 */
export function usePurchaseChapter() {
  const queryClient = useQueryClient();
  const { refetchUserInfo } = useMe();

  return useMutation({
    mutationFn: (chapterId: number) => purchaseChapter(chapterId),
    onSuccess: (response, chapterId) => {
      if (response.code === 200) {
        toast.success(response.msg || "Chapter purchased successfully");
        
        // Invalidate related queries to refetch data
        queryClient.invalidateQueries({ queryKey: CHAPTER_KEYS.DETAIL(chapterId) });
        refetchUserInfo();
      } else {
        toast.error(response.msg || "Failed to purchase chapter");
      }
    },
    onError: (error: any) => {
      toast.error(error.message || "An error occurred while purchasing the chapter");
    }
  });
} 