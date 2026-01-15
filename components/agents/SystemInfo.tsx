"use client";

import React from "react";

interface SystemInfoProps {
  cost?: string;
  duration?: string;
  isCollapsed?: boolean;
}

export function SystemInfo({ cost = "$0.0012", duration = "2s", isCollapsed = false }: SystemInfoProps) {
  if (isCollapsed) {
    return (
      <div className="flex flex-col gap-1 text-xs text-text-tertiary">
        <div className="truncate" title={`Cost: ${cost}`}>
          {cost}
        </div>
        <div className="truncate" title={`Duration: ${duration}`}>
          {duration}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4 text-sm text-text-tertiary">
      <div className="flex items-center gap-2">
        <span className="font-medium">Cost:</span>
        <span className="transition-all duration-fast tabular-nums">{cost}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="font-medium">Duration:</span>
        <span className="transition-all duration-fast tabular-nums">{duration}</span>
      </div>
    </div>
  );
}
