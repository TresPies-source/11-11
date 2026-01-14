"use client";

import { memo, useCallback } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type AgentStatus = "online" | "offline" | "deprecated";

/**
 * Props for the AgentCard component
 */
interface AgentCardProps {
  /** Unique agent identifier */
  id: string;
  /** Display name of the agent */
  name: string;
  /** Emoji icon representing the agent */
  icon: string;
  /** One-sentence description of the agent */
  tagline: string;
  /** Current operational status */
  status: AgentStatus;
  /** Callback when card is clicked */
  onClick: () => void;
}

const STATUS_CONFIG = {
  online: {
    color: "bg-green-500 dark:bg-green-400",
    label: "Online",
  },
  offline: {
    color: "bg-gray-400 dark:bg-gray-500",
    label: "Offline",
  },
  deprecated: {
    color: "bg-red-400 dark:bg-red-500",
    label: "Deprecated",
  },
};

/**
 * AgentCard - Interactive card component displaying agent metadata
 * 
 * Features:
 * - Responsive design with hover animations
 * - Accessibility support (keyboard navigation, ARIA labels)
 * - Status indicator (online/offline/deprecated)
 * - Framer Motion animations for smooth interactions
 * 
 * @example
 * ```tsx
 * <AgentCard
 *   id="supervisor"
 *   name="Supervisor"
 *   icon="🎯"
 *   tagline="Routes queries to the right agent"
 *   status="online"
 *   onClick={() => openAgentModal('supervisor')}
 * />
 * ```
 */
export const AgentCard = memo(function AgentCard({
  id,
  name,
  icon,
  tagline,
  status,
  onClick,
}: AgentCardProps) {
  const handleCardClick = useCallback(() => {
    onClick();
  }, [onClick]);

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onClick();
      }
    },
    [onClick]
  );

  const statusConfig = STATUS_CONFIG[status];

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3, ease: "easeOut" },
    },
    hover: {
      scale: 1.02,
      boxShadow: "0 20px 40px -12px rgba(0, 0, 0, 0.25)",
      transition: { duration: 0.2, ease: "easeOut" },
    },
  };

  return (
    <motion.div
      layoutId={`agent-card-${id}`}
      layout
      role="article"
      tabIndex={0}
      aria-label={`Agent: ${name}. ${tagline}. Status: ${statusConfig.label}`}
      className={cn(
        "group bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6 transition-all duration-200 flex flex-col h-full cursor-pointer",
        "hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-700",
        "focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-background"
      )}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      onClick={handleCardClick}
      onKeyDown={handleKeyPress}
      transition={{
        layout: { duration: 0.3, ease: "easeInOut" },
      }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="text-4xl" aria-hidden="true">
          {icon}
        </div>
        <div
          className={cn(
            "w-2.5 h-2.5 rounded-full",
            statusConfig.color
          )}
          aria-label={`Status: ${statusConfig.label}`}
        />
      </div>

      <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
        {name}
      </h3>

      <p className="text-sm text-gray-600 dark:text-gray-400 flex-1">
        {tagline}
      </p>

      {status === "offline" && (
        <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
            Coming Soon
          </span>
        </div>
      )}

      {status === "deprecated" && (
        <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
            Deprecated
          </span>
        </div>
      )}
    </motion.div>
  );
});
