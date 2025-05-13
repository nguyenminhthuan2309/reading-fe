"use client";

import { Button } from "@/components/ui/button";
import { useAvailableActivities } from "@/lib/hooks/useActivities";
import { BookOpen, Book, MessageSquare, Bookmark, Loader2, LogIn, Play, Star } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useRouter } from "next/navigation";

export function AvailableMissions() {
  const router = useRouter();
  const { availableActivities, isLoading, createActivity } = useAvailableActivities();
  const [videoOpen, setVideoOpen] = useState(false);
  
  // Random YouTube video IDs for demo purposes
  const videoIds = [
    "dQw4w9WgXcQ", // Rick Astley - Never Gonna Give You Up
    "jNQXAC9IVRw", // Me at the zoo
    "9bZkp7q19f0", // PSY - GANGNAM STYLE
    "kJQP7kiw5Fk", // Luis Fonsi - Despacito
    "RgKAFK5djSk" // Wiz Khalifa - See You Again
  ];
  
  const randomVideoId = videoIds[Math.floor(Math.random() * videoIds.length)];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-6">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  if (!availableActivities || availableActivities.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-secondary/90 shadow-sm p-5 text-center">
        <p className="text-sm text-muted-foreground">No available missions at the moment.</p>
        <Button variant="default" size="sm" className="mt-3">
          <Link href="/books">Browse Books</Link>
        </Button>
      </div>
    );
  }

  // Helper function to get the appropriate icon for an activity type
  const getActivityIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'login':
        return <LogIn size={15} className="text-primary" />;
      case 'watch_ad':
        return <Play size={15} className="text-primary" />;
      case 'rate_book':
        return <Star size={15} className="text-primary" />;
      case 'complete_book':
        return <Book size={15} className="text-primary" />;
      default:
        return <BookOpen size={15} className="text-primary" />;
    }
  };
  
  const handleStartMission = (activity: any) => {
    switch (activity.type.toLowerCase()) {
      case 'watch_ad':
        setVideoOpen(true);
        break;
      case 'rate_book':
      case 'complete_book':
        router.push('/me?section=history');
        break;
      default:
        // For other activity types, just call createActivity
        if (activity.status !== 'done') {
          createActivity({
            activityType: activity.type,
          });
        }
        break;
    }
  };
  
  const handleVideoClose = () => {
    setVideoOpen(false);
    // Create activity after watching the ad
    createActivity({
      activityType: 'watch_ad',
    });
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {availableActivities.map((activity) => (
          <div key={activity.id} className="bg-white rounded-lg border border-secondary/90 shadow-sm overflow-hidden">
            <div className="p-3 flex items-start justify-between">
              <div className="flex-1">
                <h4 className="text-sm font-medium flex items-center gap-1.5 mb-1.5">
                  {getActivityIcon(activity.type)}
                  {activity.name}
                 {!!(activity.earnedPoint && activity.earnedPoint > 0) && <span className="ml-auto text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">+{activity.earnedPoint} Haru</span>}
                </h4>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-amber-400 to-amber-500  h-full rounded-full" 
                      style={{ width: `${(activity.done / activity.total) * 100}%` }}
                    ></div>
                  </div>
                   <span className="text-xs text-muted-foreground">{activity.done}/{activity.total}</span>
                  {activity.status !== 'done' ? (
                    <Button 
                      variant="default" 
                      size="sm" 
                      className="ml-auto h-7 text-xs bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 px-2 py-0.5 " 
                      onClick={() => handleStartMission(activity)}
                    >
                      Start
                    </Button>
                  ): (
                    <span className="ml-auto h-6 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Completed</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <Dialog open={videoOpen} onOpenChange={setVideoOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Watch Advertisement</DialogTitle>
            <DialogDescription>
              Watch this video to earn Haru tokens. You can close this dialog when finished.
            </DialogDescription>
          </DialogHeader>
          <div className="aspect-video w-full">
            <iframe 
              width="100%" 
              height="100%" 
              src={`https://www.youtube.com/embed/${randomVideoId}?autoplay=1`}
              title="YouTube video player" 
              frameBorder="0" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowFullScreen
            ></iframe>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleVideoClose}>
              Complete & Earn Reward
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
} 