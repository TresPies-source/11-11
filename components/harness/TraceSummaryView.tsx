"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Activity,
  Clock,
  DollarSign,
  Hash,
  Users,
  Layers,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { HarnessTrace } from "@/lib/harness/types";

interface TraceSummaryViewProps {
  trace: HarnessTrace;
  className?: string;
}

export function TraceSummaryView({ trace, className }: TraceSummaryViewProps) {
  const { summary } = trace;

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
    return `${(ms / 60000).toFixed(2)}m`;
  };

  const stats = [
    {
      label: "Total Events",
      value: summary.total_events,
      icon: Activity,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-100 dark:bg-blue-900/30",
    },
    {
      label: "Total Duration",
      value: formatDuration(summary.total_duration_ms),
      icon: Clock,
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-100 dark:bg-purple-900/30",
    },
    {
      label: "Total Tokens",
      value: summary.total_tokens.toLocaleString(),
      icon: Hash,
      color: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-100 dark:bg-amber-900/30",
    },
    {
      label: "Total Cost",
      value: `$${summary.total_cost_usd.toFixed(4)}`,
      icon: DollarSign,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-100 dark:bg-green-900/30",
    },
    {
      label: "Agents Used",
      value: summary.agents_used.length,
      icon: Users,
      color: "text-indigo-600 dark:text-indigo-400",
      bgColor: "bg-indigo-100 dark:bg-indigo-900/30",
    },
    {
      label: "Modes Used",
      value: summary.modes_used.length,
      icon: Layers,
      color: "text-pink-600 dark:text-pink-400",
      bgColor: "bg-pink-100 dark:bg-pink-900/30",
    },
    {
      label: "Errors",
      value: summary.errors,
      icon: AlertCircle,
      color: summary.errors > 0 ? "text-red-600 dark:text-red-400" : "text-gray-600 dark:text-gray-400",
      bgColor: summary.errors > 0 ? "bg-red-100 dark:bg-red-900/30" : "bg-gray-100 dark:bg-gray-900/30",
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3, ease: "easeOut" },
    },
  };

  return (
    <div className={cn("space-y-6", className)}>
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4"
              variants={itemVariants}
            >
              <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-lg", stat.bgColor)}>
                  <Icon className={cn("w-5 h-5", stat.color)} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    {stat.value}
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div
          className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Agents Used
            </h3>
          </div>
          <div className="space-y-2">
            {summary.agents_used.length > 0 ? (
              summary.agents_used.map((agent) => (
                <div
                  key={agent}
                  className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-md"
                >
                  <div className="w-2 h-2 bg-indigo-500 dark:bg-indigo-600 rounded-full" />
                  <span className="text-sm text-gray-900 dark:text-gray-100">{agent}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">No agents used</p>
            )}
          </div>
        </motion.div>

        <motion.div
          className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.25 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Layers className="w-5 h-5 text-pink-600 dark:text-pink-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Modes Used
            </h3>
          </div>
          <div className="space-y-2">
            {summary.modes_used.length > 0 ? (
              summary.modes_used.map((mode) => (
                <div
                  key={mode}
                  className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-md"
                >
                  <div className="w-2 h-2 bg-pink-500 dark:bg-pink-600 rounded-full" />
                  <span className="text-sm text-gray-900 dark:text-gray-100">{mode}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">No modes used</p>
            )}
          </div>
        </motion.div>
      </div>

      <motion.div
        className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Trace Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Trace ID</p>
            <p className="text-sm font-mono text-gray-900 dark:text-gray-100">{trace.trace_id}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Session ID</p>
            <p className="text-sm font-mono text-gray-900 dark:text-gray-100">{trace.session_id}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Started At</p>
            <p className="text-sm text-gray-900 dark:text-gray-100">
              {new Date(trace.started_at).toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Ended At</p>
            <p className="text-sm text-gray-900 dark:text-gray-100">
              {trace.ended_at ? new Date(trace.ended_at).toLocaleString() : "Ongoing"}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
