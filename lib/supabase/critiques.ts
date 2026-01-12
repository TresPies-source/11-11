import { getSupabaseClient } from './client';
import type { CritiqueInsert, CritiqueRow } from './types';
import type { CritiqueResult } from '../types';

const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true';

function mapCritiqueRowToResult(row: CritiqueRow): CritiqueResult {
  return {
    id: row.id,
    promptId: row.prompt_id,
    score: row.score,
    concisenessScore: row.conciseness_score,
    specificityScore: row.specificity_score,
    contextScore: row.context_score,
    taskDecompositionScore: row.task_decomposition_score,
    feedback: row.feedback || {
      conciseness: { score: 0, issues: [], suggestions: [] },
      specificity: { score: 0, issues: [], suggestions: [] },
      context: { score: 0, issues: [], suggestions: [] },
      taskDecomposition: { score: 0, issues: [], suggestions: [] },
    },
    createdAt: row.created_at,
  };
}

function mapCritiqueResultToInsert(
  promptId: string,
  critique: Omit<CritiqueResult, 'id' | 'promptId' | 'createdAt'>
): CritiqueInsert {
  return {
    prompt_id: promptId,
    score: critique.score,
    conciseness_score: critique.concisenessScore,
    specificity_score: critique.specificityScore,
    context_score: critique.contextScore,
    task_decomposition_score: critique.taskDecompositionScore,
    feedback: critique.feedback,
  };
}

function getMockCritique(promptId: string): CritiqueResult {
  const score = 50 + Math.floor(Math.random() * 40);
  const concisenessScore = Math.min(25, score / 4 + Math.random() * 10);
  const specificityScore = Math.min(25, score / 4 + Math.random() * 10);
  const contextScore = Math.min(25, score / 4 + Math.random() * 10);
  const taskDecompositionScore = Math.min(25, score / 4 + Math.random() * 10);

  return {
    id: `mock-critique-${promptId}`,
    promptId,
    score,
    concisenessScore,
    specificityScore,
    contextScore,
    taskDecompositionScore,
    feedback: {
      conciseness: {
        score: concisenessScore,
        issues: ['Contains filler words like "basically" and "really"'],
        suggestions: ['Remove unnecessary qualifiers to make prompt more direct'],
      },
      specificity: {
        score: specificityScore,
        issues: ['Uses vague terms like "good" and "better"'],
        suggestions: ['Add specific metrics or examples for desired output'],
      },
      context: {
        score: contextScore,
        issues: ['Missing audience specification'],
        suggestions: ['Define who will use the output and their expertise level'],
      },
      taskDecomposition: {
        score: taskDecompositionScore,
        issues: ['Multiple tasks combined in one prompt'],
        suggestions: ['Break into numbered steps for clarity'],
      },
    },
    createdAt: new Date().toISOString(),
  };
}

export async function saveCritique(
  promptId: string,
  critique: Omit<CritiqueResult, 'id' | 'promptId' | 'createdAt'>
): Promise<CritiqueResult | null> {
  if (isDevMode) {
    console.log('[Critiques] Dev mode - returning mock critique');
    return getMockCritique(promptId);
  }

  const client = getSupabaseClient();
  if (!client) {
    console.error('[Critiques] Supabase client not available');
    return null;
  }

  try {
    const insert: CritiqueInsert = mapCritiqueResultToInsert(promptId, critique);
    const { data, error } = await client
      .from('critiques')
      .insert(insert as any)
      .select()
      .single();

    if (error) {
      console.error('[Critiques] Error saving critique:', error);
      return null;
    }

    if (!data) {
      console.error('[Critiques] No data returned from insert');
      return null;
    }

    return mapCritiqueRowToResult(data as CritiqueRow);
  } catch (error) {
    console.error('[Critiques] Exception saving critique:', error);
    return null;
  }
}

export async function getLatestCritique(
  promptId: string
): Promise<CritiqueResult | null> {
  if (isDevMode) {
    console.log('[Critiques] Dev mode - returning mock critique');
    return getMockCritique(promptId);
  }

  const client = getSupabaseClient();
  if (!client) {
    console.error('[Critiques] Supabase client not available');
    return null;
  }

  try {
    const { data, error } = await client
      .from('critiques')
      .select('*')
      .eq('prompt_id', promptId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('[Critiques] Error fetching latest critique:', error);
      return null;
    }

    return mapCritiqueRowToResult(data);
  } catch (error) {
    console.error('[Critiques] Exception fetching latest critique:', error);
    return null;
  }
}

export async function getCritiqueHistory(
  promptId: string
): Promise<CritiqueResult[]> {
  if (isDevMode) {
    console.log('[Critiques] Dev mode - returning mock critique history');
    return [
      getMockCritique(promptId),
      {
        ...getMockCritique(promptId),
        id: `mock-critique-${promptId}-old`,
        score: 45,
        createdAt: new Date(Date.now() - 86400000).toISOString(),
      },
    ];
  }

  const client = getSupabaseClient();
  if (!client) {
    console.error('[Critiques] Supabase client not available');
    return [];
  }

  try {
    const { data, error } = await client
      .from('critiques')
      .select('*')
      .eq('prompt_id', promptId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Critiques] Error fetching critique history:', error);
      return [];
    }

    return data.map(mapCritiqueRowToResult);
  } catch (error) {
    console.error('[Critiques] Exception fetching critique history:', error);
    return [];
  }
}
