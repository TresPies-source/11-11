"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Activity, TrendingUp, Clock, Settings2 } from "lucide-react";
import { useGatewayLogs } from "@/hooks/useGatewayLogs";
import { useGatewayMetrics } from "@/hooks/useGatewayMetrics";
import { useProviderStats } from "@/hooks/useProviderStats";
import { ProviderStatus } from "./ProviderStatus";
import { MetricsCharts } from "./MetricsCharts";
import { LogsTable } from "./LogsTable";
import { LoadingState } from "@/components/shared/LoadingState";
import { ErrorState } from "@/components/shared/ErrorState";
import { cn } from "@/lib/utils";
import "@/lib/pglite/test-data-generator";

interface GatewayDashboardProps {
  className?: string;
}

export function GatewayDashboard({ className }: GatewayDashboardProps) {
  const [timeRange, setTimeRange] = useState<"1h" | "24h" | "7d" | "30d">("24h");

  const {
    stats,
    loading: statsLoading,
    error: statsError,
    retry: retryStats,
  } = useProviderStats({ timeRange, refreshInterval: 5000 });

  const {
    metrics,
    loading: metricsLoading,
    error: metricsError,
    retry: retryMetrics,
  } = useGatewayMetrics({ timeRange, refreshInterval: 5000 });

  const {
    logs,
    loading: logsLoading,
    error: logsError,
    retry: retryLogs,
  } = useGatewayLogs({ limit: 20, refreshInterval: 5000 });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
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

  const timeRangeOptions = [
    { value: "1h" as const, label: "1 Hour" },
    { value: "24h" as const, label: "24 Hours" },
    { value: "7d" as const, label: "7 Days" },
    { value: "30d" as const, label: "30 Days" },
  ];

  if (statsLoading && stats.length === 0) {
    return (
      <div className={cn("max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8", className)}>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
            <Activity className="h-8 w-8 text-blue-600 dark:text-blue-500" />
            AI Gateway Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Monitor provider performance and request analytics
          </p>
        </div>
        <LoadingState count={3} />
      </div>
    );
  }

  return (
    <div className={cn("max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8", className)}>
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
              <Activity className="h-8 w-8 text-blue-600 dark:text-blue-500" />
              AI Gateway Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Real-time monitoring of AI provider routing and performance
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Settings2 className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              {timeRangeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setTimeRange(option.value)}
                  className={cn(
                    "px-3 py-1 text-sm font-medium rounded transition-colors",
                    timeRange === option.value
                      ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <motion.div
        className="space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants}>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-4">
            <Activity className="h-5 w-5 text-blue-600 dark:text-blue-500" />
            Provider Health Status
          </h2>
          {statsError ? (
            <ErrorState
              title="Unable to load provider stats"
              message={statsError}
              onRetry={retryStats}
              loading={statsLoading}
            />
          ) : (
            <ProviderStatus stats={stats} />
          )}
        </motion.div>

        {metrics && (
          <motion.div
            className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm"
            variants={itemVariants}
          >
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-6">
              <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-500" />
              Gateway Metrics
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Requests</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {metrics.totalRequests.toLocaleString()}
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Avg Latency</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {metrics.avgLatency < 1000
                    ? `${metrics.avgLatency.toFixed(0)}ms`
                    : `${(metrics.avgLatency / 1000).toFixed(2)}s`}
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Success Rate</div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-500">
                  {metrics.successRate.toFixed(1)}%
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Cost</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  ${metrics.totalCost.toFixed(4)}
                </div>
              </div>
            </div>

            {metricsError && (
              <ErrorState
                title="Unable to load metrics"
                message={metricsError}
                onRetry={retryMetrics}
                loading={metricsLoading}
              />
            )}
          </motion.div>
        )}

        <motion.div
          className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm"
          variants={itemVariants}
        >
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-6">
            <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-500" />
            Performance Charts
          </h2>

          {statsError ? (
            <ErrorState
              title="Unable to load charts"
              message={statsError}
              onRetry={retryStats}
              loading={statsLoading}
            />
          ) : (
            <MetricsCharts stats={stats} />
          )}
        </motion.div>

        <motion.div
          className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm"
          variants={itemVariants}
        >
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-6">
            <Clock className="h-5 w-5 text-orange-600 dark:text-orange-500" />
            Recent Requests
          </h2>

          {logsError ? (
            <ErrorState
              title="Unable to load logs"
              message={logsError}
              onRetry={retryLogs}
              loading={logsLoading}
            />
          ) : logsLoading && logs.length === 0 ? (
            <div className="py-8 text-center text-gray-500 dark:text-gray-400">
              Loading request logs...
            </div>
          ) : (
            <LogsTable logs={logs} />
          )}
        </motion.div>
      </motion.div>

      <div className="mt-6 text-xs text-gray-500 dark:text-gray-400 text-center">
        Dashboard auto-refreshes every 5 seconds • Showing data for the last {timeRange}
      </div>
    </div>
  );
}
