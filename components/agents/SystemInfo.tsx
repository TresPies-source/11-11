"use client";

import React from "react";

interface SystemInfoProps {
  cost?: string;
  duration?: string;
}

export function SystemInfo({ cost = "$0.0012", duration = "2s" }: SystemInfoProps) {
  return (
    <div className="flex items-center gap-4 text-sm text-text-tertiary">
      <div className="flex items-center gap-2">
        <span className="font-medium">Cost:</span>
        <span>{cost}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="font-medium">Duration:</span>
        <span>{duration}</span>
      </div>
    </div>
  );
}
