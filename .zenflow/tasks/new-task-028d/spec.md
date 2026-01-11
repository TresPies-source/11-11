# Technical Specification: Core Validation & Advanced Features

**Author:** Manus AI (Dojo)  
**Status:** Draft  
**Date:** January 11, 2026  
**Version:** 1.0

---

## 1. Technical Context

### 1.1 Current Stack

**Framework & Runtime:**
- Next.js 14.2.24 (App Router)
- React 18.3.1
- TypeScript 5.7.2 (strict mode enabled)
- Node.js runtime

**Key Dependencies:**
- `googleapis@131.0.0` - Google Drive API client
- `next-auth@5.0.0-beta.25` - Authentication (OAuth 2.0)
- `@monaco-editor/react@4.6.0` - Code editor
- `framer-motion@11.15.0` - Animations
- `gray-matter@4.0.3` - Frontmatter parsing
- `mitt@3.0.1` - Event bus
- `react-resizable-panels@2.1.7` - Layout management

**Development Tools:**
- ESLint 8.57.1 (Next.js config)
- TypeScript compiler with `--noEmit` for type checking

**Build Commands:**
- `npm run dev` - Development server
- `npm run build` - Production build
- `npm run lint` - ESLint validation
- `npm run type-check` - TypeScript validation

### 1.2 Current Architecture

**Project Structure:**
```
app/
├── api/
│   ├── auth/[...nextauth]/    # NextAuth route handlers
│   └── drive/
│       ├── files/             # List Drive files
│       ├── content/[fileId]/  # Get/Update file content
│       └── fork/              # Fork prompts
├── library/                   # Library page
├── gallery/                   # Gallery page
└── page.tsx                   # Home/Multi-Agent view

components/
├── editor/                    # Monaco Editor wrapper
├── gallery/                   # Gallery view components
├── layout/                    # CommandCenter, Sidebar, Header
├── library/                   # Library view components
├── multi-agent/               # ChatPanel, MultiAgentView
├── providers/                 # Context providers
└── shared/                    # Reusable components

lib/
├── google/
│   ├── drive.ts               # DriveClient class
│   ├── auth.ts                # OAuth helpers
│   └── types.ts               # Google-specific types
├── auth.ts                    # NextAuth configuration
├── types.ts                   # Shared TypeScript types
├── constants.ts               # App constants
└── utils.ts                   # Utilities (cn, etc.)

hooks/
├── useContextBus.ts           # Event bus hook
├── useLibrary.ts              # Library data fetching
├── useGallery.ts              # Gallery data fetching
├── usePromptSearch.ts         # Search filtering
├── useSyncStatus.ts           # Sync state management
└── useRepository.ts           # File operations
```

**Existing Type Definitions:**
```typescript
// lib/types.ts
interface PromptMetadata {
  title?: string;
  description?: string;
  tags?: string[];
  public?: boolean;
  author?: string;
  created?: string;
  version?: string;
}

interface PromptFile extends DriveFile {
  metadata?: PromptMetadata;
  rawContent?: string;
}

interface SyncStatus {
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

type ContextBusEvent =
  | { type: 'PLAN_UPDATED'; payload: { content: string; timestamp: Date } }
  | { type: 'FILE_SAVED'; payload: { fileId: string; fileName: string } }
  | { type: 'AGENT_SPAWNED'; payload: { agentId: string; persona: string } }
  | { type: 'SYNC_STATUS_CHANGED'; payload: { status: 'synced' | 'syncing' | 'error' } };
```

**Existing Patterns:**
- Server Components by default, Client Components marked with `"use client"`
- API routes in `/app/api` using Next.js 14 Route Handlers
- Framer Motion for animations (200-300ms duration, ease-out)
- Tailwind CSS with `cn()` utility for conditional classes
- Context Bus using `mitt` for event-driven architecture
- DriveClient class pattern for API abstraction with retry logic
- Gray-matter for parsing Markdown frontmatter

---

## 2. Feature Implementation Approach

### 2.1 Core Feature Validation (Sprint 2 & 3)

**Objective:** Manually test and document all existing features before building new functionality.

**Approach:**
This is a **testing and documentation phase**, not implementation. No new code will be written except for bug fixes discovered during validation.

**Test Execution Strategy:**
1. Create structured test execution log in `JOURNAL.md` under new section
2. Follow test scenarios from PRD section 2.1 and 2.2
3. Capture screenshots for each test scenario in `05_Logs/screenshots/validation/`
4. Document findings, bugs, and performance metrics
5. Create GitHub issues for any critical bugs found
6. Fix P0/P1 bugs before proceeding to Phase 2

**Validation Checklist:**
- [ ] Google Drive file listing works
- [ ] Monaco Editor loads and displays files
- [ ] Auto-save triggers after 500ms debounce
- [ ] Dirty state indicator appears/disappears correctly
- [ ] Context Bus propagates events <100ms
- [ ] Library page displays all prompts
- [ ] Gallery page filters public prompts
- [ ] Quick Copy works
- [ ] Run in Chat spawns new ChatPanel
- [ ] Fork to Library duplicates prompt
- [ ] Toast notifications appear/dismiss correctly
- [ ] Multi-Agent grid is responsive
- [ ] All animations complete in 200-300ms

