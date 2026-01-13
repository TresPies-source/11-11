"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Clock, DollarSign, Hash, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { HarnessEvent } from "@/lib/harness/types";

interface TraceEventDetailsProps {
  event: HarnessEvent | null;
  onClose: () => void;
}

export function TraceEventDetails({ event, onClose }: TraceEventDetailsProps) {
  if (!event) return null;

  const formatJson = (obj: Record<string, any>) => {
    return JSON.stringify(obj, null, 2);
  };

  return (
    <AnimatePresence>
      <motion.div
        className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.2 }}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Event Details</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Event Type</p>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {event.event_type}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Span ID</p>
              <p className="text-sm font-mono text-gray-900 dark:text-gray-100">
                {event.span_id}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Timestamp</p>
              <p className="text-sm text-gray-900 dark:text-gray-100">
                {new Date(event.timestamp).toLocaleString()}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Parent ID</p>
              <p className="text-sm font-mono text-gray-900 dark:text-gray-100">
                {event.parent_id || "None (root)"}
              </p>
            </div>
          </div>

          {Object.keys(event.metadata).length > 0 && (
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Metadata</p>
              <div className="grid grid-cols-2 gap-3">
                {event.metadata.duration_ms !== undefined && (
                  <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-md">
                    <Clock className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Duration</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {event.metadata.duration_ms < 1000
                          ? `${event.metadata.duration_ms}ms`
                          : `${(event.metadata.duration_ms / 1000).toFixed(2)}s`}
                      </p>
                    </div>
                  </div>
                )}

                {event.metadata.cost_usd !== undefined && (
                  <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-md">
                    <DollarSign className="w-4 h-4 text-green-600 dark:text-green-400" />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Cost</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        ${event.metadata.cost_usd.toFixed(4)}
                      </p>
                    </div>
                  </div>
                )}

                {event.metadata.token_count !== undefined && (
                  <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-md">
                    <Hash className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Tokens</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {event.metadata.token_count}
                      </p>
                    </div>
                  </div>
                )}

                {event.metadata.confidence !== undefined && (
                  <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-md">
                    <Hash className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Confidence</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {(event.metadata.confidence * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {event.metadata.error_message && (
                <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-red-600 dark:text-red-400 font-medium mb-1">Error</p>
                      <p className="text-sm text-red-700 dark:text-red-300">
                        {event.metadata.error_message}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {Object.keys(event.inputs).length > 0 && (
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Inputs</p>
              <pre className="text-xs bg-gray-50 dark:bg-gray-800 p-3 rounded-md overflow-x-auto">
                <code className="text-gray-900 dark:text-gray-100">
                  {formatJson(event.inputs)}
                </code>
              </pre>
            </div>
          )}

          {Object.keys(event.outputs).length > 0 && (
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Outputs</p>
              <pre className="text-xs bg-gray-50 dark:bg-gray-800 p-3 rounded-md overflow-x-auto">
                <code className="text-gray-900 dark:text-gray-100">
                  {formatJson(event.outputs)}
                </code>
              </pre>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
