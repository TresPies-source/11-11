"use client";

import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface CritiqueScoreProps {
  score: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

const getScoreColor = (score: number) => {
  if (score < 50) {
    return {
      bg: "bg-red-100",
      fill: "bg-red-500",
      text: "text-red-700",
      border: "border-red-200",
    };
  } else if (score < 75) {
    return {
      bg: "bg-yellow-100",
      fill: "bg-yellow-500",
      text: "text-yellow-700",
      border: "border-yellow-200",
    };
  } else {
    return {
      bg: "bg-green-100",
      fill: "bg-green-500",
      text: "text-green-700",
      border: "border-green-200",
    };
  }
};

const sizeConfig = {
  sm: {
    container: "h-1.5",
    text: "text-xs",
    label: "text-[10px]",
  },
  md: {
    container: "h-2",
    text: "text-sm",
    label: "text-xs",
  },
  lg: {
    container: "h-3",
    text: "text-base",
    label: "text-sm",
  },
};

const getScoreDescription = (score: number) => {
  if (score < 50) return "needs improvement";
  if (score < 75) return "good";
  return "excellent";
};

export const CritiqueScore = memo(function CritiqueScore({
  score,
  size = "md",
  showLabel = true,
  className,
}: CritiqueScoreProps) {
  const clampedScore = useMemo(() => Math.max(0, Math.min(100, score)), [score]);

  const colors = useMemo(() => getScoreColor(clampedScore), [clampedScore]);
  const config = sizeConfig[size];

  return (
    <div 
      className={cn("flex flex-col gap-1.5", className)}
      role="status"
      aria-label={`Quality score: ${clampedScore} out of 100, ${getScoreDescription(clampedScore)}`}
    >
      <div className="flex items-center justify-between gap-2">
        {showLabel && (
          <span className={cn("font-medium text-muted-foreground", config.label)}>
            Quality Score
          </span>
        )}
        <span 
          className={cn("font-semibold tabular-nums", colors.text, config.text)}
          aria-hidden="true"
        >
          {clampedScore}/100
        </span>
      </div>

      <div 
        className={cn("relative w-full rounded-full overflow-hidden", colors.bg, config.container)}
        role="progressbar"
        aria-valuenow={clampedScore}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Quality score progress"
      >
        <motion.div
          className={cn("h-full rounded-full", colors.fill)}
          initial={{ width: 0 }}
          animate={{ width: `${clampedScore}%` }}
          transition={{
            duration: 0.8,
            ease: "easeOut",
          }}
        />
      </div>
    </div>
  );
});