**Deliverables:**
- Updated `JOURNAL.md` with validation results
- Screenshots in `05_Logs/screenshots/validation/`
- Bug list (if any) with severity ratings
- Performance metrics document

---

### 2.2 Advanced Prompt Management

**Objective:** Enhance search, filtering, and categorization capabilities.

#### 2.2.1 Extended Type Definitions

**Update `lib/types.ts`:**
```typescript
// Extended PromptMetadata with new fields
export interface PromptMetadata {
  title?: string;
  description?: string;
  tags?: string[];
  category?: string;           // NEW: e.g., "Development", "Writing"
  public?: boolean;
  author?: string;
  created?: string;
  updated?: string;            // NEW: ISO 8601 date string
  version?: string;
  model?: string;              // NEW: e.g., "gpt-4", "claude-3"
  temperature?: number;        // NEW: 0-1
  maxTokens?: number;          // NEW: Recommended max tokens
  license?: string;            // NEW: e.g., "MIT", "CC-BY-4.0"
  keywords?: string[];         // NEW: Additional searchable terms
}

// Filter options for search/filtering
export interface PromptFilterOptions {
  searchTerm: string;
  selectedTags: string[];      // Multi-select AND logic
  selectedAuthor: string | null;
  dateRange: 'all' | 'week' | 'month' | 'quarter';
  selectedCategory: string | null;
  sortBy: 'newest' | 'oldest' | 'name-asc' | 'name-desc';
}

// Aggregated metadata for filter UI
export interface PromptAggregations {
  allTags: Array<{ tag: string; count: number }>;
  allAuthors: Array<{ author: string; count: number }>;
  allCategories: Array<{ category: string; count: number }>;
}
```

#### 2.2.2 Enhanced Search Hook

**Update `hooks/usePromptSearch.ts`:**

```typescript
import { useMemo } from "react";
import type { PromptFile, PromptFilterOptions } from "@/lib/types";

interface UsePromptSearchParams {
  prompts: PromptFile[];
  filters: PromptFilterOptions;
}

export function usePromptSearch({ prompts, filters }: UsePromptSearchParams) {
  const filteredPrompts = useMemo(() => {
    let results = prompts;

    // Text search (title, description, tags, keywords)
    if (filters.searchTerm.trim()) {
      const term = filters.searchTerm.toLowerCase();
      results = results.filter((prompt) => {
        const title = (prompt.metadata?.title || prompt.name).toLowerCase();
        const description = (prompt.metadata?.description || "").toLowerCase();
        const tags = prompt.metadata?.tags || [];
        const keywords = prompt.metadata?.keywords || [];

        return (
          title.includes(term) ||
          description.includes(term) ||
          tags.some((tag) => tag.toLowerCase().includes(term)) ||
          keywords.some((kw) => kw.toLowerCase().includes(term))
        );
      });
    }

    // Tag filter (AND logic)
    if (filters.selectedTags.length > 0) {
      results = results.filter((prompt) => {
        const promptTags = prompt.metadata?.tags || [];
        return filters.selectedTags.every((tag) =>
          promptTags.includes(tag)
        );
      });
    }

    // Author filter
    if (filters.selectedAuthor) {
      results = results.filter(
        (prompt) => prompt.metadata?.author === filters.selectedAuthor
      );
    }

    // Category filter
    if (filters.selectedCategory) {
      results = results.filter(
        (prompt) => prompt.metadata?.category === filters.selectedCategory
      );
    }

    // Date range filter
    if (filters.dateRange !== "all") {
      const now = Date.now();
      const ranges = {
        week: 7 * 24 * 60 * 60 * 1000,
        month: 30 * 24 * 60 * 60 * 1000,
        quarter: 90 * 24 * 60 * 60 * 1000,
      };
      const cutoff = now - ranges[filters.dateRange];

      results = results.filter((prompt) => {
        const created = prompt.metadata?.created || prompt.modifiedTime;
        return new Date(created).getTime() >= cutoff;
      });
    }

    // Sorting
    results = [...results].sort((a, b) => {
      switch (filters.sortBy) {
        case "newest":
          return new Date(b.metadata?.created || b.modifiedTime).getTime() -
                 new Date(a.metadata?.created || a.modifiedTime).getTime();
        case "oldest":
          return new Date(a.metadata?.created || a.modifiedTime).getTime() -
                 new Date(b.metadata?.created || b.modifiedTime).getTime();
        case "name-asc":
          return (a.metadata?.title || a.name).localeCompare(
            b.metadata?.title || b.name
          );
        case "name-desc":
          return (b.metadata?.title || b.name).localeCompare(
            a.metadata?.title || a.name
          );
        default:
          return 0;
      }
    });

    return results;
  }, [prompts, filters]);

  return { filteredPrompts };
}
```

#### 2.2.3 New Filter Components

**Create `components/library/FilterPanel.tsx`:**
- Multi-select tag dropdown (checkbox list)
- Author dropdown (single select)
- Date range radio buttons
- Sort dropdown
- "Clear Filters" button
- Persist filters to URL query parameters
- Responsive: collapses to drawer on mobile

