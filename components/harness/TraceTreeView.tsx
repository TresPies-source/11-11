"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Network } from "lucide-react";
import { cn } from "@/lib/utils";
import type { HarnessTrace, HarnessEvent } from "@/lib/harness/types";
import { TraceEventNode } from "./TraceEventNode";
import { TraceEventDetails } from "./TraceEventDetails";

interface TraceTreeViewProps {
  trace: HarnessTrace;
  className?: string;
}

export function TraceTreeView({ trace, className }: TraceTreeViewProps) {
  const [selectedEvent, setSelectedEvent] = useState<HarnessEvent | null>(null);

  if (!trace.events || trace.events.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-8 text-center">
        <Network className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
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
        <div className="flex items-center gap-2 mb-4">
          <Network className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Event Tree</h3>
        </div>

        <div className="space-y-1">
          {trace.events.map((event) => (
            <TraceEventNode
              key={event.span_id}
              event={event}
              depth={0}
              onEventClick={setSelectedEvent}
            />
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
