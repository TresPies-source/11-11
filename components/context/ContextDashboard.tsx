'use client';

import { motion } from 'framer-motion';
import { Layers, TrendingDown, Clock, AlertCircle, Activity } from 'lucide-react';
import { useContextStatus } from '@/hooks/useContextStatus';
import { useBudgetStatus } from '@/hooks/useBudgetStatus';
import { TierBreakdownChart } from './TierBreakdownChart';
import { LoadingState } from '@/components/shared/LoadingState';
import { ErrorState } from '@/components/shared/ErrorState';
import { cn } from '@/lib/utils';

interface ContextDashboardProps {
  sessionId?: string | null;
  className?: string;
}

export function ContextDashboard({ sessionId, className }: ContextDashboardProps) {
  const {
    data: contextStatus,
    loading: contextLoading,
    error: contextError,
    retry: retryContext,
  } = useContextStatus({ sessionId, refreshInterval: 30000 });

  const {
    data: budgetStatus,
    loading: budgetLoading,
  } = useBudgetStatus({ sessionId, refreshInterval: 30000 });

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
      transition: { duration: 0.3, ease: 'easeOut' },
    },
  };

  if (contextLoading && !contextStatus) {
    return (
      <div className={cn('max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8', className)}>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
            <Layers className="h-8 w-8 text-blue-600 dark:text-blue-500" />
            Context Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Monitor your hierarchical context management
          </p>
        </div>
        <LoadingState count={3} />
      </div>
    );
  }

  if (contextError) {
    return (
      <div className={cn('max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8', className)}>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
            <Layers className="h-8 w-8 text-blue-600 dark:text-blue-500" />
            Context Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Monitor your hierarchical context management
          </p>
        </div>
        <ErrorState
          title="Unable to load context data"
          message={contextError}
          onRetry={retryContext}
          loading={contextLoading}
        />
      </div>
    );
  }

  if (!contextStatus) {
    return (
      <div className={cn('max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8', className)}>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
            <Layers className="h-8 w-8 text-blue-600 dark:text-blue-500" />
            Context Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Monitor your hierarchical context management
          </p>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-yellow-900 dark:text-yellow-100">
                No context data available
              </p>
              <p className="text-sm text-yellow-800 dark:text-yellow-200 mt-1">
                {sessionId 
                  ? 'No context snapshots found for this session yet. Make an LLM call with context building enabled to see data here.'
                  : 'Please select a session to view context data.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const pruningStrategy = contextStatus.pruningStrategy;
  const budgetPercent = contextStatus.budgetPercent;

  const getBudgetStatusColor = (percent: number) => {
    if (percent >= 80) return 'text-red-600 dark:text-red-400';
    if (percent >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-green-600 dark:text-green-400';
  };

  const getBudgetStatusBg = (percent: number) => {
    if (percent >= 80) return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
    if (percent >= 60) return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
    return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
  };

  return (
    <div className={cn('max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8', className)}>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
          <Layers className="h-8 w-8 text-blue-600 dark:text-blue-500" />
          Context Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Monitor 4-tier hierarchical context management and token optimization
        </p>
      </div>

      <motion.div
        className="space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div
            className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm"
            variants={itemVariants}
          >
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-5 w-5 text-blue-600 dark:text-blue-500" />
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Total Tokens
              </h3>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {contextStatus.totalTokens.toLocaleString()}
            </p>
          </motion.div>

          <motion.div
            className={cn(
              'rounded-lg border p-4 shadow-sm',
              getBudgetStatusBg(budgetPercent)
            )}
            variants={itemVariants}
          >
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className={cn('h-5 w-5', getBudgetStatusColor(budgetPercent))} />
              <h3 className={cn('text-sm font-semibold', getBudgetStatusColor(budgetPercent))}>
                Budget Remaining
              </h3>
            </div>
            <p className={cn('text-2xl font-bold', getBudgetStatusColor(budgetPercent))}>
              {(100 - budgetPercent).toFixed(1)}%
            </p>
          </motion.div>

          <motion.div
            className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm"
            variants={itemVariants}
          >
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-5 w-5 text-purple-600 dark:text-purple-500" />
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Last Updated
              </h3>
            </div>
            <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
              {new Date(contextStatus.createdAt).toLocaleTimeString()}
            </p>
          </motion.div>
        </div>

        <motion.div
          className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm"
          variants={itemVariants}
        >
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-6">
            <Layers className="h-5 w-5 text-blue-600 dark:text-blue-500" />
            4-Tier Breakdown
          </h2>
          <TierBreakdownChart breakdown={contextStatus.tierBreakdown} />
        </motion.div>

        <motion.div
          className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm"
          variants={itemVariants}
        >
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-4">
            <TrendingDown className="h-5 w-5 text-green-600 dark:text-green-500" />
            Active Pruning Strategy
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Budget Range
              </div>
              <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {pruningStrategy.budgetRange}
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Tier 1 Messages
              </div>
              <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {pruningStrategy.tier1Messages === -1 ? 'All' : pruningStrategy.tier1Messages}
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Tier 2 Seeds
              </div>
              <div className="text-lg font-bold text-green-600 dark:text-green-400">
                {pruningStrategy.tier2Items === 'all' ? 'All' : pruningStrategy.tier2Items}
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Tier 3 Mode
              </div>
              <div className="text-lg font-bold text-yellow-600 dark:text-yellow-400 capitalize">
                {pruningStrategy.tier3Mode}
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Tier 4 Messages
              </div>
              <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                {pruningStrategy.tier4Messages}
              </div>
            </div>

            {budgetStatus && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Session Budget Used
                </div>
                <div className={cn('text-lg font-bold', getBudgetStatusColor(budgetPercent))}>
                  ${budgetStatus.session_usage.toFixed(4)}
                </div>
              </div>
            )}
          </div>
        </motion.div>

        <motion.div
          className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4"
          variants={itemVariants}
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900 dark:text-blue-100">
              <p className="font-semibold mb-1">About Hierarchical Context Management</p>
              <ul className="space-y-1 text-blue-800 dark:text-blue-200">
                <li>• <strong>Tier 1 (Core):</strong> System prompt, Dojo principles - always included</li>
                <li>• <strong>Tier 2 (Seeds):</strong> Active seeds from database - budget-aware</li>
                <li>• <strong>Tier 3 (Files):</strong> Referenced files - pruned when budget low</li>
                <li>• <strong>Tier 4 (History):</strong> Conversation history - pruned aggressively</li>
                <li>• Context automatically optimizes based on budget to reduce costs by 30-50%</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
