"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar, ChevronDown, Download, Users, BookOpen, Star, Clock } from "lucide-react";

// Mock data for analytics
const mockStats = [
  { title: "Total Readers", value: "12,456", icon: Users, change: "+12%", trend: "up" },
  { title: "Books Read", value: "43,892", icon: BookOpen, change: "+8%", trend: "up" },
  { title: "Avg. Rating", value: "4.7", icon: Star, change: "+0.2", trend: "up" },
  { title: "Avg. Reading Time", value: "45 min", icon: Clock, change: "-3%", trend: "down" },
];

// Mock data for popular books
const mockPopularBooks = [
  { id: "1", title: "The Great Gatsby", reads: 1423, rating: 4.5 },
  { id: "2", title: "To Kill a Mockingbird", reads: 2156, rating: 4.8 },
  { id: "3", title: "1984", reads: 1876, rating: 4.6 },
  { id: "4", title: "The Hobbit", reads: 3254, rating: 4.7 },
  { id: "5", title: "Pride and Prejudice", reads: 1532, rating: 4.4 },
];

// Mock data for user engagement
const mockEngagement = [
  { day: "Mon", reads: 145 },
  { day: "Tue", reads: 156 },
  { day: "Wed", reads: 178 },
  { day: "Thu", reads: 203 },
  { day: "Fri", reads: 225 },
  { day: "Sat", reads: 256 },
  { day: "Sun", reads: 231 },
];

export default function AnalyticsPage() {
  const [timeframe, setTimeframe] = useState("This Week");

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
                  stat.trend === "up" ? "text-green-600" : "text-red-600"
                }`}
              >
                {stat.change} from last period
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Main analytics content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User engagement chart */}
        <div className="lg:col-span-2 bg-card border rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">User Engagement</h2>
          <div className="h-64 flex items-end justify-between">
            {mockEngagement.map((item, index) => (
              <div key={index} className="flex flex-col items-center space-y-2">
                <div 
                  className="bg-primary/70 w-12 rounded-t" 
                  style={{ height: `${(item.reads / 300) * 100}%` }}
                ></div>
                <span className="text-xs text-muted-foreground">{item.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Popular books */}
        <div className="bg-card border rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">Most Popular Books</h2>
          <div className="space-y-4">
            {mockPopularBooks.map((book, index) => (
              <div key={book.id} className="flex items-center space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-sm font-medium text-primary">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{book.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {book.reads.toLocaleString()} reads • {book.rating} ★
                  </p>
                </div>
              </div>
            ))}
          </div>
          <Button variant="link" className="mt-4 w-full text-sm">View all books</Button>
        </div>
      </div>

      {/* User demographics */}
      <div className="bg-card border rounded-lg p-5">
        <h2 className="text-lg font-semibold mb-4">Reader Demographics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="border rounded-md p-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Age Distribution</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs">18-24</span>
                <span className="text-xs font-medium">24%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-primary h-2 rounded-full" style={{ width: '24%' }}></div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-xs">25-34</span>
                <span className="text-xs font-medium">38%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-primary h-2 rounded-full" style={{ width: '38%' }}></div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-xs">35-44</span>
                <span className="text-xs font-medium">22%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-primary h-2 rounded-full" style={{ width: '22%' }}></div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-xs">45+</span>
                <span className="text-xs font-medium">16%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-primary h-2 rounded-full" style={{ width: '16%' }}></div>
              </div>
            </div>
          </div>
          
          <div className="border rounded-md p-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Genre Preferences</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs">Fiction</span>
                <span className="text-xs font-medium">42%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-primary h-2 rounded-full" style={{ width: '42%' }}></div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-xs">Fantasy</span>
                <span className="text-xs font-medium">28%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-primary h-2 rounded-full" style={{ width: '28%' }}></div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-xs">Mystery</span>
                <span className="text-xs font-medium">16%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-primary h-2 rounded-full" style={{ width: '16%' }}></div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-xs">Others</span>
                <span className="text-xs font-medium">14%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-primary h-2 rounded-full" style={{ width: '14%' }}></div>
              </div>
            </div>
          </div>
          
          <div className="border rounded-md p-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Reading Time</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs">Morning</span>
                <span className="text-xs font-medium">18%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-primary h-2 rounded-full" style={{ width: '18%' }}></div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-xs">Afternoon</span>
                <span className="text-xs font-medium">22%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-primary h-2 rounded-full" style={{ width: '22%' }}></div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-xs">Evening</span>
                <span className="text-xs font-medium">36%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-primary h-2 rounded-full" style={{ width: '36%' }}></div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-xs">Night</span>
                <span className="text-xs font-medium">24%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-primary h-2 rounded-full" style={{ width: '24%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 