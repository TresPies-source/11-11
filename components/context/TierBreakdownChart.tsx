'use client';

import { motion } from 'framer-motion';
import { TIER_CONFIGS } from '@/lib/context/types';
import type { TierBreakdown } from '@/lib/context/types';
import { cn } from '@/lib/utils';

interface TierBreakdownChartProps {
  breakdown: TierBreakdown;
  className?: string;
}

const TIER_COLORS = {
  tier1: 'bg-blue-500',
  tier2: 'bg-green-500',
  tier3: 'bg-yellow-500',
  tier4: 'bg-purple-500',
} as const;

const TIER_BORDER_COLORS = {
  tier1: 'border-blue-500',
  tier2: 'border-green-500',
  tier3: 'border-yellow-500',
  tier4: 'border-purple-500',
} as const;

const TIER_TEXT_COLORS = {
  tier1: 'text-blue-600 dark:text-blue-400',
  tier2: 'text-green-600 dark:text-green-400',
  tier3: 'text-yellow-600 dark:text-yellow-400',
  tier4: 'text-purple-600 dark:text-purple-400',
} as const;

export function TierBreakdownChart({ breakdown, className }: TierBreakdownChartProps) {
  const total = breakdown.total;

  const tiers = [
    { key: 'tier1' as const, ...breakdown.tier1, config: TIER_CONFIGS.tier1 },
    { key: 'tier2' as const, ...breakdown.tier2, config: TIER_CONFIGS.tier2 },
    { key: 'tier3' as const, ...breakdown.tier3, config: TIER_CONFIGS.tier3 },
    { key: 'tier4' as const, ...breakdown.tier4, config: TIER_CONFIGS.tier4 },
  ];

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center h-8 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
        {tiers.map((tier) => {
          const percentage = total > 0 ? (tier.tokens / total) * 100 : 0;
          
          if (percentage === 0) return null;

          return (
            <motion.div
              key={tier.key}
              className={cn(TIER_COLORS[tier.key], 'h-full flex items-center justify-center')}
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              title={`${tier.config.name}: ${tier.tokens.toLocaleString()} tokens (${percentage.toFixed(1)}%)`}
            >
              {percentage > 5 && (
                <span className="text-xs font-semibold text-white px-1">
                  {percentage.toFixed(0)}%
                </span>
              )}
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {tiers.map((tier) => {
          const percentage = total > 0 ? (tier.tokens / total) * 100 : 0;

          return (
            <motion.div
              key={tier.key}
              className={cn(
                'border-l-4 bg-white dark:bg-gray-900 rounded-lg p-3 shadow-sm',
                TIER_BORDER_COLORS[tier.key]
              )}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: tier.config.priority * 0.05 }}
            >
              <div className="flex items-start justify-between mb-1">
                <h3 className={cn('font-semibold text-sm', TIER_TEXT_COLORS[tier.key])}>
                  {tier.config.name}
                </h3>
                <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                  {percentage.toFixed(1)}%
                </span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                {tier.config.description}
              </p>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-700 dark:text-gray-300">
                  {tier.tokens.toLocaleString()} tokens
                </span>
                <span className="text-gray-500 dark:text-gray-500">
                  {tier.items} item{tier.items !== 1 ? 's' : ''}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Total Tokens
        </span>
        <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
          {total.toLocaleString()}
        </span>
      </div>
    </div>
  );
}
