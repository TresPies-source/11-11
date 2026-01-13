import type { PruningStrategy, ContextResult, TierContent } from './types';
import { countTokens } from './tokens';

export function getPruningStrategy(budgetPercent: number): PruningStrategy {
  if (budgetPercent < 40) {
    return {
      budgetRange: '<40%',
      tier1Messages: 1,
      tier2Items: 1,
      tier3Mode: 'none',
      tier4Messages: 0,
    };
  } else if (budgetPercent < 60) {
    return {
      budgetRange: '40-60%',
      tier1Messages: 1,
      tier2Items: 3,
      tier3Mode: 'summary',
      tier4Messages: 2,
    };
  } else if (budgetPercent < 80) {
    return {
      budgetRange: '60-80%',
      tier1Messages: 1,
      tier2Items: 'all',
      tier3Mode: 'full',
      tier4Messages: 5,
    };
  } else {
    return {
      budgetRange: '>80%',
      tier1Messages: 1,
      tier2Items: 'all',
      tier3Mode: 'full',
      tier4Messages: 10,
    };
  }
}

export function applyPruning(
  context: ContextResult,
  strategy: PruningStrategy
): ContextResult {
  const prunedTiers = context.tiers.map(tier => {
    switch (tier.tier) {
      case 'tier1':
        return tier;
      case 'tier2':
        return pruneTier2(tier, strategy);
      case 'tier3':
        return pruneTier3(tier, strategy);
      case 'tier4':
        return pruneTier4(tier, strategy);
      default:
        return tier;
    }
  });
  
  const totalTokens = prunedTiers.reduce((sum, t) => sum + t.tokenCount, 0);
  const tierBreakdown = prunedTiers.reduce((acc, tier) => {
    acc[tier.tier] = tier.tokenCount;
    return acc;
  }, {
    tier1: 0,
    tier2: 0,
    tier3: 0,
    tier4: 0,
  });
  
  return {
    ...context,
    tiers: prunedTiers,
    totalTokens,
    tierBreakdown,
    pruningStrategy: strategy,
  };
}

function pruneTier2(tier: TierContent, strategy: PruningStrategy): TierContent {
  if (!tier.content) {
    return tier;
  }
  
  if (strategy.tier2Items === 'all') {
    return tier;
  }
  
  const seeds = tier.content.split('\n\n---\n\n');
  const limitedSeeds = seeds.slice(0, strategy.tier2Items as number);
  const prunedContent = limitedSeeds.join('\n\n---\n\n');
  
  return {
    ...tier,
    content: prunedContent,
    tokenCount: countTokens(prunedContent),
  };
}

function pruneTier3(tier: TierContent, strategy: PruningStrategy): TierContent {
  if (!tier.content) {
    return tier;
  }
  
  if (strategy.tier3Mode === 'none') {
    return {
      ...tier,
      content: '',
      tokenCount: 0,
    };
  }
  
  if (strategy.tier3Mode === 'summary') {
    const files = tier.content.split('\n\n---\n\n');
    const summaries = files.map(file => {
      const lines = file.split('\n');
      if (lines.length <= 20) {
        return file;
      }
      
      const firstLines = lines.slice(0, 10).join('\n');
      const lastLines = lines.slice(-5).join('\n');
      return `${firstLines}\n...\n${lastLines}`;
    });
    
    const prunedContent = summaries.join('\n\n---\n\n');
    return {
      ...tier,
      content: prunedContent,
      tokenCount: countTokens(prunedContent),
      source: 'file_summaries',
    };
  }
  
  return tier;
}

function pruneTier4(tier: TierContent, strategy: PruningStrategy): TierContent {
  if (!tier.content || strategy.tier4Messages === 0) {
    return {
      ...tier,
      content: '',
      tokenCount: 0,
    };
  }
  
  const messages = tier.content.split('\n\n');
  const limitedMessages = messages.slice(-strategy.tier4Messages);
  const prunedContent = limitedMessages.join('\n\n');
  
  return {
    ...tier,
    content: prunedContent,
    tokenCount: countTokens(prunedContent),
  };
}

export function pruneConversationHistory(
  messages: any[],
  maxMessages: number,
  relevanceScores?: number[]
): any[] {
  if (messages.length <= maxMessages) {
    return messages;
  }
  
  if (!relevanceScores || relevanceScores.length !== messages.length) {
    return messages.slice(-maxMessages);
  }
  
  const scoredMessages = messages.map((msg, idx) => ({
    message: msg,
    score: relevanceScores[idx],
    index: idx,
  }));
  
  scoredMessages.sort((a, b) => {
    const recencyA = a.index / messages.length;
    const recencyB = b.index / messages.length;
    const combinedA = a.score * 0.6 + recencyA * 0.4;
    const combinedB = b.score * 0.6 + recencyB * 0.4;
    return combinedB - combinedA;
  });
  
  const selected = scoredMessages.slice(0, maxMessages);
  selected.sort((a, b) => a.index - b.index);
  
  return selected.map(s => s.message);
}
