"use client";

import { useEffect, useRef } from 'react';
import { useCreateVisit, useCreatePageView } from './useAnalytics';
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

/**
 * Hook for automatic analytics tracking
 * Handles visit creation and page view tracking on page load
 */
export function useAutoAnalytics() {
  const { user } = useUserStore();
  const { mutateAsync: createVisit } = useCreateVisit({ showToasts: false });
  const { mutateAsync: createPageView } = useCreatePageView({ showToasts: false });
  const hasTrackedVisit = useRef(false);
  const hasTrackedPageView = useRef(false);

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    const trackVisitAndPageView = async () => {
      try {
        // Don't track multiple times in the same session
        if (hasTrackedVisit.current && hasTrackedPageView.current) return;

        const visitorId = getOrCreateVisitorId();
        let currentVisitId = getCurrentVisitId();
        
        // Create new visit if this is a new session or no existing visit
        if (isNewSession() || !currentVisitId) {
          if (!hasTrackedVisit.current) {
            currentVisitId = generateVisitId();
            const browserInfo = getBrowserInfo();
            const now = new Date().toISOString();

            const visitPayload = {
              visitorId,
              userAgent: browserInfo.userAgent,
              referrer: browserInfo.referrer,
              // Add userId if user is logged in
              ...(user?.id && { userId: user.id })
            };

            console.log('Creating new visit:', visitPayload);

            const visitResponse = await createVisit(visitPayload);
            
            if ((visitResponse.code === 200 || visitResponse.code === 201) && visitResponse.data) {
              // Store the visit ID returned from the server
              const serverVisitId = visitResponse.data.id;
              setCurrentVisitId(serverVisitId);
              setSessionStartTime(now);
              currentVisitId = serverVisitId;
              hasTrackedVisit.current = true;
              
              console.log('Visit created successfully:', serverVisitId);
            } else {
              console.error('Failed to create visit:', visitResponse.msg);
              return;
            }
          }
        } else {
          hasTrackedVisit.current = true;
        }

        // Create page view for the current page
        if (currentVisitId && !hasTrackedPageView.current) {
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
            hasTrackedPageView.current = true;
            console.log('Page view tracked successfully');
          } else {
            console.error('Failed to track page view:', pageViewResponse.msg);
          }
        }
      } catch (error) {
        console.error('Error in analytics tracking:', error);
      }
    };

    // Track visit and page view
    trackVisitAndPageView();

    // Cleanup function to handle session end
    const handleBeforeUnload = () => {
      // You could update the visit end time here if needed
      // For now, we'll just clear the tracking flags for the next load
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // User is leaving/hiding the page
        // Could update visit duration here
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user?.id, createVisit, createPageView]);

  // Reset tracking flags when user auth state changes
  useEffect(() => {
    // If user logs out, clear the current session
    if (!user) {
      clearCurrentVisitId();
      hasTrackedVisit.current = false;
      hasTrackedPageView.current = false;
    }
  }, [user]);

  return {
    visitorId: getOrCreateVisitorId(),
    currentVisitId: getCurrentVisitId(),
    hasTrackedVisit: hasTrackedVisit.current,
    hasTrackedPageView: hasTrackedPageView.current,
  };
}

export default useAutoAnalytics; 