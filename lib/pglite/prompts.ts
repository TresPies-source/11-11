import { getDB } from './client';
import type { PromptRow, PromptInsert, PromptUpdate, PromptStatus, StatusHistoryEntry } from './types';
import type { DriveFile } from '@/lib/types';
import matter from 'gray-matter';
import { isValidTransition } from './statusTransitions';

export interface PromptFilters {
  tags?: string[];
  minScore?: number;
  maxScore?: number;
  searchQuery?: string;
}

export interface PromptWithCritique extends PromptRow {
  latestCritique?: {
    score: number;
    conciseness_score: number;
    specificity_score: number;
    context_score: number;
    task_decomposition_score: number;
  } | null;
  metadata?: {
    description: string | null;
    tags: string[] | null;
    is_public: boolean;
    author: string | null;
    version: string | null;
  } | null;
}

export async function getPromptsByStatus(
  userId: string,
  status: PromptStatus
): Promise<PromptWithCritique[]> {
  const db = await getDB();
  
  const result = await db.query(`
    SELECT 
      p.*,
      json_build_object(
        'score', c.score,
        'conciseness_score', c.conciseness_score,
        'specificity_score', c.specificity_score,
        'context_score', c.context_score,
        'task_decomposition_score', c.task_decomposition_score
      ) as "latestCritique",
      json_build_object(
        'description', pm.description,
        'tags', pm.tags,
        'is_public', pm.is_public,
        'author', pm.author,
        'version', pm.version
      ) as "metadata"
    FROM prompts p
    LEFT JOIN LATERAL (
      SELECT * FROM critiques 
      WHERE prompt_id = p.id 
      ORDER BY created_at DESC 
      LIMIT 1
    ) c ON true
    LEFT JOIN prompt_metadata pm ON pm.prompt_id = p.id
    WHERE p.user_id = $1 AND p.status = $2
    ORDER BY p.updated_at DESC
  `, [userId, status]);

  return result.rows.map((row: any) => ({
    ...row,
    latestCritique: row.latestCritique?.score ? row.latestCritique : null,
    metadata: row.metadata?.description !== null || row.metadata?.tags !== null 
      ? row.metadata 
      : null
  }));
}

export async function getPromptById(
  promptId: string
): Promise<PromptWithCritique | null> {
  const db = await getDB();
  
  const result = await db.query(`
    SELECT 
      p.*,
      json_build_object(
        'score', c.score,
        'conciseness_score', c.conciseness_score,
        'specificity_score', c.specificity_score,
        'context_score', c.context_score,
        'task_decomposition_score', c.task_decomposition_score
      ) as "latestCritique",
      json_build_object(
        'description', pm.description,
        'tags', pm.tags,
        'is_public', pm.is_public,
        'author', pm.author,
        'version', pm.version
      ) as "metadata"
    FROM prompts p
    LEFT JOIN LATERAL (
      SELECT * FROM critiques 
      WHERE prompt_id = p.id 
      ORDER BY created_at DESC 
      LIMIT 1
    ) c ON true
    LEFT JOIN prompt_metadata pm ON pm.prompt_id = p.id
    WHERE p.id = $1
  `, [promptId]);

  if (result.rows.length === 0) {
    return null;
  }

  const row: any = result.rows[0];
  return {
    ...row,
    latestCritique: row.latestCritique?.score ? row.latestCritique : null,
    metadata: row.metadata?.description !== null || row.metadata?.tags !== null 
      ? row.metadata 
      : null
  };
}

export async function createPrompt(
  insert: PromptInsert
): Promise<PromptRow> {
  const db = await getDB();
  
  const result = await db.query(`
    INSERT INTO prompts (user_id, title, content, status, drive_file_id)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `, [
    insert.user_id,
    insert.title,
    insert.content,
    insert.status,
    insert.drive_file_id || null
  ]);

  return result.rows[0] as PromptRow;
}

export async function updatePrompt(
  promptId: string,
  update: PromptUpdate
): Promise<PromptRow | null> {
  const db = await getDB();
  
  const fields: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  if (update.title !== undefined) {
    fields.push(`title = $${paramCount++}`);
    values.push(update.title);
  }
  if (update.content !== undefined) {
    fields.push(`content = $${paramCount++}`);
    values.push(update.content);
  }
  if (update.status !== undefined) {
    fields.push(`status = $${paramCount++}`);
    values.push(update.status);
  }
  if (update.drive_file_id !== undefined) {
    fields.push(`drive_file_id = $${paramCount++}`);
    values.push(update.drive_file_id);
  }

  if (fields.length === 0) {
    const getResult = await db.query('SELECT * FROM prompts WHERE id = $1', [promptId]);
    return (getResult.rows[0] as PromptRow) || null;
  }

  values.push(promptId);

  const result = await db.query(`
    UPDATE prompts 
    SET ${fields.join(', ')}
    WHERE id = $${paramCount}
    RETURNING *
  `, values);

  return (result.rows[0] as PromptRow) || null;
}

export async function updatePromptStatus(
  promptId: string,
  status: PromptStatus
): Promise<void> {
  const db = await getDB();
  
  await db.query(`
    UPDATE prompts 
    SET status = $1, updated_at = NOW()
    WHERE id = $2
  `, [status, promptId]);
}

