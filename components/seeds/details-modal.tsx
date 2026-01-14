"use client";

import { useEffect, useState, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { X, Copy, CheckCircle, Leaf, TrendingUp, Clock } from "lucide-react";
import type { SeedRow } from "@/lib/seeds/types";
import { cn } from "@/lib/utils";

interface SeedDetailsModalProps {
  seed: SeedRow | null;
  isOpen: boolean;
  onClose: () => void;
}

const TYPE_COLORS = {
  principle: {
    bg: "bg-blue-50 dark:bg-blue-900/30",
    text: "text-blue-700 dark:text-blue-300",
    border: "border-blue-200 dark:border-blue-800",
  },
  pattern: {
    bg: "bg-green-50 dark:bg-green-900/30",
    text: "text-green-700 dark:text-green-300",
    border: "border-green-200 dark:border-green-800",
  },
  question: {
    bg: "bg-yellow-50 dark:bg-yellow-900/30",
    text: "text-yellow-700 dark:text-yellow-300",
    border: "border-yellow-200 dark:border-yellow-800",
  },
  route: {
    bg: "bg-purple-50 dark:bg-purple-900/30",
    text: "text-purple-700 dark:text-purple-300",
    border: "border-purple-200 dark:border-purple-800",
  },
  artifact: {
    bg: "bg-orange-50 dark:bg-orange-900/30",
    text: "text-orange-700 dark:text-orange-300",
    border: "border-orange-200 dark:border-orange-800",
  },
  constraint: {
    bg: "bg-red-50 dark:bg-red-900/30",
    text: "text-red-700 dark:text-red-300",
    border: "border-red-200 dark:border-red-800",
  },
};

const STATUS_CONFIG = {
  new: {
    Icon: Leaf,
    label: "New",
    color: "text-gray-600 dark:text-gray-400",
    bg: "bg-gray-100 dark:bg-gray-800",
  },
  growing: {
    Icon: TrendingUp,
    label: "Growing",
    color: "text-green-600 dark:text-green-400",
    bg: "bg-green-100 dark:bg-green-900/30",
  },
  mature: {
    Icon: CheckCircle,
    label: "Mature",
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-100 dark:bg-blue-900/30",
  },
  compost: {
    Icon: X,
    label: "Composted",
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-100 dark:bg-red-900/30",
  },
};

function generateMemoryPatch(seed: SeedRow): string {
  return `## Seed: ${seed.name}

**Type:** ${seed.type}  
**Status:** ${seed.status}

**Why it matters:** ${seed.why_matters || "N/A"}  
**Revisit when:** ${seed.revisit_when || "N/A"}

**Content:**
${seed.content}

---
_Exported on ${new Date().toLocaleString()}_
`;
}

export const SeedDetailsModal = memo(function SeedDetailsModal({
  seed,
  isOpen,
  onClose,
}: SeedDetailsModalProps) {
  const [mounted, setMounted] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) {
      setIsCopied(false);
    }
  }, [isOpen]);

  if (!mounted || !seed) return null;

  const typeColors = TYPE_COLORS[seed.type];
  const statusConfig = STATUS_CONFIG[seed.status];
  const StatusIcon = statusConfig.Icon;

  async function handleExportMemoryPatch() {
    if (!seed) return;

    const memoryPatch = generateMemoryPatch(seed);

    try {
      await navigator.clipboard.writeText(memoryPatch);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error("[EXPORT_MEMORY_PATCH]", error);
    }
  }

  const modal = (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={onClose}
            aria-hidden="true"
          />

          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col"
              role="dialog"
              aria-modal="true"
              aria-labelledby="modal-title"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-6 flex items-start justify-between z-10">
                <div className="flex-1 pr-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={cn(
                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                        typeColors.bg,
                        typeColors.text
                      )}
                    >
                      {seed.type}
                    </span>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium",
                        statusConfig.bg,
                        statusConfig.color
                      )}
                    >
                      <StatusIcon className="w-3 h-3" />
                      {statusConfig.label}
                    </span>
                  </div>
                  <h2
                    id="modal-title"
                    className="text-2xl font-bold text-gray-900 dark:text-gray-100"
                  >
                    {seed.name}
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {seed.why_matters && (
                  <section>
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                      <span className="w-1 h-4 bg-blue-500 rounded-full" />
                      Why it matters
                    </h3>
                    <p className="text-gray-800 dark:text-gray-200 leading-relaxed pl-3">
                      {seed.why_matters}
                    </p>
                  </section>
                )}

                {seed.revisit_when && (
                  <section>
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-500" />
                      Revisit when
                    </h3>
                    <p className="text-gray-800 dark:text-gray-200 leading-relaxed pl-3">
                      {seed.revisit_when}
                    </p>
                  </section>
                )}

                <section>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                    <span className="w-1 h-4 bg-green-500 rounded-full" />
                    Content
                  </h3>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-sm text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap font-mono border border-gray-200 dark:border-gray-700">
                    {seed.content}
                  </div>
                </section>

                <section className="pt-4 border-t border-gray-200 dark:border-gray-800">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400 block mb-1">
                        Created
                      </span>
                      <span className="text-gray-800 dark:text-gray-200 font-medium">
                        {new Date(seed.created_at).toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400 block mb-1">
                        Last Updated
                      </span>
                      <span className="text-gray-800 dark:text-gray-200 font-medium">
                        {new Date(seed.updated_at).toLocaleString()}
                      </span>
                    </div>
                    {seed.replanted && (
                      <>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400 block mb-1">
                            Replanted
                          </span>
                          <span className="text-green-600 dark:text-green-400 font-medium">
                            Yes
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400 block mb-1">
                            Replant Count
                          </span>
                          <span className="text-gray-800 dark:text-gray-200 font-medium">
                            {seed.replant_count}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </section>
              </div>

              <div className="sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 p-6 flex justify-end gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-all duration-100 active:scale-95"
                >
                  Close
                </button>
                <button
                  onClick={handleExportMemoryPatch}
                  disabled={isCopied}
                  className={cn(
                    "px-4 py-2 text-sm font-medium rounded-lg transition-all duration-100 active:scale-95 flex items-center gap-2",
                    isCopied
                      ? "bg-green-600 dark:bg-green-700 text-white cursor-default"
                      : "bg-blue-600 dark:bg-blue-700 text-white hover:bg-blue-700 dark:hover:bg-blue-600"
                  )}
                  aria-label={
                    isCopied
                      ? "Memory Patch copied to clipboard"
                      : "Export Memory Patch to clipboard"
                  }
                >
                  {isCopied ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Export Memory Patch
                    </>
                  )}
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
