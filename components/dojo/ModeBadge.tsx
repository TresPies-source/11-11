import { DojoMode } from '@/lib/stores/dojo.store';

interface ModeBadgeProps {
  mode: DojoMode;
}

const BADGE_CONFIG: Record<DojoMode, { emoji: string; color: string; background: string }> = {
  Mirror: {
    emoji: '🪞',
    color: 'text-blue-700 dark:text-blue-300',
    background: 'bg-blue-100 dark:bg-blue-900/30',
  },
  Scout: {
    emoji: '🔍',
    color: 'text-purple-700 dark:text-purple-300',
    background: 'bg-purple-100 dark:bg-purple-900/30',
  },
  Gardener: {
    emoji: '🌱',
    color: 'text-green-700 dark:text-green-300',
    background: 'bg-green-100 dark:bg-green-900/30',
  },
  Implementation: {
    emoji: '⚙️',
    color: 'text-orange-700 dark:text-orange-300',
    background: 'bg-orange-100 dark:bg-orange-900/30',
  },
};

export function ModeBadge({ mode }: ModeBadgeProps) {
  const config = BADGE_CONFIG[mode];

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${config.background} ${config.color}`}
    >
      <span>{config.emoji}</span>
      <span>{mode}</span>
    </span>
  );
}
