"use client";

import { useEffect, useRef, useState, memo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { X, ExternalLink, Calendar, Link2 } from "lucide-react";
import type { ArtifactType } from "@/lib/hub/types";
import type { ArtifactDetails } from "@/lib/hub/graph-queries";

interface ArtifactDetailModalProps {
  artifact: ArtifactDetails | null;
  isOpen: boolean;
  onClose: () => void;
  error?: string | null;
}

const ARTIFACT_CONFIG = {
  session: {
    color: "bg-blue-500 dark:bg-blue-400",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
    textColor: "text-blue-700 dark:text-blue-300",
    label: "Session",
    icon: "💬",
    route: (id: string) => `/dojo/${id}`,
    contextLabel: "Open in Dojo",
  },
  prompt: {
    color: "bg-purple-500 dark:bg-purple-400",
    bgColor: "bg-purple-100 dark:bg-purple-900/30",
    textColor: "text-purple-700 dark:text-purple-300",
    label: "Prompt",
    icon: "📝",
    route: () => "/library",
    contextLabel: "Open in Library",
  },
  seed: {
    color: "bg-green-500 dark:bg-green-400",
    bgColor: "bg-green-100 dark:bg-green-900/30",
    textColor: "text-green-700 dark:text-green-300",
    label: "Seed",
    icon: "🌱",
    route: () => "/seeds",
    contextLabel: "Open in Garden",
  },
  file: {
    color: "bg-orange-500 dark:bg-orange-400",
    bgColor: "bg-orange-100 dark:bg-orange-900/30",
    textColor: "text-orange-700 dark:text-orange-300",
    label: "File",
    icon: "📄",
    route: () => "/workbench",
    contextLabel: "Open in Workbench",
  },
};

export const ArtifactDetailModal = memo(function ArtifactDetailModal({
  artifact,
  isOpen,
  onClose,
  error,
}: ArtifactDetailModalProps) {
  const [mounted, setMounted] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen || !artifact) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);

    setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 50);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, artifact, onClose]);

  const formatDate = useCallback((dateString: string) => {
    try {
      return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }).format(new Date(dateString));
    } catch {
      return "Invalid date";
    }
  }, []);

  const handleOpenInContext = useCallback(() => {
    if (!artifact) return;
    const config = ARTIFACT_CONFIG[artifact.type];
    window.location.href = config.route(artifact.id);
  }, [artifact]);

  if (!mounted) return null;
  if (!isOpen) return null;

  if (error) {
    const errorModal = (
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50"
              aria-hidden="true"
            />

            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                ref={modalRef}
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-md w-full p-6"
                role="dialog"
                aria-modal="true"
              >
                <div className="text-center">
                  <div className="text-5xl mb-4">❌</div>
                  <h3 className="text-lg font-semibold text-text-primary mb-2">
                    Failed to Load Artifact
                  </h3>
                  <p className="text-sm text-text-secondary mb-4">{error}</p>
                  <button
                    onClick={onClose}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    );

    return typeof document !== "undefined"
      ? createPortal(errorModal, document.body)
      : null;
  }

  if (!artifact) return null;

  const config = ARTIFACT_CONFIG[artifact.type];

  const modal = (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50"
            aria-hidden="true"
          />

          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              ref={modalRef}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col"
              role="dialog"
              aria-modal="true"
              aria-labelledby="artifact-modal-title"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="text-4xl flex-shrink-0" aria-hidden="true">
                    {config.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2
                      id="artifact-modal-title"
                      className="text-xl font-bold text-gray-900 dark:text-gray-100 truncate"
                      title={artifact.title}
                    >
                      {artifact.title}
                    </h2>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 mt-1 px-2 py-0.5 rounded-full text-xs font-medium",
                        config.bgColor,
                        config.textColor
                      )}
                    >
                      <div
                        className={cn("w-1.5 h-1.5 rounded-full", config.color)}
                      />
                      {config.label}
                    </span>
                  </div>
                </div>
                <button
                  ref={closeButtonRef}
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 flex-shrink-0 ml-4"
                  aria-label="Close dialog"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="overflow-y-auto flex-1 p-6 space-y-6">
                <section>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-2 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Metadata
                  </h3>
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        Created
                      </p>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {formatDate(artifact.created_at)}
                      </p>
                    </div>
                    {artifact.updated_at && (
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                          Last Updated
                        </p>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {formatDate(artifact.updated_at)}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                        <Link2 className="w-3 h-3" />
                        Connections
                      </p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {artifact.connectionCount}
                      </p>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-2">
                    Content Preview
                  </h3>
                  {artifact.content_preview ? (
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                      <p className="text-gray-900 dark:text-gray-100 leading-relaxed whitespace-pre-wrap">
                        {artifact.content_preview}
                        {artifact.content_preview.length >= 300 && (
                          <span className="text-gray-500 dark:text-gray-400">
                            ...
                          </span>
                        )}
                      </p>
                    </div>
                  ) : (
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 text-center">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        No content preview available
                      </p>
                    </div>
                  )}
                </section>
              </div>

              <div className="sticky bottom-0 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-6 py-4 flex items-center justify-end gap-3">
                <button
                  onClick={onClose}
                  className={cn(
                    "px-4 py-2 text-sm font-medium rounded-lg transition-colors",
                    "text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600",
                    "hover:bg-gray-50 dark:hover:bg-gray-600",
                    "focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                  )}
                >
                  Close
                </button>
                <button
                  onClick={handleOpenInContext}
                  className={cn(
                    "px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2",
                    "text-white bg-blue-600 border border-blue-600",
                    "hover:bg-blue-700",
                    "focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                  )}
                >
                  <ExternalLink className="w-4 h-4" />
                  {config.contextLabel}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(modal, document.body);
});
