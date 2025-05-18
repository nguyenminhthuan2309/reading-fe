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
  TimerReset
} from "lucide-react";

// Mock data for analytics
const mockStats = [
  { title: "Total Visits", value: "24,853", icon: Users, change: "+15%", trend: "up" },
  { title: "New Users", value: "1,245", icon: UserPlus, change: "+8%", trend: "up" },
  { title: "Active Sessions", value: "3,892", icon: Clock, change: "+12%", trend: "up" },
  { title: "Bounce Rate", value: "32%", icon: RefreshCw, change: "-5%", trend: "up" },
];

// Mock data for book metrics
const mockBookMetrics = [
  { id: "1", title: "The Great Gatsby", ratings: 4.7, unlocks: 2345, reReads: 432 },
  { id: "2", title: "To Kill a Mockingbird", ratings: 4.8, unlocks: 3156, reReads: 562 },
  { id: "3", title: "1984", ratings: 4.6, unlocks: 2576, reReads: 387 },
  { id: "4", title: "The Hobbit", ratings: 4.7, unlocks: 4254, reReads: 845 },
  { id: "5", title: "Pride and Prejudice", ratings: 4.4, unlocks: 1932, reReads: 276 },
];

// Mock data for user engagement (visits by day)
const mockVisitsByDay = [
  { day: "Mon", visits: 1245 },
  { day: "Tue", visits: 1356 },
  { day: "Wed", visits: 1578 },
  { day: "Thu", visits: 1803 },
  { day: "Fri", visits: 2025 },
  { day: "Sat", visits: 2256 },
  { day: "Sun", visits: 1931 },
];

// Mock data for new users by day
const mockNewUsersByDay = [
  { day: "Mon", users: 145 },
  { day: "Tue", users: 156 },
  { day: "Wed", users: 178 },
  { day: "Thu", users: 203 },
  { day: "Fri", users: 225 },
  { day: "Sat", users: 256 },
  { day: "Sun", users: 231 },
];

// Mock data for active sessions by day
const mockSessionsByDay = [
  { day: "Mon", sessions: 545 },
  { day: "Tue", sessions: 586 },
  { day: "Wed", sessions: 678 },
  { day: "Thu", sessions: 703 },
  { day: "Fri", sessions: 825 },
  { day: "Sat", sessions: 956 },
  { day: "Sun", sessions: 831 },
];

// Mock data for average time spent (in minutes)
const mockAvgTimeByWeek = [
  { week: "Week 1", time: 32 },
  { week: "Week 2", time: 36 },
  { week: "Week 3", time: 42 },
  { week: "Week 4", time: 38 },
];

