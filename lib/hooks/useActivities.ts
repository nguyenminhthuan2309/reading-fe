"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ACTIVITY_KEYS, AUTH_KEYS } from "@/lib/constants/query-keys";
import { getUserById, getUserActivities, getAvailableActivities, createNewActivity, GetActivitiesParams } from "@/lib/api/user";
import { useUserStore } from "@/lib/store/useUserStore";
import { useMe } from "./useUsers";

export interface Activity {
  id: number;
  title: string;
  status: "notstarted" | "inprogress" | "done";
  completedCount: number;
  maxPerDay: number;
  activityType: ActivityType;
  points?: number;
  createdAt?: string;
  currentStreak?: number;
  earnedPoint?: number;
  activity?: ActivityCategory;
}

export type ActivityType = "login" | "watch_ad" | "rate_book" | "complete_book" | "comment_chapter";

export interface ActivityCategory {
  activityType: string;
  basePoint: number;
  createdAt: string;
  description: string;
  id: number;
  maxPerDay: number;
  maxStreakPoint: number;
  streakBased: boolean;
  title: string;
  updatedAt: string;
}

/**
 * Hook to fetch and manage user activities
 * @param userId ID of the user whose activities to fetch
 * @returns Object containing user activities and query state
 */
export const useActivities = (userId: string | number) => {
  const {
    data: activitiesData,
    isLoading: isActivitiesLoading,
    isError: isActivitiesError,
    error: activitiesError,
    refetch: refetchActivities,
  } = useQuery({
    queryKey: ACTIVITY_KEYS.USER_ACTIVITIES(userId),
    queryFn: async () => {
      const response = await getUserById(userId.toString());
      if (!response.status) {
        throw new Error(response.msg || "Failed to fetch user activities");
      }
      return response.data.activities || [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return {
    activities: activitiesData,
    isLoading: isActivitiesLoading,
    isError: isActivitiesError,
    error: activitiesError,
    refetch: refetchActivities,
  };
};

/**
 * Hook to fetch activities with filters
 * @param params Optional parameters to filter activities
 * @returns Object containing filtered activities and query state
 */
export const useFilteredActivities = (params?: GetActivitiesParams) => {
  const {
    data: filteredActivities,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['activities', 'filtered', params],
    queryFn: async () => {
      const response = await getUserActivities(params);
      if (!response.status) {
        throw new Error(response.msg || "Failed to fetch filtered activities");
      }
      return response.data || [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return {
    activities: filteredActivities || [],
    isLoading,
    isError,
    error,
    refetch,
  };
};

/**
 * Hook to fetch available activities/missions for the current user
 * @returns Object containing available activities and query state
 */
export const useAvailableActivities = () => {
  const { user } = useUserStore();
  const queryClient = useQueryClient();
  
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ACTIVITY_KEYS.AVAILABLE,
    queryFn: async () => {
      const response = await getAvailableActivities();
      if (!response.status) {
        throw new Error(response.msg || "Failed to fetch available activities");
      }

      return response.data as Activity[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!user,
  });
  
  const createActivityMutation = useMutation({
    mutationFn: ({activityType, relatedEntityId}: {activityType: ActivityType, relatedEntityId?: number}) => createNewActivity(activityType, relatedEntityId),
    onSuccess: () => {
      // Invalidate the available activities query to trigger a refetch
      queryClient.invalidateQueries({ queryKey: ACTIVITY_KEYS.AVAILABLE });
      queryClient.invalidateQueries({ queryKey: ['activities',  'filtered'] });
      queryClient.invalidateQueries({ queryKey: AUTH_KEYS.ME });
    }
  });
  
  // Calculate the number of activities that are not completed
  const notCompletedCount = data?.filter(activity => 
    activity.status === "notstarted" || activity.status === "inprogress"
  ).length || 0;

  return {
    availableActivities: data || [],
    isLoading,
    isError,
    error,
    refetch,
    createActivity: createActivityMutation.mutate,
    isCreating: createActivityMutation.isPending,
    notCompletedCount
  };
};

export default useActivities; 