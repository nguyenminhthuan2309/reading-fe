"use client";

import { useFilteredActivities } from "@/lib/hooks/useActivities";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useUserStore } from "@/lib/store/useUserStore";
import { formatDistanceToNow } from "date-fns";
import { toCurrentTimezone } from "@/lib/utils";
export function MissionHistory() {
  const { user } = useUserStore();
  const userId = user?.id;
  
  // Get completed activities
  const { activities: completedActivities, isLoading } = useFilteredActivities({
    userId: userId,
    isEarnedPoint: true
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!completedActivities || completedActivities.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-secondary/90 dark:border-gray-700 shadow-sm p-6 text-center">
        <p className="text-sm text-muted-foreground dark:text-gray-400">No completed missions yet.</p>
      </div>
    );
  }

  const sortedActivities = completedActivities.sort((a, b) => {
    return new Date(b.createdAt || Date.now().toString()).getTime() - new Date(a.createdAt || Date.now().toString()).getTime();
  });

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-secondary/90 dark:border-gray-700 shadow-sm overflow-hidden">
      <div className="px-4 py-3 bg-secondary/30 dark:bg-gray-700/50 border-b border-secondary/90 dark:border-gray-600">
        <h4 className="text-sm font-medium dark:text-white">Mission History</h4>
      </div>
      <div className="p-4">
        <div className="space-y-4">
          {sortedActivities.map((activity) => (
            <div key={activity.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <CheckCircle2 size={16} className="text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm font-medium dark:text-white">{activity.activity?.title}</p>
                  <p className="text-xs text-muted-foreground dark:text-gray-400">
                    Completed {formatDistanceToNow(toCurrentTimezone(activity.createdAt || Date.now().toString()), { addSuffix: true })}
                  </p>
                </div>
              </div>
              <span className="text-sm font-medium text-amber-600 dark:text-amber-400">+{activity.earnedPoint || 0} Haru</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 