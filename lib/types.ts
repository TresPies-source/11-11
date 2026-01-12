export interface FileNode {
  id: string;
  name: string;
  type: "file" | "folder";
  path: string;
  source: "google-drive" | "github" | "local";
  modified?: Date;
  isModified?: boolean;
  children?: FileNode[];
  expanded?: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  provider: "google" | "github";
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  persona?: string;
}

export interface Session {
  id: string;
  title: string;
  persona: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
  isMinimized: boolean;
}

export interface Workspace {
  id: string;
  name: string;
  type: "personal" | "team" | "public";
  googleDriveId?: string;
  githubRepo?: string;
}

export interface SyncStatus {
  googleDrive: {
    connected: boolean;
    lastSync?: Date;
    syncing: boolean;
    error?: string;
  };
  github: {
    connected: boolean;
    lastSync?: Date;
    syncing: boolean;
    error?: string;
  };
}

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
  path: string;
  webViewLink?: string;
}

export interface SyncOperation {
  id: string;
  type: 'read' | 'write' | 'fetch' | 'save';
  status: 'pending' | 'success' | 'error';
  timestamp: Date;
  error?: string;
  fileId?: string;
  fileName?: string;
}

export interface SyncStatusState {
  operations: SyncOperation[];
  lastSync: Date | null;
  isError: boolean;
  currentOperation: SyncOperation | null;
}

export interface RepositoryState {
  activeFile: FileNode | null;
  fileContent: string;
  savedContent: string;
  isDirty: boolean;
  isSaving: boolean;
  lastSaved: Date | null;
  error: string | null;
}

export interface PromptMetadata {
  title?: string;
  description?: string;
  tags?: string[];
  public?: boolean;
  author?: string;
  created?: string;
  version?: string;
}

export type PromptStatus = 'draft' | 'active' | 'saved' | 'archived';

export interface Prompt {
  id: string;
  userId: string;
  title: string;
  content: string;
  status: PromptStatus;
  driveFileId: string | null;
  createdAt: string;
  updatedAt: string;
  metadata: PromptMetadata;
}

export interface CritiqueResult {
  id: string;
  promptId: string;
  score: number;
  concisenessScore: number;
  specificityScore: number;
  contextScore: number;
  taskDecompositionScore: number;
  feedback: CritiqueFeedback;
  createdAt: string;
}

export interface CritiqueFeedback {
  conciseness: {
    score: number;
    issues: string[];
    suggestions: string[];
  };
  specificity: {
    score: number;
    issues: string[];
    suggestions: string[];
  };
  context: {
    score: number;
    issues: string[];
    suggestions: string[];
  };
  taskDecomposition: {
    score: number;
    issues: string[];
    suggestions: string[];
  };
}

export interface PromptFilters {
  status?: PromptStatus;
  tags?: string[];
  minScore?: number;
  maxScore?: number;
}

export interface PromptSortOptions {
  field: 'updatedAt' | 'createdAt' | 'title' | 'critiqueScore';
  direction: 'asc' | 'desc';
}

export interface PromptFile extends DriveFile {
  metadata?: PromptMetadata;
  rawContent?: string;
  status?: PromptStatus;
  critiqueScore?: number;
  critiqueDetails?: CritiqueResult;
}

export type ContextBusEvent =
  | { type: 'PLAN_UPDATED'; payload: { content: string; timestamp: Date } }
  | { type: 'FILE_SAVED'; payload: { fileId: string; fileName: string } }
  | { type: 'AGENT_SPAWNED'; payload: { agentId: string; persona: string } }
  | { type: 'SYNC_STATUS_CHANGED'; payload: { status: 'synced' | 'syncing' | 'error' } };

export type ActiveTab = "editor" | "multi-agent";
