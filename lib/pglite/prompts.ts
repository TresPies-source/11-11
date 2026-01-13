import { getDB } from './client';
import type { PromptRow, PromptInsert, PromptUpdate, PromptStatus, StatusHistoryEntry } from './types';
import type { DriveFile } from '@/lib/types';
import matter from 'gray-matter';
import { isValidTransition } from './statusTransitions';
import { autoEmbedOnCreate, autoEmbedOnUpdate } from '@/lib/librarian/auto-embed';

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
    INSERT INTO prompts (
      user_id, title, content, status, drive_file_id,
      published_at, visibility, author_name, author_id
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *
  `, [
    insert.user_id,
    insert.title,
    insert.content,
    insert.status,
    insert.drive_file_id || null,
    insert.published_at || null,
    insert.visibility || 'private',
    insert.author_name || null,
    insert.author_id || insert.user_id
  ]);

  const prompt = result.rows[0] as PromptRow;

  // Auto-generate embedding (async, non-blocking)
  autoEmbedOnCreate(prompt.id, prompt.content, prompt.user_id).catch(err => {
    console.error(`[CREATE_PROMPT] Auto-embed failed for ${prompt.id}:`, err);
  });

  return prompt;
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
  if (update.published_at !== undefined) {
    fields.push(`published_at = $${paramCount++}`);
    values.push(update.published_at);
  }
  if (update.visibility !== undefined) {
    fields.push(`visibility = $${paramCount++}`);
    values.push(update.visibility);
  }
  if (update.author_name !== undefined) {
    fields.push(`author_name = $${paramCount++}`);
    values.push(update.author_name);
  }
  if (update.author_id !== undefined) {
    fields.push(`author_id = $${paramCount++}`);
    values.push(update.author_id);
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

  const prompt = result.rows[0] as PromptRow | null;

  // Auto-refresh embedding if content changed (async, non-blocking)
  if (prompt && update.content !== undefined) {
    autoEmbedOnUpdate(prompt.id, update.content, prompt.user_id).catch(err => {
      console.error(`[UPDATE_PROMPT] Auto-embed failed for ${prompt.id}:`, err);
    });
  }

  return prompt;
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
      SET title = $1, content = $2, status = $3, updated_at = $4,
          author_id = COALESCE(author_id, $5)
      WHERE id = $6
      RETURNING *
    `, [title, parsedContent, status, driveFile.modifiedTime, userId, existingPrompt.id]);

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
      INSERT INTO prompts (user_id, title, content, status, drive_file_id, author_id, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [
      userId,
      title,
      parsedContent,
      status,
      driveFile.id,
      userId,
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

export interface PublicPromptsFilters {
  myPromptsOnly?: boolean;
  userId?: string;
  sortBy?: 'recent' | 'popular' | 'score';
  limit?: number;
  offset?: number;
}

export async function getPublicPrompts(
  filters: PublicPromptsFilters = {}
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
    WHERE p.visibility = 'public'
  `;

  const params: any[] = [];
  let paramCount = 1;

  if (filters.myPromptsOnly && filters.userId) {
    sql += ` AND p.user_id = $${paramCount}`;
    params.push(filters.userId);
    paramCount++;
  }

  const sortBy = filters.sortBy || 'recent';
  if (sortBy === 'recent') {
    sql += ' ORDER BY p.published_at DESC NULLS LAST';
  } else if (sortBy === 'popular' || sortBy === 'score') {
    sql += ' ORDER BY c.score DESC NULLS LAST, p.published_at DESC';
  }

  if (filters.limit) {
    sql += ` LIMIT $${paramCount}`;
    params.push(filters.limit);
    paramCount++;
  }

  if (filters.offset) {
    sql += ` OFFSET $${paramCount}`;
    params.push(filters.offset);
    paramCount++;
  }

  const result = await db.query(sql, params);

  return result.rows.map((row: any) => ({
    ...row,
    latestCritique: row.latestCritique?.score ? row.latestCritique : null,
    metadata: row.metadata?.description !== null || row.metadata?.tags !== null 
      ? row.metadata 
      : null
  }));
}

export async function publishPrompt(
  promptId: string,
  userId: string,
  authorName: string
): Promise<PromptRow | null> {
  const db = await getDB();
  
  const checkResult = await db.query(
    'SELECT user_id FROM prompts WHERE id = $1',
    [promptId]
  );

  if (checkResult.rows.length === 0) {
    return null;
  }

  const prompt: any = checkResult.rows[0];
  if (prompt.user_id !== userId) {
    throw new Error('Unauthorized: only the owner can publish this prompt');
  }

  const publishedAt = new Date().toISOString();
  
  const result = await db.query(`
    UPDATE prompts 
    SET 
      visibility = 'public',
      published_at = $2,
      author_name = $3,
      author_id = $4
    WHERE id = $1
    RETURNING *
  `, [promptId, publishedAt, authorName, userId]);

  return (result.rows[0] as PromptRow) || null;
}

export async function unpublishPrompt(
  promptId: string,
  userId: string
): Promise<PromptRow | null> {
  const db = await getDB();
  
  const checkResult = await db.query(
    'SELECT user_id FROM prompts WHERE id = $1',
    [promptId]
  );

  if (checkResult.rows.length === 0) {
    return null;
  }

  const prompt: any = checkResult.rows[0];
  if (prompt.user_id !== userId) {
    throw new Error('Unauthorized: only the owner can unpublish this prompt');
  }

  const result = await db.query(`
    UPDATE prompts 
    SET visibility = 'private'
    WHERE id = $1
    RETURNING *
  `, [promptId]);

  return (result.rows[0] as PromptRow) || null;
}

export async function copyPrompt(
  sourcePromptId: string,
  targetUserId: string
): Promise<PromptRow | null> {
  const db = await getDB();
  
  const sourceResult = await db.query(
    'SELECT * FROM prompts WHERE id = $1 AND visibility = $2',
    [sourcePromptId, 'public']
  );

  if (sourceResult.rows.length === 0) {
    return null;
  }

  const sourcePrompt: any = sourceResult.rows[0];

  const result = await db.query(`
    INSERT INTO prompts (
      user_id, title, content, status, visibility,
      author_name, author_id
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
  `, [
    targetUserId,
    `${sourcePrompt.title} (Copy)`,
    sourcePrompt.content,
    'draft',
    'private',
    null,
    targetUserId
  ]);

  const newPrompt: any = result.rows[0];

  const metadataResult = await db.query(
    'SELECT * FROM prompt_metadata WHERE prompt_id = $1',
    [sourcePromptId]
  );

  if (metadataResult.rows.length > 0) {
    const sourceMetadata: any = metadataResult.rows[0];
    await db.query(`
      INSERT INTO prompt_metadata (prompt_id, description, tags, is_public, author, version)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [
      newPrompt.id,
      sourceMetadata.description,
      sourceMetadata.tags,
      false,
      sourceMetadata.author,
      sourceMetadata.version
    ]);
  }

  return newPrompt as PromptRow;
}
