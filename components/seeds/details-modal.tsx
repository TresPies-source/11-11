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
    bg: "bg-info/10",
    text: "text-info",
    border: "border-info/30",
  },
  pattern: {
    bg: "bg-success/10",
    text: "text-success",
    border: "border-success/30",
  },
  question: {
    bg: "bg-librarian/10",
    text: "text-librarian",
    border: "border-librarian/30",
  },
  route: {
    bg: "bg-dojo/10",
    text: "text-dojo",
    border: "border-dojo/30",
  },
  artifact: {
    bg: "bg-supervisor/10",
    text: "text-supervisor",
    border: "border-supervisor/30",
  },
  constraint: {
    bg: "bg-error/10",
    text: "text-error",
    border: "border-error/30",
  },
};

const STATUS_CONFIG = {
  new: {
    Icon: Leaf,
    label: "New",
    color: "text-muted",
    bg: "bg-muted/20",
  },
  growing: {
    Icon: TrendingUp,
    label: "Growing",
    color: "text-success",
    bg: "bg-success/20",
  },
  mature: {
    Icon: CheckCircle,
    label: "Mature",
    color: "text-info",
    bg: "bg-info/20",
  },
  compost: {
    Icon: X,
    label: "Composted",
    color: "text-error",
    bg: "bg-error/20",
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
              className="bg-bg-primary rounded-lg shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col"
              role="dialog"
              aria-modal="true"
              aria-labelledby="modal-title"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-bg-primary border-b border-border p-6 flex items-start justify-between z-10">
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
                    className="text-2xl font-bold text-text-primary"
                  >
                    {seed.name}
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-md text-text-muted hover:text-text-secondary hover:bg-muted/20 transition-colors"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {seed.why_matters && (
                  <section>
                    <h3 className="text-sm font-semibold text-text-secondary mb-2 flex items-center gap-2">
                      <span className="w-1 h-4 bg-accent rounded-full" />
                      Why it matters
                    </h3>
                    <p className="text-text-primary leading-relaxed pl-3">
                      {seed.why_matters}
                    </p>
                  </section>
                )}

                {seed.revisit_when && (
                  <section>
                    <h3 className="text-sm font-semibold text-text-secondary mb-2 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-warning" />
                      Revisit when
                    </h3>
                    <p className="text-text-primary leading-relaxed pl-3">
                      {seed.revisit_when}
                    </p>
                  </section>
                )}

                <section>
                  <h3 className="text-sm font-semibold text-text-secondary mb-2 flex items-center gap-2">
                    <span className="w-1 h-4 bg-success rounded-full" />
                    Content
                  </h3>
                  <div className="bg-bg-tertiary rounded-lg p-4 text-sm text-text-primary leading-relaxed whitespace-pre-wrap font-mono border border-border">
                    {seed.content}
                  </div>
                </section>

                <section className="pt-4 border-t border-border">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-text-muted block mb-1">
                        Created
                      </span>
                      <span className="text-text-primary font-medium">
                        {new Date(seed.created_at).toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-text-muted block mb-1">
                        Last Updated
                      </span>
                      <span className="text-text-primary font-medium">
                        {new Date(seed.updated_at).toLocaleString()}
                      </span>
                    </div>
                    {seed.replanted && (
                      <>
                        <div>
                          <span className="text-text-muted block mb-1">
                            Replanted
                          </span>
                          <span className="text-success font-medium">
                            Yes
                          </span>
                        </div>
                        <div>
                          <span className="text-text-muted block mb-1">
                            Replant Count
                          </span>
                          <span className="text-text-primary font-medium">
                            {seed.replant_count}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </section>
              </div>

              <div className="sticky bottom-0 bg-bg-primary border-t border-border p-6 flex justify-end gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-text-secondary bg-muted/20 hover:bg-muted/30 rounded-lg transition-all duration-100 active:scale-95"
                >
                  Close
                </button>
                <button
                  onClick={handleExportMemoryPatch}
                  disabled={isCopied}
                  className={cn(
                    "px-4 py-2 text-sm font-medium rounded-lg transition-all duration-100 active:scale-95 flex items-center gap-2",
                    isCopied
                      ? "bg-success text-white cursor-default"
                      : "bg-accent text-white hover:bg-accent/90"
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