**Create `components/library/CategoryTabs.tsx`:**
- Horizontal tab navigation
- Show category name + count
- "All" tab shows all prompts
- Active state styling
- Smooth transition animations (200ms)

**Create `components/shared/SortDropdown.tsx`:**
- Reusable dropdown component
- Options: Newest, Oldest, Name (A-Z), Name (Z-A)
- Persist selection to localStorage

#### 2.2.4 Component Updates

**Update `components/shared/PromptCard.tsx`:**
```typescript
// Add category badge display
{prompt.metadata?.category && (
  <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
    {prompt.metadata.category}
  </span>
)}

// Add model badge (if specified)
{prompt.metadata?.model && (
  <span className="text-xs text-gray-500">
    Recommended: {prompt.metadata.model}
  </span>
)}

// Add license in footer (if specified)
{prompt.metadata?.license && (
  <span className="text-xs text-gray-400">
    License: {prompt.metadata.license}
  </span>
)}
```

**Update `components/library/LibraryView.tsx`:**
- Integrate FilterPanel and CategoryTabs
- Manage filter state with useState
- Sync filters to URL query parameters
- Pass filters to usePromptSearch hook
- Show loading skeleton during filter application
- Display "X results" count

**Update `components/gallery/GalleryView.tsx`:**
- Same changes as LibraryView (DRY: extract shared FilteredPromptView component)

#### 2.2.5 Utility Functions

**Create `lib/promptUtils.ts`:**
```typescript
import { PromptFile, PromptAggregations } from "./types";

export function aggregatePromptMetadata(
  prompts: PromptFile[]
): PromptAggregations {
  const tagCounts = new Map<string, number>();
  const authorCounts = new Map<string, number>();
  const categoryCounts = new Map<string, number>();

  prompts.forEach((prompt) => {
    // Count tags
    prompt.metadata?.tags?.forEach((tag) => {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
    });

    // Count authors
    if (prompt.metadata?.author) {
      const author = prompt.metadata.author;
      authorCounts.set(author, (authorCounts.get(author) || 0) + 1);
    }

    // Count categories
    if (prompt.metadata?.category) {
      const category = prompt.metadata.category;
      categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1);
    }
  });

  return {
    allTags: Array.from(tagCounts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count),
    allAuthors: Array.from(authorCounts.entries())
      .map(([author, count]) => ({ author, count }))
      .sort((a, b) => b.count - a.count),
    allCategories: Array.from(categoryCounts.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count),
  };
}
```

---

### 2.3 GitHub Sync Integration

**Objective:** Implement bidirectional synchronization with GitHub repositories.

#### 2.3.1 New Dependencies

**Add to `package.json`:**
```json
{
  "dependencies": {
    "@octokit/rest": "^20.0.0",
    "@octokit/auth-oauth-app": "^7.0.0"
  }
}
```

**Installation:**
```bash
npm install @octokit/rest @octokit/auth-oauth-app
```

#### 2.3.2 GitHub Type Definitions

**Create `lib/github/types.ts`:**
```typescript
export interface GitHubFile {
  path: string;
  content: string;
  sha: string;
  size: number;
  url: string;
  htmlUrl: string;
  downloadUrl: string | null;
}

export interface SyncConflict {
  fileId: string;
  fileName: string;
  filePath: string;
  driveContent: string;
  githubContent: string;
  driveSha?: string;
  githubSha: string;
  driveModified: string;
  githubModified: string;
}

export type SyncDirection = "push" | "pull" | "both";

export interface SyncOperation {
  id: string;
  type: SyncDirection;
  status: "pending" | "in_progress" | "completed" | "error" | "conflict";
  filesTotal: number;
  filesCompleted: number;
  conflicts: SyncConflict[];
  startTime: Date;
  endTime?: Date;
  error?: string;
}

export interface GitHubClientConfig {
  auth: string; // OAuth token
  owner: string;
  repo: string;
  basePath?: string; // e.g., "prompts/"
}

export class GitHubError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: any
  ) {
    super(message);
    this.name = "GitHubError";
  }
}

export class GitHubAuthError extends GitHubError {
  constructor(message: string) {
    super(message, 401);
    this.name = "GitHubAuthError";
  }
}

export class GitHubNotFoundError extends GitHubError {
  constructor(message: string) {
    super(message, 404);
    this.name = "GitHubNotFoundError";
  }
}

export class GitHubConflictError extends GitHubError {
  constructor(message: string, public conflict: SyncConflict) {
    super(message, 409);
    this.name = "GitHubConflictError";
  }
}
```

#### 2.3.3 GitHub Client Implementation

