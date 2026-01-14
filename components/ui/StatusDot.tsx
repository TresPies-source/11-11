"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface StatusDotProps {
  status: 'idle' | 'working' | 'error' | 'success' | 'default';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const StatusDot = React.memo(function StatusDot({
  status,
  size = 'md',
  className,
}: StatusDotProps) {
  const statusColors = {
    idle: 'bg-text-muted',
    working: 'bg-supervisor animate-pulse',
    error: 'bg-error',
    success: 'bg-success',
    default: 'bg-text-tertiary',
  };
  
  const sizeStyles = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-3 h-3',
  };
  
  const statusLabels = {
    idle: 'Idle',
    working: 'Working',
    error: 'Error',
    success: 'Success',
    default: 'Status indicator',
  };

  return (
    <span
      className={cn(
        'inline-block rounded-full',
        statusColors[status],
        sizeStyles[size],
        className
      )}
      aria-label={statusLabels[status]}
      role="status"
    />
  );
});

StatusDot.displayName = "StatusDot";

export { StatusDot };
