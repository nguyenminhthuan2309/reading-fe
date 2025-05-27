"use client";

import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { ANALYTICS_KEYS } from "@/lib/constants/query-keys";
import { 
  createVisit, 
  createPageView, 
  updateVisit,
  getVisit,
  getVisitsByVisitorId,
  getVisitsByUser,
  getVisitsByTimeRange,
  getVisitStats,
  getPageViewsByVisitId,
  getPageViewsByTimeRange,
  getPageViewStats,
  getBounceRate,
  endVisit,
  getVisitStatistics
} from "@/lib/api/analytics";
import { getBookStatistics } from "@/lib/api/books";
import { getUserStatistics } from "@/lib/api/user";
import { 
  Visit, 
  PageView, 
  CreateVisitPayload, 
  CreatePageViewPayload, 
  UpdateVisitPayload,
  VisitTimeRangeParams,
  PageViewTimeRangeParams,
  AnalyticsTimeRangeParams
} from "@/models/analytics";

/**
 * Hook for creating a new visit
 * @param options Configuration options for the mutation
 * @returns Mutation object for creating visits
 */
export const useCreateVisit = (options: { showToasts?: boolean } = {}) => {
  const queryClient = useQueryClient();
  const { showToasts = true } = options;

  return useMutation({
    mutationFn: (payload: CreateVisitPayload) => createVisit(payload),
    onSuccess: (response, variables) => {
      if (response.code === 200 || response.code === 201) {
        if (showToasts) {
          toast.success("Visit created successfully");
        }
        
        // Invalidate related queries
        queryClient.invalidateQueries({ queryKey: ANALYTICS_KEYS.VISITS.ALL });
        queryClient.invalidateQueries({ queryKey: ANALYTICS_KEYS.VISITS.BY_USER });
        queryClient.invalidateQueries({ 
          queryKey: ANALYTICS_KEYS.VISITS.BY_VISITOR(variables.visitorId) 
        });
      } else {
        if (showToasts) {
          toast.error(response.msg || "Failed to create visit");
        }
      }
    },
    onError: (error: any) => {
      if (showToasts) {
        toast.error(error.message || "An error occurred while creating visit");
      }
    },
  });
};

/**
 * Hook for creating a new page view
 * @param options Configuration options for the mutation
 * @returns Mutation object for creating page views
 */
export const useCreatePageView = (options: { showToasts?: boolean } = {}) => {
  const queryClient = useQueryClient();
  const { showToasts = true } = options;

  return useMutation({
    mutationFn: (payload: CreatePageViewPayload) => createPageView(payload),
    onSuccess: (response, variables) => {
      if (response.code === 200 || response.code === 201) {
        if (showToasts) {
          toast.success("Page view tracked successfully");
        }
        
        // Invalidate related queries
        queryClient.invalidateQueries({ queryKey: ANALYTICS_KEYS.PAGE_VIEWS.ALL });
        queryClient.invalidateQueries({ 
          queryKey: ANALYTICS_KEYS.PAGE_VIEWS.BY_VISIT(variables.visitId) 
        });
        
        // Also invalidate visit-related queries as page views affect visit stats
        queryClient.invalidateQueries({ queryKey: ANALYTICS_KEYS.VISITS.ALL });
      } else {
        if (showToasts) {
          toast.error(response.msg || "Failed to track page view");
        }
      }
    },
    onError: (error: any) => {
      if (showToasts) {
        toast.error(error.message || "An error occurred while tracking page view");
      }
    },
  });
};

/**
 * Hook for updating an existing visit
 * @returns Mutation object for updating visits
 */
export const useUpdateVisit = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateVisitPayload }) => 
      updateVisit(id, payload),
    onSuccess: (response, variables) => {
      if (response.code === 200 || response.code === 201) {
        toast.success("Visit updated successfully");
        
        // Invalidate related queries
        queryClient.invalidateQueries({ queryKey: ANALYTICS_KEYS.VISITS.ALL });
        queryClient.invalidateQueries({ 
          queryKey: ANALYTICS_KEYS.VISITS.DETAIL(variables.id) 
        });
        queryClient.invalidateQueries({ queryKey: ANALYTICS_KEYS.VISITS.BY_USER });
      } else {
        toast.error(response.msg || "Failed to update visit");
      }
    },
    onError: (error: any) => {
      toast.error(error.message || "An error occurred while updating visit");
    },
  });
};

