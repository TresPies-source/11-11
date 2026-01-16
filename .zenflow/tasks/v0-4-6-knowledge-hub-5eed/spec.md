# Technical Specification: Knowledge Hub (Prompt Bridge v2)

**Version:** 1.0  
**Date:** January 15, 2026  
**Based on:** `requirements.md`  
**Status:** Draft

---

## 1. Technical Context

### 1.1 Technology Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: PGlite (local PostgreSQL in WebAssembly)
- **State Management**: Zustand
- **UI Components**: React with shadcn/ui patterns
- **Animations**: Framer Motion
- **Styling**: Tailwind CSS
- **Authentication**: Custom auth (`@/lib/auth`)
- **Testing**: TypeScript compilation (`npm run type-check`), ESLint (`npm run lint`)

### 1.2 Key Constraints

1. **No Supabase** - All data is stored locally in PGlite
2. **Optional Google Drive** - Prompts can sync to Google Drive via `drive_file_id` column
3. **Dev Mode Support** - Must work with `NEXT_PUBLIC_DEV_MODE=true` (mock authentication)
4. **Session Messages** - Currently NOT persisted; needs new `session_messages` table
5. **File IDs** - Workbench uses Google Drive `fileId` when file-based, or generated IDs for unsaved tabs

---

## 2. Database Schema Changes

### 2.1 Migration 011: Add Knowledge Hub

**File:** `lib/pglite/migrations/011_add_knowledge_hub.ts`

#### 2.1.1 New Table: `knowledge_links`

Stores bidirectional relationships between knowledge artifacts.

```sql
CREATE TABLE IF NOT EXISTS knowledge_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type TEXT NOT NULL CHECK (source_type IN ('session', 'prompt', 'seed', 'file')),
  source_id TEXT NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('session', 'prompt', 'seed', 'file')),
  target_id TEXT NOT NULL,
  relationship TEXT NOT NULL CHECK (relationship IN ('extracted_from', 'discussed_in', 'refined_in', 'created_from')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_knowledge_links_source ON knowledge_links(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_links_target ON knowledge_links(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_links_user ON knowledge_links(user_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_links_created_at ON knowledge_links(created_at DESC);
```

**Notes:**
- `source_id` and `target_id` are TEXT (not UUID) because:
  - Seeds use TEXT IDs (`seed_123`)
  - Sessions use UUID
  - Files use Google Drive IDs (TEXT)
  - Prompts use UUID
- `metadata` JSONB allows future extension (e.g., storing extracted message IDs, line numbers, etc.)

#### 2.1.2 New Table: `session_messages`

Stores Dojo session messages for persistence and extraction.

```sql
CREATE TABLE IF NOT EXISTS session_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'agent')),
  content TEXT NOT NULL,
  mode TEXT CHECK (mode IN ('Mirror', 'Scout', 'Gardener', 'Implementation')),
  timestamp TIMESTAMPTZ NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_session_messages_session_id ON session_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_session_messages_timestamp ON session_messages(timestamp);
```

**Notes:**
- `session_id` references the existing `sessions` table (no FK constraint to allow flexibility)
- `mode` tracks which Dojo mode the message was in
- `metadata` can store additional context (e.g., code blocks, artifacts)

#### 2.1.3 Migration Function

```typescript
export const migration011 = `
-- Migration 011: Add Knowledge Hub Schema
-- Date: 2026-01-15
-- Purpose: Add knowledge_links and session_messages tables for Knowledge Hub feature

