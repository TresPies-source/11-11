"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface BudgetProgressProps {
  label: string;
  current: number;
  limit: number;
  warnThreshold?: number;
  className?: string;
}

export function BudgetProgress({
  label,
  current,
  limit,
  warnThreshold = 0.8,
  className,
}: BudgetProgressProps) {
  const percentage = limit > 0 ? Math.min((current / limit) * 100, 100) : 0;
  const isWarning = percentage >= warnThreshold * 100;
  const isDanger = percentage >= 100;

  const getColor = () => {
    if (isDanger) return "bg-red-600 dark:bg-red-500";
    if (isWarning) return "bg-yellow-500 dark:bg-yellow-400";
    return "bg-green-600 dark:bg-green-500";
  };

  const getBarBackgroundColor = () => {
    if (isDanger) return "bg-red-100 dark:bg-red-900/20";
    if (isWarning) return "bg-yellow-100 dark:bg-yellow-900/20";
    return "bg-green-100 dark:bg-green-900/20";
  };

  const formatNumber = (num: number) => {
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
    return num.toLocaleString();
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
        <span className={cn(
          "text-sm font-semibold",
          isDanger ? "text-red-600 dark:text-red-400" : 
          isWarning ? "text-yellow-600 dark:text-yellow-400" : 
          "text-gray-600 dark:text-gray-400"
        )}>
          {formatNumber(current)} / {formatNumber(limit)}
          <span className="ml-1 text-xs">({percentage.toFixed(0)}%)</span>
        </span>
      </div>
      
      <div
        className={cn(
          "h-3 rounded-full overflow-hidden",
          getBarBackgroundColor()
        )}
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${label}: ${percentage.toFixed(0)}% used`}
      >
        <motion.div
          className={cn("h-full rounded-full", getColor())}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}