**Create `lib/github/client.ts`:**
```typescript
import { Octokit } from "@octokit/rest";
import {
  GitHubClientConfig,
  GitHubFile,
  GitHubError,
  GitHubAuthError,
  GitHubNotFoundError,
  GitHubConflictError,
} from "./types";

export class GitHubClient {
  private octokit: Octokit;
  private owner: string;
  private repo: string;
  private basePath: string;

  constructor(config: GitHubClientConfig) {
    this.octokit = new Octokit({ auth: config.auth });
    this.owner = config.owner;
    this.repo = config.repo;
    this.basePath = config.basePath || "";
  }

  async listFiles(path?: string): Promise<GitHubFile[]> {
    try {
      const fullPath = this.basePath + (path || "");
      const response = await this.octokit.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path: fullPath,
      });

      if (Array.isArray(response.data)) {
        return response.data
          .filter((item) => item.type === "file" && item.name.endsWith(".md"))
          .map((item) => ({
            path: item.path,
            content: "", // Not fetched yet
            sha: item.sha,
            size: item.size || 0,
            url: item.url,
            htmlUrl: item.html_url,
            downloadUrl: item.download_url,
          }));
      }

      throw new GitHubError("Expected directory but got file");
    } catch (error: any) {
      this.handleError(error);
    }
  }

  async getFileContent(path: string): Promise<GitHubFile> {
    try {
      const response = await this.octokit.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path: this.basePath + path,
      });

      if (!Array.isArray(response.data) && response.data.type === "file") {
        const content = Buffer.from(
          response.data.content,
          "base64"
        ).toString("utf-8");

        return {
          path: response.data.path,
          content,
          sha: response.data.sha,
          size: response.data.size || 0,
          url: response.data.url,
          htmlUrl: response.data.html_url,
          downloadUrl: response.data.download_url,
        };
      }

      throw new GitHubError("Expected file but got directory");
    } catch (error: any) {
      this.handleError(error);
    }
  }

  async createFile(
    path: string,
    content: string,
    message: string
  ): Promise<GitHubFile> {
    try {
      const response = await this.octokit.repos.createOrUpdateFileContents({
        owner: this.owner,
        repo: this.repo,
        path: this.basePath + path,
        message,
        content: Buffer.from(content).toString("base64"),
      });

      return {
        path: response.data.content!.path!,
        content,
        sha: response.data.content!.sha!,
        size: response.data.content!.size!,
        url: response.data.content!.url!,
        htmlUrl: response.data.content!.html_url!,
        downloadUrl: response.data.content!.download_url!,
      };
    } catch (error: any) {
      this.handleError(error);
    }
  }

  async updateFile(
    path: string,
    content: string,
    sha: string,
    message: string
  ): Promise<GitHubFile> {
    try {
      const response = await this.octokit.repos.createOrUpdateFileContents({
        owner: this.owner,
        repo: this.repo,
        path: this.basePath + path,
        message,
        content: Buffer.from(content).toString("base64"),
        sha,
      });

      return {
        path: response.data.content!.path!,
        content,
        sha: response.data.content!.sha!,
        size: response.data.content!.size!,
        url: response.data.content!.url!,
        htmlUrl: response.data.content!.html_url!,
        downloadUrl: response.data.content!.download_url!,
      };
    } catch (error: any) {
      if (error.status === 409) {
        throw new GitHubConflictError("File has been modified remotely", {
          fileId: "",
          fileName: path.split("/").pop() || path,
          filePath: path,
          driveContent: content,
          githubContent: "",
          githubSha: sha,
          driveModified: new Date().toISOString(),
          githubModified: new Date().toISOString(),
        });
      }
      this.handleError(error);
    }
  }

  async deleteFile(
    path: string,
    sha: string,
    message: string
  ): Promise<void> {
    try {
      await this.octokit.repos.deleteFile({
        owner: this.owner,
        repo: this.repo,
        path: this.basePath + path,
        message,
        sha,
      });
    } catch (error: any) {
      this.handleError(error);
    }
  }

  private handleError(error: any): never {
    if (error.status === 401) {
      throw new GitHubAuthError("GitHub authentication failed");
    } else if (error.status === 404) {
      throw new GitHubNotFoundError("File or repository not found");
    } else {
      throw new GitHubError(
        error.message || "Unknown GitHub error",
        error.status,
        error.response
      );
    }
  }
}
```

#### 2.3.4 Sync Orchestration

**Create `lib/github/sync.ts`:**
```typescript
import { DriveClient } from "../google/drive";
import { GitHubClient } from "./client";
import { SyncOperation, SyncDirection, SyncConflict } from "./types";
import mitt from "mitt";

type SyncEvents = {
  SYNC_STARTED: { operation: SyncOperation };
  SYNC_FILE_COMPLETED: { fileName: string; status: "success" | "error" };
  SYNC_COMPLETED: { operation: SyncOperation };
  SYNC_CONFLICT: { conflict: SyncConflict };
  SYNC_ERROR: { error: string };
};

export class SyncOrchestrator {
  private driveClient: DriveClient;
  private githubClient: GitHubClient;
  private emitter = mitt<SyncEvents>();
  
  constructor(driveClient: DriveClient, githubClient: GitHubClient) {
    this.driveClient = driveClient;
    this.githubClient = githubClient;
  }

  on<K extends keyof SyncEvents>(
    type: K,
    handler: (event: SyncEvents[K]) => void
  ) {
    this.emitter.on(type, handler);
  }

  async syncAll(direction: SyncDirection): Promise<SyncOperation> {
    const operation: SyncOperation = {
      id: crypto.randomUUID(),
      type: direction,
      status: "in_progress",
      filesTotal: 0,
      filesCompleted: 0,
      conflicts: [],
      startTime: new Date(),
    };

    this.emitter.emit("SYNC_STARTED", { operation });

    try {
      if (direction === "push" || direction === "both") {
        await this.pushToGitHub(operation);
      }
      if (direction === "pull" || direction === "both") {
        await this.pullFromGitHub(operation);
      }

      operation.status = operation.conflicts.length > 0 ? "conflict" : "completed";
      operation.endTime = new Date();
      this.emitter.emit("SYNC_COMPLETED", { operation });
    } catch (error: any) {
      operation.status = "error";
      operation.error = error.message;
      operation.endTime = new Date();
      this.emitter.emit("SYNC_ERROR", { error: error.message });
    }

    return operation;
  }

  private async pushToGitHub(operation: SyncOperation): Promise<void> {
    // Implementation: Fetch Drive files, push to GitHub
    // Handle conflicts, update operation stats
  }

  private async pullFromGitHub(operation: SyncOperation): Promise<void> {
    // Implementation: Fetch GitHub files, push to Drive
    // Handle conflicts, update operation stats
  }
}
```

