import type { ContextBuildOptions, ContextResult, TierContent, ContextTier } from './types';
import { buildTier1, buildTier2, buildTier3, buildTier4 } from './tiers';
import { countTokens } from './tokens';
import { getPruningStrategy } from './pruning';
import { getSessionTokenUsage, getUserMonthlyTokenUsage } from '../pglite/cost';
import { DEFAULT_BUDGET } from '../cost/constants';
import { logEvent, isTraceActive } from '../harness/trace';

export async function buildContext(
  options: ContextBuildOptions
): Promise<ContextResult> {
  const startTime = Date.now();

  try {
    const budgetPercent = options.budgetPercent ?? 
      await calculateBudgetPercent(options.userId, options.sessionId);
    
    const strategy = getPruningStrategy(budgetPercent);
    
    if (isTraceActive()) {
      logEvent('TOOL_INVOCATION', {
        tool: 'context_builder',
        agent: options.agent,
        message_count: options.messages.length,
        budget_percent: budgetPercent,
      }, {}, {});
    }
    
    const tier1 = buildTier1(options);
    const tier2 = await buildTier2(options, strategy);
    const tier3 = await buildTier3(options, strategy);
    const tier4 = buildTier4(options, strategy);
    
    const forcedTiers = options.forceIncludeTiers || [];
    const allTiers: TierContent[] = [tier1, tier2, tier3, tier4].map((tier, idx) => {
      const tierName = `tier${idx + 1}` as ContextTier;
      if (forcedTiers.includes(tierName) && tier.tokenCount === 0) {
        console.warn(`[CONTEXT] Forced tier ${tierName} has 0 tokens`);
      }
      return tier;
    });
    
    const includedTiers = allTiers.filter(t => 
      t.tokenCount > 0 || (options.forceIncludeTiers || []).includes(t.tier)
    );
    
    const totalTokens = includedTiers.reduce((sum, t) => sum + t.tokenCount, 0);
    
    const messages = convertTiersToMessages(includedTiers, options.messages);
    
    const tierBreakdown = calculateTierBreakdown(includedTiers);
    
    const duration = Date.now() - startTime;
    
    if (isTraceActive()) {
      logEvent('TOOL_INVOCATION', {
        tool: 'context_builder',
        agent: options.agent,
      }, {
        success: true,
        total_tokens: totalTokens,
        tier_count: includedTiers.length,
        pruning_strategy: strategy.budgetRange,
      }, {
        duration_ms: duration,
        token_count: totalTokens,
      });
    }
    
    return {
      messages,
      tiers: includedTiers,
      totalTokens,
      tierBreakdown,
      pruningStrategy: strategy,
      budgetPercent,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    
    if (isTraceActive()) {
      logEvent('ERROR', {
        tool: 'context_builder',
        agent: options.agent,
      }, {
        error: true,
      }, {
        duration_ms: duration,
        error_message: error instanceof Error ? error.message : String(error),
      });
    }
    
    console.error('[CONTEXT] Failed to build context:', error);
    
    return {
      messages: options.messages,
      tiers: [],
      totalTokens: 0,
      tierBreakdown: {
        tier1: 0,
        tier2: 0,
        tier3: 0,
        tier4: 0,
      },
      pruningStrategy: getPruningStrategy(100),
      budgetPercent: 100,
    };
  }
}

async function calculateBudgetPercent(
  userId: string, 
  sessionId?: string
): Promise<number> {
  try {
    const sessionUsage = sessionId ? await getSessionTokenUsage(sessionId) : 0;
    const userUsage = await getUserMonthlyTokenUsage(userId);
    
    const sessionLimit = DEFAULT_BUDGET.session_limit;
    const userLimit = DEFAULT_BUDGET.user_monthly_limit;
    
    const sessionPercent = sessionId ? (sessionUsage / sessionLimit) * 100 : 0;
    const userPercent = (userUsage / userLimit) * 100;
    
    return Math.max(sessionPercent, userPercent);
  } catch (error) {
    console.warn('[CONTEXT] Failed to calculate budget percent:', error);
    return 100;
  }
}

function convertTiersToMessages(
  tiers: TierContent[], 
  originalMessages: any[]
): any[] {
  const messages: any[] = [];
  
  const tier1 = tiers.find(t => t.tier === 'tier1');
  if (tier1 && tier1.content) {
    messages.push({
      role: 'system',
      content: tier1.content,
    });
  }
  
  const tier2 = tiers.find(t => t.tier === 'tier2');
  if (tier2 && tier2.content) {
    messages.push({
      role: 'system',
      content: `Active Seeds:\n\n${tier2.content}`,
    });
  }
  
  const tier3 = tiers.find(t => t.tier === 'tier3');
  if (tier3 && tier3.content) {
    messages.push({
      role: 'system',
      content: `Referenced Files:\n\n${tier3.content}`,
    });
  }
  
  const tier4 = tiers.find(t => t.tier === 'tier4');
  if (tier4 && tier4.content) {
    messages.push({
      role: 'system',
      content: `Conversation History:\n\n${tier4.content}`,
    });
  }
  
  const currentQuery = originalMessages[originalMessages.length - 1];
  if (currentQuery) {
    messages.push(currentQuery);
  }
  
  return messages;
}

function calculateTierBreakdown(tiers: TierContent[]): Record<ContextTier, number> {
  const breakdown: Record<ContextTier, number> = {
    tier1: 0,
    tier2: 0,
    tier3: 0,
    tier4: 0,
  };
  
  for (const tier of tiers) {
    breakdown[tier.tier] = tier.tokenCount;
  }
  
  return breakdown;
}

export function calculateTokenSavings(
  originalTokens: number,
  contextResult: ContextResult
): { savedTokens: number; percentSaved: number } {
  const savedTokens = Math.max(0, originalTokens - contextResult.totalTokens);
  const percentSaved = originalTokens > 0 
    ? (savedTokens / originalTokens) * 100 
    : 0;
  
  return { savedTokens, percentSaved };
}
