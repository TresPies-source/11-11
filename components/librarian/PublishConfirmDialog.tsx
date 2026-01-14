"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, X } from "lucide-react";
import { ANIMATION_EASE } from "@/lib/constants";

interface PublishConfirmDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const CONFIRM_DIALOG_KEY = "hidePublishConfirmDialog";

export function PublishConfirmDialog({
  isOpen,
  onConfirm,
  onCancel,
}: PublishConfirmDialogProps) {
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleConfirm = () => {
    if (dontShowAgain) {
      localStorage.setItem(CONFIRM_DIALOG_KEY, "true");
    }
    onConfirm();
  };

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={onCancel}
            aria-hidden="true"
          />
          <motion.div
            role="dialog"
            aria-labelledby="publish-dialog-title"
            aria-describedby="publish-dialog-description"
            aria-modal="true"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: ANIMATION_EASE }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-white rounded-lg shadow-2xl p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-accent rounded-lg">
                  <Globe className="h-6 w-6 text-primary" aria-hidden="true" />
                </div>
                <h2
                  id="publish-dialog-title"
                  className="text-xl font-semibold text-gray-900"
                >
                  Make Prompt Public?
                </h2>
              </div>
              <button
                onClick={onCancel}
                className="p-1 rounded-md hover:bg-gray-100 transition-colors"
                aria-label="Close dialog"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <p id="publish-dialog-description" className="text-gray-600 text-sm">
                Your prompt will be visible to all 11-11 users in the Global Commons.
                Others will be able to view and copy it to their library, but only you
                can edit the original.
              </p>

              <div className="bg-accent border border-primary/20 rounded-md p-3">
                <p className="text-sm text-primary-foreground">
                  <strong>Note:</strong> You can unpublish your prompt at any time to
                  make it private again.
                </p>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={dontShowAgain}
                  onChange={(e) => setDontShowAgain(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-2 focus:ring-primary focus:ring-offset-2"
                />
                <span className="text-sm text-gray-700">
                  Don&apos;t show this again
                </span>
              </label>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={onCancel}
                  className="flex-1 px-4 py-2.5 rounded-md border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  className="flex-1 px-4 py-2.5 rounded-md bg-primary text-white font-medium hover:bg-primary/90 transition-colors focus:ring-2 focus:ring-primary focus:ring-offset-2"
                >
                  Make Public
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