#### 2.3.5 NextAuth GitHub Provider

**Update `lib/auth.ts`:**
```typescript
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "openid email profile https://www.googleapis.com/auth/drive.file",
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "repo read:user user:email",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        if (account.provider === "google") {
          token.googleAccessToken = account.access_token;
          token.googleRefreshToken = account.refresh_token;
        } else if (account.provider === "github") {
          token.githubAccessToken = account.access_token;
        }
        token.expiryDate = account.expires_at! * 1000;
      }
      return token;
    },
    async session({ session, token }) {
      session.googleAccessToken = token.googleAccessToken as string;
      session.googleRefreshToken = token.googleRefreshToken as string;
      session.githubAccessToken = token.githubAccessToken as string;
      session.expiryDate = token.expiryDate as number;
      return session;
    },
  },
});
```

**Update `types/next-auth.d.ts`:**
```typescript
import "next-auth";

declare module "next-auth" {
  interface Session {
    googleAccessToken?: string;
    googleRefreshToken?: string;
    githubAccessToken?: string;
    expiryDate: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    googleAccessToken?: string;
    googleRefreshToken?: string;
    githubAccessToken?: string;
    expiryDate?: number;
  }
}
```

#### 2.3.6 API Routes

**Create `app/api/github/sync/route.ts`:**
```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { DriveClient } from "@/lib/google/drive";
import { GitHubClient } from "@/lib/github/client";
import { SyncOrchestrator } from "@/lib/github/sync";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.githubAccessToken || !session?.googleAccessToken) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const { direction } = await req.json();

    const driveClient = new DriveClient({
      accessToken: session.googleAccessToken,
    });

    const githubClient = new GitHubClient({
      auth: session.githubAccessToken,
      owner: process.env.GITHUB_REPO_OWNER!,
      repo: process.env.GITHUB_REPO_NAME!,
      basePath: process.env.GITHUB_PROMPTS_PATH || "prompts/",
    });

    const orchestrator = new SyncOrchestrator(driveClient, githubClient);
    const operation = await orchestrator.syncAll(direction);

    return NextResponse.json({ success: true, operation });
  } catch (error: any) {
    console.error("GitHub sync error:", error);
    return NextResponse.json(
      { error: error.message || "Sync failed" },
      { status: 500 }
    );
  }
}
```

**Create `app/api/github/resolve/route.ts`:**
```typescript
import { NextRequest, NextResponse } from "next/server";
// Implementation for conflict resolution endpoint
```

#### 2.3.7 UI Components

**Create `components/github/GitHubSyncButton.tsx`:**
- Dropdown button with options: "Push to GitHub", "Pull from GitHub", "Sync Both"
- Loading state during sync
- Error state with retry button
- Success toast on completion

**Create `components/github/ConflictResolutionModal.tsx`:**
- Side-by-side diff view (Monaco Editor in read-only mode)
- Action buttons: Keep Mine, Keep Theirs, Manual Merge
- Framer Motion animations (fade-in 200ms)

**Update `components/shared/SyncStatus.tsx`:**
- Add real GitHub status (currently mocked)
- Connect to GitHub sync state
- Show last sync timestamp
- Add sync progress indicator

#### 2.3.8 Environment Variables

**Update `.env.example`:**
```bash
# GitHub OAuth Configuration
GITHUB_CLIENT_ID=your-github-oauth-app-client-id
GITHUB_CLIENT_SECRET=your-github-oauth-app-secret

# GitHub Repository Configuration
GITHUB_REPO_OWNER=your-username-or-org
GITHUB_REPO_NAME=your-prompts-repo
GITHUB_PROMPTS_PATH=prompts/
```

---

## 3. Data Model Changes

### 3.1 Type Updates

**Extended `PromptMetadata`:**
```typescript
export interface PromptMetadata {
  // Existing fields
  title?: string;
  description?: string;
  tags?: string[];
  public?: boolean;
  author?: string;
  created?: string;
  version?: string;
  
  // NEW fields
  category?: string;
  updated?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  license?: string;
  keywords?: string[];
}
```

