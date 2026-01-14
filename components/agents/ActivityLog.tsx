"use client";

import React from "react";

interface ActivityLogProps {
  activities?: string[];
}

const DEFAULT_ACTIVITIES = [
  "Agent initialized workspace",
  "Running code analysis...",
  "Generated 3 file modifications",
  "Executing build command",
  "All tests passed",
];

export function ActivityLog({ activities = DEFAULT_ACTIVITIES }: ActivityLogProps) {
  const displayedActivities = activities.slice(0, 5);

  return (
    <div className="space-y-1">
      <h3 className="text-xs font-medium text-text-secondary mb-2">Activity Log</h3>
      <div className="space-y-1">
        {displayedActivities.map((activity, index) => (
          <div
            key={index}
            className="text-xs text-text-tertiary truncate"
            title={activity}
          >
            {activity}
          </div>
        ))}
      </div>
    </div>
  );
}
