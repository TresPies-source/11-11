"use client";

import { motion } from "framer-motion";
import type { CostTrend } from "@/hooks/useCostTrends";
import { cn } from "@/lib/utils";

interface CostTrendsChartProps {
  trends: CostTrend[];
  className?: string;
}

export function CostTrendsChart({ trends, className }: CostTrendsChartProps) {
  if (trends.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <p>No cost data available yet. Start making queries to see trends.</p>
      </div>
    );
  }

  const width = 700;
  const height = 300;
  const padding = { top: 20, right: 40, bottom: 40, left: 60 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const maxTokens = Math.max(...trends.map((t) => t.total_tokens), 1);
  const maxCost = Math.max(...trends.map((t) => t.total_cost), 0.01);

  const scaleX = (index: number) => {
    return (index / Math.max(trends.length - 1, 1)) * chartWidth;
  };

  const scaleYTokens = (tokens: number) => {
    return chartHeight - (tokens / maxTokens) * chartHeight;
  };

  const scaleYCost = (cost: number) => {
    return chartHeight - (cost / maxCost) * chartHeight;
  };

  const pathTokens = trends
    .map((trend, index) => {
      const x = scaleX(index) + padding.left;
      const y = scaleYTokens(trend.total_tokens) + padding.top;
      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  const pathCost = trends
    .map((trend, index) => {
      const x = scaleX(index) + padding.left;
      const y = scaleYCost(trend.total_cost) + padding.top;
      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const formatNumber = (num: number) => {
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
    return num.toFixed(0);
  };

  const xAxisLabels = trends.filter((_, index) => {
    const step = Math.max(Math.floor(trends.length / 6), 1);
    return index % step === 0 || index === trends.length - 1;
  });

  const yAxisLabelsTokens = [0, maxTokens * 0.25, maxTokens * 0.5, maxTokens * 0.75, maxTokens];
  const yAxisLabelsCost = [0, maxCost * 0.25, maxCost * 0.5, maxCost * 0.75, maxCost];

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 bg-blue-600 dark:bg-blue-400" />
          <span className="text-gray-700 dark:text-gray-300">Tokens</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 bg-green-600 dark:bg-green-400" />
          <span className="text-gray-700 dark:text-gray-300">Cost (USD)</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto"
          role="img"
          aria-label="Cost trends over time"
        >
          <g>
            {yAxisLabelsTokens.map((value, index) => (
              <g key={`y-grid-tokens-${index}`}>
                <line
                  x1={padding.left}
                  y1={scaleYTokens(value) + padding.top}
                  x2={width - padding.right}
                  y2={scaleYTokens(value) + padding.top}
                  stroke="currentColor"
                  strokeWidth="0.5"
                  className="text-gray-200 dark:text-gray-700"
                  strokeDasharray="4 4"
                />
                <text
                  x={padding.left - 10}
                  y={scaleYTokens(value) + padding.top + 4}
                  textAnchor="end"
                  className="text-xs fill-gray-500 dark:fill-gray-400"
                >
                  {formatNumber(value)}
                </text>
              </g>
            ))}

            {yAxisLabelsCost.map((value, index) => (
              <text
                key={`y-label-cost-${index}`}
                x={width - padding.right + 10}
                y={scaleYCost(value) + padding.top + 4}
                textAnchor="start"
                className="text-xs fill-green-600 dark:fill-green-400"
              >
                ${value.toFixed(2)}
              </text>
            ))}

            {xAxisLabels.map((trend, labelIndex) => {
              const index = trends.indexOf(trend);
              return (
                <text
                  key={`x-label-${labelIndex}`}
                  x={scaleX(index) + padding.left}
                  y={height - padding.bottom + 20}
                  textAnchor="middle"
                  className="text-xs fill-gray-500 dark:fill-gray-400"
                >
                  {formatDate(trend.date)}
                </text>
              );
            })}

            <motion.path
              d={pathTokens}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-blue-600 dark:text-blue-400"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1, ease: "easeOut" }}
            />

            <motion.path
              d={pathCost}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-green-600 dark:text-green-400"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
            />

            {trends.map((trend, index) => {
              const x = scaleX(index) + padding.left;
              const yTokens = scaleYTokens(trend.total_tokens) + padding.top;
              const yCost = scaleYCost(trend.total_cost) + padding.top;

              return (
                <g key={`points-${index}`}>
                  <motion.circle
                    cx={x}
                    cy={yTokens}
                    r="3"
                    className="fill-blue-600 dark:fill-blue-400"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: index * 0.02, duration: 0.2 }}
                  >
                    <title>
                      {formatDate(trend.date)}: {formatNumber(trend.total_tokens)} tokens
                    </title>
                  </motion.circle>
                  <motion.circle
                    cx={x}
                    cy={yCost}
                    r="3"
                    className="fill-green-600 dark:fill-green-400"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: index * 0.02 + 0.1, duration: 0.2 }}
                  >
                    <title>
                      {formatDate(trend.date)}: ${trend.total_cost.toFixed(4)}
                    </title>
                  </motion.circle>
                </g>
              );
            })}
          </g>

          <text
            x={padding.left - 40}
            y={height / 2}
            textAnchor="middle"
            className="text-xs fill-gray-600 dark:fill-gray-400 font-semibold"
            transform={`rotate(-90 ${padding.left - 40} ${height / 2})`}
          >
            Tokens
          </text>

          <text
            x={width - padding.right + 30}
            y={height / 2}
            textAnchor="middle"
            className="text-xs fill-green-600 dark:fill-green-400 font-semibold"
            transform={`rotate(90 ${width - padding.right + 30} ${height / 2})`}
          >
            Cost (USD)
          </text>

          <text
            x={width / 2}
            y={height - 5}
            textAnchor="middle"
            className="text-xs fill-gray-600 dark:fill-gray-400 font-semibold"
          >
            Date
          </text>
        </svg>
      </div>
    </div>
  );
}
