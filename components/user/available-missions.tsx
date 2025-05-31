"use client";

import { Button } from "@/components/ui/button";
import { ActivityType, useAvailableActivities } from "@/lib/hooks/useActivities";
import { BookOpen, Book, MessageSquare, Bookmark, Loader2, LogIn, Play, Star } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useRouter } from "next/navigation";

export function AvailableMissions() {
  const router = useRouter();
  const { availableActivities, isLoading, createActivity } = useAvailableActivities();
  const [videoOpen, setVideoOpen] = useState(false);
  const [randomVideoId, setRandomVideoId] = useState("");
  const [timeRemaining, setTimeRemaining] = useState(15);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const videoDurationRef = useRef<number>(15); // Default to 15 seconds

  // Random YouTube video IDs for demo purposes
  const videoIds = [
    "dQw4w9WgXcQ", // Rick Astley - Never Gonna Give You Up
    "jNQXAC9IVRw", // Me at the zoo
    "9bZkp7q19f0", // PSY - GANGNAM STYLE
    "kJQP7kiw5Fk", // Luis Fonsi - Despacito
    "RgKAFK5djSk" // Wiz Khalifa - See You Again
  ];

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (videoOpen) {
      // Generate random video ID when dialog opens
      const randomVideoId = videoIds[Math.floor(Math.random() * videoIds.length)];
      setRandomVideoId(randomVideoId);
      setVideoLoaded(false);
      setTimeRemaining(15); // Reset timer
    } else {
      // Clean up when dialog closes
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setTimeRemaining(15);
      setRandomVideoId("");
      setVideoLoaded(false);
    }
  }, [videoOpen]);

  // Start countdown only after video is loaded
  useEffect(() => {
    if (videoLoaded && timeRemaining > 0) {
      // Start countdown only when video is loaded
      intervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          const newValue = prev - 1;
          // If we reached zero, clear the interval
          if (newValue <= 0) {
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            return 0;
          }
          return newValue;
        });
      }, 1000);
      
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    }
  }, [videoLoaded, timeRemaining]);

  // Handle video metadata loaded - get duration
  const handleVideoMetadata = (duration: number) => {
    // If video is less than 15 seconds, set remaining to video length
    const videoLengthInSeconds = Math.min(Math.floor(duration), 15);
    videoDurationRef.current = videoLengthInSeconds;
    setTimeRemaining(videoLengthInSeconds);
    setVideoLoaded(true);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-6">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  if (!availableActivities || availableActivities.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-secondary/90 dark:border-gray-700 shadow-sm p-5 text-center">
        <p className="text-sm text-muted-foreground dark:text-gray-400">No available missions at the moment.</p>
        <Button variant="default" size="sm" className="mt-3">
          <Link href="/books">Browse Books</Link>
        </Button>
      </div>
    );
  }

  // Helper function to get the appropriate icon for an activity type
  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case 'login':
        return <LogIn size={15} className="text-primary" />;
      case 'watch_ad':
        return <Play size={15} className="text-primary" />;
      case 'rate_book':
        return <Star size={15} className="text-primary" />;
      case 'complete_book':
        return <Book size={15} className="text-primary" />;
      case 'comment_chapter':
        return <MessageSquare size={15} className="text-primary" />;
      default:
        return <BookOpen size={15} className="text-primary" />;
    }
  };

  const handleStartMission = (activity: any) => {
    switch (activity.activityType.toLowerCase()) {
      case 'watch_ad':
        setVideoOpen(true);
        break;
      case 'rate_book':
      case 'complete_book':
      case 'comment_chapter':
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
          <div key={activity.id} className="bg-white dark:bg-gray-800 rounded-lg border border-secondary/90 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="p-3 flex items-start justify-between">
              <div className="flex-1">
                <h4 className="text-sm font-medium flex items-center gap-1.5 mb-1.5 dark:text-white">
                  {getActivityIcon(activity.activityType)}
                  {activity.title}
                  {!!(activity.earnedPoint && activity.earnedPoint > 0) && <span className="ml-auto text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded-full">+{activity.earnedPoint} Haru</span>}
                </h4>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-amber-400 to-amber-500  h-full rounded-full"
                      style={{ width: `${(activity.completedCount / activity.maxPerDay) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-muted-foreground dark:text-gray-400">{activity.completedCount}/{activity.maxPerDay}</span>
                  {activity.status !== 'done' ? (
                    <Button
                      variant="default"
                      size="sm"
                      className="ml-auto h-7 text-xs bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 px-2 py-0.5 "
                      onClick={() => handleStartMission(activity)}
                    >
                      Start
                    </Button>
                  ) : (
                    <span className="ml-auto h-6 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full">Completed</span>
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
              src={`https://www.youtube.com/embed/${randomVideoId}?autoplay=1&enablejsapi=1`}
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              onLoad={() => {
                // Add post-message listener for YouTube iframe API events
                window.addEventListener('message', (event) => {
                  try {
                    const data = JSON.parse(event.data);
                    // Handle YouTube player state changes
                    if (data.event === 'onStateChange' && data.info === 1) { // 1 = playing
                      // Video started playing, get duration and start timer
                      if (!videoLoaded && data.info === 1) {
                        handleVideoMetadata(data.duration || 15);
                      }
                    }
                  } catch (e) {
                    // Not a JSON message or not from YouTube
                  }
                });
                
                // Fallback if YouTube API doesn't respond
                setTimeout(() => {
                  if (!videoLoaded) {
                    setVideoLoaded(true);
                  }
                }, 100);
              }}
            ></iframe>
          </div>
           <div className="flex justify-between items-center">
            <p className="text-xs text-muted-foreground">
              {timeRemaining > 0 
                ? `You can earn reward after ${timeRemaining} seconds`
                : 'You can now claim your reward!'}
            </p>
            <Button onClick={handleVideoClose} disabled={timeRemaining > 0}>
              Complete & Earn Reward
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
} 