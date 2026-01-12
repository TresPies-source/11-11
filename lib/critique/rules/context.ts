import type { CritiqueRule, DimensionResult, RuleContext } from '../types';

const AUDIENCE_INDICATORS = [
  'audience', 'user', 'reader', 'developer', 'engineer', 'designer',
  'team', 'stakeholder', 'customer', 'client', 'beginner', 'expert',
  'professional', 'student', 'researcher', 'analyst', 'manager'
];

const INPUT_INDICATORS = [
  'input', 'given', 'provided', 'receive', 'accept', 'take',
  'parameter', 'argument', 'data', 'information', 'context'
];

const OUTPUT_INDICATORS = [
  'output', 'return', 'produce', 'generate', 'create', 'deliver',
  'result', 'outcome', 'response', 'answer', 'solution'
];

const BACKGROUND_INDICATORS = [
  'background', 'context', 'assume', 'requirement', 'constraint',
  'limitation', 'prerequisite', 'dependency', 'environment', 'setting'
];

const VAGUE_TERMS = [
  'something', 'somehow', 'whatever', 'anything', 'everything',
  'various', 'some', 'any', 'several', 'certain'
];

function normalizeText(text: string): string {
  return text.toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function hasIndicators(content: string, indicators: string[]): { found: boolean; matches: string[] } {
  const normalized = normalizeText(content);
  const matches: string[] = [];
  
  indicators.forEach(indicator => {
    const regex = new RegExp(`\\b${indicator}\\b`, 'gi');
    if (content.match(regex)) {
      matches.push(indicator);
    }
  });
  
  return { found: matches.length > 0, matches };
}

function detectVagueTerms(content: string): { count: number; terms: string[] } {
  const normalized = normalizeText(content);
  const foundTerms = new Set<string>();
  let count = 0;

  VAGUE_TERMS.forEach(term => {
    const regex = new RegExp(`\\b${term}\\b`, 'gi');
    const matches = content.match(regex);
    if (matches) {
      count += matches.length;
      foundTerms.add(term);
    }
  });

  return { count, terms: Array.from(foundTerms) };
}

function checkAudienceDefinition(content: string): { defined: boolean; strength: number } {
  const audienceCheck = hasIndicators(content, AUDIENCE_INDICATORS);
  
  if (!audienceCheck.found) {
    return { defined: false, strength: 0 };
  }
  
  const strength = Math.min(audienceCheck.matches.length / 2, 1.0);
  return { defined: true, strength };
}

function checkInputOutputSpec(content: string): { 
  hasInput: boolean; 
  hasOutput: boolean; 
  clarity: number 
} {
  const inputCheck = hasIndicators(content, INPUT_INDICATORS);
  const outputCheck = hasIndicators(content, OUTPUT_INDICATORS);
  
  const hasInput = inputCheck.found;
  const hasOutput = outputCheck.found;
  
  let clarity = 0;
  if (hasInput) clarity += 0.5;
  if (hasOutput) clarity += 0.5;
  
  if (hasInput && hasOutput) {
    clarity += 0.2;
  }
  
  return { hasInput, hasOutput, clarity: Math.min(clarity, 1.0) };
}

function checkBackgroundInfo(content: string): { hasBackground: boolean; depth: number } {
  const backgroundCheck = hasIndicators(content, BACKGROUND_INDICATORS);
  
  if (!backgroundCheck.found) {
    return { hasBackground: false, depth: 0 };
  }
  
  const wordCount = content.trim().split(/\s+/).length;
  const backgroundSentenceEstimate = backgroundCheck.matches.length * 10;
  const depth = Math.min(backgroundSentenceEstimate / wordCount, 1.0);
  
  return { hasBackground: true, depth };
}

function calculateScore(
  audienceStrength: number,
  ioClarity: number,
  backgroundDepth: number,
  vagueTermCount: number,
  wordCount: number
): number {
  let score = 0;
  
  score += audienceStrength * 8;
  
  score += ioClarity * 10;
  
  score += backgroundDepth * 7;
  
  const vaguePenalty = Math.min((vagueTermCount / wordCount) * 50, 5);
  score -= vaguePenalty;
  
  return Math.max(0, Math.min(25, Math.round(score)));
}

export const contextRule: CritiqueRule = {
  name: 'Context',
  maxScore: 25,
  
  execute(context: RuleContext): DimensionResult {
    const content = context.content || '';
    
    if (!content.trim()) {
      return {
        score: 0,
        issues: ['No content provided'],
        suggestions: ['Add context to your prompt including audience, inputs/outputs, and background']
      };
    }
    
    const wordCount = content.trim().split(/\s+/).length;
    
    const audienceCheck = checkAudienceDefinition(content);
    const ioCheck = checkInputOutputSpec(content);
    const backgroundCheck = checkBackgroundInfo(content);
    const vagueCheck = detectVagueTerms(content);
    
    const score = calculateScore(
      audienceCheck.strength,
      ioCheck.clarity,
      backgroundCheck.depth,
      vagueCheck.count,
      wordCount
    );
    
    const issues: string[] = [];
    const suggestions: string[] = [];
    
    if (!audienceCheck.defined) {
      issues.push('No clear audience defined');
      suggestions.push('Specify who this prompt is for (e.g., "for developers", "for beginners", "for data analysts")');
    } else if (audienceCheck.strength < 0.5) {
      issues.push('Audience definition could be clearer');
      suggestions.push('Be more specific about your target audience');
    }
    
    if (!ioCheck.hasInput && !ioCheck.hasOutput) {
      issues.push('No clear input/output specification');
      suggestions.push('Specify what information you\'re providing and what you expect in return');
    } else if (!ioCheck.hasInput) {
      issues.push('Missing input specification');
      suggestions.push('Clarify what information or context you\'re providing');
    } else if (!ioCheck.hasOutput) {
      issues.push('Missing output specification');
      suggestions.push('Define what result or output you expect');
    }
    
    if (!backgroundCheck.hasBackground) {
      issues.push('Insufficient background information');
      suggestions.push('Add relevant context, constraints, or assumptions');
    } else if (backgroundCheck.depth < 0.3) {
      issues.push('Background information could be more detailed');
      suggestions.push('Provide more context about requirements, constraints, or environment');
    }
    
    if (vagueCheck.count > 0) {
      const percentage = ((vagueCheck.count / wordCount) * 100).toFixed(1);
      issues.push(`Found ${vagueCheck.count} vague terms (${percentage}% of text)`);
      suggestions.push(`Replace vague terms with specific details: ${vagueCheck.terms.slice(0, 5).join(', ')}`);
    }
    
    if (score >= 20) {
      suggestions.push('Excellent context! Your prompt provides clear background and specifications.');
    } else if (score >= 15) {
      suggestions.push('Good context overall, but some improvements possible.');
    }
    
    return { score, issues, suggestions };
  }
};
