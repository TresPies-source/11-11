"use client";

import React from "react";

interface Activity {
  agent?: "supervisor" | "dojo" | "librarian" | "debugger";
  message: string;
}

interface ActivityLogProps {
  activities?: (string | Activity)[];
  isCollapsed?: boolean;
}

const AGENT_ICONS = {
  supervisor: "👔",
  dojo: "🥋",
  librarian: "📚",
  debugger: "🐛",
} as const;

const AGENT_COLORS = {
  supervisor: "text-agent-supervisor",
  dojo: "text-agent-dojo",
  librarian: "text-agent-librarian",
  debugger: "text-agent-debugger",
} as const;

const DEFAULT_ACTIVITIES: Activity[] = [
  { agent: "supervisor", message: "Initialized workspace" },
  { agent: "dojo", message: "Running code analysis..." },
  { agent: "dojo", message: "Generated 3 file modifications" },
  { agent: "debugger", message: "Executing build command" },
  { agent: "debugger", message: "All tests passed" },
];

export function ActivityLog({ activities = DEFAULT_ACTIVITIES, isCollapsed = false }: ActivityLogProps) {
  const normalizedActivities: Activity[] = activities.map((activity) =>
    typeof activity === "string" ? { message: activity } : activity
  );

  const maxItems = isCollapsed ? 3 : 5;
  const displayedActivities = normalizedActivities.slice(0, maxItems);

  return (
    <div className="space-y-1">
      {!isCollapsed && (
        <h3 className="text-xs font-medium text-text-secondary mb-2">Activity Log</h3>
      )}
      <div className="space-y-1">
        {displayedActivities.map((activity, index) => (
          <div
            key={index}
            className="text-xs text-text-tertiary flex items-start gap-1 animate-in fade-in duration-fast"
            title={activity.message}
          >
            {activity.agent && (
              <span className={`${AGENT_COLORS[activity.agent]} flex-shrink-0`}>
                {AGENT_ICONS[activity.agent]}
              </span>
            )}
            <span className={`truncate ${isCollapsed ? "max-w-[50px]" : ""}`}>
              {activity.message}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
