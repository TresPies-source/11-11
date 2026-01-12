export interface DimensionResult {
  score: number;
  issues: string[];
  suggestions: string[];
}

export interface RuleContext {
  content: string;
  title?: string;
  metadata?: {
    tags?: string[];
    description?: string;
    [key: string]: unknown;
  };
}

export interface CritiqueRule {
  name: string;
  maxScore: number;
  execute(context: RuleContext): DimensionResult;
}

export interface CritiqueEngineOptions {
  maxScore?: number;
  timeout?: number;
}

export interface CritiqueProgress {
  dimension: string;
  progress: number;
  total: number;
}

export type CritiqueDimension = 
  | 'conciseness' 
  | 'specificity' 
  | 'context' 
  | 'taskDecomposition';

export const DIMENSION_MAX_SCORES: Record<CritiqueDimension, number> = {
  conciseness: 25,
  specificity: 25,
  context: 25,
  taskDecomposition: 25,
};
