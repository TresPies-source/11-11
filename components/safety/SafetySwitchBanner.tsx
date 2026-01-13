"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, ShieldAlert, X, RotateCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { SafetySwitchReason, SafetyStatus } from "@/lib/safety/types";
import { getSafetyStatus } from "@/lib/safety/switch";
import { attemptManualRecovery } from "@/lib/safety/recovery";

interface SafetySwitchBannerProps {
  sessionId: string;
  onDismiss?: () => void;
  className?: string;
}

const REASON_MESSAGES: Record<
  SafetySwitchReason,
  { title: string; description: string }
> = {
  llm_error: {
    title: "Safety Switch Activated",
    description: "The AI model encountered an error. We've switched to a simpler, more reliable mode.",
  },
  budget_exhausted: {
    title: "Budget Limit Reached",
    description: "You've reached your budget limit. We've switched to a cost-saving mode.",
  },
  rate_limit: {
    title: "Rate Limit Hit",
    description: "Too many requests. We've switched to a slower, more reliable mode.",
  },
  timeout: {
    title: "Request Timeout",
    description: "The request timed out. We've switched to a faster, more efficient mode.",
  },
  api_failure: {
    title: "API Error",
    description: "The API service is experiencing issues. We've switched to a backup mode.",
  },
  parsing_error: {
    title: "Parsing Error",
    description: "We couldn't parse the response. We've switched to a more reliable mode.",
  },
  auth_error: {
    title: "Authentication Error",
    description: "There was an authentication issue. We've switched to safe mode.",
  },
  conflicting_perspectives: {
    title: "Conflicting Perspectives Detected",
    description: "The debugger detected logical contradictions. We've switched to conservative mode.",
  },
  unknown_error: {
    title: "Unknown Error",
    description: "An unexpected error occurred. We've switched to safe mode.",
  },
};

export function SafetySwitchBanner({
  sessionId,
  onDismiss,
  className,
}: SafetySwitchBannerProps) {
  const [status, setStatus] = useState<SafetyStatus | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);

  useEffect(() => {
    const checkStatus = () => {
      const currentStatus = getSafetyStatus(sessionId);
      setStatus(currentStatus.active ? currentStatus : null);
      
      if (!currentStatus.active && dismissed) {
        setDismissed(false);
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 1000);
    return () => clearInterval(interval);
  }, [sessionId, dismissed]);

  const handleTryAgain = async () => {
    setIsRecovering(true);
    try {
      const result = await attemptManualRecovery(sessionId);
      if (result.success) {
        setStatus(null);
        setDismissed(false);
      }
    } catch (error) {
      console.error('[SafetySwitchBanner] Recovery failed:', error);
    } finally {
      setIsRecovering(false);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  if (!status || dismissed) return null;

  const reason = status.reason || 'unknown_error';
  const message = REASON_MESSAGES[reason];

  return (
    <AnimatePresence>
      <motion.div
        className={cn(
          "rounded-lg border p-4 shadow-md",
          "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800",
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
          <ShieldAlert className="h-5 w-5 flex-shrink-0 mt-0.5 text-yellow-600 dark:text-yellow-400" />
          
          <div className="flex-1 space-y-2">
            <div>
              <h3 className="text-sm font-semibold text-yellow-900 dark:text-yellow-100">
                {message.title}
              </h3>
              <p className="text-sm mt-1 text-yellow-800 dark:text-yellow-200">
                {message.description}
              </p>
            </div>

            {status.recoveryPath && (
              <p className="text-xs text-yellow-700 dark:text-yellow-300">
                <strong>Recovery:</strong> {status.recoveryPath}
              </p>
            )}

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handleTryAgain}
                disabled={isRecovering}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                  "bg-yellow-600 text-white hover:bg-yellow-700",
                  "dark:bg-yellow-700 dark:hover:bg-yellow-600",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "flex items-center gap-1.5"
                )}
                aria-label="Try to recover from safe mode"
              >
                {isRecovering ? (
                  <>
                    <RotateCw className="h-3 w-3 animate-spin" />
                    Recovering...
                  </>
                ) : (
                  <>
                    <RotateCw className="h-3 w-3" />
                    Try Again
                  </>
                )}
              </button>

              <span className="text-xs text-yellow-700 dark:text-yellow-300">
                Operating in conservative mode • Mirror only • Reduced costs
              </span>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className={cn(
              "p-1 rounded-md transition-colors flex-shrink-0",
              "hover:bg-yellow-200 dark:hover:bg-yellow-800",
              "text-yellow-600 dark:text-yellow-400"
            )}
            aria-label="Dismiss safety switch banner"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
