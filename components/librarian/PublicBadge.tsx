"use client";

import { Globe } from "lucide-react";
import { cn } from "@/lib/utils";

interface PublicBadgeProps {
  variant?: "default" | "compact";
  className?: string;
}

export function PublicBadge({ variant = "default", className }: PublicBadgeProps) {
  const isCompact = variant === "compact";

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium",
        isCompact
          ? "px-2 py-0.5 text-xs"
          : "px-3 py-1 text-sm",
        "bg-info text-white",
        className
      )}
      role="status"
      aria-label="This prompt is public"
    >
      <Globe className={cn(isCompact ? "h-3 w-3" : "h-3.5 w-3.5")} aria-hidden="true" />
      <span>Public</span>
    </div>
  );
}
