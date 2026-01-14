"use client";

import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw, Trash2, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

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
          className="sticky top-0 z-40 bg-bg-secondary border-b border-bg-tertiary shadow-md mb-6"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={onClearSelection}
                  disabled={isLoading}
                  className="p-1.5 text-text-tertiary hover:text-text-primary hover:bg-bg-tertiary rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-text-accent focus-visible:ring-offset-2"
                  aria-label="Clear selection"
                >
                  <X className="h-5 w-5" />
                </button>
                <p className="text-sm font-medium text-text-primary">
                  {selectedCount} {selectedCount === 1 ? 'prompt' : 'prompts'} selected
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={onRestore}
                  disabled={isLoading}
                  isLoading={isRestoring}
                  size="sm"
                  variant="primary"
                  className="bg-success hover:bg-opacity-90"
                  aria-label={`Restore ${selectedCount} selected ${selectedCount === 1 ? 'prompt' : 'prompts'}`}
                >
                  {!isRestoring && <RotateCcw className="h-4 w-4" />}
                  <span>{isRestoring ? 'Restoring...' : 'Restore'}</span>
                </Button>

                <Button
                  onClick={onDelete}
                  disabled={isLoading}
                  isLoading={isDeleting}
                  size="sm"
                  variant="primary"
                  className="bg-error hover:bg-opacity-90"
                  aria-label={`Delete ${selectedCount} selected ${selectedCount === 1 ? 'prompt' : 'prompts'}`}
                >
                  {!isDeleting && <Trash2 className="h-4 w-4" />}
                  <span>{isDeleting ? 'Deleting...' : 'Delete'}</span>
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
