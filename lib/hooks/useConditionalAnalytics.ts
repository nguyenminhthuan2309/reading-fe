"use client";

import { useEffect, useRef } from 'react';
import { useCreateVisit, useCreatePageView, useUpdateVisit, useEndVisit } from './useAnalytics';
import { 
  getOrCreateVisitorId,
  getCurrentVisitId,
  setCurrentVisitId,
  setSessionStartTime,
  isNewSession,
  generateVisitId,
  getBrowserInfo,
  getPageInfo,
  extractBookAndChapterIds,
  clearCurrentVisitId
} from '@/lib/utils/analytics';
import { useUserStore } from '@/lib/store';

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';


interface ConditionalAnalyticsOptions {
  enabled: boolean;
  pathname: string;
}

/**
 * Hook for conditional analytics tracking
 * Only tracks when enabled and prevents duplicate calls
 */
export function useConditionalAnalytics({ enabled, pathname }: ConditionalAnalyticsOptions) {
  const { user } = useUserStore();
  const { mutateAsync: createVisit } = useCreateVisit({ showToasts: false });
  const { mutateAsync: createPageView } = useCreatePageView({ showToasts: false });
  
  // Prevent concurrent tracking calls and rapid duplicates
  const isTracking = useRef(false);
  const lastTrackingTime = useRef<number>(0);
  const lastTrackedPath = useRef<string>('');

  // Clear tracking state
  const clearTracking = () => {
    clearCurrentVisitId();
    isTracking.current = false;
    lastTrackingTime.current = 0;
    lastTrackedPath.current = '';
  }

  const endSession = (currentVisitId: string) => {
    const apiEndpoint = `${API_BASE_URL}/activities/visits/${currentVisitId}/end`;
    navigator.sendBeacon(apiEndpoint);
  }

  // Handle page unload and visibility change
  useEffect(() => {
    if (!enabled) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      const currentVisitId = getCurrentVisitId();
      if (currentVisitId) {
        // Remove visit id from session storage
        clearTracking();

        // End the session
        endSession(currentVisitId);
        
        // For debugging
        console.log('Sending visit end time via beacon:', { currentVisitId });
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        const currentVisitId = getCurrentVisitId();
        if (currentVisitId) {
          clearTracking();
          // End the session
          endSession(currentVisitId);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled]);

  useEffect(() => {
    // Only track if enabled
    if (!enabled) {
      return;
    }

    // Only run on client side
    if (typeof window === 'undefined') return;

    // Prevent rapid duplicate calls (within 100ms) for the same path
    const now = Date.now();
    if (isTracking.current || 
        (lastTrackedPath.current === pathname && now - lastTrackingTime.current < 100)) {
      return;
    }

    const trackVisitAndPageView = async () => {
      // Prevent concurrent tracking calls
      if (isTracking.current) return;
      isTracking.current = true;

      try {
         const visitorId = getOrCreateVisitorId(user?.id);
         let currentVisitId = getCurrentVisitId();
        
        // Create new visit if this is a new session or no existing visit
        if (!currentVisitId) {
          const browserInfo = getBrowserInfo();
          const now = new Date().toISOString();

          const visitPayload = {
            visitorId,
            userAgent: browserInfo.userAgent,
            referrer: browserInfo.referrer,
            // Add userId if user is logged in
            ...(user?.id && { userId: user.id })
          };

          const visitResponse = await createVisit(visitPayload);
          
          if (visitResponse.code === 200 || visitResponse.code === 201) {
            // Store the visit ID returned from the server
            const serverVisitId = visitResponse.data?.id;
            if (serverVisitId) {
              setCurrentVisitId(serverVisitId);
              setSessionStartTime(now);
              currentVisitId = serverVisitId;
              console.log('Visit created successfully:', serverVisitId);
            }
          } else {
            console.error('Failed to create visit:', visitResponse.msg);
            isTracking.current = false;
            return;
          }
        }

        // Create page view for the current page
        if (currentVisitId) {
          const pageInfo = getPageInfo();
          const { bookId, chapterId } = extractBookAndChapterIds();

          const pageViewPayload = {
            visitId: currentVisitId,
            url: pageInfo.url,
            title: pageInfo.title,
            ...(bookId && { bookId }),
            ...(chapterId && { chapterId }),
          };

          console.log('Creating page view:', pageViewPayload);

          const pageViewResponse = await createPageView(pageViewPayload);
          
          if (pageViewResponse.code === 200 || pageViewResponse.code === 201) {
            console.log('Page view tracked successfully for:', pathname);
            // Update tracking state
            lastTrackedPath.current = pathname;
            lastTrackingTime.current = now;
          } else {
            console.error('Failed to track page view:', pageViewResponse.msg);
          }
        }
      } catch (error) {
        console.error('Error in analytics tracking:', error);
      } finally {
        isTracking.current = false;
      }
    };

    // Track visit and page view
    trackVisitAndPageView();
  }, [enabled, pathname, user?.id, createVisit, createPageView]);

  // Reset tracking when user auth state changes
  const prevUserRef = useRef(user);
  useEffect(() => {
    // Only clear tracking if user actually logged out (was logged in, now not)
    if (prevUserRef.current && !user) {
      clearTracking();
    }
    prevUserRef.current = user;
  }, [user]);

  // No cleanup needed for the new tracking approach

  return {
    visitorId: getOrCreateVisitorId(user?.id),
    currentVisitId: getCurrentVisitId(),
    isTracked: lastTrackedPath.current === pathname,
    isCurrentlyTracking: isTracking.current,
    clearTracking,
    endSession,
  };
}

export default useConditionalAnalytics; 