"use client";

import React from "react";
import { Clock } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { useActivity } from "@/hooks/useActivity";
import { ActivityItem } from "./ActivityItem";

export const RecentActivityFeed = React.memo(function RecentActivityFeed() {
  const { history } = useActivity();

  const recentActivities = React.useMemo(() => {
    return history.slice(0, 10);
  }, [history]);

  if (recentActivities.length === 0) {
    return (
      <Card>
        <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6">Recent Activity</h2>
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-bg-tertiary/30 mb-3">
            <Clock className="w-6 h-6 text-text-secondary" />
          </div>
          <p className="text-sm text-text-secondary">
            No activity yet
          </p>
          <p className="text-xs text-text-tertiary mt-1">
            Agent activities will appear here
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6">Recent Activity</h2>
      <div className="flex flex-col gap-2">
        {recentActivities.map((activity, index) => (
          <ActivityItem
            key={`${activity.started_at}-${index}`}
            activity={activity}
          />
        ))}
      </div>
    </Card>
  );
});
