// Analytics related types and interfaces

export enum TimePeriod {
  TODAY = 'today',
  THIS_WEEK = 'this_week',
  THIS_MONTH = 'this_month',
  LAST_MONTH = 'last_month',
  LAST_THREE_MONTHS = 'last_3_months',
  LAST_SIX_MONTHS = 'last_6_months',
  THIS_YEAR = 'this_year',
  CUSTOM = 'custom'
}

// Visit related types
export interface Visit {
  id: string;
  visitorId: string;
  userId?: number;
  startedAt: string;
  endedAt?: string;
  duration?: number;
  userAgent?: string;
  ipAddress?: string;
  referrer?: string;
  country?: string;
  city?: string;
  device?: string;
  browser?: string;
  os?: string;
  screenResolution?: string;
  language?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVisitPayload {
  visitorId: string;
  userId?: number;
  userAgent?: string;
  ipAddress?: string;
  referrer?: string;
}

export interface UpdateVisitPayload {
  endTime?: string;
}

// Page view related types
export interface PageView {
  id: string;
  visitId: string;
  bookId?: number;
  chapterId?: number;
  url: string;
  title?: string;
  timestamp: string;
  timeOnPage?: number;
  scrollDepth?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePageViewPayload {
  visitId: string;
  bookId?: number;
  chapterId?: number;
  url: string;
  title?: string;
  timeOnPage?: number;
  scrollDepth?: number;
}

// Statistics types
export interface VisitStats {
  totalVisits: number;
  uniqueVisitors: number;
  avgDuration: number;
}

export interface PageViewStats {
  totalPageViews: number;
  uniqueBooks: number;
  uniqueChapters: number;
}

export interface BounceRateStats {
  bounceRate: number;
  totalVisits: number;
  singlePageVisits: number;
}

// Combined statistics types
export interface VisitStatisticsChart {
  period: string;
  totalVisits: number;
  uniqueVisitors: number;
  avgDuration: number;
  bounceRate: number;
}

export interface VisitStatisticsOverview {
  totalVisits: number;
  uniqueVisitors: number;
  avgDuration: number;
  bounceRate: number;
}

export interface VisitStatisticsResponse {
  chart: VisitStatisticsChart[];
  overview: VisitStatisticsOverview;
}

// Query parameters for analytics endpoints
export interface AnalyticsTimeRangeParams {
  period?: TimePeriod;
  startDate?: string;
  endDate?: string;
}

export interface VisitTimeRangeParams extends AnalyticsTimeRangeParams {
  userId?: number;
  visitorId?: string;
}

export interface PageViewTimeRangeParams extends AnalyticsTimeRangeParams {
  bookId?: number;
  chapterId?: number;
  visitId?: string;
}

// Book statistics types
export interface BookStatisticsChart {
  period: string;
  totalBooks: number;
  totalChapters: number;
  blockedBooks: number;
  totalViews: number;
}

export interface BookStatusBreakdown {
  published: number;
  draft: number;
  pendingReview: number;
  rejected: number;
}

export interface BookCategoryBreakdown {
  categoryId: number;
  categoryName: string;
  count: number;
}

export interface BookAgeRatingBreakdown {
  ageRating: number;
  count: number;
}

export interface BookTypeBreakdown {
  typeId: number;
  typeName: string;
  count: number;
}

export interface BookStatisticsOverview {
  totalBooks: number;
  totalChapters: number;
  blockedBooks: number;
  totalViews: number;
  statusBreakdown: BookStatusBreakdown;
  categoryBreakdown: BookCategoryBreakdown[];
  ageRatingBreakdown: BookAgeRatingBreakdown[];
  bookTypeBreakdown: BookTypeBreakdown[];
}

export interface BookStatisticsResponse {
  chart: BookStatisticsChart[];
  overview: BookStatisticsOverview;
}

// User statistics types
export interface UserStatisticsChart {
  period: string;
  totalUsers: number;
}

export interface UserStatisticsOverview {
  totalUsers: number;
}

export interface UserStatisticsResponse {
  chart: UserStatisticsChart[];
  overview: UserStatisticsOverview;
}

// Transaction statistics types
export interface TransactionStatisticsChart {
  period: string;
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  totalDeposit: number;
  totalPurchased: number;
  averageDepositVolume: number;
}

export interface TransactionStatisticsOverview {
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  totalDeposit: number;
  totalPurchased: number;
  averageDepositVolume: number;
}

export interface TransactionStatisticsResponse {
  chart: TransactionStatisticsChart[];
  overview: TransactionStatisticsOverview;
} 