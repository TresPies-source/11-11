"use client";

import React from "react";
import { motion } from "framer-motion";
import { Brain, Search, Bug, GitBranch, CheckCircle2, XCircle, Clock, Loader2 } from "lucide-react";
import { AgentActivity } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ActivityItemProps {
  activity: AgentActivity;
}

type AgentId = 'supervisor' | 'dojo' | 'librarian' | 'debugger';

const AGENT_ICONS = {
  supervisor: GitBranch,
  dojo: Brain,
  librarian: Search,
  debugger: Bug,
} as const;

const AGENT_COLORS = {
  supervisor: '#f5a623',
  dojo: '#f39c5a',
  librarian: '#ffd699',
  debugger: '#6b7f91',
} as const;

const STATUS_ICONS = {
  idle: Clock,
  active: Loader2,
  waiting: Clock,
  complete: CheckCircle2,
  error: XCircle,
} as const;

const STATUS_COLORS = {
  idle: '#8a9dad',
  active: '#f5a623',
  waiting: '#ffd699',
  complete: '#4ade80',
  error: '#ef4444',
} as const;

function formatRelativeTime(isoString: string): string {
  try {
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
  } catch {
    return "Unknown time";
  }
}

function isValidAgentId(agentId: string): agentId is AgentId {
  return ['supervisor', 'dojo', 'librarian', 'debugger'].includes(agentId);
}

export const ActivityItem = React.memo(function ActivityItem({ activity }: ActivityItemProps) {
  const agentId = isValidAgentId(activity.agent_id) ? activity.agent_id : 'supervisor';
  const AgentIcon = AGENT_ICONS[agentId];
  const agentColor = AGENT_COLORS[agentId];
  const StatusIcon = STATUS_ICONS[activity.status];
  const statusColor = STATUS_COLORS[activity.status];
  
  return (
    <motion.div
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg",
        "transition-colors duration-200"
      )}
      whileHover={{
        y: -1,
        backgroundColor: 'rgba(26, 58, 79, 0.3)',
      }}
      transition={{ duration: 0.2 }}
    >
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: `${agentColor}1a` }}
      >
        <AgentIcon className="w-5 h-5" style={{ color: agentColor }} />
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="text-sm text-text-primary truncate">
          {activity.message}
        </p>
        <p className="text-xs text-text-tertiary">
          {formatRelativeTime(activity.started_at)}
        </p>
      </div>
      
      <StatusIcon
        className={cn(
          "w-4 h-4 flex-shrink-0",
          activity.status === 'active' && "animate-spin"
        )}
        style={{ color: statusColor }}
        aria-label={`Status: ${activity.status}`}
      />
    </motion.div>
  );
});
