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
    color: "text-gray-400 dark:text-gray-500",
  },
  growing: {
    Icon: TrendingUp,
    color: "text-green-500 dark:text-green-400",
  },
  mature: {
    Icon: CheckCircle,
    color: "text-blue-500 dark:text-blue-400",
  },
  compost: {
    Icon: X,
    color: "text-red-400 dark:text-red-500",
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
        "group bg-white dark:bg-gray-900 rounded-lg border p-4 transition-all duration-200 flex flex-col h-full",
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
            className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors active:scale-95"
            aria-label={`View details of ${seed.name}`}
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>

        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 line-clamp-2">
          {seed.name}
        </h3>

        {seed.why_matters && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
            {seed.why_matters}
          </p>
        )}

        {seed.revisit_when && (
          <p className="text-xs text-gray-500 dark:text-gray-500 mb-3">
            <strong>Revisit when:</strong> {seed.revisit_when}
          </p>
        )}
      </div>

      <div className="mt-auto pt-3 border-t border-gray-100 dark:border-gray-800 space-y-2">
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => handleStatusClick(e, "new")}
            disabled={seed.status === "new"}
            className={cn(
              "flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all duration-100 active:scale-95",
              seed.status === "new"
                ? "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed"
                : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
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
                ? "bg-green-100 dark:bg-green-900/30 text-green-400 dark:text-green-600 cursor-not-allowed"
                : "bg-green-200 dark:bg-green-700 text-green-700 dark:text-green-300 hover:bg-green-300 dark:hover:bg-green-600"
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
                ? "bg-amber-100 dark:bg-amber-900/30 text-amber-400 dark:text-amber-600 cursor-not-allowed"
                : "bg-amber-200 dark:bg-amber-700 text-amber-700 dark:text-amber-300 hover:bg-amber-300 dark:hover:bg-amber-600"
            )}
            aria-label={`Mark ${seed.name} as Compost`}
          >
            Compost
          </button>
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={handleDeleteClick}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-all duration-100 active:scale-95"
            aria-label={`Delete ${seed.name}`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </button>

          <div className="text-xs text-gray-400 dark:text-gray-600">
            {new Date(seed.updated_at).toLocaleDateString()}
          </div>
        </div>
      </div>
    </motion.div>
  );
});
