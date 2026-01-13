"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, XCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface BudgetAlertProps {
  warnings: string[];
  onDismiss?: () => void;
  className?: string;
}

const WARNING_MESSAGES: Record<string, { title: string; description: string; actions: string[] }> = {
  query_approaching_limit: {
    title: "Query Budget Warning",
    description: "This query is approaching the per-query token limit (80%).",
    actions: ["Consider simplifying your prompt", "Break into smaller queries"],
  },
  session_approaching_limit: {
    title: "Session Budget Warning",
    description: "This session is approaching the token limit (80%).",
    actions: ["End session and start fresh", "Prune conversation history"],
  },
  user_approaching_limit: {
    title: "Monthly Budget Warning",
    description: "You're approaching your monthly token limit (80%).",
    actions: ["Monitor usage carefully", "Consider upgrading your plan"],
  },
  query_limit_exceeded: {
    title: "Query Budget Exceeded",
    description: "This query exceeds the per-query token limit.",
    actions: ["Simplify your prompt", "Break into multiple smaller queries"],
  },
  session_limit_exceeded: {
    title: "Session Budget Exceeded",
    description: "This session has exceeded the token limit.",
    actions: ["Start a new session", "Clear conversation history"],
  },
  user_limit_exceeded: {
    title: "Monthly Budget Exceeded",
    description: "You've exceeded your monthly token limit.",
    actions: ["Wait until next month", "Upgrade your plan for more tokens"],
  },
};

export function BudgetAlert({ warnings, onDismiss, className }: BudgetAlertProps) {
  const [dismissed, setDismissed] = useState(false);

  if (warnings.length === 0 || dismissed) return null;

  const hasExceeded = warnings.some((w) => w.includes("exceeded"));
  const variant = hasExceeded ? "error" : "warning";

  const Icon = hasExceeded ? XCircle : AlertTriangle;

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  return (
    <AnimatePresence>
      <motion.div
        className={cn(
          "rounded-lg border p-4",
          variant === "error"
            ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
            : "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800",
          className
        )}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
        role="alert"
        aria-live="assertive"
      >
        <div className="flex items-start gap-3">
          <Icon
            className={cn(
              "h-5 w-5 flex-shrink-0 mt-0.5",
              variant === "error"
                ? "text-red-600 dark:text-red-400"
                : "text-yellow-600 dark:text-yellow-400"
            )}
          />
          <div className="flex-1 space-y-2">
            {warnings.map((warning, index) => {
              const info = WARNING_MESSAGES[warning] || {
                title: "Budget Alert",
                description: warning,
                actions: [],
              };

              return (
                <div key={index}>
                  <h3
                    className={cn(
                      "text-sm font-semibold",
                      variant === "error"
                        ? "text-red-900 dark:text-red-100"
                        : "text-yellow-900 dark:text-yellow-100"
                    )}
                  >
                    {info.title}
                  </h3>
                  <p
                    className={cn(
                      "text-sm mt-1",
                      variant === "error"
                        ? "text-red-800 dark:text-red-200"
                        : "text-yellow-800 dark:text-yellow-200"
                    )}
                  >
                    {info.description}
                  </p>
                  {info.actions.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {info.actions.map((action, actionIndex) => (
                        <li
                          key={actionIndex}
                          className={cn(
                            "text-xs flex items-start gap-2",
                            variant === "error"
                              ? "text-red-700 dark:text-red-300"
                              : "text-yellow-700 dark:text-yellow-300"
                          )}
                        >
                          <span className="font-bold">•</span>
                          <span>{action}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
          {onDismiss && (
            <button
              onClick={handleDismiss}
              className={cn(
                "p-1 rounded-md transition-colors flex-shrink-0",
                variant === "error"
                  ? "hover:bg-red-200 dark:hover:bg-red-800 text-red-600 dark:text-red-400"
                  : "hover:bg-yellow-200 dark:hover:bg-yellow-800 text-yellow-600 dark:text-yellow-400"
              )}
              aria-label="Dismiss alert"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
