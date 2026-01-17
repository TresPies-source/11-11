"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { X, AlertTriangle } from "lucide-react";
import { deleteSession } from "@/lib/pglite/sessions";

interface SessionDeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onDeleted: () => void;
  sessionId: string;
  sessionTitle?: string;
}

export function SessionDeleteDialog({
  isOpen,
  onClose,
  onDeleted,
  sessionId,
  sessionTitle,
}: SessionDeleteDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setIsDeleting(false);
    }
  }, [isOpen]);

  const handleDelete = useCallback(async () => {
    setIsDeleting(true);
    setError(null);

    try {
      await deleteSession(sessionId);
      onDeleted();
      onClose();
    } catch (err) {
      console.error('[SessionDeleteDialog] Failed to delete session:', err);
      setError('Failed to delete session. Please try again.');
      setIsDeleting(false);
    }
  }, [sessionId, onDeleted, onClose]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!mounted) return null;

  const modal = (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed inset-0 bg-black/50 z-50"
            aria-hidden="true"
          />

          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              ref={modalRef}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
              className="bg-bg-secondary rounded-lg shadow-xl max-w-md w-full border border-bg-tertiary"
              role="dialog"
              aria-modal="true"
              aria-labelledby="modal-title"
            >
              <div className="flex items-center justify-between p-4 border-b border-bg-tertiary">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-error" />
                  <h2
                    id="modal-title"
                    className="text-lg font-semibold text-text-primary"
                  >
                    Delete Session
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="text-text-tertiary hover:text-text-primary transition-all duration-150 p-1 rounded focus:outline-none focus:ring-2 focus:ring-text-accent"
                  aria-label="Close dialog"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 space-y-4">
                <div className="space-y-2">
                  <p className="text-sm text-text-secondary">
                    Are you sure you want to delete{" "}
                    {sessionTitle ? (
                      <span className="font-medium text-text-primary">
                        &ldquo;{sessionTitle}&rdquo;
                      </span>
                    ) : (
                      "this session"
                    )}
                    ?
                  </p>
                  <p className="text-sm text-text-tertiary">
                    This action cannot be undone. All messages and data associated with this session will be permanently deleted.
                  </p>
                </div>

                {error && (
                  <div
                    className="p-3 bg-error/10 border border-error/20 rounded-lg"
                    role="alert"
                  >
                    <p className="text-sm text-error">{error}</p>
                  </div>
                )}

                <div className="flex justify-end gap-3">
                  <button
                    onClick={onClose}
                    disabled={isDeleting}
                    className={cn(
                      "px-4 py-2 text-sm font-medium rounded-lg transition-all duration-150",
                      "text-text-secondary bg-transparent border border-bg-tertiary hover:border-text-tertiary",
                      "focus:outline-none focus:ring-2 focus:ring-text-accent",
                      "disabled:opacity-50 disabled:cursor-not-allowed"
                    )}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className={cn(
                      "px-4 py-2 text-sm font-medium rounded-lg transition-all duration-150",
                      "text-white bg-error hover:bg-error/90",
                      "focus:outline-none focus:ring-2 focus:ring-error",
                      "disabled:opacity-50 disabled:cursor-not-allowed"
                    )}
                  >
                    {isDeleting ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(modal, document.body);
}
