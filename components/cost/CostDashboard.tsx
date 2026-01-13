"use client";

import { motion } from "framer-motion";
import { DollarSign, TrendingUp, Clock, AlertCircle } from "lucide-react";
import { useBudgetStatus } from "@/hooks/useBudgetStatus";
import { useCostRecords } from "@/hooks/useCostRecords";
import { useCostTrends } from "@/hooks/useCostTrends";
import { BudgetProgress } from "./BudgetProgress";
import { BudgetAlert } from "./BudgetAlert";
import { CostRecordsTable } from "./CostRecordsTable";
import { CostTrendsChart } from "./CostTrendsChart";
import { LoadingState } from "@/components/shared/LoadingState";
import { ErrorState } from "@/components/shared/ErrorState";
import { cn } from "@/lib/utils";

interface CostDashboardProps {
  sessionId?: string | null;
  className?: string;
}

export function CostDashboard({ sessionId, className }: CostDashboardProps) {
  const {
    data: budgetStatus,
    loading: budgetLoading,
    error: budgetError,
    retry: retryBudget,
  } = useBudgetStatus({ sessionId, refreshInterval: 30000 });

  const {
    records,
    loading: recordsLoading,
    error: recordsError,
    retry: retryRecords,
  } = useCostRecords({ limit: 20 });

  const {
    trends,
    loading: trendsLoading,
    error: trendsError,
    retry: retryTrends,
  } = useCostTrends({ days: 30 });

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

  if (budgetLoading && !budgetStatus) {
    return (
      <div className={cn("max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8", className)}>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
            <DollarSign className="h-8 w-8 text-green-600 dark:text-green-500" />
            Cost Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Track your token usage and costs
          </p>
        </div>
        <LoadingState count={3} />
      </div>
    );
  }

  if (budgetError) {
    return (
      <div className={cn("max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8", className)}>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
            <DollarSign className="h-8 w-8 text-green-600 dark:text-green-500" />
            Cost Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Track your token usage and costs
          </p>
        </div>
        <ErrorState
          title="Unable to load budget data"
          message={budgetError}
          onRetry={retryBudget}
          loading={budgetLoading}
        />
      </div>
    );
  }

  if (!budgetStatus) {
    return null;
  }

  return (
    <div className={cn("max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8", className)}>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
          <DollarSign className="h-8 w-8 text-green-600 dark:text-green-500" />
          Cost Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Monitor your token usage and costs across queries, sessions, and monthly limits
        </p>
      </div>

      <motion.div
        className="space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {budgetStatus.warnings.length > 0 && (
          <motion.div variants={itemVariants}>
            <BudgetAlert warnings={budgetStatus.warnings} />
          </motion.div>
        )}

        <motion.div
          className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm"
          variants={itemVariants}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-500" />
              Budget Overview
            </h2>
            <div className="text-right">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Total Cost This Month
              </div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-500">
                ${budgetStatus.total_cost_this_month.toFixed(2)}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <BudgetProgress
              label="Query Budget"
              current={budgetStatus.query_usage}
              limit={budgetStatus.query_limit}
              warnThreshold={0.8}
            />
            <BudgetProgress
              label="Session Budget"
              current={budgetStatus.session_usage}
              limit={budgetStatus.session_limit}
              warnThreshold={0.8}
            />
            <BudgetProgress
              label="Monthly Budget"
              current={budgetStatus.user_monthly_usage}
              limit={budgetStatus.user_monthly_limit}
              warnThreshold={0.8}
            />
          </div>
        </motion.div>

        <motion.div
          className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm"
          variants={itemVariants}
        >
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-6">
            <Clock className="h-5 w-5 text-purple-600 dark:text-purple-500" />
            Recent Queries
          </h2>

          {recordsError ? (
            <ErrorState
              title="Unable to load cost records"
              message={recordsError}
              onRetry={retryRecords}
              loading={recordsLoading}
            />
          ) : recordsLoading && records.length === 0 ? (
            <div className="py-8 text-center text-gray-500 dark:text-gray-400">
              Loading cost records...
            </div>
          ) : (
            <CostRecordsTable records={records} />
          )}
        </motion.div>

        <motion.div
          className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm"
          variants={itemVariants}
        >
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-6">
            <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-500" />
            Cost Trends (30 Days)
          </h2>

          {trendsError ? (
            <ErrorState
              title="Unable to load cost trends"
              message={trendsError}
              onRetry={retryTrends}
              loading={trendsLoading}
            />
          ) : trendsLoading && trends.length === 0 ? (
            <div className="py-8 text-center text-gray-500 dark:text-gray-400">
              Loading cost trends...
            </div>
          ) : (
            <CostTrendsChart trends={trends} />
          )}
        </motion.div>

        <motion.div
          className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4"
          variants={itemVariants}
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900 dark:text-blue-100">
              <p className="font-semibold mb-1">Budget Management Tips</p>
              <ul className="space-y-1 text-blue-800 dark:text-blue-200">
                <li>• Budgets reset monthly on the 1st of each month</li>
                <li>• Session budgets help prevent runaway conversations</li>
                <li>
                  • You&apos;ll receive warnings at 80% and hard stops at 100% of limits
                </li>
                <li>• Consider using smaller models (GPT-4o-mini) to reduce costs</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
