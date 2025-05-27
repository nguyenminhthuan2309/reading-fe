import { get, post, patch } from './base';
import { ApiResponse } from '@/models/api';
import { 
  Visit, 
  PageView, 
  CreateVisitPayload, 
  UpdateVisitPayload, 
  CreatePageViewPayload,
  VisitStats,
  PageViewStats,
  BounceRateStats,
  VisitTimeRangeParams,
  PageViewTimeRangeParams,
  AnalyticsTimeRangeParams,
  VisitStatisticsResponse,
} from '@/models/analytics';

// Visit tracking endpoints

/**
 * Create a new visit
 */
export async function createVisit(createVisitPayload: CreateVisitPayload): Promise<ApiResponse<Visit>> {
  return post<Visit, CreateVisitPayload>('/activities/visits', createVisitPayload);
}

/**
 * Update an existing visit
 */
export async function updateVisit(id: string, updateVisitPayload: UpdateVisitPayload): Promise<ApiResponse<Visit>> {
  return patch<Visit, UpdateVisitPayload>(`/activities/visits/${id}`, updateVisitPayload);
}

/**
 * Update an existing visit
 */
export async function endVisit(id: string): Promise<ApiResponse<Visit>> {
  return post<Visit>(`/activities/visits/${id}/end`, {});
}

/**
 * Get a visit by ID
 */
export async function getVisit(id: string): Promise<ApiResponse<Visit>> {
  return get<Visit>(`/activities/visits/${id}`);
}

/**
 * Get visits by visitor ID
 */
export async function getVisitsByVisitorId(visitorId: string): Promise<ApiResponse<Visit[]>> {
  return get<Visit[]>(`/activities/visits/visitor/${visitorId}`);
}

/**
 * Get visits for the authenticated user
 */
export async function getVisitsByUser(): Promise<ApiResponse<Visit[]>> {
  return get<Visit[]>('/activities/visits/user');
}

/**
 * Get visits by time range
 */
export async function getVisitsByTimeRange(params: VisitTimeRangeParams): Promise<ApiResponse<Visit[]>> {
  const queryParams = new URLSearchParams();
  
  // Add period parameter
  if (params.period) {
    queryParams.append('period', params.period);
  }
  
  // Add date range parameters
  if (params.startDate) {
    queryParams.append('startDate', params.startDate);
  }
  if (params.endDate) {
    queryParams.append('endDate', params.endDate);
  }
  
  // Add optional filters
  if (params.userId) {
    queryParams.append('userId', params.userId.toString());
  }
  if (params.visitorId) {
    queryParams.append('visitorId', params.visitorId);
  }
  
  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
  
  return get<Visit[]>(`/activities/visits/range${queryString}`);
}

/**
 * Get visit statistics
 */
export async function getVisitStats(params: AnalyticsTimeRangeParams): Promise<ApiResponse<VisitStats>> {
  const queryParams = new URLSearchParams();
  
  // Add period parameter
  if (params.period) {
    queryParams.append('period', params.period);
  }
  
  // Add date range parameters
  if (params.startDate) {
    queryParams.append('startDate', params.startDate);
  }
  if (params.endDate) {
    queryParams.append('endDate', params.endDate);
  }
  
  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
  
  return get<VisitStats>(`/activities/visits/stats${queryString}`);
}

// Page view tracking endpoints

/**
 * Create a new page view
 */
export async function createPageView(createPageViewPayload: CreatePageViewPayload): Promise<ApiResponse<PageView>> {
  return post<PageView, CreatePageViewPayload>('/activities/page-views', createPageViewPayload);
}

/**
 * Get page views by visit ID
 */
export async function getPageViewsByVisitId(visitId: string): Promise<ApiResponse<PageView[]>> {
  return get<PageView[]>(`/activities/visits/${visitId}/page-views`);
}

/**
 * Get page views by time range
 */
export async function getPageViewsByTimeRange(params: PageViewTimeRangeParams): Promise<ApiResponse<PageView[]>> {
  const queryParams = new URLSearchParams();
  
  // Add period parameter
  if (params.period) {
    queryParams.append('period', params.period);
  }
  
  // Add date range parameters
  if (params.startDate) {
    queryParams.append('startDate', params.startDate);
  }
  if (params.endDate) {
    queryParams.append('endDate', params.endDate);
  }
  
  // Add optional filters
  if (params.bookId) {
    queryParams.append('bookId', params.bookId.toString());
  }
  if (params.chapterId) {
    queryParams.append('chapterId', params.chapterId.toString());
  }
  if (params.visitId) {
    queryParams.append('visitId', params.visitId);
  }
  
  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
  
  return get<PageView[]>(`/activities/page-views/range${queryString}`);
}

/**
 * Get page view statistics
 */
export async function getPageViewStats(params: AnalyticsTimeRangeParams): Promise<ApiResponse<PageViewStats>> {
  const queryParams = new URLSearchParams();
  
  // Add period parameter
  if (params.period) {
    queryParams.append('period', params.period);
  }
  
  // Add date range parameters
  if (params.startDate) {
    queryParams.append('startDate', params.startDate);
  }
  if (params.endDate) {
    queryParams.append('endDate', params.endDate);
  }
  
  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
  
  return get<PageViewStats>(`/activities/page-views/stats${queryString}`);
}

/**
 * Get bounce rate statistics
 */
export async function getBounceRate(params: AnalyticsTimeRangeParams): Promise<ApiResponse<BounceRateStats>> {
  const queryParams = new URLSearchParams();
  
  // Add period parameter
  if (params.period) {
    queryParams.append('period', params.period);
  }
  
  // Add date range parameters
  if (params.startDate) {
    queryParams.append('startDate', params.startDate);
  }
  if (params.endDate) {
    queryParams.append('endDate', params.endDate);
  }
  
  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
  
  return get<BounceRateStats>(`/activities/bounce-rate${queryString}`);
}

/**
 * Get combined visit statistics (overview + chart data)
 */
export async function getVisitStatistics(params: AnalyticsTimeRangeParams): Promise<ApiResponse<VisitStatisticsResponse>> {
  const queryParams = new URLSearchParams();
  
  // Add period parameter
  if (params.period) {
    queryParams.append('period', params.period);
  }
  
  // Add date range parameters
  if (params.startDate) {
    queryParams.append('startDate', params.startDate);
  }
  if (params.endDate) {
    queryParams.append('endDate', params.endDate);
  }
  
  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
  
  return get<VisitStatisticsResponse>(`/activities/visits/statistics${queryString}`);
} 