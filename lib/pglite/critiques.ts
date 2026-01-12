import { getDB } from './client';
import type { CritiqueInsert, CritiqueRow } from './types';
import type { CritiqueResult } from '../types';

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

export async function saveCritique(
  promptId: string,
  critique: Omit<CritiqueResult, 'id' | 'promptId' | 'createdAt'>
): Promise<CritiqueResult | null> {
  try {
    const db = await getDB();
    const insert: CritiqueInsert = mapCritiqueResultToInsert(promptId, critique);
    
    const result = await db.query(`
      INSERT INTO critiques (
        prompt_id, 
        score, 
        conciseness_score, 
        specificity_score, 
        context_score, 
        task_decomposition_score, 
        feedback
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [
      insert.prompt_id,
      insert.score,
      insert.conciseness_score,
      insert.specificity_score,
      insert.context_score,
      insert.task_decomposition_score,
      JSON.stringify(insert.feedback)
    ]);

    if (result.rows.length === 0) {
      console.error('[Critiques] No data returned from insert');
      return null;
    }

    return mapCritiqueRowToResult(result.rows[0] as CritiqueRow);
  } catch (error) {
    console.error('[Critiques] Exception saving critique:', error);
    return null;
  }
}

export async function getLatestCritique(
  promptId: string
): Promise<CritiqueResult | null> {
  try {
    const db = await getDB();
    
    const result = await db.query(`
      SELECT * FROM critiques
      WHERE prompt_id = $1
      ORDER BY created_at DESC
      LIMIT 1
    `, [promptId]);

    if (result.rows.length === 0) {
      return null;
    }

    return mapCritiqueRowToResult(result.rows[0] as CritiqueRow);
  } catch (error) {
    console.error('[Critiques] Exception fetching latest critique:', error);
    return null;
  }
}

export async function getCritiqueHistory(
  promptId: string
): Promise<CritiqueResult[]> {
  try {
    const db = await getDB();
    
    const result = await db.query(`
      SELECT * FROM critiques
      WHERE prompt_id = $1
      ORDER BY created_at DESC
    `, [promptId]);

    return result.rows.map(row => mapCritiqueRowToResult(row as CritiqueRow));
  } catch (error) {
    console.error('[Critiques] Exception fetching critique history:', error);
    return [];
  }
}

export async function updateCritique(
  critiqueId: string,
  update: Partial<CritiqueInsert>
): Promise<CritiqueResult | null> {
  try {
    const db = await getDB();
    
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (update.score !== undefined) {
      fields.push(`score = $${paramCount++}`);
      values.push(update.score);
    }
    if (update.conciseness_score !== undefined) {
      fields.push(`conciseness_score = $${paramCount++}`);
      values.push(update.conciseness_score);
    }
    if (update.specificity_score !== undefined) {
      fields.push(`specificity_score = $${paramCount++}`);
      values.push(update.specificity_score);
    }
    if (update.context_score !== undefined) {
      fields.push(`context_score = $${paramCount++}`);
      values.push(update.context_score);
    }
    if (update.task_decomposition_score !== undefined) {
      fields.push(`task_decomposition_score = $${paramCount++}`);
      values.push(update.task_decomposition_score);
    }
    if (update.feedback !== undefined) {
      fields.push(`feedback = $${paramCount++}`);
      values.push(JSON.stringify(update.feedback));
    }

    if (fields.length === 0) {
      const getResult = await db.query('SELECT * FROM critiques WHERE id = $1', [critiqueId]);
      return getResult.rows[0] ? mapCritiqueRowToResult(getResult.rows[0] as CritiqueRow) : null;
    }

    values.push(critiqueId);

    const result = await db.query(`
      UPDATE critiques 
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `, values);

    return result.rows[0] ? mapCritiqueRowToResult(result.rows[0] as CritiqueRow) : null;
  } catch (error) {
    console.error('[Critiques] Exception updating critique:', error);
    return null;
  }
}