export async function updatePromptStatusWithHistory(
  promptId: string,
  newStatus: PromptStatus,
  userId: string
): Promise<void> {
  const db = await getDB();
  
  const currentResult = await db.query(
    'SELECT status, status_history FROM prompts WHERE id = $1',
    [promptId]
  );
  
  if (currentResult.rows.length === 0) {
    throw new Error('Prompt not found');
  }
  
  const row = currentResult.rows[0] as { status: PromptStatus; status_history: StatusHistoryEntry[] };
  const currentStatus = row.status;
  
  if (!isValidTransition(currentStatus, newStatus)) {
    throw new Error(`Invalid transition from ${currentStatus} to ${newStatus}`);
  }
  
  const historyEntry: StatusHistoryEntry = {
    from: currentStatus,
    to: newStatus,
    timestamp: new Date().toISOString(),
    user_id: userId,
  };
  
  await db.query(`
    UPDATE prompts 
    SET 
      status = $1, 
      status_history = status_history || $2::jsonb,
      updated_at = NOW()
    WHERE id = $3
  `, [newStatus, JSON.stringify([historyEntry]), promptId]);
}

export async function deletePrompt(promptId: string): Promise<void> {
  const db = await getDB();
  
  await db.query('DELETE FROM prompts WHERE id = $1', [promptId]);
}

export async function syncDriveFile(
  userId: string,
  driveFile: DriveFile & { content?: string }
): Promise<PromptRow> {
  const db = await getDB();
  
  const { data: frontmatter, content: parsedContent } = matter(driveFile.content || '');
  const metadata = frontmatter as any;
  
  const title = driveFile.name.replace(/\.md$/, '');
  const status: PromptStatus = metadata.status || 'draft';

  const existingResult = await db.query(
    'SELECT * FROM prompts WHERE drive_file_id = $1',
    [driveFile.id]
  );

  if (existingResult.rows.length > 0) {
    const existingPrompt: any = existingResult.rows[0];
    
    const updateResult = await db.query(`
      UPDATE prompts
      SET title = $1, content = $2, status = $3, updated_at = $4
      WHERE id = $5
      RETURNING *
    `, [title, parsedContent, status, driveFile.modifiedTime, existingPrompt.id]);

    if (metadata.description || metadata.tags || metadata.author || metadata.version) {
      await db.query(`
        INSERT INTO prompt_metadata (prompt_id, description, tags, is_public, author, version)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (prompt_id) 
        DO UPDATE SET 
          description = EXCLUDED.description,
          tags = EXCLUDED.tags,
          is_public = EXCLUDED.is_public,
          author = EXCLUDED.author,
          version = EXCLUDED.version
      `, [
        existingPrompt.id,
        metadata.description || null,
        metadata.tags || null,
        metadata.public || false,
        metadata.author || null,
        metadata.version || null
      ]);
    }

    return updateResult.rows[0] as PromptRow;
  } else {
    const insertResult = await db.query(`
      INSERT INTO prompts (user_id, title, content, status, drive_file_id, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [
      userId,
      title,
      parsedContent,
      status,
      driveFile.id,
      driveFile.modifiedTime,
      driveFile.modifiedTime
    ]);

    const newPrompt: any = insertResult.rows[0];

    if (metadata.description || metadata.tags || metadata.author || metadata.version) {
      await db.query(`
        INSERT INTO prompt_metadata (prompt_id, description, tags, is_public, author, version)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        newPrompt.id,
        metadata.description || null,
        metadata.tags || null,
        metadata.public || false,
        metadata.author || null,
        metadata.version || null
      ]);
    }

    return newPrompt as PromptRow;
  }
}

export async function searchPrompts(
  userId: string,
  query: string,
  filters: PromptFilters = {}
): Promise<PromptWithCritique[]> {
  const db = await getDB();
  
  let sql = `
    SELECT 
      p.*,
      json_build_object(
        'score', c.score,
        'conciseness_score', c.conciseness_score,
        'specificity_score', c.specificity_score,
        'context_score', c.context_score,
        'task_decomposition_score', c.task_decomposition_score
      ) as "latestCritique",
      json_build_object(
        'description', pm.description,
        'tags', pm.tags,
        'is_public', pm.is_public,
        'author', pm.author,
        'version', pm.version
      ) as "metadata"
    FROM prompts p
    LEFT JOIN LATERAL (
      SELECT * FROM critiques 
      WHERE prompt_id = p.id 
      ORDER BY created_at DESC 
      LIMIT 1
    ) c ON true
    LEFT JOIN prompt_metadata pm ON pm.prompt_id = p.id
    WHERE p.user_id = $1
  `;

  const params: any[] = [userId];
  let paramCount = 2;

  if (query) {
    sql += ` AND (p.title ILIKE $${paramCount} OR p.content ILIKE $${paramCount} OR pm.description ILIKE $${paramCount})`;
    params.push(`%${query}%`);
    paramCount++;
  }

  if (filters.tags && filters.tags.length > 0) {
    sql += ` AND pm.tags && $${paramCount}`;
    params.push(filters.tags);
    paramCount++;
  }

  sql += ' ORDER BY p.updated_at DESC';

  const result = await db.query(sql, params);

  let prompts: PromptWithCritique[] = result.rows.map((row: any) => ({
    ...row,
    latestCritique: row.latestCritique?.score ? row.latestCritique : null,
    metadata: row.metadata?.description !== null || row.metadata?.tags !== null 
      ? row.metadata 
      : null
  }));

  if (filters.minScore !== undefined) {
    prompts = prompts.filter(
      p => (p.latestCritique?.score || 0) >= filters.minScore!
    );
  }

  if (filters.maxScore !== undefined) {
    prompts = prompts.filter(
      p => (p.latestCritique?.score || 0) <= filters.maxScore!
    );
  }

  return prompts;
}

export async function syncPromptFromDrive(
  fileMetadata: Omit<DriveFile, 'content'>,
  userId: string,
  content: string
): Promise<PromptRow> {
  return syncDriveFile(userId, { ...fileMetadata, content });
}
