"use client";

import { ReactNode, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useConditionalAnalytics } from '@/lib/hooks';

interface AnalyticsPageWrapperProps {
  children: ReactNode;
}

/**
 * Page wrapper component that handles analytics tracking
 * Excludes admin pages and ensures tracking only happens once per page load
 */
export function AnalyticsPageWrapper({ children }: AnalyticsPageWrapperProps) {
  const pathname = usePathname();
  const lastTrackedPath = useRef<string | null>(null);
  const trackingEnabled = useRef(false);

  // Check if current page should be tracked
  const shouldTrackAnalytics = () => {
    // Don't track admin pages
    if (pathname.startsWith('/admin')) {
      return false;
    }
    
    // Don't track system pages
    if (pathname.startsWith('/_next') || pathname.startsWith('/api')) {
      return false;
    }
    
    return true;
  };

  // Determine if we should track this path
  const shouldTrack = shouldTrackAnalytics();
  const pathChanged = lastTrackedPath.current !== pathname;
  
  // Update tracking status when pathname changes
  useEffect(() => {
    if (shouldTrack && pathChanged) {
      trackingEnabled.current = true;
      lastTrackedPath.current = pathname;
      console.log('Analytics tracking enabled for path:', pathname);
    } else if (!shouldTrack) {
      trackingEnabled.current = false;
      console.log('Analytics tracking disabled for path:', pathname);
    } else if (!pathChanged) {
      trackingEnabled.current = false;
      console.log('Analytics tracking skipped - same path:', pathname);
    }
  }, [pathname, shouldTrack, pathChanged]);

  // Use analytics hook with conditional tracking
  useConditionalAnalytics({
    enabled: true,
    pathname: pathname,
  });

  return <>{children}</>;
}

export default AnalyticsPageWrapper; 