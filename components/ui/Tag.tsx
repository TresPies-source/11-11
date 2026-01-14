"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface TagProps {
  label: string;
  className?: string;
}

const Tag = React.memo(function Tag({
  label,
  className,
}: TagProps) {
  return (
    <span
      className={cn(
        "bg-bg-tertiary rounded-full px-3 py-1 text-xs text-text-secondary",
        className
      )}
    >
      {label}
    </span>
  );
});

Tag.displayName = "Tag";

export { Tag };