**New Types:**
```typescript
export interface PromptFilterOptions { ... }
export interface PromptAggregations { ... }
export interface GitHubFile { ... }
export interface SyncConflict { ... }
export interface SyncOperation { ... }
```

**Updated `ContextBusEvent`:**
```typescript
export type ContextBusEvent =
  | ... existing events ...
  | { type: 'SYNC_STARTED'; payload: { operation: SyncOperation } }
  | { type: 'SYNC_FILE_COMPLETED'; payload: { fileName: string; status: 'success' | 'error' } }
  | { type: 'SYNC_COMPLETED'; payload: { operation: SyncOperation } }
  | { type: 'SYNC_CONFLICT'; payload: { conflict: SyncConflict } }
  | { type: 'GITHUB_AUTH_CHANGED'; payload: { connected: boolean } };
```

### 3.2 Database Schema

No database changes required. All data stored in:
- Google Drive (file content + metadata)
- GitHub (file content + commits)
- LocalStorage (UI preferences, filter state)

---

## 4. Source Code Structure Changes

### 4.1 New Files

```
lib/github/
├── client.ts              # GitHubClient class (similar to DriveClient)
├── sync.ts                # SyncOrchestrator class
├── types.ts               # GitHub-specific types
└── auth.ts                # GitHub OAuth helpers (if needed)

lib/
└── promptUtils.ts         # Aggregation and filtering utilities

components/github/
├── GitHubSyncButton.tsx   # Sync trigger UI
├── ConflictResolutionModal.tsx
├── SyncProgressToast.tsx  # Progress indicator
└── GitHubStatusBadge.tsx  # Connection status

components/library/
├── FilterPanel.tsx        # Advanced filters UI
├── CategoryTabs.tsx       # Category navigation
└── FilteredPromptView.tsx # Shared component for Library/Gallery

components/shared/
└── SortDropdown.tsx       # Reusable sort component

hooks/
└── useGitHubSync.ts       # GitHub sync state management

app/api/github/
├── sync/route.ts          # POST /api/github/sync
├── resolve/route.ts       # POST /api/github/resolve
└── files/route.ts         # GET /api/github/files
```

### 4.2 Modified Files

```
lib/types.ts               # Add new interfaces
lib/auth.ts                # Add GitHub provider
hooks/usePromptSearch.ts   # Enhanced filtering
components/shared/SyncStatus.tsx    # GitHub status
components/shared/PromptCard.tsx    # Category badge
components/library/LibraryView.tsx  # Filter integration
components/gallery/GalleryView.tsx  # Filter integration
.env.example               # GitHub env vars
types/next-auth.d.ts       # GitHub token in session
```

---

## 5. Delivery Phases

### Phase 1: Core Validation (Days 1-3)
**Goal:** Validate all existing features work correctly.

**Tasks:**
1. Set up validation test log structure in JOURNAL.md
2. Execute Sprint 2 validation tests (Google Drive, Monaco Editor)
3. Execute Sprint 3 validation tests (Context Bus, Library/Gallery, Multi-Agent)
4. Capture screenshots for all test scenarios
5. Document findings and performance metrics
6. Fix any P0/P1 bugs discovered
7. Update JOURNAL.md with results

**Deliverables:**
- ✅ Validation section in JOURNAL.md
- ✅ Screenshots in `05_Logs/screenshots/validation/`
- ✅ Bug list (if any)
- ✅ Performance metrics document

**Exit Criteria:**
- All validation tests pass
- Zero P0 bugs
- Screenshots captured
- JOURNAL.md updated

---

### Phase 2: Advanced Prompt Management (Days 4-7)
**Goal:** Implement enhanced search, filtering, and categorization.

**Tasks:**
1. Update `lib/types.ts` with extended metadata fields
2. Create `lib/promptUtils.ts` with aggregation functions
3. Update `hooks/usePromptSearch.ts` with advanced filtering
4. Create `components/library/FilterPanel.tsx`
5. Create `components/library/CategoryTabs.tsx`
6. Create `components/shared/SortDropdown.tsx`
7. Update `components/shared/PromptCard.tsx` with category badge
8. Update `components/library/LibraryView.tsx` with filter integration
9. Update `components/gallery/GalleryView.tsx` with filter integration
10. Implement URL query parameter persistence
11. Add localStorage persistence for sort preference
12. Test all filter combinations
13. Run `npm run lint` and `npm run type-check`

**Deliverables:**
- ✅ Extended metadata parsing working
- ✅ Multi-tag filter works
- ✅ Author filter works
- ✅ Date range filter works
- ✅ Category tabs work
- ✅ Sort options work
- ✅ Filters persist to URL
- ✅ Zero ESLint warnings
- ✅ Zero TypeScript errors

**Exit Criteria:**
- All filters work independently and in combination
- UI is responsive on mobile/tablet/desktop
- Animations complete in 200-300ms
- All tests pass (lint, type-check)

---

### Phase 3: GitHub Sync (Days 8-14)
**Goal:** Implement bidirectional GitHub synchronization.

#### Milestone 1: GitHub Client & Auth (Days 8-9)

