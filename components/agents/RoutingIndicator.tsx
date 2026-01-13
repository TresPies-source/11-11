"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, Route, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { RoutingResult } from "@/lib/agents/types";
import { AgentStatusBadge } from "./AgentStatusBadge";
import { ANIMATION_EASE } from "@/lib/constants";

interface RoutingIndicatorProps {
  result: RoutingResult;
  agent: { id: string; name: string; description: string };
  className?: string;
  mode?: "full" | "minimal" | "hidden";
}

export function RoutingIndicator({
  result,
  agent,
  className,
  mode = "full",
}: RoutingIndicatorProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (mode === "hidden") return null;

  if (mode === "minimal") {
    return (
      <div className={cn("inline-flex items-center gap-2", className)}>
        <Route className="w-3 h-3 text-gray-400 dark:text-gray-500" />
        <AgentStatusBadge
          agent={{ ...agent, when_to_use: [], when_not_to_use: [], default: false }}
        />
      </div>
    );
  }

  const confidenceColor =
    result.confidence >= 0.8
      ? "text-green-600 dark:text-green-400"
      : result.confidence >= 0.6
      ? "text-amber-600 dark:text-amber-400"
      : "text-red-600 dark:text-red-400";

  const confidencePercentage = Math.round(result.confidence * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3, ease: ANIMATION_EASE }}
      className={cn(
        "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm overflow-hidden",
        className
      )}
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-2 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Route className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
          <span className="text-sm text-gray-700 dark:text-gray-300">Routed to:</span>
          <AgentStatusBadge
            agent={{ ...agent, when_to_use: [], when_not_to_use: [], default: false }}
          />
          {result.fallback && (
            <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
              (Fallback)
            </span>
          )}
          <span className={cn("text-xs font-medium ml-2", confidenceColor)}>
            {confidencePercentage}%
          </span>
        </div>
        <div className="flex items-center gap-2">
          {result.routing_cost && (
            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
              <DollarSign className="w-3 h-3" />
              <span>${result.routing_cost.cost_usd.toFixed(6)}</span>
            </div>
          )}
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-gray-400 dark:text-gray-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400 dark:text-gray-500" />
          )}
        </div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: ANIMATION_EASE }}
            className="border-t border-gray-200 dark:border-gray-700"
          >
            <div className="px-4 py-3 space-y-2">
              <div>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Reasoning:
                </span>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                  {result.reasoning}
                </p>
              </div>

              {result.routing_cost && (
                <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Routing Cost:
                  </span>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-600 dark:text-gray-400">
                    <span>{result.routing_cost.tokens_used} tokens</span>
                    <span>•</span>
                    <span>${result.routing_cost.cost_usd.toFixed(6)}</span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
