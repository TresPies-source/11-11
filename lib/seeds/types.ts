export type SeedType = 'principle' | 'pattern' | 'question' | 'route' | 'artifact' | 'constraint';
export type SeedStatus = 'new' | 'growing' | 'mature' | 'compost';

export interface SeedRow {
  id: string;
  name: string;
  type: SeedType;
  status: SeedStatus;
  content: string;
  why_matters: string | null;
  revisit_when: string | null;
  created_at: string;
  updated_at: string;
  user_id: string | null;
  session_id: string | null;
  replanted: boolean;
  replant_count: number;
}

export interface SeedInsert {
  id?: string;
  name: string;
  type: SeedType;
  status?: SeedStatus;
  content: string;
  why_matters?: string | null;
  revisit_when?: string | null;
  created_at?: string;
  updated_at?: string;
  user_id?: string | null;
  session_id?: string | null;
  replanted?: boolean;
  replant_count?: number;
}

export interface SeedUpdate {
  id?: string;
  name?: string;
  type?: SeedType;
  status?: SeedStatus;
  content?: string;
  why_matters?: string | null;
  revisit_when?: string | null;
  updated_at?: string;
  user_id?: string | null;
  session_id?: string | null;
  replanted?: boolean;
  replant_count?: number;
}

export interface SeedFilters {
  status?: SeedStatus[];
  type?: SeedType[];
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  user_id?: string;
  session_id?: string;
}
