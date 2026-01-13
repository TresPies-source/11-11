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
