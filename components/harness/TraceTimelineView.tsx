"use client";

import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { HarnessTrace, HarnessEvent } from "@/lib/harness/types";
import { TraceEventDetails } from "./TraceEventDetails";

interface TraceTimelineViewProps {
  trace: HarnessTrace;
  className?: string;
}

interface FlatEvent {
  event: HarnessEvent;
  depth: number;
}

const EVENT_TYPE_COLORS = {
  SESSION_START: "bg-green-500 dark:bg-green-600",
  SESSION_END: "bg-gray-500 dark:bg-gray-600",
  MODE_TRANSITION: "bg-purple-500 dark:bg-purple-600",
  AGENT_ROUTING: "bg-blue-500 dark:bg-blue-600",
  AGENT_HANDOFF: "bg-indigo-500 dark:bg-indigo-600",
  TOOL_INVOCATION: "bg-amber-500 dark:bg-amber-600",
  PERSPECTIVE_INTEGRATION: "bg-pink-500 dark:bg-pink-600",
  COST_TRACKED: "bg-emerald-500 dark:bg-emerald-600",
  CONTEXT_BUILD: "bg-teal-500 dark:bg-teal-600",
  SAFETY_SWITCH: "bg-yellow-500 dark:bg-yellow-600",
  ERROR: "bg-red-500 dark:bg-red-600",
  USER_INPUT: "bg-cyan-500 dark:bg-cyan-600",
  AGENT_RESPONSE: "bg-violet-500 dark:bg-violet-600",
  AGENT_ACTIVITY_START: "bg-lime-500 dark:bg-lime-600",
  AGENT_ACTIVITY_PROGRESS: "bg-sky-500 dark:bg-sky-600",
  AGENT_ACTIVITY_COMPLETE: "bg-emerald-500 dark:bg-emerald-600",
} as const;

export function TraceTimelineView({ trace, className }: TraceTimelineViewProps) {
  const [selectedEvent, setSelectedEvent] = useState<HarnessEvent | null>(null);

  const flatEvents = useMemo(() => {
    const flatten = (events: HarnessEvent[], depth: number = 0): FlatEvent[] => {
      return events.flatMap((event) => [
        { event, depth },
        ...(event.children ? flatten(event.children, depth + 1) : []),
      ]);
    };
    return flatten(trace.events).sort(
      (a, b) => new Date(a.event.timestamp).getTime() - new Date(b.event.timestamp).getTime()
    );
  }, [trace.events]);

  const startTime = useMemo(
    () => new Date(trace.started_at).getTime(),
    [trace.started_at]
  );

  const endTime = useMemo(() => {
    if (trace.ended_at) {
      return new Date(trace.ended_at).getTime();
    }
    if (flatEvents.length > 0) {
      return new Date(flatEvents[flatEvents.length - 1].event.timestamp).getTime();
    }
    return startTime + 1000;
  }, [trace.ended_at, flatEvents, startTime]);

  const totalDuration = endTime - startTime;

  const getEventPosition = (timestamp: string) => {
    const eventTime = new Date(timestamp).getTime();
    return ((eventTime - startTime) / totalDuration) * 100;
  };

  const getEventWidth = (event: HarnessEvent) => {
    if (!event.metadata.duration_ms) return 0.5;
    return Math.max((event.metadata.duration_ms / totalDuration) * 100, 0.5);
  };

  if (!trace.events || trace.events.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-8 text-center">
        <Clock className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">No events in this trace</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <motion.div
        className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center gap-2 mb-6">
          <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Event Timeline</h3>
        </div>

        <div className="mb-4 flex justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>{new Date(startTime).toLocaleTimeString()}</span>
          <span>
            Duration: {totalDuration < 1000
              ? `${totalDuration}ms`
              : `${(totalDuration / 1000).toFixed(2)}s`}
          </span>
          <span>{new Date(endTime).toLocaleTimeString()}</span>
        </div>

        <div className="relative h-12 bg-gray-100 dark:bg-gray-800 rounded-md mb-6">
          {flatEvents.map(({ event, depth }) => {
            const left = getEventPosition(event.timestamp);
            const width = getEventWidth(event);
            const colorClass = EVENT_TYPE_COLORS[event.event_type] || "bg-gray-500";

            return (
              <motion.div
                key={event.span_id}
                className={cn(
                  "absolute h-8 rounded cursor-pointer transition-all hover:scale-105 hover:z-10",
                  colorClass
                )}
                style={{
                  left: `${left}%`,
                  width: `${width}%`,
                  top: `${depth * 2}px`,
                }}
                initial={{ opacity: 0, scaleX: 0 }}
                animate={{ opacity: 1, scaleX: 1 }}
                transition={{ duration: 0.3, delay: 0.05 }}
                onClick={() => setSelectedEvent(event)}
                title={`${event.event_type} - ${event.metadata.duration_ms || 0}ms`}
              />
            );
          })}
        </div>

        <div className="space-y-2">
          {flatEvents.map(({ event, depth }) => (
            <div
              key={event.span_id}
              className={cn(
                "flex items-center gap-3 p-2 rounded-md cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors",
                depth > 0 && "ml-6"
              )}
              onClick={() => setSelectedEvent(event)}
            >
              <div
                className={cn(
                  "w-3 h-3 rounded-full flex-shrink-0",
                  EVENT_TYPE_COLORS[event.event_type] || "bg-gray-500"
                )}
              />
              <span className="text-xs font-medium text-gray-900 dark:text-gray-100">
                {event.event_type}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {new Date(event.timestamp).toLocaleTimeString()}
              </span>
              {event.metadata.duration_ms !== undefined && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  ({event.metadata.duration_ms}ms)
                </span>
              )}
            </div>
          ))}
        </div>
      </motion.div>

      {selectedEvent && (
        <TraceEventDetails
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </div>
  );
}
