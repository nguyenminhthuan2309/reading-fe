"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  ChevronDown, 
  Download, 
  Users, 
  BookOpen, 
  Star, 
  Clock,
  UserPlus,
  RefreshCw,
  TimerReset,
  CreditCard,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Eye,
  Repeat
} from "lucide-react";
import { 
  useVisitStatistics,
  usePageViewStats, 
  usePageViewsByTimeRange,
  useBookStatistics,
  useUserStatistics
} from "@/lib/hooks/useAnalytics";
import { useTransactions, useTransactionStatistics } from "@/lib/hooks/useTransactions";
import { TimePeriod } from "@/models/analytics";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { DateRange } from "react-day-picker";

export default function AnalyticsPage() {
  const [timeframe, setTimeframe] = useState<TimePeriod>(TimePeriod.THIS_WEEK);
  const [dateRange, setDateRange] = useState<DateRange>();

  // Fetch analytics data
  const { data: visitStatistics, isLoading: isLoadingVisitStatistics } = useVisitStatistics({ 
    period: timeframe,
    ...(timeframe === TimePeriod.CUSTOM && dateRange?.from && dateRange?.to && {
      startDate: dateRange.from.toISOString(),
      endDate: dateRange.to.toISOString(),
    })
  });

  const { data: bookStatistics, isLoading: isLoadingBookStatistics } = useBookStatistics({ 
    period: timeframe,
    ...(timeframe === TimePeriod.CUSTOM && dateRange?.from && dateRange?.to && {
      startDate: dateRange.from.toISOString(),
      endDate: dateRange.to.toISOString(),
    })
  });

  const { data: userStatistics, isLoading: isLoadingUserStatistics } = useUserStatistics({ 
    period: timeframe,
    ...(timeframe === TimePeriod.CUSTOM && dateRange?.from && dateRange?.to && {
      startDate: dateRange.from.toISOString(),
      endDate: dateRange.to.toISOString(),
    })
  });

  const { data: transactionStatistics, isLoading: isLoadingTransactionStatistics } = useTransactionStatistics({ 
    period: timeframe,
    ...(timeframe === TimePeriod.CUSTOM && dateRange?.from && dateRange?.to && {
      startDate: dateRange.from.toISOString(),
      endDate: dateRange.to.toISOString(),
    })
  });

  // Extract data from the combined statistics
  const visitStats = visitStatistics?.overview;
  const visits = visitStatistics?.chart;

  const { transactions, isLoading: isLoadingTransactions } = useTransactions(100);

  // Handle timeframe change
  const handleTimeframeChange = (newTimeframe: TimePeriod) => {
    setTimeframe(newTimeframe);
    if (newTimeframe !== TimePeriod.CUSTOM) {
      setDateRange(undefined);
    }
  };

  // Get display text for timeframe
  const getTimeframeDisplayText = () => {
    switch (timeframe) {
      case TimePeriod.TODAY:
        return "Today";
      case TimePeriod.THIS_WEEK:
        return "This Week";
      case TimePeriod.LAST_THREE_MONTHS:
        return "Last 3 Months";
      case TimePeriod.LAST_SIX_MONTHS:
        return "Last 6 Months";
      case TimePeriod.THIS_MONTH:
        return "This Month";
      case TimePeriod.LAST_MONTH:
        return "Last Month";
      case TimePeriod.THIS_YEAR:
        return "This Year";
      case TimePeriod.CUSTOM:
        return "Custom Range";
      default:
        return "Select Period";
    }
  };

  // Generate x-axis labels based on timeframe
  const getXAxisLabels = () => {
    switch (timeframe) {
      case TimePeriod.TODAY:
        return Array.from({ length: 12 }, (_, i) => {
          const hour = i * 2;
          return `${hour.toString().padStart(2, '0')}:00`;
        });
      case TimePeriod.THIS_WEEK:
        return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      case TimePeriod.THIS_MONTH:
      case TimePeriod.LAST_MONTH:
        return Array.from({ length: 30 }, (_, i) => `${i + 1}`);
      case TimePeriod.LAST_THREE_MONTHS:
        return ['Month 1', 'Month 2', 'Month 3'];
      case TimePeriod.LAST_SIX_MONTHS:
        return ['6M ago', '5M ago', '4M ago', '3M ago', '2M ago', 'Last M'];
      case TimePeriod.THIS_YEAR:
        return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      default:
        return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    }
  };

  // Process data for charts with dynamic x-axis
  const processDataForChart = (data: any[], valueKey: string) => {
    const labels = getXAxisLabels();
    const processedData = labels.map(label => ({ label, value: 0 }));
    
    if (timeframe === TimePeriod.TODAY) {
      // Group by 2-hour intervals
      data?.forEach((item: any) => {
        const date = new Date(item.startTime || item.timestamp || item.createdAt);
        const hour = date.getHours();
        const intervalIndex = Math.floor(hour / 2);
        if (intervalIndex < processedData.length) {
          processedData[intervalIndex].value += item[valueKey] || 1;
        }
      });
    } else if (timeframe === TimePeriod.THIS_WEEK) {
      // Group by day of week
      data?.forEach((item: any) => {
        const date = new Date(item.startTime || item.timestamp || item.createdAt);
        const dayIndex = (date.getDay() + 6) % 7; // Convert Sunday=0 to Monday=0
        if (dayIndex < processedData.length) {
          processedData[dayIndex].value += item[valueKey] || 1;
        }
      });
    } else {
      // For other periods, distribute data evenly or use existing logic
      data?.forEach((item: any, index: number) => {
        const targetIndex = index % processedData.length;
        processedData[targetIndex].value += item[valueKey] || 1;
      });
    }
    
    return processedData;
  };

  // Process visits data for user charts using the new chart data structure
  const chartData = visits || [];
  const userVisitsData = chartData.map(item => ({ label: item.period, value: item.totalVisits }));
  
  // Process user statistics data for new users chart
  const userChartData = userStatistics?.chart || [];
  const newUsersData = userChartData.map(item => ({ label: item.period, value: item.totalUsers }));
  
  // Process avg duration data (convert from seconds to minutes)
  const avgDurationData = chartData.map(item => ({ label: item.period, value: Math.round(item.avgDuration / 60) }));
  
  // Process bounce rate data
  const bounceRateData = chartData.map(item => ({ label: item.period, value: Math.round(item.bounceRate) }));

  // Process book statistics data for book charts
  const bookChartData = bookStatistics?.chart || [];
  const totalBooksData = bookChartData.map(item => ({ label: item.period, value: item.totalBooks }));
  const totalChaptersData = bookChartData.map(item => ({ label: item.period, value: item.totalChapters }));
  const blockedBooksData = bookChartData.map(item => ({ label: item.period, value: item.blockedBooks }));
  const totalViewsData = bookChartData.map(item => ({ label: item.period, value: item.totalViews }));

  // Process transaction statistics data for charts
  const transactionChartData = transactionStatistics?.chart || [];
  const totalTransactionsData = transactionChartData.map(item => ({ label: item.period, value: item.totalTransactions }));
  const successfulTransactionsData = transactionChartData.map(item => ({ label: item.period, value: item.successfulTransactions }));
  const failedTransactionsData = transactionChartData.map(item => ({ label: item.period, value: item.failedTransactions }));
  const revenueData = transactionChartData.map(item => ({ 
    label: item.period, 
    value: Math.round(item.totalDeposit / 1000),
    displayValue: `${Math.round(item.totalDeposit / 1000)}k`
  }));
  const purchasedData = transactionChartData.map(item => ({ label: item.period, value: item.totalPurchased }));

  // Extract transaction stats from the new API
  const transactionStats = transactionStatistics?.overview;
  const totalRevenue = transactionStats?.totalDeposit || 0;
  const totalSpent = transactionStats?.totalPurchased || 0;
  const transactionCount = transactionStats?.totalTransactions || 0;
  const successfulTransactions = transactionStats?.successfulTransactions || 0;
  const failedTransactions = transactionStats?.failedTransactions || 0;
  const averageDepositVolume = transactionStats?.averageDepositVolume || 0;

  // Helper function to format VND amount
  const formatVND = (amount: number) => {
    if (amount >= 1000) {
      const amountInK = amount / 1000;
      return `${amountInK.toFixed(amountInK >= 100 ? 0 : 1)}k đ`;
    }
    return `${amount} đ`;
  };

  // Chart component
  const Chart = ({ data, color, height = "h-32" }: { data: any[], color: string, height?: string }) => {
    const maxValue = Math.max(...data.map(d => d.value), 1);
    const yAxisSteps = 5;
    const stepValue = Math.ceil(maxValue / yAxisSteps);
    const yAxisMaxValue = stepValue * yAxisSteps;
    const chartHeight = 120; // Chart area height
    const totalHeight = chartHeight + 40; // Total height including labels
    
    return (
      <div className="flex justify-center w-full">
        <div className="flex gap-2 w-full" style={{ height: `${totalHeight}px` }}>
          {/* Y-axis */}
          <div className="flex flex-col justify-start text-xs text-muted-foreground w-8 text-right pr-1" style={{ height: `${totalHeight}px`, paddingTop: '10px' }}>
            {Array.from({ length: yAxisSteps + 1 }, (_, i) => (
              <div key={i} style={{ height: `${chartHeight / yAxisSteps}px`, display: 'flex', alignItems: 'flex-start' }}>
                <span>{stepValue * (yAxisSteps - i)}</span>
              </div>
            ))}
          </div>
          
          {/* Chart area container */}
          <div className="flex-1 relative" style={{ height: `${totalHeight}px` }}>
            {/* Y-axis line */}
            <div 
              className="absolute left-0 border-l border-gray-300" 
              style={{ 
                height: `${chartHeight}px`, 
                top: '20px' 
              }}
            ></div>
            
            {/* X-axis line */}
            <div 
              className="absolute left-0 right-0 border-b" 
              style={{ 
                top: `${chartHeight + 20}px` 
              }}
            ></div>
            
            {/* Grid lines (optional) */}
            {Array.from({ length: yAxisSteps }, (_, i) => (
              <div 
                key={i}
                className="absolute left-0 right-0 border-b" 
                style={{ 
                  top: `${20 + (chartHeight / yAxisSteps) * (i + 1)}px` 
                }}
              ></div>
            ))}
            
            {/* Chart bars container with values positioned on top of each column */}
            <div className="relative flex justify-between gap-1 pl-1" style={{ height: `${chartHeight + 20}px`, paddingTop: '20px' }}>
              {data.map((item, index) => {
                const barHeight = (item.value / yAxisMaxValue) * chartHeight;
                return (
                  <div key={index} className="flex-1 relative flex flex-col items-center">
                    {/* Value positioned above the column */}
                    <div 
                      className="absolute text-center"
                      style={{ 
                        bottom: `${barHeight + 2}px`,
                        left: '50%',
                        transform: 'translateX(-50%)'
                      }}
                    >
                      <span className="text-xs font-medium text-foreground">
                        {item.value > 0 ? (item.displayValue || item.value) : ''}
                      </span>
                    </div>
                    
                    {/* Column bar with max width and centered */}
                    <div className="absolute bottom-0 flex justify-center w-full">
                      <div 
                        className={`${color} rounded-t transition-all duration-300 hover:opacity-80`}
                        style={{ 
                          height: `${barHeight}px`,
                          minHeight: item.value > 0 ? '2px' : '0px',
                          width: '100%',
                          maxWidth: '40px'
                        }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* X-axis labels */}
            <div className="flex justify-between gap-1 pl-1" style={{ height: '20px', alignItems: 'flex-start', paddingTop: '4px' }}>
              {data.map((item, index) => (
                <div key={index} className="flex-1 text-center">
                  <span className="text-xs text-muted-foreground truncate">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Stacked Chart component for combining successful and failed transactions
  const StackedChart = ({ successData, failedData }: { successData: any[], failedData: any[] }) => {
    // Combine data and calculate max values
    const combinedData = successData.map((item, index) => ({
      label: item.label,
      successful: item.value,
      failed: failedData[index]?.value || 0,
      total: item.value + (failedData[index]?.value || 0)
    }));
    
    const maxValue = Math.max(...combinedData.map(d => d.total), 1);
    const yAxisSteps = 5;
    const stepValue = Math.ceil(maxValue / yAxisSteps);
    const yAxisMaxValue = stepValue * yAxisSteps;
    const chartHeight = 120;
    const totalHeight = chartHeight + 40;
    
    return (
      <div className="flex justify-center w-full">
        <div className="flex gap-2 w-full" style={{ height: `${totalHeight}px` }}>
          {/* Y-axis */}
          <div className="flex flex-col justify-start text-xs text-muted-foreground w-8 text-right pr-1" style={{ height: `${totalHeight}px`, paddingTop: '10px' }}>
            {Array.from({ length: yAxisSteps + 1 }, (_, i) => (
              <div key={i} style={{ height: `${chartHeight / yAxisSteps}px`, display: 'flex', alignItems: 'flex-start' }}>
                <span>{stepValue * (yAxisSteps - i)}</span>
              </div>
            ))}
          </div>
          
          {/* Chart area container */}
          <div className="flex-1 relative" style={{ height: `${totalHeight}px` }}>
            {/* Y-axis line */}
            <div 
              className="absolute left-0 border-l border-gray-300" 
              style={{ 
                height: `${chartHeight}px`, 
                top: '20px' 
              }}
            ></div>
            
            {/* X-axis line */}
            <div 
              className="absolute left-0 right-0 border-b border-gray-300" 
              style={{ 
                top: `${chartHeight + 20}px` 
              }}
            ></div>
            
            {/* Grid lines */}
            {Array.from({ length: yAxisSteps }, (_, i) => (
              <div 
                key={i}
                className="absolute left-0 right-0 border-b border-gray-100" 
                style={{ 
                  top: `${20 + (chartHeight / yAxisSteps) * (i + 1)}px` 
                }}
              ></div>
            ))}
            
            {/* Stacked bars container */}
            <div className="relative flex justify-between gap-1 pl-1" style={{ height: `${chartHeight + 20}px`, paddingTop: '20px' }}>
              {combinedData.map((item, index) => {
                const successfulHeight = (item.successful / yAxisMaxValue) * chartHeight;
                const failedHeight = (item.failed / yAxisMaxValue) * chartHeight;
                const totalHeight = successfulHeight + failedHeight;
                
                return (
                  <div key={index} className="flex-1 relative flex flex-col items-center">
                    {/* Total value positioned above the stacked column */}
                    <div 
                      className="absolute text-center"
                      style={{ 
                        bottom: `${totalHeight + 2}px`,
                        left: '50%',
                        transform: 'translateX(-50%)'
                      }}
                    >
                      <span className="text-xs font-medium text-foreground">
                        {item.total > 0 ? item.total : ''}
                      </span>
                    </div>
                    
                    {/* Stacked bars with max width and centered */}
                    <div className="absolute bottom-0 flex justify-center w-full">
                      <div className="relative" style={{ width: '100%', maxWidth: '40px', height: `${totalHeight}px` }}>
                        {/* Successful transactions (bottom layer) */}
                        <div 
                          className={`bg-green-500/70 transition-all duration-300 hover:opacity-80 absolute bottom-0 w-full ${
                            item.failed > 0 ? 'rounded-b' : 'rounded'
                          }`}
                          style={{ 
                            height: `${successfulHeight}px`,
                            minHeight: item.successful > 0 ? '2px' : '0px',
                          }}
                        ></div>
                        
                        {/* Failed transactions (top layer) */}
                        {item.failed > 0 && (
                          <div 
                            className="bg-red-500/70 rounded-t transition-all duration-300 hover:opacity-80 absolute w-full"
                            style={{ 
                              height: `${failedHeight}px`,
                              minHeight: '2px',
                              bottom: `${successfulHeight}px`,
                            }}
                          ></div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* X-axis labels */}
            <div className="flex justify-between gap-1 pl-1" style={{ height: '20px', alignItems: 'flex-start', paddingTop: '4px' }}>
              {combinedData.map((item, index) => (
                <div key={index} className="flex-1 text-center">
                  <span className="text-xs text-muted-foreground truncate">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Age rating mapping function
  const getAgeRatingText = (rating: number): string => {
    switch (rating) {
      case 1: return "All Ages";
      case 2: return "Teen (13+)";
      case 3: return "Mature (16+)";
      case 4: return "Adult (18+)";
      default: return `${rating}+`;
    }
  };

  // Pie Chart component
  const PieChart = ({ data, title }: { data: Array<{ label: string; value: number; color: string }>, title: string }) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    if (total === 0) return <div className="text-center text-muted-foreground">No data available</div>;
    
    let currentAngle = 0;
    
    return (
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-center">{title}</h4>
        <div className="flex items-center gap-4">
          {/* Pie chart on the left */}
          <div className="flex-shrink-0">
            <div className="relative w-32 h-32 group">
              <svg width="128" height="128" className="transform -rotate-90">
                {data.map((item, index) => {
                  if (item.value === 0) return null;
                  
                  const percentage = item.value / total;
                  const angle = percentage * 360;
                  const startAngle = currentAngle;
                  const endAngle = currentAngle + angle;
                  
                  const startAngleRad = (startAngle * Math.PI) / 180;
                  const endAngleRad = (endAngle * Math.PI) / 180;
                  
                  const largeArcFlag = angle > 180 ? 1 : 0;
                  
                  // Normal radius
                  const normalRadius = 48;
                  // Hover radius (bigger)
                  const hoverRadius = 52;
                  
                  const x1 = 64 + normalRadius * Math.cos(startAngleRad);
                  const y1 = 64 + normalRadius * Math.sin(startAngleRad);
                  const x2 = 64 + normalRadius * Math.cos(endAngleRad);
                  const y2 = 64 + normalRadius * Math.sin(endAngleRad);
                  
                  const x1Hover = 64 + hoverRadius * Math.cos(startAngleRad);
                  const y1Hover = 64 + hoverRadius * Math.sin(startAngleRad);
                  const x2Hover = 64 + hoverRadius * Math.cos(endAngleRad);
                  const y2Hover = 64 + hoverRadius * Math.sin(endAngleRad);
                  
                  const pathData = [
                    `M 64 64`,
                    `L ${x1} ${y1}`,
                    `A ${normalRadius} ${normalRadius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                    `Z`
                  ].join(' ');
                  
                  const pathDataHover = [
                    `M 64 64`,
                    `L ${x1Hover} ${y1Hover}`,
                    `A ${hoverRadius} ${hoverRadius} 0 ${largeArcFlag} 1 ${x2Hover} ${y2Hover}`,
                    `Z`
                  ].join(' ');
                  
                  currentAngle += angle;
                  
                  return (
                    <g key={index}>
                      <path
                        d={pathData}
                        fill={item.color}
                        className="transition-all duration-300 hover:opacity-90"
                        style={{ transformOrigin: '64px 64px' }}
                      />
                      <path
                        d={pathDataHover}
                        fill={item.color}
                        className="opacity-0 hover:opacity-100 transition-all duration-300"
                        style={{ transformOrigin: '64px 64px' }}
                      />
                    </g>
                  );
                })}
              </svg>
            </div>
            <div className="text-center mt-2">
              <div className="text-lg font-bold">{total}</div>
              <div className="text-xs text-muted-foreground">Total</div>
            </div>
          </div>
          
          {/* Description on the right */}
          <div className="flex-1 space-y-2 max-h-40 overflow-y-auto">
            {data.filter(item => item.value > 0).map((item, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full flex-shrink-0" 
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <span className="truncate">{item.label}</span>
                </div>
                <span className="font-medium">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
        <div className="flex items-center space-x-2">
          <Select
            value={timeframe}
            onValueChange={(value) => handleTimeframeChange(value as TimePeriod)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select period">
                {getTimeframeDisplayText()}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TimePeriod.TODAY}>Today</SelectItem>
              <SelectItem value={TimePeriod.THIS_WEEK}>This Week</SelectItem>
              <SelectItem value={TimePeriod.THIS_MONTH}>This Month</SelectItem>
              <SelectItem value={TimePeriod.LAST_MONTH}>Last Month</SelectItem>
              <SelectItem value={TimePeriod.LAST_THREE_MONTHS}>Last 3 Months</SelectItem>
              <SelectItem value={TimePeriod.LAST_SIX_MONTHS}>Last 6 Months</SelectItem>
              <SelectItem value={TimePeriod.THIS_YEAR}>This Year</SelectItem>
              <SelectItem value={TimePeriod.CUSTOM}>Custom Range</SelectItem>
            </SelectContent>
          </Select>

          <DateRangePicker
            dateRange={dateRange}
            setDateRange={setDateRange}
            disabled={timeframe !== TimePeriod.CUSTOM}
            placeholder="Select date range"
          />

          <Button variant="outline" className="flex items-center">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Section 1: Book Analytics */}
      <div className="bg-card border rounded-lg p-4">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="h-5 w-5 text-green-500" />
          <h2 className="text-lg font-semibold">Book Analytics</h2>
        </div>
        
        {/* Book Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <div className="bg-background border rounded-lg p-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-muted-foreground">Total Books</p>
                {isLoadingBookStatistics ? (
                  <Skeleton className="h-6 w-16 mt-1" />
                ) : (
                  <h3 className="text-lg font-bold mt-1">{bookStatistics?.overview.totalBooks.toLocaleString() || "0"}</h3>
                )}
              </div>
              <BookOpen className="h-4 w-4 text-green-500" />
            </div>
          </div>
          
          <div className="bg-background border rounded-lg p-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-muted-foreground">Total Chapters</p>
                {isLoadingBookStatistics ? (
                  <Skeleton className="h-6 w-16 mt-1" />
                ) : (
                  <h3 className="text-lg font-bold mt-1">{bookStatistics?.overview.totalChapters.toLocaleString() || "0"}</h3>
                )}
              </div>
              <Star className="h-4 w-4 text-yellow-500" />
            </div>
          </div>
          
          <div className="bg-background border rounded-lg p-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-muted-foreground">Blocked Books</p>
                {isLoadingBookStatistics ? (
                  <Skeleton className="h-6 w-16 mt-1" />
                ) : (
                  <h3 className="text-lg font-bold mt-1">{bookStatistics?.overview.blockedBooks.toLocaleString() || "0"}</h3>
                )}
              </div>
              <Eye className="h-4 w-4 text-red-500" />
            </div>
          </div>

          <div className="bg-background border rounded-lg p-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-muted-foreground">Total Views</p>
                {isLoadingBookStatistics ? (
                  <Skeleton className="h-6 w-16 mt-1" />
                ) : (
                  <h3 className="text-lg font-bold mt-1">{bookStatistics?.overview.totalViews.toLocaleString() || "0"}</h3>
                )}
              </div>
              <Eye className="h-4 w-4 text-blue-500" />
            </div>
          </div>
        </div>

        {/* Book Trend Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <div className="bg-background border rounded-lg p-3">
            <h3 className="text-sm font-medium mb-3">Books</h3>
            {isLoadingBookStatistics ? (
              <Skeleton className="h-32 w-full" />
            ) : (
              <Chart data={totalBooksData} color="bg-green-500/70" />
            )}
          </div>
          
          <div className="bg-background border rounded-lg p-3">
            <h3 className="text-sm font-medium mb-3">Chapters</h3>
            {isLoadingBookStatistics ? (
              <Skeleton className="h-32 w-full" />
            ) : (
              <Chart data={totalChaptersData} color="bg-blue-500/70" />
            )}
          </div>
          
          <div className="bg-background border rounded-lg p-3">
            <h3 className="text-sm font-medium mb-3">Views</h3>
            {isLoadingBookStatistics ? (
              <Skeleton className="h-32 w-full" />
            ) : (
              <Chart data={totalViewsData} color="bg-purple-500/70" />
            )}
          </div>

          <div className="bg-background border rounded-lg p-3">
            <h3 className="text-sm font-medium mb-3">Blocked Books</h3>
            {isLoadingBookStatistics ? (
              <Skeleton className="h-32 w-full" />
            ) : (
              <Chart data={blockedBooksData} color="bg-red-500/70" />
            )}
          </div>
        </div>

        {/* Book Breakdown Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="bg-background border rounded-lg p-4">
            {isLoadingBookStatistics ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <PieChart 
                title="Status"
                data={[
                  { label: "Published", value: bookStatistics?.overview.statusBreakdown.published || 0, color: "#FFB6C1" },
                  { label: "Draft", value: bookStatistics?.overview.statusBreakdown.draft || 0, color: "#E6E6FA" },
                  { label: "Pending Review", value: bookStatistics?.overview.statusBreakdown.pendingReview || 0, color: "#F0E68C" },
                  { label: "Rejected", value: bookStatistics?.overview.statusBreakdown.rejected || 0, color: "#FFA07A" },
                ]}
              />
            )}
          </div>
          
          <div className="bg-background border rounded-lg p-4">
            {isLoadingBookStatistics ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <PieChart 
                title="Age Rating"
                data={bookStatistics?.overview.ageRatingBreakdown.map((rating, index) => {
                  const pastelColors = ["#DDA0DD", "#98FB98", "#F0E68C", "#FFB6C1", "#AFEEEE", "#FFEFD5"];
                  return {
                    label: getAgeRatingText(rating.ageRating),
                    value: rating.count,
                    color: pastelColors[index % pastelColors.length]
                  };
                }) || []}
              />
            )}
          </div>
          
          <div className="bg-background border rounded-lg p-4">
            {isLoadingBookStatistics ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <PieChart 
                title="Category"
                data={bookStatistics?.overview.categoryBreakdown.slice(0, 5).map((cat, index) => {
                  const pastelColors = ["#B0E0E6", "#F5DEB3", "#D8BFD8", "#F0F8FF", "#FFF8DC"];
                  return {
                    label: cat.categoryName,
                    value: cat.count,
                    color: pastelColors[index % pastelColors.length]
                  };
                }) || []}
              />
            )}
          </div>
          
          <div className="bg-background border rounded-lg p-4">
            {isLoadingBookStatistics ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <PieChart 
                title="Book Type Breakdown"
                data={bookStatistics?.overview.bookTypeBreakdown.map((type, index) => {
                  const pastelColors = ["#FAFAD2", "#E0FFFF", "#F5F5DC", "#FDF5E6", "#F0FFFF", "#FFFAF0"];
                  return {
                    label: type.typeName,
                    value: type.count,
                    color: pastelColors[index % pastelColors.length]
                  };
                }) || []}
              />
            )}
          </div>
        </div>
      </div>

      {/* Section 2: User Analytics */}
      <div className="bg-card border rounded-lg p-4">
        <div className="flex items-center gap-2 mb-4">
          <Users className="h-5 w-5 text-blue-500" />
          <h2 className="text-lg font-semibold">User Analytics</h2>
        </div>

        {/* User Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
          <div className="bg-background border rounded-lg p-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-muted-foreground">Total Visits</p>
                {isLoadingVisitStatistics ? (
                  <Skeleton className="h-6 w-16 mt-1" />
                ) : (
                  <h3 className="text-lg font-bold mt-1">{visitStats?.totalVisits.toLocaleString() || "0"}</h3>
                )}
              </div>
              <Users className="h-4 w-4 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-background border rounded-lg p-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-muted-foreground">Unique Visitors</p>
                {isLoadingVisitStatistics ? (
                  <Skeleton className="h-6 w-16 mt-1" />
                ) : (
                  <h3 className="text-lg font-bold mt-1">{visitStats?.uniqueVisitors.toLocaleString() || "0"}</h3>
                )}
              </div>
              <Users className="h-4 w-4 text-green-500" />
            </div>
          </div>
          
          <div className="bg-background border rounded-lg p-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-muted-foreground">New Users</p>
                {isLoadingUserStatistics ? (
                  <Skeleton className="h-6 w-16 mt-1" />
                ) : (
                  <h3 className="text-lg font-bold mt-1">{userStatistics?.overview.totalUsers.toLocaleString() || "0"}</h3>
                )}
              </div>
              <UserPlus className="h-4 w-4 text-purple-500" />
            </div>
          </div>

          <div className="bg-background border rounded-lg p-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-muted-foreground">Avg. Duration</p>
                {isLoadingVisitStatistics ? (
                  <Skeleton className="h-6 w-16 mt-1" />
                ) : (
                  <h3 className="text-lg font-bold mt-1">{Math.round((visitStats?.avgDuration || 0) / 60)}m</h3>
                )}
              </div>
              <Clock className="h-4 w-4 text-orange-500" />
            </div>
          </div>
          
          <div className="bg-background border rounded-lg p-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-muted-foreground">Bounce Rate</p>
                {isLoadingVisitStatistics ? (
                  <Skeleton className="h-6 w-16 mt-1" />
                ) : (
                  <h3 className="text-lg font-bold mt-1">{visitStats?.bounceRate || 0}%</h3>
                )}
              </div>
              <RefreshCw className="h-4 w-4 text-red-500" />
            </div>
          </div>
        </div>

        {/* User Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-background border rounded-lg p-3">
            <h3 className="text-sm font-medium mb-3">User Visits</h3>
            {isLoadingVisitStatistics ? (
              <Skeleton className="h-32 w-full" />
            ) : (
              <Chart data={userVisitsData} color="bg-blue-500/70" />
            )}
          </div>

          <div className="bg-background border rounded-lg p-3">
            <h3 className="text-sm font-medium mb-3">New Users</h3>
            {isLoadingUserStatistics ? (
              <Skeleton className="h-32 w-full" />
            ) : (
              <Chart data={newUsersData} color="bg-green-500/70" />
            )}
          </div>

          <div className="bg-background border rounded-lg p-3">
            <h3 className="text-sm font-medium mb-3">Avg Duration (min)</h3>
            {isLoadingVisitStatistics ? (
              <Skeleton className="h-32 w-full" />
            ) : (
              <Chart data={avgDurationData} color="bg-orange-500/70" />
            )}
          </div>
          
          <div className="bg-background border rounded-lg p-3">
            <h3 className="text-sm font-medium mb-3">Bounce Rate (%)</h3>
            {isLoadingVisitStatistics ? (
              <Skeleton className="h-32 w-full" />
            ) : (
              <Chart data={bounceRateData} color="bg-red-500/70" />
            )}
          </div>
        </div>
      </div>

      {/* Section 3: Transaction Analytics */}
      <div className="bg-card border rounded-lg p-4">
        <div className="flex items-center gap-2 mb-4">
          <CreditCard className="h-5 w-5 text-purple-500" />
          <h2 className="text-lg font-semibold">Transaction Analytics</h2>
        </div>
        
        {/* Transaction Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 mb-4">
          <div className="bg-background border rounded-lg p-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-muted-foreground">Total Revenue</p>
                {isLoadingTransactionStatistics ? (
                  <Skeleton className="h-6 w-16 mt-1" />
                ) : (
                  <h3 className="text-lg font-bold mt-1">{formatVND(totalRevenue)}</h3>
                )}
              </div>
              <DollarSign className="h-4 w-4 text-green-500" />
            </div>
          </div>
          
          <div className="bg-background border rounded-lg p-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-muted-foreground">Total Spent</p>
                {isLoadingTransactionStatistics ? (
                  <Skeleton className="h-6 w-16 mt-1" />
                ) : (
                  <h3 className="text-lg font-bold mt-1">{formatVND(totalSpent)}</h3>
                )}
              </div>
              <ShoppingCart className="h-4 w-4 text-red-500" />
            </div>
          </div>
          
          <div className="bg-background border rounded-lg p-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-muted-foreground">Total Transactions</p>
                {isLoadingTransactionStatistics ? (
                  <Skeleton className="h-6 w-16 mt-1" />
                ) : (
                  <h3 className="text-lg font-bold mt-1">{transactionCount.toLocaleString()}</h3>
                )}
              </div>
              <CreditCard className="h-4 w-4 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-background border rounded-lg p-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-muted-foreground">Successful</p>
                {isLoadingTransactionStatistics ? (
                  <Skeleton className="h-6 w-16 mt-1" />
                ) : (
                  <h3 className="text-lg font-bold mt-1">{successfulTransactions.toLocaleString()}</h3>
                )}
              </div>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </div>
          </div>
          
          <div className="bg-background border rounded-lg p-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-muted-foreground">Failed</p>
                {isLoadingTransactionStatistics ? (
                  <Skeleton className="h-6 w-16 mt-1" />
                ) : (
                  <h3 className="text-lg font-bold mt-1">{failedTransactions.toLocaleString()}</h3>
                )}
              </div>
              <TrendingDown className="h-4 w-4 text-red-500" />
            </div>
          </div>
          
          <div className="bg-background border rounded-lg p-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-muted-foreground">Avg. Deposit</p>
                {isLoadingTransactionStatistics ? (
                  <Skeleton className="h-6 w-16 mt-1" />
                ) : (
                  <h3 className="text-lg font-bold mt-1">{formatVND(averageDepositVolume)}</h3>
                )}
              </div>
              <TrendingUp className="h-4 w-4 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Transaction Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-background border rounded-lg p-3">
            <h3 className="text-sm font-medium mb-3">Revenue Trend</h3>
            {isLoadingTransactionStatistics ? (
              <Skeleton className="h-32 w-full" />
            ) : (
              <Chart data={revenueData} color="bg-green-500/70" />
            )}
          </div>
          
          <div className="bg-background border rounded-lg p-3">
            <h3 className="text-sm font-medium mb-3">Total Transactions</h3>
            {isLoadingTransactionStatistics ? (
              <Skeleton className="h-32 w-full" />
            ) : (
              <Chart data={totalTransactionsData} color="bg-blue-500/70" />
            )}
          </div>
          
          <div className="bg-background border rounded-lg p-3">
            <h3 className="text-sm font-medium mb-3">Successful vs Failed</h3>
            {isLoadingTransactionStatistics ? (
              <Skeleton className="h-32 w-full" />
            ) : (
              <div>
                <StackedChart successData={successfulTransactionsData} failedData={failedTransactionsData} />
                {/* Legend */}
                <div className="flex justify-center gap-4 mt-2">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-green-500/70 rounded"></div>
                    <span className="text-xs text-muted-foreground">Successful</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-red-500/70 rounded"></div>
                    <span className="text-xs text-muted-foreground">Failed</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="bg-background border rounded-lg p-3">
            <h3 className="text-sm font-medium mb-3">Total Purchased</h3>
            {isLoadingTransactionStatistics ? (
              <Skeleton className="h-32 w-full" />
            ) : (
              <Chart data={purchasedData} color="bg-purple-500/70" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 