-- ============================================================
-- TABLE: knowledge_links
-- ============================================================
CREATE TABLE IF NOT EXISTS knowledge_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type TEXT NOT NULL CHECK (source_type IN ('session', 'prompt', 'seed', 'file')),
  source_id TEXT NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('session', 'prompt', 'seed', 'file')),
  target_id TEXT NOT NULL,
  relationship TEXT NOT NULL CHECK (relationship IN ('extracted_from', 'discussed_in', 'refined_in', 'created_from')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_knowledge_links_source ON knowledge_links(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_links_target ON knowledge_links(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_links_user ON knowledge_links(user_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_links_created_at ON knowledge_links(created_at DESC);

-- ============================================================
-- TABLE: session_messages
-- ============================================================
CREATE TABLE IF NOT EXISTS session_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'agent')),
  content TEXT NOT NULL,
  mode TEXT CHECK (mode IN ('Mirror', 'Scout', 'Gardener', 'Implementation')),
  timestamp TIMESTAMPTZ NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_session_messages_session_id ON session_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_session_messages_timestamp ON session_messages(timestamp);
`;

export async function applyMigration011(db: any): Promise<void> {
  try {
    console.log('[Migration 011] Adding Knowledge Hub schema...');
    await db.exec(migration011);
    console.log('[Migration 011] Successfully added knowledge_links and session_messages tables');
  } catch (error) {
    console.error('[Migration 011] Error applying migration:', error);
    throw error;
  }
}
```

### 2.2 Update Migration Runner

**File:** `lib/pglite/migrations/index.ts`

Add migration 011 to the migrations array and increment the version number.

---

## 3. TypeScript Types & Interfaces

### 3.1 Knowledge Links Types

**File:** `lib/hub/types.ts` (new file)

```typescript
export type ArtifactType = 'session' | 'prompt' | 'seed' | 'file';

export type RelationshipType = 
  | 'extracted_from'    // Target was extracted from Source (e.g., Seed extracted from Session)
  | 'discussed_in'      // Source was discussed in Target (e.g., Prompt discussed in Session)
  | 'refined_in'        // Source was refined in Target (e.g., Code refined in Workbench)
  | 'created_from';     // Target was created from Source (e.g., Prompt created from File)

export interface KnowledgeLink {
  id: string;
  source_type: ArtifactType;
  source_id: string;
  target_type: ArtifactType;
  target_id: string;
  relationship: RelationshipType;
  metadata: Record<string, any>;
  created_at: string;
  user_id: string;
}

export interface KnowledgeLinkInsert {
  source_type: ArtifactType;
  source_id: string;
  target_type: ArtifactType;
  target_id: string;
  relationship: RelationshipType;
  metadata?: Record<string, any>;
  user_id: string;
}

export interface LineageNode {
  type: ArtifactType;
  id: string;
  title: string;
  content_preview: string;
  created_at: string;
  relationship?: RelationshipType;
}

export interface TransferRequest {
  source: {
    type: ArtifactType;
    id: string;
  };
  target: {
    type: ArtifactType;
    id?: string;
  };
  content: {
    title?: string;
    content: string;
    description?: string;
    tags?: string[];
    type?: string;
    status?: string;
    visibility?: string;
    why_matters?: string;
    revisit_when?: string;
  };
  create_link?: boolean;
}

export interface TransferResponse {
  success: boolean;
  target_id: string;
  link_id?: string;
  message?: string;
}
```

### 3.2 Session Messages Types

**File:** `lib/dojo/types.ts` (add to existing file or create new)

```typescript
import { DojoMode } from '@/lib/stores/dojo.store';

export interface SessionMessage {
  id: string;
  session_id: string;
  role: 'user' | 'agent';
  content: string;
  mode?: DojoMode;
  timestamp: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface SessionMessageInsert {
  session_id: string;
  role: 'user' | 'agent';
  content: string;
  mode?: DojoMode;
  timestamp?: string;
  metadata?: Record<string, any>;
}
```

---

## 4. Database Operations Layer

### 4.1 Knowledge Links Operations

**File:** `lib/pglite/knowledge-links.ts` (new file)

```typescript
import { getDB } from './client';
import type { KnowledgeLink, KnowledgeLinkInsert, LineageNode } from '@/lib/hub/types';

export async function insertKnowledgeLink(
  link: KnowledgeLinkInsert
): Promise<KnowledgeLink> {
  try {
    const db = await getDB();
    
    const result = await db.query(
      `INSERT INTO knowledge_links (
        source_type, source_id, target_type, target_id, relationship, metadata, user_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [
        link.source_type,
        link.source_id,
        link.target_type,
        link.target_id,
        link.relationship,
        JSON.stringify(link.metadata || {}),
        link.user_id,
      ]
    );
    
    console.log(`[KNOWLEDGE_LINKS] Created link ${result.rows[0].id}`);
    return result.rows[0] as KnowledgeLink;
  } catch (error) {
    console.error('[KNOWLEDGE_LINKS] Error inserting link:', error);
    throw error;
  }
}

export async function getLineage(
  type: string,
  id: string,
  userId: string
): Promise<LineageNode[]> {
  try {
    const db = await getDB();
    
    const result = await db.query(
      `SELECT 
        kl.source_type as type,
        kl.source_id as id,
        kl.relationship,
        kl.created_at
      FROM knowledge_links kl
      WHERE kl.target_type = $1 
        AND kl.target_id = $2 
        AND kl.user_id = $3
      
      UNION
      
      SELECT 
        kl.target_type as type,
        kl.target_id as id,
        kl.relationship,
        kl.created_at
      FROM knowledge_links kl
      WHERE kl.source_type = $1 
        AND kl.source_id = $2 
        AND kl.user_id = $3
      
      ORDER BY created_at DESC`,
      [type, id, userId]
    );
    
    const nodes: LineageNode[] = [];
    
    for (const row of result.rows) {
      const artifact = await getArtifactMetadata(row.type, row.id, userId);
      if (artifact) {
        nodes.push({
          type: row.type,
          id: row.id,
          title: artifact.title,
          content_preview: artifact.preview,
          created_at: row.created_at,
          relationship: row.relationship,
        });
      }
    }
    
    return nodes;
  } catch (error) {
    console.error('[KNOWLEDGE_LINKS] Error getting lineage:', error);
    throw error;
  }
}

