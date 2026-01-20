"use client";

import { motion } from "framer-motion";
import { CheckCircle2, XCircle, Clock, DollarSign } from "lucide-react";
import type { GatewayLogRow } from "@/lib/pglite/ai-gateway-logs";
import { cn } from "@/lib/utils";

interface LogsTableProps {
  logs: GatewayLogRow[];
  className?: string;
}

export function LogsTable({ logs, className }: LogsTableProps) {
  if (logs.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <p>No gateway logs available yet. Start using the AI Gateway to see requests.</p>
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const formatLatency = (ms: number | null) => {
    if (ms === null) return "N/A";
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatCost = (cost: string | null) => {
    if (cost === null) return "N/A";
    const costNum = parseFloat(cost);
    if (costNum === 0) return "$0.00";
    if (costNum < 0.01) return `$${costNum.toFixed(4)}`;
    return `$${costNum.toFixed(2)}`;
  };

  const getStatusIcon = (statusCode: number | null, errorMessage: string | null) => {
    if (errorMessage || (statusCode && statusCode >= 400)) {
      return <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />;
    }
    return <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />;
  };

  const getStatusText = (statusCode: number | null, errorMessage: string | null) => {
    if (errorMessage) return "Error";
    if (!statusCode) return "Unknown";
    if (statusCode >= 400) return `Error ${statusCode}`;
    return "Success";
  };

  const getProviderBadgeColor = (providerId: string) => {
    const colors: Record<string, string> = {
      deepseek: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
      openai: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
      anthropic: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
      google: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
    };
    return colors[providerId] || "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
  };

  const getTaskTypeBadgeColor = (taskType: string | null) => {
    if (!taskType) return "bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400";
    
    const colors: Record<string, string> = {
      code_generation: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
      architectural_design: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
      general_chat: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
      content_synthesis: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
      complex_reasoning: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
      default: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300",
    };
    return colors[taskType] || colors.default;
  };

  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
              Status
            </th>
            <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
              Time
            </th>
            <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
              Provider
            </th>
            <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
              Model
            </th>
            <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
              Task Type
            </th>
            <th className="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
              <div className="flex items-center justify-end gap-1">
                <Clock className="h-3.5 w-3.5" />
                Latency
              </div>
            </th>
            <th className="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
              <div className="flex items-center justify-end gap-1">
                <DollarSign className="h-3.5 w-3.5" />
                Cost
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log, index) => (
            <motion.tr
              key={log.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.02, duration: 0.2 }}
              className={cn(
                "border-b border-gray-100 dark:border-gray-800",
                "hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              )}
            >
              <td className="py-3 px-4">
                <div className="flex items-center gap-2">
                  {getStatusIcon(log.status_code, log.error_message)}
                  <span className="text-gray-700 dark:text-gray-300 text-xs">
                    {getStatusText(log.status_code, log.error_message)}
                  </span>
                </div>
              </td>
              <td className="py-3 px-4 text-gray-600 dark:text-gray-400 text-xs">
                {formatDate(log.created_at)}
              </td>
              <td className="py-3 px-4">
                <span
                  className={cn(
                    "px-2 py-1 rounded-full text-xs font-medium",
                    getProviderBadgeColor(log.provider_id)
                  )}
                >
                  {log.provider_id}
                </span>
              </td>
              <td className="py-3 px-4 text-gray-700 dark:text-gray-300 text-xs font-mono">
                {log.model_id}
              </td>
              <td className="py-3 px-4">
                <span
                  className={cn(
                    "px-2 py-1 rounded-full text-xs font-medium",
                    getTaskTypeBadgeColor(log.task_type)
                  )}
                >
                  {log.task_type || "default"}
                </span>
              </td>
              <td className="py-3 px-4 text-right text-gray-700 dark:text-gray-300 text-xs font-mono">
                {formatLatency(log.latency_ms)}
              </td>
              <td className="py-3 px-4 text-right text-gray-700 dark:text-gray-300 text-xs font-mono">
                {formatCost(log.cost_usd)}
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
      
      {logs.some((log) => log.error_message) && (
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
          <p className="text-sm font-semibold text-red-900 dark:text-red-100 mb-2">
            Recent Errors:
          </p>
          <div className="space-y-1">
            {logs
              .filter((log) => log.error_message)
              .slice(0, 3)
              .map((log) => (
                <div key={log.id} className="text-xs text-red-800 dark:text-red-200">
                  <span className="font-mono">{log.provider_id}</span>:{" "}
                  {log.error_message}
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
