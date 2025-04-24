'use client';

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { 
  getNotifications, 
  getNotificationCount, 
  markNotificationAsRead, 
  markAllNotificationsAsRead, 
  deleteNotification, 
  deleteAllNotifications,
  NotificationQueryParams,
  Notification
} from '@/lib/api/notification';
import { toast } from 'sonner';
import { useUserStore } from '@/lib/store';
import { ApiResponse, PaginatedData } from '@/models/api';

export const NOTIFICATION_QUERY_KEYS = {
  all: ['notifications'] as const,
  list: () => [...NOTIFICATION_QUERY_KEYS.all, 'list'] as const,
  infinite: () => [...NOTIFICATION_QUERY_KEYS.all, 'infinite'] as const,
  count: () => [...NOTIFICATION_QUERY_KEYS.all, 'count'] as const,
  details: (id: string) => [...NOTIFICATION_QUERY_KEYS.all, 'details', id] as const,
};

export function useNotifications(baseParams: Omit<NotificationQueryParams, 'page' | 'limit'> = {}) {
  const queryClient = useQueryClient();
  const isLoggedIn = useUserStore(state => state.isLoggedIn);
  const LIMIT = 10; // Number of notifications per page

  // Use infinite query for pagination support
  const {
    data: infiniteData,
    isLoading: isLoadingNotifications,
    error: notificationsError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: [...NOTIFICATION_QUERY_KEYS.infinite(), baseParams],
    queryFn: ({ pageParam }) => {
      const params: NotificationQueryParams = {
        ...baseParams,
        page: Number(pageParam),
        limit: LIMIT
      };
      return getNotifications(params);
    },
    getNextPageParam: (lastPage: ApiResponse<PaginatedData<Notification<any>>>, pages) => {
      if (lastPage.status !== 200 || !lastPage.data) return undefined;
      const { totalPages } = lastPage.data;
      const currentPage = pages.length; // Current page is the number of pages we already have
      return currentPage < totalPages ? currentPage + 1 : undefined;
    },
    initialPageParam: 1,
    enabled: isLoggedIn,
  });

  // Query to get unread count
  const {
    data: countData,
    isLoading: isLoadingCount,
    error: countError
  } = useQuery({
    queryKey: NOTIFICATION_QUERY_KEYS.count(),
    queryFn: () => getNotificationCount(),
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: isLoggedIn,
  });

  // Invalidate all notification queries
  const invalidateQueries = () => {
    queryClient.invalidateQueries({ queryKey: NOTIFICATION_QUERY_KEYS.all });
  };

  // Mutation to mark a notification as read
  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: string) => markNotificationAsRead(notificationId),
    onSuccess: (response) => {
      if (response.status === 200 ) {
        invalidateQueries();
      } else {
        toast.error('Failed to mark notification as read');
      }
    },
    onError: () => {
      toast.error('An error occurred while marking notification as read');
    }
  });

  // Mutation to mark all notifications as read
  const markAllAsReadMutation = useMutation({
    mutationFn: () => markAllNotificationsAsRead(),
    onSuccess: (response) => {
      if (response.status === 200 ) {
        invalidateQueries();
      } else {
        toast.error('Failed to mark all notifications as read');
      }
    },
    onError: () => {
      toast.error('An error occurred while marking all notifications as read');
    }
  });

  // Mutation to delete a notification
  const deleteNotificationMutation = useMutation({
    mutationFn: (notificationId: string) => deleteNotification(notificationId),
    onSuccess: (response) => {
      if (response.status === 200 ) {
        invalidateQueries();
      } else {
        toast.error('Failed to delete notification');
      }
    },
    onError: () => {
      toast.error('An error occurred while deleting notification');
    }
  });

  // Mutation to delete all notifications
  const deleteAllNotificationsMutation = useMutation({
    mutationFn: () => deleteAllNotifications(),
    onSuccess: (response) => {
      if (response.status === 200 ) {
        invalidateQueries();
      } else {
        toast.error('Failed to clear notifications');
      }
    },
    onError: () => {
      toast.error('An error occurred while clearing notifications');
    }
  });

  // Handler functions
  const handleMarkAsRead = (notificationId: string) => {
    markAsReadMutation.mutate(notificationId);
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const handleDeleteNotification = (notificationId: string) => {
    deleteNotificationMutation.mutate(notificationId);
  };

  const handleClearNotifications = () => {
    deleteAllNotificationsMutation.mutate();
  };

  const handleLoadMore = () => {
    if (!isFetchingNextPage && hasNextPage) {
      fetchNextPage();
    }
  };

  // Process data
  const notifications = infiniteData?.pages.flatMap(page => 
    page.status === 200 && page.data ? page.data.data : []
  ) || [];
  
  const totalItems = infiniteData?.pages[0]?.status === 200 && infiniteData.pages[0].data
    ? infiniteData.pages[0].data.totalItems 
    : 0;
    
  const unreadCount = countData?.status === 200 ? countData.data : 0;
  const isLoading = isLoadingNotifications || isLoadingCount;
  const error = notificationsError || countError;

  return {
    notifications,
    unreadCount,
    totalItems,
    isLoading,
    error,
    isFetchingMore: isFetchingNextPage,
    hasMoreNotifications: hasNextPage,
    handleMarkAsRead,
    handleMarkAllAsRead,
    handleDeleteNotification,
    handleClearNotifications,
    handleLoadMore,
  };
} 