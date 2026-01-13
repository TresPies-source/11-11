"use client";

import { Search } from "lucide-react";

interface EmptySearchStateProps {
  searchTerm: string;
  onClear: () => void;
}

export function EmptySearchState({
  searchTerm,
  onClear,
}: EmptySearchStateProps) {
  return (
    <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-12 text-center">
      <Search className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
      <p className="text-gray-700 dark:text-gray-300 font-medium text-lg mb-2">
        No prompts match your search
      </p>
      <p className="text-gray-500 dark:text-gray-400 text-sm italic mb-4">
        &ldquo;{searchTerm}&rdquo;
      </p>
      <button
        onClick={onClear}
        className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium text-sm transition-colors"
      >
        Clear search
      </button>
    </div>
  );
}
