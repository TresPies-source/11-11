import { PGlite } from '@electric-sql/pglite';
import { initializeSchema, checkIfInitialized, MIGRATION_SQL } from './schema';
import { seedDatabase } from './seed';
import { applyMigration002 } from './migrations/002_add_status_history';

const DB_PATH = 'idb://11-11-db';
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
    
    const db = new PGlite(DB_PATH);
    
    const isInitialized = await checkIfInitialized(db);
    
    if (!isInitialized) {
      console.log('[PGlite] First run detected - initializing schema...');
      await initializeSchema(db);
      console.log('[PGlite] Schema initialization complete');
      
      console.log('[PGlite] Seeding database with sample data...');
      await seedDatabase(db, DEFAULT_USER_ID);
      console.log('[PGlite] Database seeding complete');
    } else {
      console.log('[PGlite] Database already initialized');
      
      console.log('[PGlite] Running migrations...');
      await applyMigration002(db);
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
