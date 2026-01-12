export type PromptStatus = 'draft' | 'active' | 'saved' | 'archived';

export interface Database {
  public: {
    Tables: {
      prompts: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          content: string;
          status: PromptStatus;
          drive_file_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          content: string;
          status: PromptStatus;
          drive_file_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          content?: string;
          status?: PromptStatus;
          drive_file_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      prompt_metadata: {
        Row: {
          id: string;
          prompt_id: string;
          description: string | null;
          tags: string[] | null;
          is_public: boolean;
          author: string | null;
          version: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          prompt_id: string;
          description?: string | null;
          tags?: string[] | null;
          is_public?: boolean;
          author?: string | null;
          version?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          prompt_id?: string;
          description?: string | null;
          tags?: string[] | null;
          is_public?: boolean;
          author?: string | null;
          version?: string | null;
          created_at?: string;
        };
      };
      critiques: {
        Row: {
          id: string;
          prompt_id: string;
          score: number;
          conciseness_score: number;
          specificity_score: number;
          context_score: number;
          task_decomposition_score: number;
          feedback: CritiqueFeedbackJson | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          prompt_id: string;
          score: number;
          conciseness_score: number;
          specificity_score: number;
          context_score: number;
          task_decomposition_score: number;
          feedback?: CritiqueFeedbackJson | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          prompt_id?: string;
          score?: number;
          conciseness_score?: number;
          specificity_score?: number;
          context_score?: number;
          task_decomposition_score?: number;
          feedback?: CritiqueFeedbackJson | null;
          created_at?: string;
        };
      };
    };
  };
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

export type PromptRow = Database['public']['Tables']['prompts']['Row'];
export type PromptInsert = Database['public']['Tables']['prompts']['Insert'];
export type PromptUpdate = Database['public']['Tables']['prompts']['Update'];

export type PromptMetadataRow = Database['public']['Tables']['prompt_metadata']['Row'];
export type PromptMetadataInsert = Database['public']['Tables']['prompt_metadata']['Insert'];
export type PromptMetadataUpdate = Database['public']['Tables']['prompt_metadata']['Update'];

export type CritiqueRow = Database['public']['Tables']['critiques']['Row'];
export type CritiqueInsert = Database['public']['Tables']['critiques']['Insert'];
export type CritiqueUpdate = Database['public']['Tables']['critiques']['Update'];