**Tasks:**
1. Install `@octokit/rest` and `@octokit/auth-oauth-app`
2. Create `lib/github/types.ts`
3. Create `lib/github/client.ts` (GitHubClient class)
4. Add GitHub provider to `lib/auth.ts`
5. Update `types/next-auth.d.ts`
6. Update `.env.example` with GitHub variables
7. Test GitHub OAuth flow
8. Test GitHubClient CRUD operations

**Deliverables:**
- ✅ GitHub OAuth works
- ✅ GitHubClient can list/read/write files
- ✅ Error handling works

#### Milestone 2: Sync Orchestration (Days 10-11)

**Tasks:**
1. Create `lib/github/sync.ts` (SyncOrchestrator class)
2. Implement push workflow (Drive → GitHub)
3. Implement pull workflow (GitHub → Drive)
4. Add event emitters for sync progress
5. Create `app/api/github/sync/route.ts`
6. Test sync operations

**Deliverables:**
- ✅ Push sync works
- ✅ Pull sync works
- ✅ Events emitted correctly

#### Milestone 3: Conflict Resolution (Days 12-13)

**Tasks:**
1. Implement conflict detection logic
2. Create `components/github/ConflictResolutionModal.tsx`
3. Implement diff view (side-by-side Monaco editors)
4. Implement resolution strategies (Keep Mine, Keep Theirs, Manual Merge)
5. Create `app/api/github/resolve/route.ts`
6. Test conflict scenarios

**Deliverables:**
- ✅ Conflicts detected accurately
- ✅ Diff view shows differences
- ✅ All resolution strategies work

#### Milestone 4: UI Integration & Polish (Day 14)

**Tasks:**
1. Create `components/github/GitHubSyncButton.tsx`
2. Update `components/shared/SyncStatus.tsx`
3. Create `components/github/SyncProgressToast.tsx`
4. Integrate sync events with Context Bus
5. Add loading states and error handling
6. Test full user workflows
7. Run `npm run lint` and `npm run type-check`
8. Run `npm run build` to verify production build

**Deliverables:**
- ✅ Sync UI works
- ✅ Progress feedback visible
- ✅ Error states actionable
- ✅ Zero ESLint warnings
- ✅ Zero TypeScript errors
- ✅ Production build succeeds

**Exit Criteria:**
- Bidirectional sync works
- Conflict resolution works
- All UI feedback is clear
- All tests pass
- Production build succeeds

---

## 6. Verification Approach

### 6.1 Type Safety
```bash
npm run type-check
```
**Expected:** Zero TypeScript errors

### 6.2 Code Quality
```bash
npm run lint
```
**Expected:** Zero ESLint warnings

### 6.3 Build Validation
```bash
npm run build
```
**Expected:** Successful production build with no errors

### 6.4 Manual Testing

**Core Validation:**
- Follow test scenarios from PRD sections 2.1 and 2.2
- Document all findings in JOURNAL.md

**Advanced Filtering:**
- Test each filter independently
- Test filter combinations (tags + author + date)
- Verify URL persistence works
- Test on mobile/tablet/desktop

**GitHub Sync:**
- Test push workflow (Drive → GitHub)
- Test pull workflow (GitHub → Drive)
- Test conflict resolution (all three strategies)
- Test error scenarios (network failure, token expiration)
- Verify commit messages are meaningful

### 6.5 Performance Benchmarks

**Metrics to Capture:**
- Context Bus event propagation time (target: <100ms)
- Monaco Editor load time (target: <2s for files <100KB)
- Auto-save debounce timing (verify 500ms)
- Filter application time (target: <100ms)
- Sync operation time (target: <5s for 10 files)

### 6.6 Acceptance Criteria

**Phase 1:**
- ✅ All validation tests pass
- ✅ Screenshots captured
- ✅ JOURNAL.md updated
- ✅ Zero P0 bugs

**Phase 2:**
- ✅ All filters work correctly
- ✅ Category tabs functional
- ✅ Extended metadata displays
- ✅ Zero ESLint warnings
- ✅ Zero TypeScript errors

**Phase 3:**
- ✅ GitHub OAuth works
- ✅ Bidirectional sync works
- ✅ Conflict resolution works
- ✅ All UI feedback clear
- ✅ Production build succeeds
- ✅ Zero data loss in any scenario

---

## 7. Risk Mitigation

### 7.1 Technical Risks

**Risk:** GitHub API rate limiting (5000 requests/hour)  
**Mitigation:**
- Implement request caching
- Batch operations (max 20 files at a time)
- Display rate limit status in UI
- Graceful degradation when limit reached

**Risk:** OAuth token expiration during sync  
**Mitigation:**
- Validate tokens before starting sync
- Implement silent token refresh
- Retry with fresh token on 401 errors

**Risk:** Large file sync performance  
**Mitigation:**
- Implement pagination (20 files per batch)
- Show progress indicator
- Allow cancel operation
- Queue-based sync architecture

### 7.2 UX Risks

**Risk:** Conflict resolution too complex  
**Mitigation:**
- Clear visual diff view
- Default to safest option (Manual Merge)
- Include help text
- Beta test with users

**Risk:** Filter overwhelm  
**Mitigation:**
- Start with collapsed filter panel
- Show filter count badge
- Provide "Reset Filters" button
- Save common filter presets (future)

---

