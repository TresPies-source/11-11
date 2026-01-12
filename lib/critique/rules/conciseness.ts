import type { CritiqueRule, DimensionResult, RuleContext } from '../types';

const FILLER_WORDS = [
  'very', 'really', 'just', 'basically', 'actually', 'literally',
  'simply', 'quite', 'rather', 'somewhat', 'fairly', 'pretty',
  'kind of', 'sort of', 'a bit', 'a little', 'in order to',
  'due to the fact that', 'at this point in time', 'for the purpose of',
  'in the event that', 'with regard to', 'in regards to', 'as a matter of fact'
];

const REDUNDANT_PHRASES = [
  'absolutely essential', 'advance planning', 'added bonus', 'basic fundamentals',
  'completely finished', 'end result', 'final outcome', 'free gift',
  'future plans', 'past history', 'personal opinion', 'true fact',
  'unexpected surprise', 'usual custom'
];

const OPTIMAL_WORD_DENSITY = 0.15;
const MAX_REPEATED_PHRASES = 2;

function normalizeText(text: string): string {
  return text.toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function detectFillerWords(content: string): { count: number; words: string[] } {
  const normalized = normalizeText(content);
  const foundFillers = new Set<string>();
  let count = 0;

  FILLER_WORDS.forEach(filler => {
    const regex = new RegExp(`\\b${filler.replace(/\s+/g, '\\s+')}\\b`, 'gi');
    const matches = content.match(regex);
    if (matches) {
      count += matches.length;
      foundFillers.add(filler);
    }
  });

  return { count, words: Array.from(foundFillers) };
}

function detectRedundantPhrases(content: string): { count: number; phrases: string[] } {
  const normalized = normalizeText(content);
  const foundRedundant = new Set<string>();
  let count = 0;

  REDUNDANT_PHRASES.forEach(phrase => {
    const regex = new RegExp(`\\b${phrase.replace(/\s+/g, '\\s+')}\\b`, 'gi');
    const matches = content.match(regex);
    if (matches) {
      count += matches.length;
      foundRedundant.add(phrase);
    }
  });

  return { count, phrases: Array.from(foundRedundant) };
}

function detectRepeatedPhrases(content: string): { count: number; phrases: string[] } {
  const normalized = normalizeText(content);
  const words = normalized.split(' ');
  const phraseMap = new Map<string, number>();
  const repeatedPhrases = new Set<string>();
  
  for (let length = 3; length <= 6; length++) {
    for (let i = 0; i <= words.length - length; i++) {
      const phrase = words.slice(i, i + length).join(' ');
      if (phrase.length < 10) continue;
      
      const currentCount = phraseMap.get(phrase) || 0;
      phraseMap.set(phrase, currentCount + 1);
      
      if (currentCount + 1 > MAX_REPEATED_PHRASES) {
        repeatedPhrases.add(phrase);
      }
    }
  }

  return { 
    count: repeatedPhrases.size, 
    phrases: Array.from(repeatedPhrases).slice(0, 5)
  };
}

function calculateWordEfficiency(content: string): number {
  if (!content || content.trim().length === 0) return 1.0;
  
  const words = content.trim().split(/\s+/);
  const wordCount = words.length;
  const charCount = content.length;
  
  if (wordCount === 0) return 1.0;
  
  const uniqueWords = new Set(words.map(w => normalizeText(w)));
  const uniqueRatio = uniqueWords.size / wordCount;
  
  const avgWordLength = charCount / wordCount;
  const lengthFactor = Math.min(avgWordLength / 6, 1.0);
  
  return (uniqueRatio + lengthFactor) / 2;
}

function calculateScore(
  fillerCount: number,
  redundantCount: number,
  repeatedCount: number,
  efficiency: number,
  wordCount: number
): number {
  if (wordCount === 0) return 25;
  
  let score = 25;
  
  const fillerPenalty = Math.min((fillerCount / wordCount) * 100, 10);
  score -= fillerPenalty;
  
  const redundantPenalty = Math.min(redundantCount * 2, 5);
  score -= redundantPenalty;
  
  const repeatedPenalty = Math.min(repeatedCount * 1.5, 5);
  score -= repeatedPenalty;
  
  const efficiencyBonus = (efficiency - OPTIMAL_WORD_DENSITY) * 20;
  score += Math.max(Math.min(efficiencyBonus, 5), -5);
  
  return Math.max(0, Math.min(25, Math.round(score)));
}

export const concisenessRule: CritiqueRule = {
  name: 'Conciseness',
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
    
    const fillerAnalysis = detectFillerWords(content);
    const redundantAnalysis = detectRedundantPhrases(content);
    const repeatedAnalysis = detectRepeatedPhrases(content);
    const efficiency = calculateWordEfficiency(content);
    
    const score = calculateScore(
      fillerAnalysis.count,
      redundantAnalysis.count,
      repeatedAnalysis.count,
      efficiency,
      wordCount
    );
    
    const issues: string[] = [];
    const suggestions: string[] = [];
    
    if (fillerAnalysis.count > 0) {
      const percentage = ((fillerAnalysis.count / wordCount) * 100).toFixed(1);
      issues.push(`Found ${fillerAnalysis.count} filler words (${percentage}% of text)`);
      suggestions.push(`Remove or replace filler words: ${fillerAnalysis.words.slice(0, 5).join(', ')}`);
    }
    
    if (redundantAnalysis.count > 0) {
      issues.push(`Found ${redundantAnalysis.count} redundant phrases`);
      suggestions.push(`Simplify redundant phrases: ${redundantAnalysis.phrases.slice(0, 3).join(', ')}`);
    }
    
    if (repeatedAnalysis.count > 0) {
      issues.push(`Detected ${repeatedAnalysis.count} repeated phrases`);
      suggestions.push(`Vary your phrasing or consolidate repeated content`);
    }
    
    if (efficiency < OPTIMAL_WORD_DENSITY) {
      issues.push('Text could be more information-dense');
      suggestions.push('Consider combining sentences or removing unnecessary words');
    }
    
    if (wordCount > 500) {
      issues.push(`Prompt is quite long (${wordCount} words)`);
      suggestions.push('Consider breaking into multiple focused prompts');
    }
    
    if (score === 25 && wordCount > 0) {
      suggestions.push('Excellent conciseness! Your prompt is clear and efficient.');
    }
    
    return { score, issues, suggestions };
  }
};
