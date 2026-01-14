"use client";

import React, { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, CheckCircle2, XCircle, Clock } from "lucide-react";
import { useActivity } from "@/hooks/useActivity";
import { AgentAvatar } from "./AgentAvatar";
import { Progress } from "@/components/ui/Progress";
import { cn } from "@/lib/utils";
import { ANIMATION_EASE } from "@/lib/constants";

const STATUS_ICONS = {
  idle: Clock,
  active: Loader2,
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

function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `~${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return remainingSeconds > 0 ? `~${minutes}m ${remainingSeconds}s` : `~${minutes}m`;
}

export const ActivityStatus = React.memo(function ActivityStatus() {
  const { current } = useActivity();

  const agentId = useMemo(() => {
    if (!current) return null;
    
    const validIds = ['supervisor', 'dojo', 'librarian', 'debugger'] as const;
    if (validIds.includes(current.agent_id as any)) {
      return current.agent_id as 'supervisor' | 'dojo' | 'librarian' | 'debugger';
    }
    
    return 'supervisor';
  }, [current]);

  const statusMetadata = useMemo(() => {
    if (!current) return null;
    
    return {
      icon: STATUS_ICONS[current.status],
      color: STATUS_COLORS[current.status],
      isActive: current.status === 'active',
      hasProgress: typeof current.progress === 'number',
    };
  }, [current]);

  if (!current || !agentId || !statusMetadata) return null;

  const { icon: StatusIcon, color: statusColor, isActive, hasProgress } = statusMetadata;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="activity-status"
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ duration: 0.2, ease: ANIMATION_EASE }}
        className="fixed bottom-4 right-4 z-50"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 w-80 max-w-[calc(100vw-2rem)]">
          <div className="flex items-start gap-3">
            <AgentAvatar 
              agentId={agentId} 
              size="sm" 
              isActive={isActive}
            />
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                  {agentId.charAt(0).toUpperCase() + agentId.slice(1)}
                </span>
                <StatusIcon 
                  className={cn(
                    "w-4 h-4 flex-shrink-0",
                    statusColor,
                    isActive && "animate-spin"
                  )}
                  aria-hidden="true"
                />
              </div>
              
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 break-words">
                {current.message}
              </p>
              
              {hasProgress && (
                <div className="mb-2">
                  <Progress 
                    value={current.progress!} 
                    className="h-1.5"
                  />
                </div>
              )}
              
              {current.estimated_duration && isActive && (
                <p className="text-xs text-gray-500 dark:text-gray-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" aria-hidden="true" />
                  <span>{formatDuration(current.estimated_duration)} remaining</span>
                </p>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
});
