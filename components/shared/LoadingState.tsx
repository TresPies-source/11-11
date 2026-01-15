"use client";

import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { PromptCardSkeleton } from "./PromptCardSkeleton";

interface LoadingStateProps {
  count?: number;
}

export function LoadingState({ count = 6 }: LoadingStateProps) {
  return (
    <>
      <div className="flex flex-col items-center justify-center py-12">
        <LoadingSpinner size="lg" className="text-text-accent" />
        <p className="text-text-secondary mt-4">Loading prompts...</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        {[...Array(count)].map((_, i) => (
          <PromptCardSkeleton key={i} index={i} />
        ))}
      </div>
    </>
  );
}
