"use client";

import { useState, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Copy,
  CheckCircle,
  Leaf,
  TrendingUp,
  Clock,
  X,
  Trash2,
} from "lucide-react";
import type { SeedRow, SeedStatus } from "@/lib/seeds/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

interface SeedDetailViewProps {
  seed: SeedRow;
  onBack: () => void;
  onUpdate: (status: SeedStatus) => Promise<void>;
  onDelete: () => Promise<void>;
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

export const SeedDetailView = memo(function SeedDetailView({
  seed,
  onBack,
  onUpdate,
  onDelete,
}: SeedDetailViewProps) {
  const [isCopied, setIsCopied] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const typeColors = TYPE_COLORS[seed.type];
  const statusConfig = STATUS_CONFIG[seed.status];
  const StatusIcon = statusConfig.Icon;

  const handleStatusUpdate = async (status: SeedStatus) => {
    if (seed.status === status) return;

    setIsUpdating(true);
    setErrorMessage(null);

    try {
      await onUpdate(status);
    } catch (err) {
      console.error("[SEED_DETAIL_VIEW] Error updating status:", err);
      setErrorMessage("Failed to update seed status. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${seed.name}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    setIsUpdating(true);
    setErrorMessage(null);

    try {
      await onDelete();
    } catch (err) {
      console.error("[SEED_DETAIL_VIEW] Error deleting seed:", err);
      setErrorMessage("Failed to delete seed. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleExportMemoryPatch = async () => {
    const memoryPatch = generateMemoryPatch(seed);

    try {
      await navigator.clipboard.writeText(memoryPatch);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error("[EXPORT_MEMORY_PATCH]", error);
      setErrorMessage("Failed to copy to clipboard.");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="p-12 flex flex-col min-h-screen"
    >
      <div className="mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors duration-100 active:scale-95"
          aria-label="Back to seeds list"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Back to Seeds</span>
        </button>
      </div>

      <AnimatePresence>
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6 bg-error/10 border border-error/30 rounded-lg p-4"
          >
            <div className="flex items-start gap-3">
              <X className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-text-secondary">{errorMessage}</p>
              </div>
              <button
                onClick={() => setErrorMessage(null)}
                className="text-error hover:text-error/80"
              >
                Dismiss
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-bg-secondary border border-bg-tertiary rounded-lg overflow-hidden flex-1 flex flex-col">
        <div className="bg-bg-secondary border-b border-bg-tertiary p-6">
          <div className="flex items-center gap-2 mb-3">
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
          <h1 className="text-3xl font-bold text-text-primary">{seed.name}</h1>
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
            <div className="bg-bg-tertiary rounded-lg p-4 text-sm text-text-primary leading-relaxed whitespace-pre-wrap font-mono border border-bg-tertiary">
              {seed.content}
            </div>
          </section>

          <section className="pt-4 border-t border-bg-tertiary">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-text-tertiary block mb-1">Created</span>
                <span className="text-text-primary font-medium">
                  {new Date(seed.created_at).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-text-tertiary block mb-1">Last Updated</span>
                <span className="text-text-primary font-medium">
                  {new Date(seed.updated_at).toLocaleString()}
                </span>
              </div>
              {seed.replanted && (
                <>
                  <div>
                    <span className="text-text-tertiary block mb-1">Replanted</span>
                    <span className="text-success font-medium">Yes</span>
                  </div>
                  <div>
                    <span className="text-text-tertiary block mb-1">
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

        <div className="sticky bottom-0 bg-bg-secondary border-t border-bg-tertiary p-6">
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-semibold text-text-secondary mb-3">
                Lifecycle Actions
              </h4>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleStatusUpdate("new")}
                  disabled={seed.status === "new" || isUpdating}
                  className={cn(
                    "flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-100 active:scale-95",
                    seed.status === "new"
                      ? "bg-bg-tertiary/30 text-text-muted cursor-not-allowed"
                      : "bg-bg-tertiary/50 text-text-secondary hover:bg-bg-tertiary"
                  )}
                >
                  Keep
                </button>
                <button
                  onClick={() => handleStatusUpdate("growing")}
                  disabled={seed.status === "growing" || isUpdating}
                  className={cn(
                    "flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-100 active:scale-95",
                    seed.status === "growing"
                      ? "bg-success/20 text-success/50 cursor-not-allowed"
                      : "bg-success/30 text-success hover:bg-success/40"
                  )}
                >
                  Grow
                </button>
                <button
                  onClick={() => handleStatusUpdate("compost")}
                  disabled={seed.status === "compost" || isUpdating}
                  className={cn(
                    "flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-100 active:scale-95",
                    seed.status === "compost"
                      ? "bg-supervisor/20 text-supervisor/50 cursor-not-allowed"
                      : "bg-supervisor/30 text-supervisor hover:bg-supervisor/40"
                  )}
                >
                  Compost
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4">
              <button
                onClick={handleDelete}
                disabled={isUpdating}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-error hover:bg-error/10 transition-all duration-100 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-4 h-4" />
                Delete Seed
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
          </div>
        </div>
      </div>
    </motion.div>
  );
});