async function getArtifactMetadata(
  type: string,
  id: string,
  userId: string
): Promise<{ title: string; preview: string } | null> {
  try {
    const db = await getDB();
    
    let query = '';
    let params: any[] = [];
    
    switch (type) {
      case 'prompt':
        query = 'SELECT title, SUBSTRING(content, 1, 200) as preview FROM prompts WHERE id = $1 AND user_id = $2';
        params = [id, userId];
        break;
      case 'seed':
        query = 'SELECT name as title, SUBSTRING(content, 1, 200) as preview FROM seeds WHERE id = $1 AND user_id = $2';
        params = [id, userId];
        break;
      case 'session':
        query = 'SELECT title, situation as preview FROM sessions WHERE id = $1';
        params = [id];
        break;
      case 'file':
        return { title: 'Workbench File', preview: id };
      default:
        return null;
    }
    
    const result = await db.query(query, params);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return result.rows[0] as { title: string; preview: string };
  } catch (error) {
    console.error('[KNOWLEDGE_LINKS] Error getting artifact metadata:', error);
    return null;
  }
}

export async function deleteKnowledgeLink(linkId: string): Promise<boolean> {
  try {
    const db = await getDB();
    
    const result = await db.query(
      'DELETE FROM knowledge_links WHERE id = $1 RETURNING id',
      [linkId]
    );
    
    return result.rows.length > 0;
  } catch (error) {
    console.error('[KNOWLEDGE_LINKS] Error deleting link:', error);
    throw error;
  }
}
```

### 4.2 Session Messages Operations

**File:** `lib/pglite/session-messages.ts` (new file)

```typescript
import { getDB } from './client';
import type { SessionMessage, SessionMessageInsert } from '@/lib/dojo/types';

