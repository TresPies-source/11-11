"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronRight, Clock, DollarSign, Hash } from "lucide-react";
import { cn } from "@/lib/utils";
import type { HarnessEvent } from "@/lib/harness/types";

interface TraceEventNodeProps {
  event: HarnessEvent;
  depth: number;
  onEventClick?: (event: HarnessEvent) => void;
}

const EVENT_TYPE_COLORS = {
  SESSION_START: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
  SESSION_END: "bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400",
  MODE_TRANSITION: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400",
  AGENT_ROUTING: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
  AGENT_HANDOFF: "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400",
  TOOL_INVOCATION: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
  PERSPECTIVE_INTEGRATION: "bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400",
  COST_TRACKED: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
  CONTEXT_BUILD: "bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400",
  SAFETY_SWITCH: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400",
  ERROR: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
  USER_INPUT: "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400",
  AGENT_RESPONSE: "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400",
} as const;

export function TraceEventNode({ event, depth, onEventClick }: TraceEventNodeProps) {
  const [expanded, setExpanded] = useState(depth < 2);

  const hasChildren = event.children && event.children.length > 0;
  const colorClass = EVENT_TYPE_COLORS[event.event_type] || "bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400";

  const formatDuration = (ms?: number) => {
    if (ms === undefined) return null;
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (hasChildren) {
      if (e.key === "ArrowRight" && !expanded) {
        e.preventDefault();
        setExpanded(true);
      } else if (e.key === "ArrowLeft" && expanded) {
        e.preventDefault();
        setExpanded(false);
      }
    }
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onEventClick?.(event);
    }
  };

  return (
    <div className={cn("relative", depth > 0 && "ml-6")}>
      <div
        className={cn(
          "flex items-center gap-2 py-2 px-3 rounded-md cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900",
          depth > 0 && "border-l-2 border-gray-200 dark:border-gray-700 pl-4"
        )}
        onClick={() => {
          if (hasChildren) {
            setExpanded(!expanded);
          }
          onEventClick?.(event);
        }}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        aria-expanded={hasChildren ? expanded : undefined}
        aria-label={`${event.event_type} event at ${new Date(event.timestamp).toLocaleTimeString()}${hasChildren ? `, ${expanded ? "expanded" : "collapsed"}` : ""}`}
      >
        {hasChildren && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
            className="flex-shrink-0"
            aria-label={expanded ? "Collapse children" : "Expand children"}
            tabIndex={-1}
          >
            {expanded ? (
              <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" aria-hidden="true" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-500 dark:text-gray-400" aria-hidden="true" />
            )}
          </button>
        )}

        {!hasChildren && <div className="w-4" aria-hidden="true" />}

        <div
          className={cn(
            "inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium flex-shrink-0",
            colorClass
          )}
        >
          {event.event_type}
        </div>

        {event.metadata.duration_ms !== undefined && (
          <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
            <Clock className="w-3 h-3" />
            {formatDuration(event.metadata.duration_ms)}
          </div>
        )}

        {event.metadata.cost_usd !== undefined && (
          <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
            <DollarSign className="w-3 h-3" />
            {event.metadata.cost_usd.toFixed(4)}
          </div>
        )}

        {event.metadata.token_count !== undefined && (
          <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
            <Hash className="w-3 h-3" />
            {event.metadata.token_count}
          </div>
        )}

        <div className="text-xs text-gray-500 dark:text-gray-500 truncate flex-1">
          {new Date(event.timestamp).toLocaleTimeString()}
        </div>
      </div>

      <AnimatePresence>
        {expanded && hasChildren && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
          >
            {event.children?.map((child) => (
              <TraceEventNode
                key={child.span_id}
                event={child}
                depth={depth + 1}
                onEventClick={onEventClick}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
