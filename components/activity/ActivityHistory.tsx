"use client";

import React from "react";
import { CheckCircle2, XCircle, Clock, History } from "lucide-react";
import { useActivity } from "@/hooks/useActivity";
import { AgentAvatar } from "./AgentAvatar";
import { cn } from "@/lib/utils";

const STATUS_ICONS = {
  idle: Clock,
  active: Clock,
  waiting: Clock,
  complete: CheckCircle2,
  error: XCircle,
} as const;

const STATUS_COLORS = {
  idle: "text-gray-400 dark:text-gray-500",
  active: "text-blue-500 dark:text-blue-400",
  waiting: "text-yellow-500 dark:text-yellow-400",
  complete: "text-green-500 dark:text-green-400",
  error: "text-red-500 dark:text-red-400",
} as const;

function formatRelativeTime(isoString: string): string {
  const now = new Date();
  const then = new Date(isoString);
  const diffMs = now.getTime() - then.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 10) {
    return "just now";
  } else if (diffSecs < 60) {
    return `${diffSecs}s ago`;
  } else if (diffMins < 60) {
    return `${diffMins}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else {
    return `${diffDays}d ago`;
  }
}

function isValidAgentId(agentId: string): agentId is 'supervisor' | 'dojo' | 'librarian' | 'debugger' {
  return ['supervisor', 'dojo', 'librarian', 'debugger'].includes(agentId);
}

export const ActivityHistory = React.memo(function ActivityHistory() {
  const { history } = useActivity();

  const validHistory = React.useMemo(
    () => history.filter(activity => isValidAgentId(activity.agent_id)),
    [history]
  );

  if (validHistory.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-2 mb-4">
          <History className="w-5 h-5 text-gray-900 dark:text-gray-100" />
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
            Activity History
          </h3>
        </div>
        
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 mb-3">
            <Clock className="w-6 h-6 text-gray-400 dark:text-gray-500" />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No activity yet
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Agent activities will appear here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center gap-2 mb-3">
        <History className="w-5 h-5 text-gray-900 dark:text-gray-100" />
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
          Activity History
        </h3>
        <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto">
          Last {validHistory.length} {validHistory.length === 1 ? 'activity' : 'activities'}
        </span>
      </div>
      
      <div className="space-y-2">
        {validHistory.map((activity, index) => {
          const StatusIcon = STATUS_ICONS[activity.status];
          const statusColor = STATUS_COLORS[activity.status];
          const agentId = activity.agent_id as 'supervisor' | 'dojo' | 'librarian' | 'debugger';

          return (
            <div 
              key={`${activity.started_at}-${index}`}
              className={cn(
                "flex items-center gap-3 p-2 rounded-md transition-colors",
                "hover:bg-gray-50 dark:hover:bg-gray-700/50"
              )}
            >
              <AgentAvatar 
                agentId={agentId} 
                size="sm" 
                isActive={false}
              />
              
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900 dark:text-gray-100 truncate">
                  {activity.message}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formatRelativeTime(activity.started_at)}
                </p>
              </div>
              
              <StatusIcon 
                className={cn("w-4 h-4 flex-shrink-0", statusColor)}
                aria-label={`Status: ${activity.status}`}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
});
