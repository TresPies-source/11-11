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
    color: "text-muted",
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

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3, ease: "easeOut" },
    },
    hover: {
      scale: 1.02,
      boxShadow: "0 10px 30px -10px rgba(0, 0, 0, 0.2)",
      transition: { duration: 0.2, ease: "easeOut" },
    },
  };

  return (
    <motion.div
      layoutId={`seed-card-${seed.id}`}
      layout
      role="article"
      aria-label={`Seed: ${seed.name}. Type: ${seed.type}. Status: ${seed.status}`}
      className={cn(
        "group bg-bg-secondary rounded-lg border p-4 transition-all duration-200 flex flex-col h-full",
        typeColors.border,
        "hover:shadow-lg"
      )}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      onHoverStart={() => setIsHovering(true)}
      onHoverEnd={() => setIsHovering(false)}
      transition={{
        layout: { duration: 0.3, ease: "easeInOut" },
      }}
    >
      <div className="flex-1">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                typeColors.bg,
                typeColors.text
              )}
            >
              {seed.type}
            </span>
            <motion.div
              animate={{
                scale: isHovering ? 1.1 : 1,
                rotate: isHovering ? seed.status === "growing" ? 180 : 0 : 0,
              }}
              transition={{ duration: 0.2 }}
              aria-hidden="true"
            >
              <StatusIcon className={cn("w-4 h-4", statusConfig.color)} />
            </motion.div>
          </div>
          <button
            onClick={handleViewClick}
            className="p-1.5 rounded-md hover:bg-bg-tertiary text-text-muted transition-colors active:scale-95"
            aria-label={`View details of ${seed.name}`}
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>

        <h3 className="font-semibold text-text-primary mb-2 line-clamp-2">
          {seed.name}
        </h3>

        {seed.why_matters && (
          <p className="text-sm text-text-secondary mb-2 line-clamp-2">
            {seed.why_matters}
          </p>
        )}

        {seed.revisit_when && (
          <p className="text-xs text-text-tertiary mb-3">
            <strong>Revisit when:</strong> {seed.revisit_when}
          </p>
        )}
      </div>

      <div className="mt-auto pt-3 border-t border-bg-tertiary space-y-2">
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => handleStatusClick(e, "new")}
            disabled={seed.status === "new"}
            className={cn(
              "flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all duration-100 active:scale-95",
              seed.status === "new"
                ? "bg-bg-tertiary/30 text-text-muted cursor-not-allowed"
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
              "flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all duration-100 active:scale-95",
              seed.status === "growing"
                ? "bg-success/20 text-success/50 cursor-not-allowed"
                : "bg-success/30 text-success hover:bg-success/40"
            )}
            aria-label={`Mark ${seed.name} as Grow`}
          >
            Grow
          </button>
          <button
            onClick={(e) => handleStatusClick(e, "compost")}
            disabled={seed.status === "compost"}
            className={cn(
              "flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all duration-100 active:scale-95",
              seed.status === "compost"
                ? "bg-supervisor/20 text-supervisor/50 cursor-not-allowed"
                : "bg-supervisor/30 text-supervisor hover:bg-supervisor/40"
            )}
            aria-label={`Mark ${seed.name} as Compost`}
          >
            Compost
          </button>
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={handleDeleteClick}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-error hover:bg-error/10 transition-all duration-100 active:scale-95"
            aria-label={`Delete ${seed.name}`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </button>

          <div className="text-xs text-text-muted">
            {new Date(seed.updated_at).toLocaleDateString()}
          </div>
        </div>
      </div>
    </motion.div>
  );
});