## 8. Dependencies & Prerequisites

**External Dependencies:**
- `@octokit/rest@^20.0.0` (new)
- `@octokit/auth-oauth-app@^7.0.0` (new)
- All existing dependencies remain unchanged

**Environment Setup:**
- GitHub OAuth app created and configured
- Google Drive API credentials (existing)
- Access to Google Drive `/03_Prompts` folder (existing)
- GitHub repository for prompt storage (new)

**Development Prerequisites:**
- Node.js 18+ installed
- npm 9+ installed
- Access to Next.js 14 documentation
- Access to Octokit documentation

---

## 9. Open Questions & Decisions

### 9.1 User Decisions Required

1. **GitHub sync mode:** Automatic on save or manual-only?
   - **Recommendation:** Manual-only initially, add auto-sync in future sprint
   - **Reason:** Reduces complexity, prevents accidental overwrites

2. **Default conflict resolution:** Which strategy?
   - **Recommendation:** Manual Merge
   - **Reason:** Safest, prevents data loss

3. **Filter persistence:** URL vs localStorage vs both?
   - **Recommendation:** Both (URL for shareability, localStorage for convenience)
   - **Reason:** Best UX for different use cases

4. **Default category names:** Pre-defined or user-defined?
   - **Recommendation:** User-defined (parsed from frontmatter only)
   - **Reason:** Maximum flexibility, no assumptions

### 9.2 Technical Decisions Made

1. **Sync queue:** Implement now or defer?
   - **Decision:** Defer to future sprint
   - **Reason:** YAGNI principle, can add if performance issues arise

2. **GitHub SHA storage:** Store in Drive metadata?
   - **Decision:** No, fetch on-demand
   - **Reason:** Simpler implementation, no metadata pollution

3. **Webhook support:** Implement now or defer?
   - **Decision:** Defer to future sprint
   - **Reason:** Not in scope, polling is sufficient for MVP

4. **Three-way merge:** Implement or defer?
   - **Decision:** Defer to future sprint
   - **Reason:** Complex, manual resolution sufficient for MVP

---

## 10. Success Criteria Summary

**Sprint Complete When:**
1. ✅ All Sprint 2/3 features validated with test logs and screenshots
2. ✅ Advanced filtering (tags, author, date) works with accurate results
3. ✅ Category system implemented and intuitive
4. ✅ GitHub bidirectional sync works for all file operations
5. ✅ Conflict resolution UI tested with all resolution strategies
6. ✅ SyncStatus shows GitHub state accurately
7. ✅ Zero ESLint warnings
8. ✅ Zero TypeScript errors
9. ✅ Production build succeeds
10. ✅ All features responsive on mobile/tablet/desktop
11. ✅ JOURNAL.md updated with validation results and implementation notes
12. ✅ Screenshots captured for all major features

---

## 11. Appendix

### A. Code Style Guidelines

**TypeScript:**
- Use `interface` for object shapes, `type` for unions/intersections
- Prefer `async/await` over `.then()` chains
- Use optional chaining (`?.`) and nullish coalescing (`??`)
- Export types from `lib/types.ts` or feature-specific `types.ts`

**React:**
- Use `"use client"` directive for client components
- Prefer functional components with hooks
- Extract complex logic to custom hooks
- Use Framer Motion for animations (200-300ms duration)

**Tailwind CSS:**
- Use `cn()` utility for conditional classes
- Follow existing color palette (blue-600, green-500, red-500, yellow-500)
- Maintain responsive breakpoints (sm:, md:, lg:)
- Use `transition-*` utilities for smooth effects

**File Naming:**
- Components: PascalCase (e.g., `FilterPanel.tsx`)
- Hooks: camelCase with `use` prefix (e.g., `usePromptSearch.ts`)
- Utils: camelCase (e.g., `promptUtils.ts`)
- API routes: lowercase (e.g., `sync/route.ts`)

### B. Animation Standards

All animations follow the "Hardworking" aesthetic:
- **Duration:** 200-300ms (never exceeds 300ms)
- **Easing:** `ease-out` for entrances, `ease-in` for exits
- **Layout transitions:** max 300ms
- **No flashy effects:** Calm, stable, purposeful

**Examples:**
```tsx
// Modal fade-in
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
  transition={{ duration: 0.2, ease: "easeOut" }}
>
  {content}
</motion.div>

// Card hover
whileHover={{
  scale: 1.02,
  transition: { duration: 0.2 }
}}
```

### C. Error Handling Patterns

**API Routes:**
```typescript
try {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  
  // Operation
  
  return NextResponse.json({ success: true, data });
} catch (error: any) {
  console.error("Operation failed:", error);
  return NextResponse.json(
    { error: error.message || "Operation failed" },
    { status: 500 }
  );
}
```

**Client Components:**
```typescript
try {
  setLoading(true);
  const response = await fetch("/api/endpoint", { ... });
  const data = await response.json();
  
  if (!response.ok) {
    toast.error(data.error || "Operation failed");
    return;
  }
  
  toast.success("Operation successful");
} catch (error) {
  console.error("Error:", error);
  toast.error("An unexpected error occurred");
} finally {
  setLoading(false);
}
```

---

**End of Technical Specification**
