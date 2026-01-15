"use client";

import { motion } from "framer-motion";

interface PromptCardSkeletonProps {
  index?: number;
}

export function PromptCardSkeleton({ index = 0 }: PromptCardSkeletonProps) {
  return (
    <motion.div
      className="bg-bg-secondary rounded-lg border border-bg-tertiary p-4 h-64"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.2, ease: "easeOut" }}
    >
      <div className="h-6 bg-bg-tertiary rounded w-3/4 mb-3 animate-shimmer"></div>
      <div className="space-y-2 mb-3">
        <div className="h-4 bg-bg-tertiary rounded w-full animate-shimmer"></div>
        <div className="h-4 bg-bg-tertiary rounded w-5/6 animate-shimmer"></div>
        <div className="h-4 bg-bg-tertiary rounded w-4/6 animate-shimmer"></div>
      </div>
      <div className="flex gap-1.5 mb-3">
        <div className="h-6 bg-bg-tertiary rounded-full w-16 animate-shimmer"></div>
        <div className="h-6 bg-bg-tertiary rounded-full w-20 animate-shimmer"></div>
        <div className="h-6 bg-bg-tertiary rounded-full w-14 animate-shimmer"></div>
      </div>
      <div className="mt-auto pt-3 border-t border-bg-tertiary">
        <div className="h-10 bg-bg-tertiary rounded-md animate-shimmer"></div>
      </div>
    </motion.div>
  );
}
