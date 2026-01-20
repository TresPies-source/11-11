"use client";

import { motion } from "framer-motion";
import type { ProviderStats } from "@/lib/pglite/ai-gateway-logs";
import { cn } from "@/lib/utils";

interface MetricsChartsProps {
  stats: ProviderStats[];
  className?: string;
}

export function MetricsCharts({ stats, className }: MetricsChartsProps) {
  if (stats.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <p>No metrics data available yet. Start using the AI Gateway to see charts.</p>
      </div>
    );
  }

  const maxRequests = Math.max(...stats.map((s) => s.request_count), 1);
  const maxLatency = Math.max(...stats.map((s) => s.avg_latency), 1);
  const maxCost = Math.max(...stats.map((s) => s.total_cost), 0.01);

  const getProviderColor = (providerId: string) => {
    const colors: Record<string, { bar: string; text: string }> = {
      deepseek: {
        bar: "bg-blue-600 dark:bg-blue-500",
        text: "text-blue-600 dark:text-blue-400",
      },
      openai: {
        bar: "bg-green-600 dark:bg-green-500",
        text: "text-green-600 dark:text-green-400",
      },
      anthropic: {
        bar: "bg-purple-600 dark:bg-purple-500",
        text: "text-purple-600 dark:text-purple-400",
      },
      google: {
        bar: "bg-yellow-600 dark:bg-yellow-500",
        text: "text-yellow-600 dark:text-yellow-400",
      },
    };
    return (
      colors[providerId] || {
        bar: "bg-gray-600 dark:bg-gray-500",
        text: "text-gray-600 dark:text-gray-400",
      }
    );
  };

  return (
    <div className={cn("space-y-8", className)}>
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Requests by Provider
        </h3>
        <div className="space-y-3">
          {stats.map((stat, index) => {
            const percentage = (stat.request_count / maxRequests) * 100;
            const colors = getProviderColor(stat.provider_id);

            return (
              <div key={stat.provider_id}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                    {stat.provider_name}
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {stat.request_count.toLocaleString()} requests
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                  <motion.div
                    className={cn("h-full rounded-full", colors.bar)}
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Average Latency by Provider
        </h3>
        <div className="space-y-3">
          {stats.map((stat, index) => {
            const percentage = (stat.avg_latency / maxLatency) * 100;
            const colors = getProviderColor(stat.provider_id);
            const latencyMs = stat.avg_latency;
            const latencyDisplay =
              latencyMs < 1000
                ? `${latencyMs.toFixed(0)}ms`
                : `${(latencyMs / 1000).toFixed(2)}s`;

            return (
              <div key={stat.provider_id}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                    {stat.provider_name}
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {latencyDisplay}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                  <motion.div
                    className={cn("h-full rounded-full", colors.bar)}
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Total Cost by Provider
        </h3>
        <div className="space-y-3">
          {stats.map((stat, index) => {
            const percentage = (stat.total_cost / maxCost) * 100;
            const colors = getProviderColor(stat.provider_id);
            const costDisplay =
              stat.total_cost < 0.01
                ? `$${stat.total_cost.toFixed(4)}`
                : `$${stat.total_cost.toFixed(2)}`;

            return (
              <div key={stat.provider_id}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                    {stat.provider_name}
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {costDisplay}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                  <motion.div
                    className={cn("h-full rounded-full", colors.bar)}
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        {stats.map((stat) => {
          const colors = getProviderColor(stat.provider_id);
          return (
            <motion.div
              key={stat.provider_id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 capitalize">
                  {stat.provider_name}
                </h4>
                <div
                  className={cn(
                    "w-2 h-2 rounded-full",
                    stat.is_healthy
                      ? "bg-green-500"
                      : "bg-red-500"
                  )}
                  title={stat.is_healthy ? "Healthy" : "Degraded"}
                />
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Success Rate:</span>
                  <span className={cn("font-medium", colors.text)}>
                    {stat.success_rate.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Errors:</span>
                  <span className="font-medium text-red-600 dark:text-red-400">
                    {stat.error_count}
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
