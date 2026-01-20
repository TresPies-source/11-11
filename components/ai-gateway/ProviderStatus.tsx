"use client";

import { motion } from "framer-motion";
import { CheckCircle2, AlertCircle, XCircle, Activity, Clock, DollarSign } from "lucide-react";
import type { ProviderStats } from "@/lib/pglite/ai-gateway-logs";
import { aiGatewayConfig } from "@/config/ai-gateway.config";
import { cn } from "@/lib/utils";

interface ProviderStatusProps {
  stats: ProviderStats[];
  className?: string;
}

export function ProviderStatus({ stats, className }: ProviderStatusProps) {
  if (stats.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <p>No provider data available. Waiting for gateway requests...</p>
      </div>
    );
  }

  const getHealthIcon = (stat: ProviderStats) => {
    if (stat.success_rate >= aiGatewayConfig.monitoring.healthyThreshold) {
      return <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />;
    }
    if (stat.success_rate >= aiGatewayConfig.monitoring.degradedThreshold) {
      return <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />;
    }
    return <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />;
  };

  const getHealthStatus = (stat: ProviderStats) => {
    if (stat.success_rate >= aiGatewayConfig.monitoring.healthyThreshold) return { text: "Healthy", color: "text-green-600 dark:text-green-400" };
    if (stat.success_rate >= aiGatewayConfig.monitoring.degradedThreshold) return { text: "Degraded", color: "text-yellow-600 dark:text-yellow-400" };
    return { text: "Down", color: "text-red-600 dark:text-red-400" };
  };

  const getHealthBadgeColor = (stat: ProviderStats) => {
    if (stat.success_rate >= aiGatewayConfig.monitoring.healthyThreshold) {
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
    }
    if (stat.success_rate >= aiGatewayConfig.monitoring.degradedThreshold) {
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
    }
    return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
  };

  const formatLatency = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatCost = (cost: number) => {
    if (cost === 0) return "$0.00";
    if (cost < 0.01) return `$${cost.toFixed(4)}`;
    return `$${cost.toFixed(2)}`;
  };

  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4", className)}>
      {stats.map((stat, index) => {
        const healthStatus = getHealthStatus(stat);

        return (
          <motion.div
            key={stat.provider_id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.3 }}
            className={cn(
              "bg-white dark:bg-gray-900 rounded-lg border p-4 shadow-sm",
              stat.success_rate >= aiGatewayConfig.monitoring.healthyThreshold
                ? "border-green-200 dark:border-green-800"
                : stat.success_rate >= aiGatewayConfig.monitoring.degradedThreshold
                ? "border-yellow-200 dark:border-yellow-800"
                : "border-red-200 dark:border-red-800"
            )}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                {getHealthIcon(stat)}
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 capitalize">
                  {stat.provider_name}
                </h3>
              </div>
              <span
                className={cn(
                  "px-2 py-0.5 rounded-full text-xs font-medium",
                  getHealthBadgeColor(stat)
                )}
              >
                {healthStatus.text}
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                  <Activity className="h-3.5 w-3.5" />
                  <span>Requests</span>
                </div>
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {stat.request_count.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Success Rate</span>
                </div>
                <span className={cn("font-semibold", healthStatus.color)}>
                  {stat.success_rate.toFixed(1)}%
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Avg Latency</span>
                </div>
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {formatLatency(stat.avg_latency)}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                  <DollarSign className="h-3.5 w-3.5" />
                  <span>Total Cost</span>
                </div>
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {formatCost(stat.total_cost)}
                </span>
              </div>

              {stat.error_count > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600 dark:text-gray-400">Errors</span>
                    <span className="font-semibold text-red-600 dark:text-red-400">
                      {stat.error_count}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
