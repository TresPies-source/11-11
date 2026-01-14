import { PGlite } from '@electric-sql/pglite';
import { initializeSchema, checkIfInitialized, MIGRATION_SQL } from './schema';
import { seedDatabase } from './seed';
import { applyMigration002 } from './migrations/002_add_status_history';
import { applyMigration003 } from './migrations/003_add_cost_guard';
import { applyMigration004 } from './migrations/004_add_supervisor_tables';
import { applyMigration005 } from './migrations/005_add_vector_search';
import { applyMigration006 } from './migrations/006_add_harness_traces';
import { applyMigration007 } from './migrations/007_add_context_tracking';
import { applyMigration008 } from './migrations/008_add_safety_switch';
import { applyMigration009 } from './migrations/009_add_dojo_sessions';

// Detect if we're running in browser or server
const isBrowser = typeof window !== 'undefined';

// Use IndexedDB in browser, memory in server (Next.js API routes)
const DB_PATH = isBrowser ? 'idb://11-11-db' : 'memory://';
export const DEFAULT_USER_ID = 'dev-user';

let dbInstance: PGlite | null = null;
let initPromise: Promise<PGlite> | null = null;

async function initializeDatabase(): Promise<PGlite> {
  if (dbInstance) {
    return dbInstance;
  }

  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    console.log('[PGlite] Initializing database at:', DB_PATH);
    console.log('[PGlite] Environment:', isBrowser ? 'Browser' : 'Server');
    
    const db = new PGlite(DB_PATH);
    
    const isInitialized = await checkIfInitialized(db);
    
    if (!isInitialized) {
      console.log('[PGlite] First run detected - initializing schema...');
      await initializeSchema(db);
      console.log('[PGlite] Schema initialization complete');
      
      console.log('[PGlite] Running initial migrations...');
      await applyMigration003(db);
      await applyMigration004(db);
      await applyMigration005(db);
      await applyMigration006(db);
      await applyMigration007(db);
      await applyMigration008(db);
      await applyMigration009(db);
      console.log('[PGlite] Initial migrations complete');
      
      console.log('[PGlite] Seeding database with sample data...');
      await seedDatabase(db, DEFAULT_USER_ID);
      console.log('[PGlite] Database seeding complete');
    } else {
      console.log('[PGlite] Database already initialized');
      
      console.log('[PGlite] Running migrations...');
      await applyMigration002(db);
      await applyMigration003(db);
      await applyMigration004(db);
      await applyMigration005(db);
      await applyMigration006(db);
      await applyMigration007(db);
      await applyMigration008(db);
      await applyMigration009(db);
      await db.exec(MIGRATION_SQL);
      console.log('[PGlite] Migrations complete');
    }
    
    dbInstance = db;
    return db;
  })();

  return initPromise;
}

export async function getDB(): Promise<PGlite> {
  if (!dbInstance) {
    return initializeDatabase();
  }
  return dbInstance;
}

export function isDBConfigured(): boolean {
  return dbInstance !== null;
}
