import type { CritiqueRule, DimensionResult, RuleContext } from '../types';

const AMBIGUOUS_TERMS = [
  'various', 'multiple', 'several', 'many', 'some', 'etc', 'and so on',
  'things', 'stuff', 'items', 'aspects', 'factors', 'elements'
];

const SCOPE_INDICATORS = [
  'all', 'every', 'complete', 'entire', 'whole', 'comprehensive',
  'anything', 'everything', 'whatever', 'however', 'whenever'
];

const TASK_SEPARATORS = [
  'also', 'additionally', 'furthermore', 'moreover', 'in addition',
  'as well as', 'along with', 'plus', 'and then', 'after that'
];

function normalizeText(text: string): string {
  return text.toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function detectNumberedSteps(content: string): { 
  hasNumbering: boolean; 
  count: number; 
  type: 'numeric' | 'bullet' | 'none';
} {
  const numericPattern = /^\s*(\d+[\.)]\s|step\s+\d+)/gim;
  const bulletPattern = /^\s*[-*•]\s/gm;
  
  const numericMatches = content.match(numericPattern);
  const bulletMatches = content.match(bulletPattern);
  
  if (numericMatches && numericMatches.length >= 2) {
    return { hasNumbering: true, count: numericMatches.length, type: 'numeric' };
  }
  
  if (bulletMatches && bulletMatches.length >= 2) {
    return { hasNumbering: true, count: bulletMatches.length, type: 'bullet' };
  }
  
  return { hasNumbering: false, count: 0, type: 'none' };
}

