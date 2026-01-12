import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true';

let supabaseClient: SupabaseClient<Database> | null = null;

export function getSupabaseClient(): SupabaseClient<Database> | null {
  if (isDevMode) {
    console.warn('[Supabase] Running in dev mode - database operations will be mocked');
    return null;
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error(
      '[Supabase] Missing environment variables. Please configure:\n' +
      '  - NEXT_PUBLIC_SUPABASE_URL\n' +
      '  - NEXT_PUBLIC_SUPABASE_ANON_KEY\n' +
      'Check .env.example for setup instructions.'
    );
    return null;
  }

  if (!supabaseClient) {
    supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }

  return supabaseClient;
}

export function isSupabaseConfigured(): boolean {
  return !isDevMode && !!supabaseUrl && !!supabaseAnonKey;
}

export const supabase = getSupabaseClient();
