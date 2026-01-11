"use client";

import { motion } from "framer-motion";

interface PromptCardSkeletonProps {
  index?: number;
}

export function PromptCardSkeleton({ index = 0 }: PromptCardSkeletonProps) {
  return (
    <motion.div
      className="bg-white rounded-lg border border-gray-200 p-4 h-64"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
      <div className="h-6 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 rounded w-3/4 mb-3 animate-shimmer"></div>
      <div className="space-y-2 mb-3">
        <div className="h-4 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 rounded w-full animate-shimmer"></div>
        <div className="h-4 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 rounded w-5/6 animate-shimmer"></div>
        <div className="h-4 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 rounded w-4/6 animate-shimmer"></div>
      </div>
      <div className="flex gap-1.5 mb-3">
        <div className="h-6 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 rounded-full w-16 animate-shimmer"></div>
        <div className="h-6 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 rounded-full w-20 animate-shimmer"></div>
        <div className="h-6 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 rounded-full w-14 animate-shimmer"></div>
      </div>
      <div className="mt-auto pt-3 border-t border-gray-100">
        <div className="h-10 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 rounded-md animate-shimmer"></div>
      </div>
    </motion.div>
  );
}
