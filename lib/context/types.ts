export type ContextTier = 'tier1' | 'tier2' | 'tier3' | 'tier4';

export interface ContextTierConfig {
  tier: ContextTier;
  name: string;
  priority: number;
  alwaysInclude: boolean;
  description: string;
}

export interface TierContent {
  tier: ContextTier;
  content: string;
  tokenCount: number;
  source: string;
}

export interface ContextBuildOptions {
  agent: string;
  messages: any[];
  sessionId?: string;
  userId: string;
  budgetPercent?: number;
  forceIncludeTiers?: ContextTier[];
}

export interface ContextResult {
  messages: any[];
  tiers: TierContent[];
  totalTokens: number;
  tierBreakdown: Record<ContextTier, number>;
  pruningStrategy: PruningStrategy;
  budgetPercent: number;
}

export interface PruningStrategy {
  budgetRange: string;
  tier1Messages: number;
  tier2Items: number | 'all';
  tier3Mode: 'full' | 'summary' | 'none';
  tier4Messages: number;
}

export interface TierBreakdown {
  tier1: { tokens: number; items: number };
  tier2: { tokens: number; items: number };
  tier3: { tokens: number; items: number };
  tier4: { tokens: number; items: number };
  total: number;
}

export interface ContextStatus {
  sessionId: string;
  currentContext: ContextResult;
  tierBreakdown: TierBreakdown;
  budgetPercent: number;
  lastUpdated: string;
}

export interface ContextSnapshot {
  id: string;
  session_id: string;
  user_id: string;
  tier_breakdown: TierBreakdown;
  total_tokens: number;
  budget_percent: number;
  pruning_strategy: PruningStrategy;
  created_at: string;
}

export const TIER_CONFIGS: Record<ContextTier, ContextTierConfig> = {
  tier1: {
    tier: 'tier1',
    name: 'Core Context',
    priority: 1,
    alwaysInclude: true,
    description: 'Core system prompt, Dojo principles, current query',
  },
  tier2: {
    tier: 'tier2',
    name: 'Active Seeds',
    priority: 2,
    alwaysInclude: false,
    description: 'Active seed patches, relevant project memory',
  },
  tier3: {
    tier: 'tier3',
    name: 'Referenced Files',
    priority: 3,
    alwaysInclude: false,
    description: 'Full text of specific files or logs when referenced',
  },
  tier4: {
    tier: 'tier4',
    name: 'Conversation History',
    priority: 4,
    alwaysInclude: false,
    description: 'General conversation history (pruned aggressively)',
  },
};
