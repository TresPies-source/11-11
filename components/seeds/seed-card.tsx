"use client";

import { useState, memo, useCallback } from "react";
import { motion } from "framer-motion";
import { Eye, Trash2, Leaf, TrendingUp, CheckCircle, X } from "lucide-react";
import type { SeedRow, SeedStatus } from "@/lib/seeds/types";
import { cn } from "@/lib/utils";

interface SeedCardProps {
  seed: SeedRow;
  onView: (seed: SeedRow) => void;
  onUpdateStatus: (seed: SeedRow, status: SeedStatus) => void;
  onDelete: (seed: SeedRow) => void;
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
    color: "text-text-muted",
  },
  growing: {
    Icon: TrendingUp,
    color: "text-success",
  },
  mature: {
    Icon: CheckCircle,
    color: "text-info",
  },
  compost: {
    Icon: X,
    color: "text-error",
  },
};

export const SeedCard = memo(function SeedCard({
  seed,
  onView,
  onUpdateStatus,
  onDelete,
}: SeedCardProps) {
  const [isHovering, setIsHovering] = useState(false);

  const typeColors = TYPE_COLORS[seed.type];
  const statusConfig = STATUS_CONFIG[seed.status];
  const StatusIcon = statusConfig.Icon;

  const handleViewClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onView(seed);
    },
    [onView, seed]
  );

  const handleStatusClick = useCallback(
    (e: React.MouseEvent, status: SeedStatus) => {
      e.stopPropagation();
      onUpdateStatus(seed, status);
    },
    [onUpdateStatus, seed]
  );

  const handleDeleteClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onDelete(seed);
    },
    [onDelete, seed]
  );

  return (
    <motion.div
      layoutId={`seed-card-${seed.id}`}
      layout
      role="article"
      aria-label={`Seed: ${seed.name}. Type: ${seed.type}. Status: ${seed.status}`}
      className={cn(
        "bg-bg-secondary border rounded-xl p-5 transition-all duration-200 flex flex-col h-full",
        typeColors.border,
        "hover:border-opacity-60"
      )}
      whileHover={{
        y: -2,
        boxShadow: "0 8px 24px -8px rgba(0, 0, 0, 0.15)",
      }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      onHoverStart={() => setIsHovering(true)}
      onHoverEnd={() => setIsHovering(false)}
    >
      <div className="flex-1 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <span
              className={cn(
                "inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase",
                typeColors.bg,
                typeColors.text
              )}
            >
              {seed.type}
            </span>
            <motion.div
              animate={{
                scale: isHovering ? 1.15 : 1,
                rotate: isHovering && seed.status === "growing" ? 180 : 0,
              }}
              transition={{ duration: 0.25 }}
              aria-hidden="true"
            >
              <StatusIcon className={cn("w-4 h-4", statusConfig.color)} />
            </motion.div>
          </div>
          <button
            onClick={handleViewClick}
            className="p-2 rounded-lg hover:bg-bg-tertiary/50 text-text-tertiary hover:text-text-primary transition-all active:scale-95"
            aria-label={`View details of ${seed.name}`}
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>

        <div>
          <h3 className="font-semibold text-text-primary text-lg mb-1.5 line-clamp-2 leading-tight">
            {seed.name}
          </h3>

          {seed.why_matters && (
            <p className="text-sm text-text-secondary leading-relaxed line-clamp-2">
              {seed.why_matters}
            </p>
          )}
        </div>

        {seed.revisit_when && (
          <div className="pt-2 border-t border-bg-tertiary">
            <p className="text-xs text-text-tertiary">
              <span className="font-medium">Revisit:</span> {seed.revisit_when}
            </p>
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-bg-tertiary space-y-3">
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={(e) => handleStatusClick(e, "new")}
            disabled={seed.status === "new"}
            className={cn(
              "px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-150 active:scale-95",
              seed.status === "new"
                ? "bg-bg-tertiary/30 text-text-muted cursor-not-allowed opacity-60"
                : "bg-bg-tertiary/50 text-text-secondary hover:bg-bg-tertiary"
            )}
            aria-label={`Mark ${seed.name} as Keep`}
          >
            Keep
          </button>
          <button
            onClick={(e) => handleStatusClick(e, "growing")}
            disabled={seed.status === "growing"}
            className={cn(
              "px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-150 active:scale-95",
              seed.status === "growing"
                ? "bg-success/20 text-success/60 cursor-not-allowed opacity-60"
                : "bg-success/20 text-success hover:bg-success/30"
            )}
            aria-label={`Mark ${seed.name} as Grow`}
          >
            Grow
          </button>
          <button
            onClick={(e) => handleStatusClick(e, "compost")}
            disabled={seed.status === "compost"}
            className={cn(
              "px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-150 active:scale-95",
              seed.status === "compost"
                ? "bg-supervisor/20 text-supervisor/60 cursor-not-allowed opacity-60"
                : "bg-supervisor/20 text-supervisor hover:bg-supervisor/30"
            )}
            aria-label={`Mark ${seed.name} as Compost`}
          >
            Compost
          </button>
        </div>

        <div className="flex items-center justify-between text-xs">
          <button
            onClick={handleDeleteClick}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium text-error hover:bg-error/10 transition-all duration-150 active:scale-95"
            aria-label={`Delete ${seed.name}`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </button>

          <span className="text-text-muted">
            {new Date(seed.updated_at).toLocaleDateString()}
          </span>
        </div>
      </div>
    </motion.div>
  );
});
