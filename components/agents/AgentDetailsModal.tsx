"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import type { Agent } from "@/lib/agents/types";

type AgentStatus = "online" | "offline" | "deprecated";

/**
 * Usage statistics for an agent
 */
interface UsageStats {
  /** Total number of queries routed to this agent */
  query_count: number;
  /** Total cost in USD for all queries */
  total_cost_usd: number;
  /** Average response time in milliseconds */
  avg_response_time_ms: number;
  /** ISO timestamp of last usage, or null if never used */
  last_used_at: string | null;
}

/**
 * Agent data with computed status and usage statistics
 */
interface AgentWithStats extends Agent {
  /** Current operational status */
  status: AgentStatus;
  /** Usage statistics, if available */
  usage_stats?: UsageStats;
}

/**
 * Props for the AgentDetailsModal component
 */
interface AgentDetailsModalProps {
  /** Agent to display, or null if modal is closed */
  agent: AgentWithStats | null;
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback to close the modal */
  onClose: () => void;
  /** Callback to open test interface for the agent */
  onTestAgent: (agentId: string, agentName: string) => void;
}

const STATUS_CONFIG = {
  online: {
    color: "bg-green-500 dark:bg-green-400",
    label: "Online",
    textColor: "text-green-700 dark:text-green-300",
    bgColor: "bg-green-100 dark:bg-green-900/30",
  },
  offline: {
    color: "bg-gray-400 dark:bg-gray-500",
    label: "Offline",
    textColor: "text-gray-700 dark:text-gray-300",
    bgColor: "bg-gray-100 dark:bg-gray-800",
  },
  deprecated: {
    color: "bg-red-400 dark:bg-red-500",
    label: "Deprecated",
    textColor: "text-red-700 dark:text-red-300",
    bgColor: "bg-red-100 dark:bg-red-900/30",
  },
};

/**
 * AgentDetailsModal - Full-screen modal displaying comprehensive agent information
 * 
 * Features:
 * - Portal-based rendering for z-index control
 * - ESC key and click-outside to close
 * - Focus management (focus trap)
 * - Animated entrance/exit with Framer Motion
 * - Sections: Purpose, When to Use, What It Doesn't Do, Usage Stats
 * - Test Agent button to open routing test interface
 * 
 * Accessibility:
 * - role="dialog" and aria-modal="true"
 * - Keyboard navigation support
 * - ARIA labels for all interactive elements
 * 
 * @example
 * ```tsx
 * <AgentDetailsModal
 *   agent={selectedAgent}
 *   isOpen={isModalOpen}
 *   onClose={() => setIsModalOpen(false)}
 *   onTestAgent={(id, name) => openTestInterface(id, name)}
 * />
 * ```
 */
export function AgentDetailsModal({
  agent,
  isOpen,
  onClose,
  onTestAgent,
}: AgentDetailsModalProps) {
  const [mounted, setMounted] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen || !agent) return;

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
  }, [isOpen, agent, onClose]);

  if (!mounted || !agent) return null;

  const statusConfig = STATUS_CONFIG[agent.status];

  const formatCost = (cost: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 4,
      maximumFractionDigits: 4,
    }).format(cost);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
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
  };

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
              aria-labelledby="agent-modal-title"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="text-4xl" aria-hidden="true">
                    {agent.icon}
                  </div>
                  <div>
                    <h2
                      id="agent-modal-title"
                      className="text-xl font-bold text-gray-900 dark:text-gray-100"
                    >
                      {agent.name}
                    </h2>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 mt-1 px-2 py-0.5 rounded-full text-xs font-medium",
                        statusConfig.bgColor,
                        statusConfig.textColor
                      )}
                    >
                      <div
                        className={cn("w-1.5 h-1.5 rounded-full", statusConfig.color)}
                      />
                      {statusConfig.label}
                    </span>
                  </div>
                </div>
                <button
                  ref={closeButtonRef}
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                  aria-label="Close dialog"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="overflow-y-auto flex-1 p-6 space-y-6">
                <section>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-2">
                    Purpose
                  </h3>
                  <p className="text-gray-900 dark:text-gray-100 leading-relaxed">
                    {agent.description}
                  </p>
                </section>

                <section>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-2">
                    When to Use
                  </h3>
                  <ul className="space-y-2">
                    {agent.when_to_use.map((item, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-2 text-gray-900 dark:text-gray-100"
                      >
                        <span className="text-green-500 dark:text-green-400 mt-1">
                          ✓
                        </span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </section>

                <section>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-2">
                    What It Doesn&apos;t Do
                  </h3>
                  <ul className="space-y-2">
                    {agent.when_not_to_use.map((item, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-2 text-gray-900 dark:text-gray-100"
                      >
                        <span className="text-red-500 dark:text-red-400 mt-1">
                          ✗
                        </span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </section>

                {agent.usage_stats && (
                  <section className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-3">
                      Usage Stats
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                          Total Queries
                        </p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          {agent.usage_stats.query_count.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                          Total Cost
                        </p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          {formatCost(agent.usage_stats.total_cost_usd)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                          Avg Response Time
                        </p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          {agent.usage_stats.avg_response_time_ms}ms
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                          Last Used
                        </p>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {formatDate(agent.usage_stats.last_used_at)}
                        </p>
                      </div>
                    </div>
                  </section>
                )}

                {!agent.usage_stats && (
                  <section className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      No usage data available yet
                    </p>
                  </section>
                )}
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
                  onClick={() => onTestAgent(agent.id, agent.name)}
                  disabled={agent.status !== "online"}
                  className={cn(
                    "px-4 py-2 text-sm font-medium rounded-lg transition-colors",
                    "text-white bg-blue-600 border border-blue-600",
                    "hover:bg-blue-700",
                    "focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400",
                    "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600"
                  )}
                >
                  Test Agent
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(modal, document.body);
}
