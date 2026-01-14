export type PromptStatus = 'draft' | 'active' | 'saved' | 'archived';
export type PromptVisibility = 'private' | 'unlisted' | 'public';

export interface StatusHistoryEntry {
  from: PromptStatus;
  to: PromptStatus;
  timestamp: string;
  user_id: string;
}

export interface PromptRow {
  id: string;
  user_id: string;
  title: string;
  content: string;
  status: PromptStatus;
  status_history: StatusHistoryEntry[];
  drive_file_id: string | null;
  published_at: string | null;
  visibility: PromptVisibility;
  author_name: string | null;
  author_id: string | null;
  embedding: number[] | null;
  created_at: string;
  updated_at: string;
}

export interface PromptInsert {
  id?: string;
  user_id: string;
  title: string;
  content: string;
  status: PromptStatus;
  drive_file_id?: string | null;
  published_at?: string | null;
  visibility?: PromptVisibility;
  author_name?: string | null;
  author_id?: string | null;
  embedding?: number[] | null;
  created_at?: string;
  updated_at?: string;
}

export interface PromptUpdate {
  id?: string;
  user_id?: string;
  title?: string;
  content?: string;
  status?: PromptStatus;
  drive_file_id?: string | null;
  published_at?: string | null;
  visibility?: PromptVisibility;
  author_name?: string | null;
  author_id?: string | null;
  embedding?: number[] | null;
  created_at?: string;
  updated_at?: string;
}

export interface PromptMetadataRow {
  id: string;
  prompt_id: string;
  description: string | null;
  tags: string[] | null;
  is_public: boolean;
  author: string | null;
  version: string | null;
  created_at: string;
}

export interface PromptMetadataInsert {
  id?: string;
  prompt_id: string;
  description?: string | null;
  tags?: string[] | null;
  is_public?: boolean;
  author?: string | null;
  version?: string | null;
  created_at?: string;
}

export interface PromptMetadataUpdate {
  id?: string;
  prompt_id?: string;
  description?: string | null;
  tags?: string[] | null;
  is_public?: boolean;
  author?: string | null;
  version?: string | null;
  created_at?: string;
}

export interface CritiqueDimensionFeedback {
  score: number;
  issues: string[];
  suggestions: string[];
}

export interface CritiqueFeedbackJson {
  conciseness: CritiqueDimensionFeedback;
  specificity: CritiqueDimensionFeedback;
  context: CritiqueDimensionFeedback;
  taskDecomposition: CritiqueDimensionFeedback;
}

export interface CritiqueRow {
  id: string;
  prompt_id: string;
  score: number;
  conciseness_score: number;
  specificity_score: number;
  context_score: number;
  task_decomposition_score: number;
  feedback: CritiqueFeedbackJson | null;
  created_at: string;
}

export interface CritiqueInsert {
  id?: string;
  prompt_id: string;
  score: number;
  conciseness_score: number;
  specificity_score: number;
  context_score: number;
  task_decomposition_score: number;
  feedback?: CritiqueFeedbackJson | null;
  created_at?: string;
}

export interface CritiqueUpdate {
  id?: string;
  prompt_id?: string;
  score?: number;
  conciseness_score?: number;
  specificity_score?: number;
  context_score?: number;
  task_decomposition_score?: number;
  feedback?: CritiqueFeedbackJson | null;
  created_at?: string;
}

export type OperationType = 'routing' | 'agent_execution' | 'search' | 'critique' | 'other';

export interface CostRecordRow {
  id: string;
  user_id: string;
  session_id: string | null;
  query_id: string | null;
  model: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  cost_usd: number;
  operation_type: OperationType;
  created_at: string;
}

export interface CostRecordInsert {
  id?: string;
  user_id: string;
  session_id?: string | null;
  query_id?: string | null;
  model: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  cost_usd: number;
  operation_type: OperationType;
  created_at?: string;
}

export type DojoMode = 'Mirror' | 'Scout' | 'Gardener' | 'Implementation';

export interface Artifact {
  type: 'file' | 'link' | 'code' | 'image';
  name: string;
  content: string | null;
  url: string | null;
}

export interface SessionRow {
  id: string;
  user_id: string;
  title: string | null;
  mode: DojoMode | null;
  situation: string | null;
  stake: string | null;
  agent_path: string[];
  next_move_action: string | null;
  next_move_why: string | null;
  next_move_test: string | null;
  artifacts: Artifact[];
  total_tokens: number;
  total_cost_usd: number;
  created_at: string;
  updated_at: string;
}

export interface SessionInsert {
  id?: string;
  user_id: string;
  title?: string | null;
  mode?: DojoMode | null;
  situation?: string | null;
  stake?: string | null;
  agent_path?: string[];
  next_move_action?: string | null;
  next_move_why?: string | null;
  next_move_test?: string | null;
  artifacts?: Artifact[];
  total_tokens?: number;
  total_cost_usd?: number;
  created_at?: string;
  updated_at?: string;
}

export interface SessionPerspectiveRow {
  id: string;
  session_id: string;
  text: string;
  source: 'user' | 'agent';
  created_at: string;
}

export interface SessionPerspectiveInsert {
  id?: string;
  session_id: string;
  text: string;
  source: 'user' | 'agent';
  created_at?: string;
}

export interface SessionAssumptionRow {
  id: string;
  session_id: string;
  text: string;
  challenged: boolean;
  created_at: string;
}

export interface SessionAssumptionInsert {
  id?: string;
  session_id: string;
  text: string;
  challenged?: boolean;
  created_at?: string;
}

export interface SessionDecisionRow {
  id: string;
  session_id: string;
  text: string;
  rationale: string;
  created_at: string;
}

export interface SessionDecisionInsert {
  id?: string;
  session_id: string;
  text: string;
  rationale: string;
  created_at?: string;
}

export interface UserMonthlyUsageRow {
  id: string;
  user_id: string;
  month: string;
  total_tokens: number;
  total_cost_usd: number;
  created_at: string;
  updated_at: string;
}

export interface UserMonthlyUsageInsert {
  id?: string;
  user_id: string;
  month: string;
  total_tokens?: number;
  total_cost_usd?: number;
  created_at?: string;
  updated_at?: string;
}

export interface SearchHistoryRow {
  id: string;
  user_id: string;
  query: string;
  results_count: number;
  filters: Record<string, any>;
  created_at: string;
}

export interface SearchHistoryInsert {
  id?: string;
  user_id: string;
  query: string;
  results_count: number;
  filters?: Record<string, any>;
  created_at?: string;
}

export interface HarnessTraceRow {
  trace_id: string;
  session_id: string;
  user_id: string;
  started_at: string;
  ended_at: string | null;
  events: any;
  summary: any;
  created_at: string;
}

export interface HarnessTraceInsert {
  trace_id: string;
  session_id: string;
  user_id: string;
  started_at: string;
  ended_at: string | null;
  events: string;
  summary: string;
}
