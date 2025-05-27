import { v4 as uuidv4, v5 as uuidv5 } from 'uuid';

// Storage keys for analytics
export const ANALYTICS_STORAGE_KEYS = {
  // Stored in localStorage
  VISITOR_ID: 'analytics_visitor_id',
  // Stored in sessionStorage
  CURRENT_VISIT_ID: 'analytics_current_visit_id',
  SESSION_START_TIME: 'analytics_session_start_time',
} as const;

// UUID namespace for generating consistent visitor IDs from user IDs
const VISITOR_ID_NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

/**
 * Generate a consistent visitor ID for a logged-in user
 * Uses UUID v5 to ensure the same user always gets the same visitor ID
 */
export function generateVisitorIdFromUserId(userId: number): string {
  return uuidv5(userId.toString(), VISITOR_ID_NAMESPACE);
}

/**
 * Generate or retrieve a persistent visitor ID
 * For logged-in users, uses a consistent ID based on their user ID
 * For guests, generates/retrieves a random persistent ID
 */
export function getOrCreateVisitorId(userId?: number): string {
  if (typeof window === 'undefined') {
    // SSR fallback
    return userId ? generateVisitorIdFromUserId(userId) : uuidv4();
  }
  
  // For logged-in users, always use a consistent visitor ID based on their user ID
  if (userId) {
    const userBasedVisitorId = generateVisitorIdFromUserId(userId);
    // Store only in localStorage for persistence
    localStorage.setItem(ANALYTICS_STORAGE_KEYS.VISITOR_ID, userBasedVisitorId);
    return userBasedVisitorId;
  }
  
  // For guests, use localStorage only
  let visitorId = localStorage.getItem(ANALYTICS_STORAGE_KEYS.VISITOR_ID);
  
  if (!visitorId) {
    visitorId = uuidv4();
    localStorage.setItem(ANALYTICS_STORAGE_KEYS.VISITOR_ID, visitorId);
  }
  
  return visitorId;
}

/**
 * Get current visit ID from session storage
 */
export function getCurrentVisitId(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(ANALYTICS_STORAGE_KEYS.CURRENT_VISIT_ID);
}

/**
 * Store current visit ID in session storage
 */
export function setCurrentVisitId(visitId: string): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(ANALYTICS_STORAGE_KEYS.CURRENT_VISIT_ID, visitId);
}

/**
 * Clear current visit ID from session storage
 */
export function clearCurrentVisitId(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(ANALYTICS_STORAGE_KEYS.CURRENT_VISIT_ID);
  sessionStorage.removeItem(ANALYTICS_STORAGE_KEYS.SESSION_START_TIME);
}

/**
 * Get session start time
 */
export function getSessionStartTime(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(ANALYTICS_STORAGE_KEYS.SESSION_START_TIME);
}

/**
 * Set session start time
 */
export function setSessionStartTime(startTime: string): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(ANALYTICS_STORAGE_KEYS.SESSION_START_TIME, startTime);
}

/**
 * Extract browser and device information for analytics
 */
export function getBrowserInfo() {
  if (typeof window === 'undefined') {
    return {
      userAgent: '',
      language: '',
      screenResolution: '',
      referrer: '',
      ipAddress: '',
    };
  }

  return {
    userAgent: navigator.userAgent,
    language: navigator.language,
    screenResolution: `${screen.width}x${screen.height}`,
    referrer: document.referrer,
  };
}

/**
 * Extract page information for page view tracking
 */
export function getPageInfo() {
  if (typeof window === 'undefined') {
    return {
      url: '',
      title: '',
    };
  }

  return {
    url: window.location.href,
    title: document.title,
  };
}

/**
 * Extract book and chapter IDs from the current URL
 * Adjust this function based on your routing structure
 */
export function extractBookAndChapterIds(): { bookId?: number; chapterId?: number } {
  if (typeof window === 'undefined') return {};
  
  const path = window.location.pathname;
  const result: { bookId?: number; chapterId?: number } = {};
  
  // Example patterns:
  // /books/123 -> bookId: 123
  // /books/123/read?chapter=1&id=456 -> bookId: 123, chapterId: 456
  
  const bookMatch = path.match(/\/books\/(\d+)/);
  if (bookMatch) {
    result.bookId = parseInt(bookMatch[1], 10);
  }
  
  // Check if this is a read page
  if (path.includes('/read')) {
    // Parse URL to get query parameters
    const url = new URL(window.location.href);
    const chapterId = url.searchParams.get('id');
    
    if (chapterId) {
      result.chapterId = parseInt(chapterId, 10);
    }
  }
  
  return result;
}

/**
 * Check if this is a new session (no existing visit ID or session expired)
 */
export function isNewSession(): boolean {
  if (typeof window === 'undefined') return true;
  
  const currentVisitId = getCurrentVisitId();
  const sessionStartTime = getSessionStartTime();
  
  if (!currentVisitId || !sessionStartTime) {
    return true;
  }
  
  // Check if session has expired (e.g., more than 30 minutes of inactivity)
  const sessionTimeout = 0.1 * 60 * 1000; // 30 minutes
  const now = new Date().getTime();
  const startTime = new Date(sessionStartTime).getTime();
  
  return (now - startTime) > sessionTimeout;
}

/**
 * Generate a new visit ID
 */
export function generateVisitId(): string {
  return uuidv4();
} 