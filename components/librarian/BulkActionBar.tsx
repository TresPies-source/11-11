"use client";

import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw, Trash2, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface BulkActionBarProps {
  selectedCount: number;
  onRestore: () => void;
  onDelete: () => void;
  onClearSelection: () => void;
  isRestoring?: boolean;
  isDeleting?: boolean;
}

export function BulkActionBar({
  selectedCount,
  onRestore,
  onDelete,
  onClearSelection,
  isRestoring = false,
  isDeleting = false,
}: BulkActionBarProps) {
  const isVisible = selectedCount > 0;
  const isLoading = isRestoring || isDeleting;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-md mb-6"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={onClearSelection}
                  disabled={isLoading}
                  className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2"
                  aria-label="Clear selection"
                >
                  <X className="h-5 w-5" />
                </button>
                <p className="text-sm font-medium text-gray-900">
                  {selectedCount} {selectedCount === 1 ? 'prompt' : 'prompts'} selected
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={onRestore}
                  disabled={isLoading}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-md transition-all duration-100 active:scale-95 focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2",
                    isRestoring
                      ? "bg-green-400 cursor-wait"
                      : "bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                  aria-label={`Restore ${selectedCount} selected ${selectedCount === 1 ? 'prompt' : 'prompts'}`}
                >
                  {isRestoring ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Restoring...</span>
                    </>
                  ) : (
                    <>
                      <RotateCcw className="h-4 w-4" />
                      <span>Restore</span>
                    </>
                  )}
                </button>

                <button
                  onClick={onDelete}
                  disabled={isLoading}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-md transition-all duration-100 active:scale-95 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2",
                    isDeleting
                      ? "bg-red-400 cursor-wait"
                      : "bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                  aria-label={`Delete ${selectedCount} selected ${selectedCount === 1 ? 'prompt' : 'prompts'}`}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      <span>Delete</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