function detectStructuralMarkers(content: string): {
  hasSections: boolean;
  hasHeaders: boolean;
  sectionCount: number;
} {
  const headerPattern = /^#+\s+.+$/gm;
  const sectionPattern = /^(##?)\s+/gm;
  
  const headers = content.match(headerPattern);
  const sections = content.match(sectionPattern);
  
  return {
    hasSections: !!sections && sections.length >= 2,
    hasHeaders: !!headers && headers.length >= 1,
    sectionCount: sections?.length || 0
  };
}

function countTaskIndicators(content: string): number {
  const normalized = normalizeText(content);
  let count = 0;
  
  const taskPatterns = [
    /\b(create|build|implement|add|write|design|develop|configure|setup|install)\b/g,
    /\b(update|modify|change|refactor|improve|optimize|fix|debug)\b/g,
    /\b(test|verify|validate|check|ensure|confirm)\b/g,
    /\b(document|explain|describe|define|specify)\b/g,
    /\b(integrate|connect|link|merge|combine)\b/g
  ];
  
  taskPatterns.forEach(pattern => {
    const matches = normalized.match(pattern);
    if (matches) count += matches.length;
  });
  
  return count;
}

function detectAmbiguousScope(content: string): { count: number; terms: string[] } {
  const normalized = normalizeText(content);
  const foundTerms = new Set<string>();
  let count = 0;
  
  AMBIGUOUS_TERMS.forEach(term => {
    const regex = new RegExp(`\\b${term}\\b`, 'gi');
    const matches = content.match(regex);
    if (matches) {
      count += matches.length;
      foundTerms.add(term);
    }
  });
  
  return { count, terms: Array.from(foundTerms) };
}

function detectOverlyBroadScope(content: string): { count: number; indicators: string[] } {
  const normalized = normalizeText(content);
  const foundIndicators = new Set<string>();
  let count = 0;
  
  SCOPE_INDICATORS.forEach(indicator => {
    const regex = new RegExp(`\\b${indicator}\\b`, 'gi');
    const matches = content.match(regex);
    if (matches) {
      count += matches.length;
      foundIndicators.add(indicator);
    }
  });
  
  return { count, indicators: Array.from(foundIndicators) };
}

function detectTaskSeparators(content: string): { count: number; separators: string[] } {
  const normalized = normalizeText(content);
  const foundSeparators = new Set<string>();
  let count = 0;
  
  TASK_SEPARATORS.forEach(sep => {
    const regex = new RegExp(`\\b${sep.replace(/\s+/g, '\\s+')}\\b`, 'gi');
    const matches = content.match(regex);
    if (matches) {
      count += matches.length;
      foundSeparators.add(sep);
    }
  });
  
  return { count, separators: Array.from(foundSeparators) };
}

function hasClearGoal(content: string): boolean {
  const goalPatterns = [
    /\b(goal|objective|purpose|aim|target|outcome|result)\s*(is|:|to)\b/i,
    /\b(should|must|need to|will)\s+(create|build|implement|produce|deliver)\b/i,
    /\b(in order to|so that|to achieve|to accomplish)\b/i
  ];
  
  return goalPatterns.some(pattern => pattern.test(content));
}

function calculateScore(
  numberedSteps: { hasNumbering: boolean; count: number; type: string },
  structure: { hasSections: boolean; hasHeaders: boolean; sectionCount: number },
  taskCount: number,
  ambiguousScope: { count: number; terms: string[] },
  broadScope: { count: number; indicators: string[] },
  taskSeparators: { count: number; separators: string[] },
  hasGoal: boolean,
  wordCount: number
): number {
  let score = 25;
  
  if (numberedSteps.hasNumbering && numberedSteps.count >= 2) {
    score += numberedSteps.type === 'numeric' ? 0 : -2;
  } else if (taskCount > 3 && !numberedSteps.hasNumbering) {
    score -= 5;
  }
  
  if (structure.hasSections || structure.hasHeaders) {
    if (structure.sectionCount >= 2 && structure.sectionCount <= 7) {
      score += 0;
    } else if (structure.sectionCount > 7) {
      score -= 3;
    }
  }
  
  if (!hasGoal && wordCount > 50) {
    score -= 4;
  }
  
  const ambiguityPenalty = Math.min(ambiguousScope.count * 1.5, 8);
  score -= ambiguityPenalty;
  
  const broadScopePenalty = Math.min(broadScope.count * 2, 6);
  score -= broadScopePenalty;
  
  if (taskSeparators.count > 5) {
    score -= 5;
  } else if (taskSeparators.count > 3) {
    score -= 3;
  }
  
  if (taskCount === 0) {
    score -= 10;
  } else if (taskCount === 1) {
    score += 3;
  } else if (taskCount > 1 && taskCount <= 5 && numberedSteps.hasNumbering) {
    score += 2;
  } else if (taskCount > 8 && !numberedSteps.hasNumbering) {
    score -= 6;
  }
  
  return Math.max(0, Math.min(25, Math.round(score)));
}

export const taskDecompositionRule: CritiqueRule = {
  name: 'Task Decomposition',
  maxScore: 25,
  
  execute(context: RuleContext): DimensionResult {
    const content = context.content || '';
    
    if (!content.trim()) {
      return {
        score: 25,
        issues: [],
        suggestions: []
      };
    }
    
    const wordCount = content.trim().split(/\s+/).length;
    
    const numberedSteps = detectNumberedSteps(content);
    const structure = detectStructuralMarkers(content);
    const taskCount = countTaskIndicators(content);
    const ambiguousScope = detectAmbiguousScope(content);
    const broadScope = detectOverlyBroadScope(content);
    const taskSeparators = detectTaskSeparators(content);
    const hasGoal = hasClearGoal(content);
    
    const score = calculateScore(
      numberedSteps,
      structure,
      taskCount,
      ambiguousScope,
      broadScope,
      taskSeparators,
      hasGoal,
      wordCount
    );
    
    const issues: string[] = [];
    const suggestions: string[] = [];
    
    if (taskCount === 0) {
      issues.push('No clear action items detected in the prompt');
      suggestions.push('Add specific tasks or actions you want to accomplish');
    } else if (taskCount === 1) {
      suggestions.push('Good! Focused on a single, clear task');
    } else if (taskCount > 1 && !numberedSteps.hasNumbering) {
      issues.push(`Detected ${taskCount} possible tasks without clear structure`);
      suggestions.push('Use numbered steps (1., 2., 3.) to organize multiple tasks');
    } else if (taskCount > 8) {
      issues.push(`Prompt contains many tasks (${taskCount} detected)`);
      suggestions.push('Consider breaking this into multiple focused prompts');
    }
    
    if (!numberedSteps.hasNumbering && taskCount > 3) {
      issues.push('Multiple tasks lack numbered organization');
      suggestions.push('Add step numbers to clarify sequence and priority');
    }
    
    if (numberedSteps.hasNumbering && numberedSteps.type === 'bullet') {
      suggestions.push('Consider using numbered steps (1., 2., 3.) instead of bullets for clearer sequencing');
    }
    
    if (!hasGoal && wordCount > 50) {
      issues.push('No clear goal or objective stated');
      suggestions.push('Start with "Goal:" or "Objective:" to clarify what you want to achieve');
    }
    
    if (ambiguousScope.count > 3) {
      issues.push(`Found ${ambiguousScope.count} ambiguous scope terms`);
      suggestions.push(`Be more specific instead of using: ${ambiguousScope.terms.slice(0, 4).join(', ')}`);
    }
    
    if (broadScope.count > 2) {
      issues.push('Scope may be too broad or open-ended');
      suggestions.push(`Narrow scope by replacing terms like: ${broadScope.indicators.slice(0, 3).join(', ')}`);
    }
    
    if (taskSeparators.count > 5) {
      issues.push('Many task transitions detected - prompt may be unfocused');
      suggestions.push('Group related tasks or split into separate prompts');
    }
    
    if (structure.sectionCount > 7) {
      issues.push('Too many sections may indicate scope creep');
      suggestions.push('Consolidate related sections or create separate prompts');
    }
    
    if (score >= 20) {
      if (numberedSteps.hasNumbering) {
        suggestions.push('Excellent task structure! Steps are clear and well-organized.');
      } else {
        suggestions.push('Good task clarity with focused scope.');
      }
    }
    
    return { score, issues, suggestions };
  }
};
