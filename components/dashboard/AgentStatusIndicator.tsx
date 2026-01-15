"use client";

import React from "react";
import { motion } from "framer-motion";
import { Brain, Search, Bug, GitBranch, Wrench } from "lucide-react";
import { AgentStatusInfo } from "@/lib/types";
import { cn } from "@/lib/utils";

interface AgentStatusIndicatorProps extends AgentStatusInfo {}

const AGENT_ICONS = {
  supervisor: GitBranch,
  dojo: Brain,
  librarian: Search,
  debugger: Bug,
  builder: Wrench,
} as const;

const AGENT_COLORS = {
  supervisor: '#f5a623',
  dojo: '#f39c5a',
  librarian: '#ffd699',
  debugger: '#6b7f91',
  builder: '#4a90e2',
} as const;

const AGENT_NAMES = {
  supervisor: 'Supervisor',
  dojo: 'Dojo',
  librarian: 'Librarian',
  debugger: 'Debugger',
  builder: 'Builder',
} as const;

const STATUS_COLORS = {
  idle: '#8a9dad',
  thinking: '#f5a623',
  working: '#f5a623',
  error: '#ef4444',
} as const;

const STATUS_LABELS = {
  idle: 'Idle',
  thinking: 'Thinking',
  working: 'Working',
  error: 'Error',
} as const;

function formatRelativeTime(isoString?: string): string {
  if (!isoString) return '';
  
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
    return "";
  }
}

export const AgentStatusIndicator = React.memo(function AgentStatusIndicator({
  agentId,
  status,
  message,
  lastActive,
  progress,
}: AgentStatusIndicatorProps) {
  const AgentIcon = AGENT_ICONS[agentId];
  const agentColor = AGENT_COLORS[agentId];
  const agentName = AGENT_NAMES[agentId];
  const statusColor = STATUS_COLORS[status];
  const statusLabel = STATUS_LABELS[status];
  const isActive = status === 'thinking' || status === 'working';
  
  return (
    <motion.div
      className={cn(
        "relative flex flex-col gap-2 p-4 rounded-lg border",
        "transition-all duration-200",
        "border-transparent hover:border-opacity-25"
      )}
      style={{
        backgroundColor: `${agentColor}1a`,
        borderColor: `${agentColor}40`,
      }}
      whileHover={{
        y: -2,
        borderColor: `${agentColor}60`,
      }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      aria-label={`${agentName} status: ${statusLabel}`}
      role="status"
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
            isActive && "animate-pulse"
          )}
          style={{ backgroundColor: `${agentColor}33` }}
        >
          <AgentIcon className="w-5 h-5" style={{ color: agentColor }} />
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-text-primary">
            {agentName}
          </p>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "inline-block w-2 h-2 rounded-full",
                isActive && "animate-pulse"
              )}
              style={{ backgroundColor: statusColor }}
              aria-hidden="true"
            />
            <p className="text-xs text-text-secondary">
              {statusLabel}
            </p>
          </div>
        </div>
      </div>
      
      {(message || lastActive) && (
        <div className="space-y-1">
          {message && (
            <p className="text-xs text-text-secondary truncate" title={message}>
              {message}
            </p>
          )}
          {lastActive && (
            <p className="text-xs text-text-tertiary">
              {formatRelativeTime(lastActive)}
            </p>
          )}
        </div>
      )}
      
      {progress !== undefined && progress > 0 && (
        <div className="w-full h-1 bg-background-tertiary rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: agentColor }}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          />
        </div>
      )}
    </motion.div>
  );
});