export default function AnalyticsPage() {
  const [timeframe, setTimeframe] = useState("This Week");
  const [metricView, setMetricView] = useState("day");

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
        <div className="flex items-center space-x-2">
          <Button variant="outline" className="flex items-center">
            <Calendar className="mr-2 h-4 w-4" />
            {timeframe}
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
          <Button variant="outline" className="flex items-center">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {mockStats.map((stat, index) => (
          <div
            key={index}
            className="bg-card border rounded-lg p-4 flex flex-col"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground">{stat.title}</p>
                <h3 className="text-2xl font-bold mt-1">{stat.value}</h3>
              </div>
              <div className="bg-primary/10 p-2 rounded-md">
                <stat.icon className="h-5 w-5 text-primary" />
              </div>
            </div>
            <div className="mt-2">
              <span
                className={`text-xs font-medium ${
                  stat.trend === "up" && stat.title !== "Bounce Rate" ? "text-green-600" : 
                  stat.trend === "down" && stat.title !== "Bounce Rate" ? "text-red-600" :
                  stat.trend === "up" && stat.title === "Bounce Rate" ? "text-red-600" : "text-green-600"
                }`}
              >
                {stat.change} from last period
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Time period selector for metrics */}
      <div className="flex space-x-2 mb-2">
        <Button 
          variant={metricView === "day" ? "default" : "outline"} 
          size="sm"
          onClick={() => setMetricView("day")}
        >
          Daily
        </Button>
        <Button 
          variant={metricView === "week" ? "default" : "outline"} 
          size="sm"
          onClick={() => setMetricView("week")}
        >
          Weekly
        </Button>
        <Button 
          variant={metricView === "month" ? "default" : "outline"} 
          size="sm"
          onClick={() => setMetricView("month")}
        >
          Monthly
        </Button>
      </div>

      {/* Main analytics content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User visits chart */}
        <div className="bg-card border rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">User Visits</h2>
          <div className="h-64 flex items-end justify-between">
            {mockVisitsByDay.map((item, index) => (
              <div key={index} className="flex flex-col items-center space-y-2">
                <div 
                  className="bg-primary/70 w-12 rounded-t" 
                  style={{ height: `${(item.visits / 2500) * 100}%` }}
                ></div>
                <span className="text-xs text-muted-foreground">{item.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* New users chart */}
        <div className="bg-card border rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">New Users</h2>
          <div className="h-64 flex items-end justify-between">
            {mockNewUsersByDay.map((item, index) => (
              <div key={index} className="flex flex-col items-center space-y-2">
                <div 
                  className="bg-green-500/70 w-12 rounded-t" 
                  style={{ height: `${(item.users / 300) * 100}%` }}
                ></div>
                <span className="text-xs text-muted-foreground">{item.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Active sessions chart */}
        <div className="bg-card border rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">Active Sessions</h2>
          <div className="h-64 flex items-end justify-between">
            {mockSessionsByDay.map((item, index) => (
              <div key={index} className="flex flex-col items-center space-y-2">
                <div 
                  className="bg-blue-500/70 w-12 rounded-t" 
                  style={{ height: `${(item.sessions / 1000) * 100}%` }}
                ></div>
                <span className="text-xs text-muted-foreground">{item.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Average time spent */}
        <div className="bg-card border rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">Average Time Spent</h2>
          <div className="h-64 flex items-end justify-between px-10">
            {mockAvgTimeByWeek.map((item, index) => (
              <div key={index} className="flex flex-col items-center space-y-2">
                <div 
                  className="bg-purple-500/70 w-20 rounded-t" 
                  style={{ height: `${(item.time / 50) * 100}%` }}
                ></div>
                <span className="text-xs text-muted-foreground">{item.week}</span>
                <span className="text-xs font-medium">{item.time} min</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Book metrics */}
      <div className="bg-card border rounded-lg p-5">
        <h2 className="text-lg font-semibold mb-4">Book Metrics (Monthly)</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 font-medium">Title</th>
                <th className="text-right py-3 px-4 font-medium">Rating</th>
                <th className="text-right py-3 px-4 font-medium">Unlocks</th>
                <th className="text-right py-3 px-4 font-medium">Re-reads</th>
                <th className="text-right py-3 px-4 font-medium">Re-read Rate</th>
              </tr>
            </thead>
            <tbody>
              {mockBookMetrics.map((book) => (
                <tr key={book.id} className="border-b">
                  <td className="py-3 px-4">{book.title}</td>
                  <td className="text-right py-3 px-4">{book.ratings} ★</td>
                  <td className="text-right py-3 px-4">{book.unlocks.toLocaleString()}</td>
                  <td className="text-right py-3 px-4">{book.reReads.toLocaleString()}</td>
                  <td className="text-right py-3 px-4">{((book.reReads / book.unlocks) * 100).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Button variant="link" className="mt-4 w-full text-sm">View all books</Button>
      </div>

      {/* Additional detailed metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Bounce rate details */}
        <div className="bg-card border rounded-lg p-5">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Bounce Rate Analysis</h2>
            <span className="text-2xl font-bold text-red-500">32%</span>
          </div>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Homepage</span>
                <span className="font-medium">28%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-red-500 h-2 rounded-full" style={{ width: '28%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Book Details</span>
                <span className="font-medium">24%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-red-500 h-2 rounded-full" style={{ width: '24%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Reading Page</span>
                <span className="font-medium">18%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-red-500 h-2 rounded-full" style={{ width: '18%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Search Results</span>
                <span className="font-medium">42%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-red-500 h-2 rounded-full" style={{ width: '42%' }}></div>
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            Bounce rate measures the percentage of visitors who navigate away after viewing only one page.
          </p>
        </div>

        {/* User retention by time */}
        <div className="bg-card border rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">User Retention Time</h2>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>&lt; 1 min</span>
                <span className="font-medium">34%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-amber-500 h-2 rounded-full" style={{ width: '34%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>1-5 mins</span>
                <span className="font-medium">28%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-amber-500 h-2 rounded-full" style={{ width: '28%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>5-15 mins</span>
                <span className="font-medium">22%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '22%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>15-30 mins</span>
                <span className="font-medium">12%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '12%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>&gt; 30 mins</span>
                <span className="font-medium">4%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '4%' }}></div>
              </div>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-sm font-medium">Average session time:</span>
            <span className="text-lg font-bold flex items-center">
              <TimerReset className="h-4 w-4 mr-1" />
              8.4 minutes
            </span>
          </div>
        </div>
      </div>
    </div>
  );
} 