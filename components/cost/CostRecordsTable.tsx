"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowUpDown, Filter } from "lucide-react";
import type { CostRecord } from "@/lib/cost/types";
import { cn } from "@/lib/utils";

interface CostRecordsTableProps {
  records: CostRecord[];
  className?: string;
}

type SortField = "created_at" | "total_tokens" | "cost_usd";
type SortDirection = "asc" | "desc";

const OPERATION_TYPE_LABELS: Record<string, string> = {
  routing: "Routing",
  agent_execution: "Agent",
  search: "Search",
  critique: "Critique",
  other: "Other",
};

const OPERATION_TYPE_COLORS: Record<string, string> = {
  routing: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
  agent_execution: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300",
  search: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300",
  critique: "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300",
  other: "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300",
};

export function CostRecordsTable({ records, className }: CostRecordsTableProps) {
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [filterType, setFilterType] = useState<string | null>(null);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const sortedAndFilteredRecords = [...records]
    .filter((record) => !filterType || record.operation_type === filterType)
    .sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "created_at":
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case "total_tokens":
          comparison = a.total_tokens - b.total_tokens;
          break;
        case "cost_usd":
          comparison = a.cost_usd - b.cost_usd;
          break;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });

  const formatTimestamp = (timestamp: Date | string) => {
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  const uniqueOperationTypes = Array.from(
    new Set(records.map((r) => r.operation_type))
  );

  if (records.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <p>No cost records yet. Start making queries to see usage here.</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {uniqueOperationTypes.length > 1 && (
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="h-4 w-4 text-gray-500" aria-hidden="true" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Filter:
          </span>
          <button
            onClick={() => setFilterType(null)}
            className={cn(
              "px-3 py-1 rounded-md text-xs font-medium transition-all duration-200",
              filterType === null
                ? "bg-blue-600 text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
            )}
          >
            All
          </button>
          {uniqueOperationTypes.map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={cn(
                "px-3 py-1 rounded-md text-xs font-medium transition-all duration-200",
                filterType === type
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              )}
            >
              {OPERATION_TYPE_LABELS[type] || type}
            </button>
          ))}
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th
                className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                onClick={() => handleSort("created_at")}
              >
                <div className="flex items-center gap-1">
                  Timestamp
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">
                Operation
              </th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">
                Model
              </th>
              <th
                className="px-4 py-3 text-right font-semibold text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                onClick={() => handleSort("total_tokens")}
              >
                <div className="flex items-center justify-end gap-1">
                  Tokens
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th
                className="px-4 py-3 text-right font-semibold text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                onClick={() => handleSort("cost_usd")}
              >
                <div className="flex items-center justify-end gap-1">
                  Cost
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {sortedAndFilteredRecords.map((record, index) => (
              <motion.tr
                key={record.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02, duration: 0.2 }}
              >
                <td className="px-4 py-3 text-gray-900 dark:text-gray-100 whitespace-nowrap">
                  {formatTimestamp(record.created_at)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                      OPERATION_TYPE_COLORS[record.operation_type] ||
                        OPERATION_TYPE_COLORS.other
                    )}
                  >
                    {OPERATION_TYPE_LABELS[record.operation_type] ||
                      record.operation_type}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-700 dark:text-gray-300 font-mono text-xs">
                  {record.model}
                </td>
                <td className="px-4 py-3 text-right text-gray-900 dark:text-gray-100 font-medium">
                  {formatNumber(record.total_tokens)}
                </td>
                <td className="px-4 py-3 text-right text-gray-900 dark:text-gray-100 font-semibold">
                  ${record.cost_usd.toFixed(4)}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {sortedAndFilteredRecords.length === 0 && filterType && (
        <div className="text-center py-4 text-gray-500 dark:text-gray-400">
          <p>No records found for this operation type.</p>
          <button
            onClick={() => setFilterType(null)}
            className="mt-2 text-blue-600 dark:text-blue-400 hover:underline text-sm"
          >
            Clear filter
          </button>
        </div>
      )}
    </div>
  );
}