export async function insertSessionMessage(
  message: SessionMessageInsert
): Promise<SessionMessage> {
  try {
    const db = await getDB();
    
    const timestamp = message.timestamp || new Date().toISOString();
    
    const result = await db.query(
      `INSERT INTO session_messages (
        session_id, role, content, mode, timestamp, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [
        message.session_id,
        message.role,
        message.content,
        message.mode || null,
        timestamp,
        JSON.stringify(message.metadata || {}),
      ]
    );
    
    return result.rows[0] as SessionMessage;
  } catch (error) {
    console.error('[SESSION_MESSAGES] Error inserting message:', error);
    throw error;
  }
}

export async function getSessionMessages(
  sessionId: string
): Promise<SessionMessage[]> {
  try {
    const db = await getDB();
    
    const result = await db.query(
      'SELECT * FROM session_messages WHERE session_id = $1 ORDER BY timestamp ASC',
      [sessionId]
    );
    
    return result.rows as SessionMessage[];
  } catch (error) {
    console.error('[SESSION_MESSAGES] Error getting messages:', error);
    throw error;
  }
}

export async function deleteSessionMessages(
  sessionId: string
): Promise<number> {
  try {
    const db = await getDB();
    
    const result = await db.query(
      'DELETE FROM session_messages WHERE session_id = $1 RETURNING id',
      [sessionId]
    );
    
    return result.rows.length;
  } catch (error) {
    console.error('[SESSION_MESSAGES] Error deleting messages:', error);
    throw error;
  }
}
```

---

## 5. API Endpoints

### 5.1 Hub Transfer Endpoint

**File:** `app/api/hub/transfer/route.ts` (new file)

Handles all knowledge transfer operations (save from Workbench, extract from Session, etc.).

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { insertKnowledgeLink } from '@/lib/pglite/knowledge-links';
import { createPrompt } from '@/lib/pglite/prompts';
import { insertSeed } from '@/lib/pglite/seeds';
import type { TransferRequest, TransferResponse } from '@/lib/hub/types';
import type { PromptInsert } from '@/lib/pglite/types';
import type { SeedInsert } from '@/lib/seeds/types';

export const runtime = 'nodejs';

const isDevMode = () => process.env.NEXT_PUBLIC_DEV_MODE === 'true';

export async function POST(request: NextRequest) {
  try {
    let userId: string;

    if (isDevMode()) {
      console.warn('[Hub Transfer API] Running in dev mode with mock authentication');
      userId = 'dev@11-11.dev';
    } else {
      const session = await auth();
      if (!session || !session.user?.email) {
        return NextResponse.json(
          { error: 'Unauthorized - no valid session' },
          { status: 401 }
        );
      }
      userId = session.user.email;
    }

    const body = await request.json() as TransferRequest;
    
    if (!body.source || !body.target || !body.content) {
      return NextResponse.json(
        { error: 'Missing required fields: source, target, content' },
        { status: 400 }
      );
    }

    let targetId: string;
    let linkId: string | undefined;

    switch (body.target.type) {
      case 'prompt': {
        const promptData: PromptInsert = {
          user_id: userId,
          title: body.content.title || 'Untitled Prompt',
          content: body.content.content,
          status: 'draft',
          visibility: (body.content.visibility as any) || 'private',
        };
        
        const prompt = await createPrompt(promptData);
        targetId = prompt.id;
        break;
      }

      case 'seed': {
        const seedData: SeedInsert = {
          name: body.content.title || 'Untitled Seed',
          type: (body.content.type as any) || 'artifact',
          content: body.content.content,
          status: (body.content.status as any) || 'new',
          why_matters: body.content.why_matters || null,
          revisit_when: body.content.revisit_when || null,
          user_id: userId,
        };
        
        const seed = await insertSeed(seedData);
        targetId = seed.id;
        break;
      }

      default:
        return NextResponse.json(
          { error: `Unsupported target type: ${body.target.type}` },
          { status: 400 }
        );
    }

    if (body.create_link !== false) {
      const link = await insertKnowledgeLink({
        source_type: body.source.type,
        source_id: body.source.id,
        target_type: body.target.type,
        target_id: targetId,
        relationship: 'created_from',
        metadata: {},
        user_id: userId,
      });
      linkId = link.id;
    }

    const response: TransferResponse = {
      success: true,
      target_id: targetId,
      link_id: linkId,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('[Hub Transfer API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process transfer' },
      { status: 500 }
    );
  }
}
```

### 5.2 Hub Lineage Endpoint

**File:** `app/api/hub/lineage/[type]/[id]/route.ts` (new file)

Retrieves the lineage graph for a knowledge artifact.

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getLineage } from '@/lib/pglite/knowledge-links';

export const runtime = 'nodejs';

const isDevMode = () => process.env.NEXT_PUBLIC_DEV_MODE === 'true';

export async function GET(
  request: NextRequest,
  { params }: { params: { type: string; id: string } }
) {
  try {
    let userId: string;

    if (isDevMode()) {
      console.warn('[Hub Lineage API] Running in dev mode with mock authentication');
      userId = 'dev@11-11.dev';
    } else {
      const session = await auth();
      if (!session || !session.user?.email) {
        return NextResponse.json(
          { error: 'Unauthorized - no valid session' },
          { status: 401 }
        );
      }
      userId = session.user.email;
    }

    const { type, id } = params;

    if (!['session', 'prompt', 'seed', 'file'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid artifact type' },
        { status: 400 }
      );
    }

    const lineage = await getLineage(type, id, userId);

    return NextResponse.json({ lineage });
  } catch (error) {
    console.error('[Hub Lineage API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve lineage' },
      { status: 500 }
    );
  }
}
```

### 5.3 Dojo Create-From-Context Endpoint

**File:** `app/api/dojo/create-from-context/route.ts` (new file)

Creates a new Dojo session pre-populated with context from an artifact.

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDB } from '@/lib/pglite/client';
import { insertKnowledgeLink } from '@/lib/pglite/knowledge-links';
import type { ArtifactType } from '@/lib/hub/types';

export const runtime = 'nodejs';

const isDevMode = () => process.env.NEXT_PUBLIC_DEV_MODE === 'true';

interface CreateFromContextRequest {
  artifact_type: ArtifactType;
  artifact_id: string;
  situation: string;
  perspectives?: string[];
}

export async function POST(request: NextRequest) {
  try {
    let userId: string;

    if (isDevMode()) {
      console.warn('[Dojo Create-From-Context API] Running in dev mode');
      userId = 'dev@11-11.dev';
    } else {
      const session = await auth();
      if (!session || !session.user?.email) {
        return NextResponse.json(
          { error: 'Unauthorized - no valid session' },
          { status: 401 }
        );
      }
      userId = session.user.email;
    }

    const body = await request.json() as CreateFromContextRequest;
    
    if (!body.artifact_type || !body.artifact_id || !body.situation) {
      return NextResponse.json(
        { error: 'Missing required fields: artifact_type, artifact_id, situation' },
        { status: 400 }
      );
    }

    const db = await getDB();
    
    const result = await db.query(
      `INSERT INTO sessions (id, title, situation, mode, created_at, updated_at)
       VALUES (gen_random_uuid(), $1, $2, $3, NOW(), NOW())
       RETURNING id`,
      [
        `Discussion: ${body.situation.substring(0, 50)}`,
        body.situation,
        'Mirror',
      ]
    );
    
    const sessionId = result.rows[0].id;

    await insertKnowledgeLink({
      source_type: body.artifact_type,
      source_id: body.artifact_id,
      target_type: 'session',
      target_id: sessionId,
      relationship: 'discussed_in',
      metadata: { perspectives: body.perspectives || [] },
      user_id: userId,
    });

    return NextResponse.json({ session_id: sessionId }, { status: 201 });
  } catch (error) {
    console.error('[Dojo Create-From-Context API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}
```

### 5.4 Session Messages Persistence

**File:** `app/api/dojo/messages/route.ts` (new file)

Saves messages to the database for persistence.

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { insertSessionMessage } from '@/lib/pglite/session-messages';
import type { SessionMessageInsert } from '@/lib/dojo/types';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as SessionMessageInsert;
    
    if (!body.session_id || !body.role || !body.content) {
      return NextResponse.json(
        { error: 'Missing required fields: session_id, role, content' },
        { status: 400 }
      );
    }

    const message = await insertSessionMessage(body);

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error('[Dojo Messages API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to save message' },
      { status: 500 }
    );
  }
}
```

---

## 6. UI Components

### 6.1 SaveArtifactModal Component

**File:** `components/workbench/SaveArtifactModal.tsx` (new file)

Modal for saving Workbench content as either a Prompt or Seed.

**Props:**
```typescript
interface SaveArtifactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (type: 'prompt' | 'seed', id: string) => void;
  initialContent: string;
  initialTitle?: string;
  sourceFileId?: string;
}
```

**Key Features:**
- Radio button group: `( ) Save as Prompt` / `( ) Save as Seed`
- Conditional fields when "Seed" is selected (Type dropdown, Status dropdown)
- Tags input field
- Public/Private toggle
- Form validation (title required, content required)
- Calls `POST /api/hub/transfer` with appropriate payload
- Follow pattern from `plant-seed-modal.tsx` (framer-motion, createPortal)

**Implementation Notes:**
- Use shadcn/ui patterns for form inputs
- Client-side validation before submission
- Show loading state during API call
- Display success toast on completion
- Auto-create knowledge_link if `sourceFileId` is provided

### 6.2 SaveSessionModal Component

**File:** `components/dojo/SaveSessionModal.tsx` (new file)

Modal for extracting knowledge from a Dojo session.

**Props:**
```typescript
interface SaveSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  sessionId: string;
  messages: DojoMessage[];
}
```

**Key Features:**
- Checkbox group: "What would you like to extract?"
  - `[ ] Full conversation (as a new Prompt)`
  - `[ ] Selected messages (as Seeds)` - opens message selector
  - `[ ] Code artifacts (open in Workbench)`
- Message selector UI (only visible if "Selected messages" is checked)
  - List of agent messages with checkboxes
  - Preview of message content
- Form fields:
  - Title (when saving full conversation)
  - Tags
  - Public/Private toggle
- Batch transfer logic:
  - If "Full conversation" → single Prompt
  - If "Selected messages" → multiple Seeds (one per message)
  - If "Code artifacts" → extract code blocks, open in Workbench, create links

**Implementation Notes:**
- Parse messages to identify code blocks (```language...```)
- Use `POST /api/hub/transfer` for each artifact
- Show progress indicator for batch operations
- Display summary of created artifacts

### 6.3 Message Context Menu

**File:** `components/dojo/MessageContextMenu.tsx` (new file)

Context menu (dropdown) for individual Dojo messages.

**Props:**
```typescript
interface MessageContextMenuProps {
  message: DojoMessage;
  sessionId: string;
}
```

**Menu Options:**
1. **Save as Prompt** - Opens mini modal with title/tags, calls transfer API
2. **Extract as Seed** - Opens mini modal with seed fields (type, status, why_matters, revisit_when)
3. **Open in Workbench** - (only if message contains code blocks) Extracts code, opens in new Workbench tab

**Implementation Notes:**
- Use Radix UI dropdown menu (shadcn pattern)
- Position near `...` button in ChatMessage component
- Extract code blocks using regex: `/```(\w+)?\n([\s\S]*?)```/g`

### 6.4 Enhanced PromptCard & SeedCard

**Files:** 
- `components/shared/PromptCard.tsx` (existing, update)
- `components/seeds/seed-card.tsx` (existing, update)

**New Button:** "Discuss in Dojo"

**Behavior:**
1. Click button
2. Call `POST /api/dojo/create-from-context` with:
   - `artifact_type`: 'prompt' or 'seed'
   - `artifact_id`: prompt.id or seed.id
   - `situation`: Pre-filled question like "I'd like to discuss this {type} in depth"
3. Redirect to `/dojo/{newSessionId}`

**Implementation Notes:**
- Add button to existing card footer
- Use routing: `router.push(\`/dojo/\${sessionId}\`)`
- Show toast notification: "Starting Dojo session..."

### 6.5 Workbench ActionBar Enhancement

**File:** `components/workbench/ActionBar.tsx` (existing, update)

**New Buttons:**
1. **"Save"** - Opens SaveArtifactModal
2. **"Discuss with Dojo"** - Opens DiscussWithDojoModal (see below)

**Implementation Notes:**
- Pass active tab's content and fileId to SaveArtifactModal
- Disable buttons when no active tab

### 6.6 DiscussWithDojoModal Component

**File:** `components/workbench/DiscussWithDojoModal.tsx` (new file)

Modal for starting a Dojo session with Workbench content as context.

**Props:**
```typescript
interface DiscussWithDojoModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileContent: string;
  fileId?: string;
  fileName?: string;
}
```

**Key Features:**
- Single textarea: "What would you like to discuss about this file?"
- Pre-filled placeholder: "Help me understand this code" / "Review this for best practices"
- Submit button calls `POST /api/dojo/create-from-context` with:
  - `artifact_type`: 'file'
  - `artifact_id`: fileId or generated ID
  - `situation`: user's question
  - `perspectives`: [fileContent] (first 1000 chars as context)
- Redirect to new Dojo session

**Implementation Notes:**
- Follow modal pattern from SaveArtifactModal
- Limit file content preview to reasonable size (avoid overwhelming context)

### 6.7 LineageViewer Component (Future Enhancement)

**File:** `components/hub/LineageViewer.tsx` (optional for Phase 3)

Visual graph showing knowledge lineage.

**Props:**
```typescript
interface LineageViewerProps {
  artifactType: ArtifactType;
  artifactId: string;
}
```

**Key Features:**
- Fetch lineage via `GET /api/hub/lineage/{type}/{id}`
- Render nodes and edges (use react-flow or similar)
- Click node to navigate to artifact
- Show relationship labels on edges

**Implementation Notes:**
- Defer to Phase 3 (not MVP)
- Can start with simple list view instead of graph

---

## 7. State Management Updates

### 7.1 Dojo Store Enhancement

**File:** `lib/stores/dojo.store.ts` (existing, update)

**New Actions:**
```typescript
interface DojoSessionState {
  // ... existing fields
  
  // NEW: Persist messages to DB
  persistMessage: (message: DojoMessage) => Promise<void>;
  
  // NEW: Load messages from DB
  loadMessages: (sessionId: string) => Promise<void>;
}
```

**Implementation:**
```typescript
persistMessage: async (message) => {
  try {
    await fetch('/api/dojo/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: get().sessionId,
        role: message.role,
        content: message.content,
        mode: message.mode,
        timestamp: new Date(message.timestamp).toISOString(),
        metadata: {},
      }),
    });
  } catch (error) {
    console.error('[DOJO_STORE] Failed to persist message:', error);
  }
},

loadMessages: async (sessionId) => {
  try {
    const response = await fetch(`/api/dojo/messages?session_id=${sessionId}`);
    const data = await response.json();
    
    set({
      messages: data.messages.map((m: any) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        mode: m.mode,
        timestamp: new Date(m.timestamp).getTime(),
      })),
    });
  } catch (error) {
    console.error('[DOJO_STORE] Failed to load messages:', error);
  }
},
```

### 7.2 Workbench Store (No Changes Required)

The existing Workbench store already tracks file IDs and content. No changes needed.

---

## 8. Integration Points

### 8.1 Workbench Page Integration

**File:** `app/workbench/page.tsx` (existing, update)

**Changes:**
1. Import SaveArtifactModal and DiscussWithDojoModal
2. Add modal state (`const [isSaveModalOpen, setIsSaveModalOpen] = useState(false)`)
3. Pass modal handlers to ActionBar
4. Render modals at bottom of component

```typescript
<SaveArtifactModal
  isOpen={isSaveModalOpen}
  onClose={() => setIsSaveModalOpen(false)}
  onSuccess={(type, id) => {
    toast.success(`${type} saved successfully!`);
    setIsSaveModalOpen(false);
  }}
  initialContent={activeTab?.content || ''}
  initialTitle={activeTab?.title}
  sourceFileId={activeTab?.fileId}
/>
```

### 8.2 Dojo Page Integration

**File:** `app/dojo/[sessionId]/page.tsx` (existing, update)

**Changes:**
1. Import SaveSessionModal and MessageContextMenu
2. Add "Save Session" button to header
3. Add modal state
4. Persist messages to DB on addMessage
5. Load messages from DB on mount (if session exists)

```typescript
useEffect(() => {
  if (sessionId) {
    loadMessages(sessionId);
  }
}, [sessionId]);

const handleAddMessage = (message: DojoMessage) => {
  addMessage(message);
  persistMessage(message);
};
```

### 8.3 Librarian Page Integration

**File:** `app/librarian/page.tsx` (existing, update)

**Changes:**
1. Add "Discuss in Dojo" button to PromptCard instances
2. Implement click handler:

```typescript
const handleDiscussPrompt = async (promptId: string) => {
  try {
    const response = await fetch('/api/dojo/create-from-context', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        artifact_type: 'prompt',
        artifact_id: promptId,
        situation: "I'd like to discuss this prompt in depth",
        perspectives: [],
      }),
    });
    
    const data = await response.json();
    router.push(`/dojo/${data.session_id}`);
  } catch (error) {
    toast.error('Failed to start Dojo session');
  }
};
```

### 8.4 Seeds Page Integration

**File:** `app/seeds/page.tsx` (existing, update)

Same pattern as Librarian page - add "Discuss in Dojo" button to SeedCard.

---

## 9. Phased Implementation Plan

### Phase 1: Core Save/Load (Week 1-2)

**Goal:** Enable saving from Workbench and loading into Workbench

**Deliverables:**
1. ✅ Migration 011 (knowledge_links table only)
2. ✅ Database operations: `knowledge-links.ts`
3. ✅ API endpoint: `/api/hub/transfer`
4. ✅ Component: SaveArtifactModal
5. ✅ Integration: Workbench ActionBar + Save button
6. ✅ Integration: PromptCard + SeedCard "Open in Workbench" button
7. ✅ Basic knowledge_link creation

**Success Criteria:**
- User can save Workbench content as Prompt ✅
- User can save Workbench content as Seed ✅
- User can open Prompt/Seed in Workbench ✅
- Knowledge links are created automatically ✅

### Phase 2: Session Extraction (Week 3-4)

**Goal:** Extract knowledge from Dojo sessions

**Deliverables:**
1. ✅ Migration 011 (add session_messages table)
2. ✅ Database operations: `session-messages.ts`
3. ✅ API endpoint: `/api/dojo/messages`
4. ✅ Dojo store: Add persistMessage and loadMessages
5. ✅ Component: SaveSessionModal
6. ✅ Component: MessageContextMenu
7. ✅ Integration: Dojo page message persistence
8. ✅ Integration: "Save Session" button in Dojo header

**Success Criteria:**
- Dojo messages are persisted to database ✅
- User can save full conversation as Prompt ✅
- User can extract individual messages as Seeds ✅
- User can extract code blocks to Workbench ✅
- Knowledge links track extraction lineage ✅

### Phase 3: Context Injection (Week 5-6)

**Goal:** Start Dojo sessions with artifact context

**Deliverables:**
1. ✅ API endpoint: `/api/dojo/create-from-context`
2. ✅ API endpoint: `/api/hub/lineage/{type}/{id}`
3. ✅ Component: DiscussWithDojoModal
4. ✅ Integration: PromptCard "Discuss in Dojo" button
5. ✅ Integration: SeedCard "Discuss in Dojo" button
6. ✅ Integration: Workbench "Discuss with Dojo" button
7. ✅ (Optional) Component: LineageViewer

**Success Criteria:**
- User can start Dojo session from Prompt ✅
- User can start Dojo session from Seed ✅
- User can start Dojo session from Workbench file ✅
- Session is pre-populated with artifact context ✅
- Knowledge links track "discussed_in" relationship ✅

---

## 10. Verification Approach

### 10.1 Type Safety

**Command:** `npm run type-check`

Ensure all new TypeScript files compile without errors.

### 10.2 Linting

**Command:** `npm run lint`

Fix any ESLint warnings or errors in new components.

### 10.3 Manual Testing Checklist

#### Phase 1:
- [ ] Open Workbench, create new file, save as Prompt
- [ ] Open Workbench, create new file, save as Seed
- [ ] Open Library, click "Open in Workbench" on a Prompt
- [ ] Open Seeds page, click "Open in Workbench" on a Seed
- [ ] Verify knowledge_links entries in database

#### Phase 2:
- [ ] Start Dojo session, send messages
- [ ] Check database for persisted messages
- [ ] Click "Save Session" button, save full conversation as Prompt
- [ ] Click `...` on message, save as Seed
- [ ] Click `...` on message with code, open in Workbench
- [ ] Verify knowledge_links for extraction relationships

#### Phase 3:
- [ ] Open Prompt, click "Discuss in Dojo"
- [ ] Open Seed, click "Discuss in Dojo"
- [ ] Open Workbench file, click "Discuss with Dojo"
- [ ] Verify new Dojo session is created with context
- [ ] Verify knowledge_links for "discussed_in" relationships
- [ ] Call lineage API and verify graph structure

### 10.4 Database Verification

After each phase, run queries to verify data integrity:

```sql
-- Check knowledge_links
SELECT * FROM knowledge_links ORDER BY created_at DESC LIMIT 10;

-- Check session_messages
SELECT * FROM session_messages ORDER BY timestamp DESC LIMIT 10;

-- Verify relationships
SELECT 
  kl.relationship,
  kl.source_type,
  kl.target_type,
  COUNT(*) as count
FROM knowledge_links kl
GROUP BY kl.relationship, kl.source_type, kl.target_type;
```

---

## 11. Migration Path

### 11.1 Existing Data

No migration of existing data is required. The feature is additive.

### 11.2 Backward Compatibility

All existing features continue to work:
- Prompts, Seeds, Sessions, Workbench remain functional
- Knowledge Hub is opt-in (users can ignore new buttons)
- No breaking changes to existing APIs or components

### 11.3 Rollback Plan

If issues arise:
1. Remove UI buttons (hide modals)
2. Disable API endpoints (return 501 Not Implemented)
3. Do NOT drop database tables (preserve data)
4. Re-enable in next release after fixes

---

## 12. Security Considerations

### 12.1 Authorization

- All API endpoints check authentication via `auth()` or dev mode
- User ID is embedded in all knowledge_links records
- Lineage API filters by `user_id` to prevent data leakage
- Privacy: Respect `visibility` field on prompts (private/unlisted/public)

### 12.2 Input Validation

- Validate artifact types against enum: `['session', 'prompt', 'seed', 'file']`
- Validate relationship types against enum
- Sanitize user input (titles, content) before database insertion
- Limit content size (e.g., max 100KB per transfer)

### 12.3 Rate Limiting

Consider adding rate limits to transfer endpoint if batch operations become problematic (future work).

---

## 13. Performance Considerations

### 13.1 Database Indexes

All critical queries are indexed:
- `knowledge_links`: source, target, user_id, created_at
- `session_messages`: session_id, timestamp

### 13.2 Query Optimization

- Lineage query uses UNION (not subquery) for efficiency
- Limit lineage depth to 2 levels initially (prevent deep graph traversal)
- Paginate large result sets if needed

### 13.3 Client-Side Optimization

- Lazy load modals (don't render until opened)
- Debounce search/filter inputs in SaveArtifactModal
- Use React.memo for expensive components (LineageViewer)

---

## 14. Future Enhancements (Out of Scope)

1. **Bulk Transfer** - Select multiple messages/files for batch transfer
2. **Advanced Lineage Visualization** - Interactive graph with zoom/pan
3. **Smart Suggestions** - AI-powered suggestions for linking related artifacts
4. **Export Knowledge Graph** - Export entire lineage as JSON/GraphML
5. **Version Control** - Track changes to prompts/seeds over time (diff view)
6. **Collaboration** - Share knowledge graphs with team members
7. **Cross-User Lineage** - Public prompts can reference others' work
8. **Automated Linking** - Background process to detect and suggest links

---

## 15. Open Questions & Decisions

### 15.1 Resolved

✅ **Q1:** Should we persist session messages to the database?  
**A:** Yes, required for extraction feature (Phase 2)

✅ **Q2:** How to handle file IDs (Workbench)?  
**A:** Use `fileId` from tab if file-based, otherwise generate temp ID

✅ **Q3:** Privacy model for lineage?  
**A:** Filter by user_id, respect prompt visibility settings

### 15.2 Pending

❓ **Q4:** Should lineage API return full artifact content or just metadata?  
**Decision:** Start with metadata only (title, preview). Full content can be fetched separately if needed.

❓ **Q5:** Max depth for lineage graph traversal?  
**Decision:** Start with unlimited depth, add pagination if performance becomes an issue.

❓ **Q6:** Should we track "refined_in" relationships automatically when editing?  
**Decision:** No - too complex for MVP. User must manually save to create link.

---

## 16. Success Metrics

### 16.1 Adoption Metrics

- Number of knowledge_links created per user
- Percentage of Prompts/Seeds with lineage (vs. orphaned)
- Average lineage depth (how interconnected is the graph)

### 16.2 Usage Metrics

- Most common transfer paths (e.g., Session → Seed vs. Workbench → Prompt)
- Most used relationship types
- Average time between artifact creation and linking

### 16.3 Quality Metrics

- Zero database errors in knowledge_links operations
- API response time < 200ms for transfer endpoint
- API response time < 500ms for lineage endpoint (including metadata fetch)

---

## 17. Documentation Requirements

### 17.1 Code Documentation

- JSDoc comments for all public functions
- Inline comments for complex logic (lineage query, batch transfers)
- README in `lib/hub/` explaining architecture

### 17.2 User Documentation (Future)

- Guide: "How to Build a Knowledge Garden"
- Tutorial: "From Conversation to Reusable Knowledge"
- FAQ: "Understanding Knowledge Lineage"

---

**End of Technical Specification**

*This document is a living specification and will be updated as implementation progresses.*
