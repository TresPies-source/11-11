import type { CritiqueRule, DimensionResult, RuleContext } from '../types';

const VAGUE_TERMS = [
  'good', 'bad', 'nice', 'better', 'best', 'worst', 'optimal', 'efficient',
  'effective', 'great', 'awesome', 'amazing', 'terrible', 'poor', 'excellent',
  'quality', 'high-quality', 'low-quality', 'appropriate', 'suitable',
  'proper', 'correct', 'right', 'wrong', 'useful', 'helpful', 'important',
  'significant', 'relevant', 'various', 'several', 'many', 'few', 'some',
  'most', 'often', 'rarely', 'sometimes', 'usually', 'generally', 'typically'
];

const VAGUE_QUALIFIERS = [
  'as much as possible', 'as needed', 'if necessary', 'when appropriate',
  'where applicable', 'to some extent', 'in many cases', 'for the most part',
  'more or less', 'roughly', 'approximately', 'around', 'about'
];

const NUMBER_REGEX = /\b\d+(\.\d+)?(%|ms|s|px|em|rem|kb|mb|gb)?\b/gi;
const EXAMPLE_INDICATORS = /\b(example|e\.g\.|for instance|such as|like|including)\b/gi;
const CONSTRAINT_INDICATORS = /\b(must|should|required|cannot|limited to|at least|at most|exactly|between|within)\b/gi;
const SUCCESS_CRITERIA_INDICATORS = /\b(success|complete|done|finished|achieve|accomplish|result in|output|produce)\b/gi;

function normalizeText(text: string): string {
  return text.toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function detectVagueTerms(content: string): { count: number; terms: string[] } {
  const normalized = normalizeText(content);
  const foundVague = new Set<string>();
  let count = 0;

  VAGUE_TERMS.forEach(term => {
    const regex = new RegExp(`\\b${term}\\b`, 'gi');
    const matches = content.match(regex);
    if (matches) {
      count += matches.length;
      foundVague.add(term);
    }
  });

  VAGUE_QUALIFIERS.forEach(qualifier => {
    const regex = new RegExp(`\\b${qualifier.replace(/\s+/g, '\\s+')}\\b`, 'gi');
    const matches = content.match(regex);
    if (matches) {
      count += matches.length;
      foundVague.add(qualifier);
    }
  });

  return { count, terms: Array.from(foundVague) };
}

function detectConcreteElements(content: string): {
  numbers: number;
  examples: number;
  constraints: number;
  successCriteria: number;
} {
  const numberMatches = content.match(NUMBER_REGEX);
  const exampleMatches = content.match(EXAMPLE_INDICATORS);
  const constraintMatches = content.match(CONSTRAINT_INDICATORS);
  const successMatches = content.match(SUCCESS_CRITERIA_INDICATORS);

  return {
    numbers: numberMatches?.length || 0,
    examples: exampleMatches?.length || 0,
    constraints: constraintMatches?.length || 0,
    successCriteria: successMatches?.length || 0,
  };
}

function hasCodeBlocks(content: string): boolean {
  return /```[\s\S]*?```|`[^`]+`/.test(content);
}

function hasListStructure(content: string): boolean {
  const listItems = content.match(/^[\s]*[-*\d]+\.?\s+/gm);
  return (listItems?.length || 0) >= 2;
}

function calculateScore(
  vagueCount: number,
  concrete: ReturnType<typeof detectConcreteElements>,
  wordCount: number,
  hasCode: boolean,
  hasList: boolean
): number {
  if (wordCount === 0) return 25;
  
  let score = 25;
  
  // Penalize vague terms (up to -12 points)
  const vaguePenalty = Math.min((vagueCount / wordCount) * 150, 12);
  score -= vaguePenalty;
  
  // Reward concrete numbers (up to +4 points)
  const numberBonus = Math.min(concrete.numbers * 0.5, 4);
  score += numberBonus;
  
  // Reward examples (up to +3 points)
  const exampleBonus = Math.min(concrete.examples * 1.5, 3);
  score += exampleBonus;
  
  // Reward constraints (up to +3 points)
  const constraintBonus = Math.min(concrete.constraints * 0.5, 3);
  score += constraintBonus;
  
  // Reward success criteria (up to +2 points)
  const successBonus = Math.min(concrete.successCriteria * 0.5, 2);
  score += successBonus;
  
  // Reward code blocks (concrete examples) (up to +2 points)
  if (hasCode) {
    score += 2;
  }
  
  // Reward structured lists (up to +1 point)
  if (hasList) {
    score += 1;
  }
  
  return Math.max(0, Math.min(25, Math.round(score)));
}

export const specificityRule: CritiqueRule = {
  name: 'Specificity',
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
    
    const vagueAnalysis = detectVagueTerms(content);
    const concrete = detectConcreteElements(content);
    const hasCode = hasCodeBlocks(content);
    const hasList = hasListStructure(content);
    
    const score = calculateScore(
      vagueAnalysis.count,
      concrete,
      wordCount,
      hasCode,
      hasList
    );
    
    const issues: string[] = [];
    const suggestions: string[] = [];
    
    // Flag vague terms
    if (vagueAnalysis.count > 0) {
      const percentage = ((vagueAnalysis.count / wordCount) * 100).toFixed(1);
      issues.push(`Found ${vagueAnalysis.count} vague terms (${percentage}% of text)`);
      
      const topVague = vagueAnalysis.terms.slice(0, 5).join(', ');
      suggestions.push(`Replace vague terms with specific details: ${topVague}`);
    }
    
    // Check for concrete numbers
    if (concrete.numbers === 0 && wordCount > 20) {
      issues.push('No specific numbers or measurements found');
      suggestions.push('Add concrete numbers, percentages, or measurements where applicable');
    }
    
    // Check for examples
    if (concrete.examples === 0 && wordCount > 30) {
      issues.push('No examples provided');
      suggestions.push('Include concrete examples (e.g., "for instance, when X happens...")');
    }
    
    // Check for constraints
    if (concrete.constraints < 2 && wordCount > 30) {
      issues.push('Few or no constraints specified');
      suggestions.push('Define clear constraints using "must", "should", "cannot", "limited to", etc.');
    }
    
    // Check for success criteria
    if (concrete.successCriteria === 0 && wordCount > 40) {
      issues.push('No clear success criteria defined');
      suggestions.push('Specify what a successful outcome looks like');
    }
    
    // Positive feedback
    if (concrete.numbers > 2) {
      suggestions.push('Good use of specific numbers and measurements!');
    }
    
    if (hasCode) {
      suggestions.push('Excellent use of code examples for clarity!');
    }
    
    if (concrete.examples >= 2 && concrete.constraints >= 2) {
      suggestions.push('Strong specificity with examples and constraints!');
    }
    
    if (score === 25 && wordCount > 0) {
      suggestions.push('Excellent specificity! Your prompt is concrete and well-defined.');
    }
    
    return { score, issues, suggestions };
  }
};
