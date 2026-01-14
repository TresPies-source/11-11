"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface ProgressProps {
  value: number;
  className?: string;
  indicatorClassName?: string;
}

export const Progress = React.memo(function Progress({ value, className, indicatorClassName }: ProgressProps) {
  const clampedValue = Math.min(100, Math.max(0, value));

  return (
    <div
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700",
        className
      )}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={clampedValue}
    >
      <div
        className={cn(
          "h-full transition-all duration-300 ease-out bg-blue-500 dark:bg-blue-400",
          indicatorClassName
        )}
        style={{ width: `${clampedValue}%` }}
      />
    </div>
  );
});
