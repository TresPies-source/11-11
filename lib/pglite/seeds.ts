import { getDB } from './client';
import type { SeedRow, SeedInsert, SeedUpdate, SeedFilters } from '../seeds/types';

export async function getSeeds(filters?: SeedFilters): Promise<SeedRow[]> {
  try {
    const db = await getDB();
    
    let query = 'SELECT * FROM seeds WHERE 1=1';
    const params: any[] = [];
    let paramCount = 1;
    
    if (filters?.status && filters.status.length > 0) {
      const placeholders = filters.status.map((_, i) => `$${paramCount + i}`).join(', ');
      query += ` AND status IN (${placeholders})`;
      params.push(...filters.status);
      paramCount += filters.status.length;
    }
    
    if (filters?.type && filters.type.length > 0) {
      const placeholders = filters.type.map((_, i) => `$${paramCount + i}`).join(', ');
      query += ` AND type IN (${placeholders})`;
      params.push(...filters.type);
      paramCount += filters.type.length;
    }
    
    if (filters?.search) {
      query += ` AND (name ILIKE $${paramCount} OR content ILIKE $${paramCount})`;
      params.push(`%${filters.search}%`);
      paramCount++;
    }
    
    if (filters?.dateFrom) {
      query += ` AND created_at >= $${paramCount}`;
      params.push(filters.dateFrom);
      paramCount++;
    }
    
    if (filters?.dateTo) {
      query += ` AND created_at <= $${paramCount}`;
      params.push(filters.dateTo);
      paramCount++;
    }
    
    if (filters?.user_id) {
      query += ` AND user_id = $${paramCount}`;
      params.push(filters.user_id);
      paramCount++;
    }
    
    if (filters?.session_id) {
      query += ` AND session_id = $${paramCount}`;
      params.push(filters.session_id);
      paramCount++;
    }
    
    query += ' ORDER BY updated_at DESC';
    
    const result = await db.query(query, params);
    return result.rows as SeedRow[];
  } catch (error) {
    console.error('[SEEDS_DB] Error getting seeds:', error);
    throw error;
  }
}

export async function getSeed(id: string): Promise<SeedRow | null> {
  try {
    const db = await getDB();
    
    const result = await db.query(
      'SELECT * FROM seeds WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return result.rows[0] as SeedRow;
  } catch (error) {
    console.error('[SEEDS_DB] Error getting seed:', error);
    throw error;
  }
}

export async function insertSeed(seed: SeedInsert): Promise<SeedRow> {
  try {
    const db = await getDB();
    
    const id = seed.id || `seed_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const now = new Date().toISOString();
    
    const result = await db.query(
      `INSERT INTO seeds (
        id, name, type, status, content, why_matters, revisit_when,
        created_at, updated_at, user_id, session_id, replanted, replant_count
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        id,
        seed.name,
        seed.type,
        seed.status || 'new',
        seed.content,
        seed.why_matters || null,
        seed.revisit_when || null,
        seed.created_at || now,
        seed.updated_at || now,
        seed.user_id || null,
        seed.session_id || null,
        seed.replanted || false,
        seed.replant_count || 0,
      ]
    );
    
    console.log(`[SEEDS_DB] Inserted seed ${id}`);
    return result.rows[0] as SeedRow;
  } catch (error) {
    console.error('[SEEDS_DB] Error inserting seed:', error);
    throw error;
  }
}

export async function updateSeed(id: string, updates: SeedUpdate): Promise<SeedRow | null> {
  try {
    const db = await getDB();
    
    const setClauses: string[] = [];
    const params: any[] = [];
    let paramCount = 1;
    
    const now = new Date().toISOString();
    setClauses.push(`updated_at = $${paramCount}`);
    params.push(now);
    paramCount++;
    
    if (updates.name !== undefined) {
      setClauses.push(`name = $${paramCount}`);
      params.push(updates.name);
      paramCount++;
    }
    
    if (updates.type !== undefined) {
      setClauses.push(`type = $${paramCount}`);
      params.push(updates.type);
      paramCount++;
    }
    
    if (updates.status !== undefined) {
      setClauses.push(`status = $${paramCount}`);
      params.push(updates.status);
      paramCount++;
    }
    
    if (updates.content !== undefined) {
      setClauses.push(`content = $${paramCount}`);
      params.push(updates.content);
      paramCount++;
    }
    
    if (updates.why_matters !== undefined) {
      setClauses.push(`why_matters = $${paramCount}`);
      params.push(updates.why_matters);
      paramCount++;
    }
    
    if (updates.revisit_when !== undefined) {
      setClauses.push(`revisit_when = $${paramCount}`);
      params.push(updates.revisit_when);
      paramCount++;
    }
    
    if (updates.user_id !== undefined) {
      setClauses.push(`user_id = $${paramCount}`);
      params.push(updates.user_id);
      paramCount++;
    }
    
    if (updates.session_id !== undefined) {
      setClauses.push(`session_id = $${paramCount}`);
      params.push(updates.session_id);
      paramCount++;
    }
    
    if (updates.replanted !== undefined) {
      setClauses.push(`replanted = $${paramCount}`);
      params.push(updates.replanted);
      paramCount++;
    }
    
    if (updates.replant_count !== undefined) {
      setClauses.push(`replant_count = $${paramCount}`);
      params.push(updates.replant_count);
      paramCount++;
    }
    
    if (setClauses.length === 1) {
      return await getSeed(id);
    }
    
    params.push(id);
    const query = `UPDATE seeds SET ${setClauses.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    
    const result = await db.query(query, params);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    console.log(`[SEEDS_DB] Updated seed ${id}`);
    return result.rows[0] as SeedRow;
  } catch (error) {
    console.error('[SEEDS_DB] Error updating seed:', error);
    throw error;
  }
}

export async function deleteSeed(id: string): Promise<boolean> {
  try {
    const db = await getDB();
    
    const result = await db.query(
      'DELETE FROM seeds WHERE id = $1 RETURNING id',
      [id]
    );
    
    const deleted = result.rows.length > 0;
    if (deleted) {
      console.log(`[SEEDS_DB] Deleted seed ${id}`);
    }
    
    return deleted;
  } catch (error) {
    console.error('[SEEDS_DB] Error deleting seed:', error);
    throw error;
  }
}