// End visit
export const useEndVisit = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => endVisit(id),
    onSuccess: (response) => {
      if (response.code === 200 || response.code === 201) {
        toast.success("Visit ended successfully");
        queryClient.invalidateQueries({ queryKey: ANALYTICS_KEYS.VISITS.ALL });
        queryClient.invalidateQueries({ queryKey: ANALYTICS_KEYS.VISITS.BY_USER });
      } else {
        toast.error(response.msg || "Failed to end visit");
      }
    },
  });
};

/**
 * Hook to fetch a specific visit by ID
 * @param visitId The ID of the visit to fetch
 * @returns Query object containing visit data
 */
export const useVisit = (visitId: string) => {
  return useQuery({
    queryKey: ANALYTICS_KEYS.VISITS.DETAIL(visitId),
    queryFn: async () => {
      const response = await getVisit(visitId);
      if (response.code !== 200) {
        throw new Error(response.msg || "Failed to fetch visit");
      }
      return response.data;
    },
    enabled: !!visitId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Hook to fetch visits by visitor ID
 * @param visitorId The visitor ID to fetch visits for
 * @returns Query object containing visits data
 */
export const useVisitsByVisitor = (visitorId: string) => {
  return useQuery({
    queryKey: ANALYTICS_KEYS.VISITS.BY_VISITOR(visitorId),
    queryFn: async () => {
      const response = await getVisitsByVisitorId(visitorId);
      if (response.code !== 200) {
        throw new Error(response.msg || "Failed to fetch visits");
      }
      return response.data || [];
    },
    enabled: !!visitorId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Hook to fetch visits for the current user
 * @returns Query object containing user visits data
 */
export const useUserVisits = () => {
  return useQuery({
    queryKey: ANALYTICS_KEYS.VISITS.BY_USER,
    queryFn: async () => {
      const response = await getVisitsByUser();
      if (response.code !== 200) {
        throw new Error(response.msg || "Failed to fetch user visits");
      }
      return response.data || [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Hook to fetch visits by time range
 * @param params Time range and filter parameters
 * @returns Query object containing filtered visits data
 */
export const useVisitsByTimeRange = (params: VisitTimeRangeParams) => {
  return useQuery({
    queryKey: ANALYTICS_KEYS.VISITS.BY_TIME_RANGE(params),
    queryFn: async () => {
      const response = await getVisitsByTimeRange(params);
      if (response.code !== 200) {
        throw new Error(response.msg || "Failed to fetch visits by time range");
      }
      return response.data || [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Hook to fetch visit statistics
 * @param params Time range parameters for statistics
 * @returns Query object containing visit statistics
 */
export const useVisitStats = (params: AnalyticsTimeRangeParams) => {
  return useQuery({
    queryKey: ANALYTICS_KEYS.VISITS.STATS(params),
    queryFn: async () => {
      const response = await getVisitStats(params);
      if (response.code !== 200) {
        throw new Error(response.msg || "Failed to fetch visit statistics");
      }
      return response.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Hook to fetch page views by visit ID
 * @param visitId The visit ID to fetch page views for
 * @returns Query object containing page views data
 */
export const usePageViewsByVisit = (visitId: string) => {
  return useQuery({
    queryKey: ANALYTICS_KEYS.PAGE_VIEWS.BY_VISIT(visitId),
    queryFn: async () => {
      const response = await getPageViewsByVisitId(visitId);
      if (response.code !== 200) {
        throw new Error(response.msg || "Failed to fetch page views");
      }
      return response.data || [];
    },
    enabled: !!visitId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Hook to fetch page views by time range
 * @param params Time range and filter parameters
 * @returns Query object containing filtered page views data
 */
export const usePageViewsByTimeRange = (params: PageViewTimeRangeParams) => {
  return useQuery({
    queryKey: ANALYTICS_KEYS.PAGE_VIEWS.BY_TIME_RANGE(params),
    queryFn: async () => {
      const response = await getPageViewsByTimeRange(params);
      if (!response.success) {
        throw new Error(response.msg || "Failed to fetch page views by time range");
      }
      return response.data || [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Hook to fetch page view statistics
 * @param params Time range parameters for statistics
 * @returns Query object containing page view statistics
 */
export const usePageViewStats = (params: AnalyticsTimeRangeParams) => {
  return useQuery({
    queryKey: ANALYTICS_KEYS.PAGE_VIEWS.STATS(params),
    queryFn: async () => {
      const response = await getPageViewStats(params);
      if (!response.success) {
        throw new Error(response.msg || "Failed to fetch page view statistics");
      }
      return response.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Hook to fetch bounce rate statistics
 * @param params Time range parameters for bounce rate calculation
 * @returns Query object containing bounce rate statistics
 */
export const useBounceRate = (params: AnalyticsTimeRangeParams) => {
  return useQuery({
    queryKey: ANALYTICS_KEYS.BOUNCE_RATE(params),
    queryFn: async () => {
      const response = await getBounceRate(params);
      if (response.code !== 200) {
        throw new Error(response.msg || "Failed to fetch bounce rate");
      }
      return response.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Hook to fetch combined visit statistics (overview + chart data)
 * @param params Time range parameters for statistics
 * @returns Query object containing combined visit statistics
 */
export const useVisitStatistics = (params: AnalyticsTimeRangeParams) => {
  return useQuery({
    queryKey: ['analytics', 'visitStatistics', params],
    queryFn: async () => {
      const response = await getVisitStatistics(params);
      if (response.code !== 200) {
        throw new Error(response.msg || "Failed to fetch visit statistics");
      }
      return response.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Hook to fetch book statistics (overview + chart data)
 * @param params Time range parameters for statistics
 * @returns Query object containing book statistics
 */
export const useBookStatistics = (params: AnalyticsTimeRangeParams) => {
  return useQuery({
    queryKey: ['analytics', 'bookStatistics', params],
    queryFn: async () => {
      const response = await getBookStatistics(params);
      if (response.code !== 200) {
        throw new Error(response.msg || "Failed to fetch book statistics");
      }
      return response.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Hook to fetch user statistics (overview + chart data)
 * @param params Time range parameters for statistics
 * @returns Query object containing user statistics
 */
export const useUserStatistics = (params: AnalyticsTimeRangeParams) => {
  return useQuery({
    queryKey: ['analytics', 'userStatistics', params],
    queryFn: async () => {
      const response = await getUserStatistics(params);
      if (response.code !== 200) {
        throw new Error(response.msg || "Failed to fetch user statistics");
      }
      return response.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Combined hook for analytics operations
 * @param options Configuration options for mutations
 * @returns Object with all analytics mutations and commonly used queries
 */
export const useAnalytics = (options: { showToasts?: boolean } = {}) => {
  const createVisitMutation = useCreateVisit(options);
  const createPageViewMutation = useCreatePageView(options);
  const updateVisitMutation = useUpdateVisit();
  const endVisitMutation = useEndVisit();

  return {
    // Mutations
    createVisit: createVisitMutation.mutate,
    createVisitAsync: createVisitMutation.mutateAsync,
    isCreatingVisit: createVisitMutation.isPending,
    
    createPageView: createPageViewMutation.mutate,
    createPageViewAsync: createPageViewMutation.mutateAsync,
    isCreatingPageView: createPageViewMutation.isPending,
    
    updateVisit: updateVisitMutation.mutate,
    updateVisitAsync: updateVisitMutation.mutateAsync,
    isUpdatingVisit: updateVisitMutation.isPending,
    
    endVisit: endVisitMutation.mutate,
    endVisitAsync: endVisitMutation.mutateAsync,
    isEndingVisit: endVisitMutation.isPending,
    
    // Loading states
    isLoading: createVisitMutation.isPending || 
               createPageViewMutation.isPending || 
               updateVisitMutation.isPending ||
               endVisitMutation.isPending,
  };
};

export default useAnalytics;
