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
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
      <Search className="h-16 w-16 text-gray-400 mx-auto mb-4" />
      <p className="text-gray-700 font-medium text-lg mb-2">
        No prompts match your search
      </p>
      <p className="text-gray-500 text-sm italic mb-4">
        &ldquo;{searchTerm}&rdquo;
      </p>
      <button
        onClick={onClear}
        className="text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors"
      >
        Clear search
      </button>
    </div>
  );
}
