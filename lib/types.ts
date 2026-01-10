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
  };
  github: {
    connected: boolean;
    lastSync?: Date;
    syncing: boolean;
  };
}

export type ActiveTab = "editor" | "multi-agent";
