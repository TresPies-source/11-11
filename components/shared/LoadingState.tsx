"use client";

import { Loader2 } from "lucide-react";
import { PromptCardSkeleton } from "./PromptCardSkeleton";

interface LoadingStateProps {
  count?: number;
}

export function LoadingState({ count = 6 }: LoadingStateProps) {
  return (
    <>
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
        <p className="text-gray-600 mt-2">Loading prompts...</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        {[...Array(count)].map((_, i) => (
          <PromptCardSkeleton key={i} index={i} />
        ))}
      </div>
    </>
  );
}
