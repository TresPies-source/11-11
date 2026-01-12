import { concisenessRule } from './rules/conciseness';
import { specificityRule } from './rules/specificity';
import { contextRule } from './rules/context';
import { taskDecompositionRule } from './rules/taskDecomposition';
import type { RuleContext, CritiqueEngineOptions } from './types';
import type { CritiqueFeedback } from '../types';

export interface CritiqueEngineResult {
  score: number;
  concisenessScore: number;
  specificityScore: number;
  contextScore: number;
  taskDecompositionScore: number;
  feedback: CritiqueFeedback;
  executionTime: number;
}

const DEFAULT_TIMEOUT = 5000;

export async function critiquePrompt(
  content: string,
  options: CritiqueEngineOptions = {}
): Promise<CritiqueEngineResult> {
  const startTime = performance.now();
  const timeout = options.timeout || DEFAULT_TIMEOUT;

  const context: RuleContext = {
    content,
  };

  const executeWithTimeout = async <T>(
    fn: () => T,
    timeoutMs: number
  ): Promise<T> => {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Execution timeout after ${timeoutMs}ms`));
      }, timeoutMs);

      try {
        const result = fn();
        clearTimeout(timer);
        resolve(result);
      } catch (error) {
        clearTimeout(timer);
        reject(error);
      }
    });
  };

  try {
    const [
      concisenessResult,
      specificityResult,
      contextResult,
      taskDecompositionResult,
    ] = await Promise.all([
      executeWithTimeout(() => concisenessRule.execute(context), timeout),
      executeWithTimeout(() => specificityRule.execute(context), timeout),
      executeWithTimeout(() => contextRule.execute(context), timeout),
      executeWithTimeout(() => taskDecompositionRule.execute(context), timeout),
    ]);

    const totalScore =
      concisenessResult.score +
      specificityResult.score +
      contextResult.score +
      taskDecompositionResult.score;

    const feedback: CritiqueFeedback = {
      conciseness: {
        score: concisenessResult.score,
        issues: concisenessResult.issues,
        suggestions: concisenessResult.suggestions,
      },
      specificity: {
        score: specificityResult.score,
        issues: specificityResult.issues,
        suggestions: specificityResult.suggestions,
      },
      context: {
        score: contextResult.score,
        issues: contextResult.issues,
        suggestions: contextResult.suggestions,
      },
      taskDecomposition: {
        score: taskDecompositionResult.score,
        issues: taskDecompositionResult.issues,
        suggestions: taskDecompositionResult.suggestions,
      },
    };

    const executionTime = performance.now() - startTime;

    return {
      score: totalScore,
      concisenessScore: concisenessResult.score,
      specificityScore: specificityResult.score,
      contextScore: contextResult.score,
      taskDecompositionScore: taskDecompositionResult.score,
      feedback,
      executionTime,
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes('timeout')) {
      throw new Error(
        `Critique engine timed out after ${timeout}ms. Try reducing input size.`
      );
    }
    throw error;
  }
}

export function critiquePromptSync(content: string): CritiqueEngineResult {
  const startTime = performance.now();

  const context: RuleContext = {
    content,
  };

  const concisenessResult = concisenessRule.execute(context);
  const specificityResult = specificityRule.execute(context);
  const contextResult = contextRule.execute(context);
  const taskDecompositionResult = taskDecompositionRule.execute(context);

  const totalScore =
    concisenessResult.score +
    specificityResult.score +
    contextResult.score +
    taskDecompositionResult.score;

  const feedback: CritiqueFeedback = {
    conciseness: {
      score: concisenessResult.score,
      issues: concisenessResult.issues,
      suggestions: concisenessResult.suggestions,
    },
    specificity: {
      score: specificityResult.score,
      issues: specificityResult.issues,
      suggestions: specificityResult.suggestions,
    },
    context: {
      score: contextResult.score,
      issues: contextResult.issues,
      suggestions: contextResult.suggestions,
    },
    taskDecomposition: {
      score: taskDecompositionResult.score,
      issues: taskDecompositionResult.issues,
      suggestions: taskDecompositionResult.suggestions,
    },
  };

  const executionTime = performance.now() - startTime;

  return {
    score: totalScore,
    concisenessScore: concisenessResult.score,
    specificityScore: specificityResult.score,
    contextScore: contextResult.score,
    taskDecompositionScore: taskDecompositionResult.score,
    feedback,
    executionTime,
  };
}

export { concisenessRule, specificityRule, contextRule, taskDecompositionRule };
