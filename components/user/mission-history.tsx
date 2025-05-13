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
      <div className="bg-white rounded-lg border border-secondary/90 shadow-sm p-6 text-center">
        <p className="text-sm text-muted-foreground">No completed missions yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-secondary/90 shadow-sm overflow-hidden">
      <div className="px-4 py-3 bg-secondary/30 border-b border-secondary/90">
        <h4 className="text-sm font-medium">Mission History</h4>
      </div>
      <div className="p-4">
        <div className="space-y-4">
          {completedActivities.map((activity) => (
            <div key={activity.id} className="flex items-center justify-between py-2 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 size={16} className="text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">{activity.activity?.title}</p>
                  <p className="text-xs text-muted-foreground">
                    Completed {formatDistanceToNow(toCurrentTimezone(activity.createdAt || Date.now().toString()), { addSuffix: true })}
                  </p>
                </div>
              </div>
              <span className="text-sm font-medium text-amber-600">+{activity.earnedPoint || 0} Haru</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 