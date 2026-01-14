# Technical Specification: DojoPacket Export & Sharing (v0.3.8a)

**Date:** 2026-01-13  
**Complexity:** Hard  
**Estimated Duration:** 1-2 weeks  
**Status:** Architecture Gap Identified - Awaiting Clarification

---

## 1. Executive Summary

This specification outlines the implementation of the DojoPacket v1.0 export system for portable, shareable session outputs. However, **critical architecture decisions are required before implementation can proceed** due to significant gaps between the task requirements and existing codebase.

### Key Finding: Database Schema Gap

The task description assumes the existence of Dojo-specific data structures (situation, stake, perspectives, assumptions, decisions, next_move, artifacts) that **do not exist in the current database schema**.

**Current State:**
- Basic `sessions` table exists with only: `id`, `user_id`, `total_tokens`, `total_cost_usd`, `created_at`, `updated_at`
- NO Dojo-specific columns or related tables
- NO session modes (Mirror/Scout/Gardener/Implementation)
- NO perspectives, assumptions, decisions, artifacts tables

**Required State (per task):**
- Full DojoPacket schema with 10+ fields including nested arrays
- Dojo session tracking with situation, stake, mode
- Related tables for perspectives, assumptions, decisions
- Artifact storage system

---

## 2. Technical Context

### 2.1 Technology Stack
- **Framework:** Next.js 14 (App Router) with TypeScript
- **Database:** PGlite (browser-based PostgreSQL via IndexedDB)
- **Storage:** `idb://11-11-db` (local-first, no cloud dependency)
- **Validation:** Zod schemas
- **UI:** React + Tailwind CSS + Framer Motion
- **Icons:** lucide-react
- **Testing:** tsx (TypeScript execution)

### 2.2 Existing Integration Points
- **Harness Trace:** `lib/harness/trace.ts` - session traceability (implemented ✅)
- **Cost Guard:** `lib/cost/tracking.ts` - cost tracking (implemented ✅)
- **Database:** `lib/pglite/` - PGlite client and schema (implemented ✅)
- **API Patterns:** `app/api/` - Next.js API routes with auth patterns (implemented ✅)

### 2.3 Current Database Schema

```sql
-- Current sessions table (from migration 003_add_cost_guard.ts)
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  total_tokens INTEGER NOT NULL DEFAULT 0,
  total_cost_usd DECIMAL(10, 6) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Missing Dojo Fields:**
- `title` (session name)
- `mode` (Mirror/Scout/Gardener/Implementation)
- `situation` (user's initial query)
- `stake` (what matters to user)
- `agent_path` (array of agent transitions)
- Plus separate tables for: perspectives, assumptions, decisions, artifacts

---

## 3. Architecture Decision Required

### Option A: Full Implementation (Recommended for Production)

**Approach:** Create complete Dojo session schema + export system

**Scope:**
1. Create migration `004_add_dojo_sessions.ts` with:
   - Add Dojo columns to `sessions` table
   - Create `session_perspectives` table
   - Create `session_assumptions` table
   - Create `session_decisions` table
   - Create `session_artifacts` table (or JSONB column)
2. Create TypeScript types in `lib/pglite/types.ts`
3. Create database access layer in `lib/pglite/sessions.ts`
4. Implement DojoPacket export as described in task

**Duration:** 1.5-2 weeks

**Pros:**
- Complete, production-ready solution
- Future-proof for Dojo Protocol features
- Matches task description exactly
- Enables rich session tracking

**Cons:**
- Requires database migration
- Larger scope than initially implied
- Need to backfill or handle existing sessions

---

### Option B: Minimal Viable Export (Quick Win)

**Approach:** Export what exists now + placeholder fields

**Scope:**
1. Create DojoPacket schema with all v1.0 fields
2. Build export from existing data:
   - `session` → from `sessions` table (id, user_id, created_at)
   - `trace_summary` → from Harness Trace
   - `metadata` → export timestamp and format
   - All other fields → empty arrays or null
3. Implement export UI and formats (JSON, Markdown, PDF)

**Duration:** 3-5 days

**Pros:**
- Ships quickly
- No database migrations required
- Validates export UX patterns
- Foundation for future enhancements

**Cons:**
- Exports mostly empty packets
- Limited usefulness until Dojo features implemented
- May require refactor when full schema added
- Doesn't match task description

---

### Option C: Staged Implementation (Balanced)

**Approach:** Phase 1 = minimal schema + export, Phase 2 = full Dojo features

**Phase 1 (Week 1):**
1. Add basic Dojo columns to sessions: `title`, `mode`, `situation`, `stake`
2. Add JSONB columns: `agent_path`, `artifacts`
3. Create simplified DojoPacket export
4. Defer perspectives/assumptions/decisions to future

**Phase 2 (Week 2 or later):**
5. Create related tables for perspectives, assumptions, decisions
6. Add session tracking logic to capture these during conversations
7. Enhance export to include full DojoPacket v1.0 spec

**Duration:** Week 1: 4-5 days, Week 2: 5-7 days

**Pros:**
- Incremental delivery
- Each phase provides value
- Can validate UX early
- Manageable scope per phase

**Cons:**
- May need to iterate on schema
- Export format may change between phases

---

## 4. Recommended Approach: Option A (Full Implementation)

I recommend **Option A** for the following reasons:

1. **Future-proof:** The task description clearly envisions a full Dojo session tracking system. Half measures now = technical debt later.
2. **Excellence Criteria:** The task emphasizes "depth (10/10)" and "complete implementations". Option A is the only approach that achieves this.
3. **Clean Architecture:** Better to design the full schema once than iterate through multiple migrations.
4. **Task Alignment:** The task prompt assumes this schema exists. Let's build it right.

---

## 5. Implementation Plan (Option A)

### 5.1 Database Schema Design

#### 5.1.1 Update `sessions` table

```sql
-- Migration 004: Add Dojo Session Schema
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS mode TEXT CHECK (mode IN ('Mirror', 'Scout', 'Gardener', 'Implementation'));
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS situation TEXT;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS stake TEXT;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS agent_path JSONB DEFAULT '[]'::jsonb;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS next_move_action TEXT;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS next_move_why TEXT;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS next_move_test TEXT;

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_mode ON sessions(mode);
CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON sessions(created_at DESC);
```

#### 5.1.2 Create `session_perspectives` table

```sql
CREATE TABLE IF NOT EXISTS session_perspectives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('user', 'agent')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_session_perspectives_session_id ON session_perspectives(session_id);
CREATE INDEX IF NOT EXISTS idx_session_perspectives_created_at ON session_perspectives(created_at);
```

#### 5.1.3 Create `session_assumptions` table

```sql
CREATE TABLE IF NOT EXISTS session_assumptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  challenged BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_session_assumptions_session_id ON session_assumptions(session_id);
```

#### 5.1.4 Create `session_decisions` table

```sql
CREATE TABLE IF NOT EXISTS session_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  rationale TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_session_decisions_session_id ON session_decisions(session_id);
```

#### 5.1.5 Store artifacts in JSONB

```sql
-- Add artifacts column to sessions table
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS artifacts JSONB DEFAULT '[]'::jsonb;
```

**Rationale:** Artifacts are variable-structure objects (files, links, code, images). JSONB is flexible and efficient for this use case.

---

### 5.2 TypeScript Types

**File:** `lib/pglite/types.ts` (add to existing file)

```typescript
// Dojo Session Types
export type DojoMode = 'Mirror' | 'Scout' | 'Gardener' | 'Implementation';

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

export interface SessionAssumptionRow {
  id: string;
  session_id: string;
  text: string;
  challenged: boolean;
  created_at: string;
}

export interface SessionDecisionRow {
  id: string;
  session_id: string;
  text: string;
  rationale: string;
  created_at: string;
}

export interface Artifact {
  type: 'file' | 'link' | 'code' | 'image';
  name: string;
  content: string | null;
  url: string | null;
}
```

---

### 5.3 Database Access Layer

**File:** `lib/pglite/sessions.ts` (new file)

```typescript
import { getDB } from './client';
import type {
  SessionRow,
  SessionInsert,
  SessionPerspectiveRow,
  SessionAssumptionRow,
  SessionDecisionRow,
} from './types';

export async function getSession(sessionId: string): Promise<SessionRow | null> {
  const db = await getDB();
  const result = await db.query(
    'SELECT * FROM sessions WHERE id = $1',
    [sessionId]
  );
  return result.rows[0] as SessionRow || null;
}

export async function getSessionPerspectives(sessionId: string): Promise<SessionPerspectiveRow[]> {
  const db = await getDB();
  const result = await db.query(
    'SELECT * FROM session_perspectives WHERE session_id = $1 ORDER BY created_at ASC',
    [sessionId]
  );
  return result.rows as SessionPerspectiveRow[];
}

export async function getSessionAssumptions(sessionId: string): Promise<SessionAssumptionRow[]> {
  const db = await getDB();
  const result = await db.query(
    'SELECT * FROM session_assumptions WHERE session_id = $1 ORDER BY created_at ASC',
    [sessionId]
  );
  return result.rows as SessionAssumptionRow[];
}

export async function getSessionDecisions(sessionId: string): Promise<SessionDecisionRow[]> {
  const db = await getDB();
  const result = await db.query(
    'SELECT * FROM session_decisions WHERE session_id = $1 ORDER BY created_at ASC',
    [sessionId]
  );
  return result.rows as SessionDecisionRow[];
}

// ... additional CRUD methods as needed
```

---

### 5.4 DojoPacket Schema & Formatters

**Files:**
- `lib/packet/schema.ts` - Zod schema + TypeScript types
- `lib/packet/builder.ts` - Build packet from session data
- `lib/packet/formatters.ts` - Export to JSON/Markdown/PDF

Implementation follows the task description exactly, using the full schema outlined in the prompt.

---

### 5.5 Export API & UI

**Files:**
- `app/api/packet/export/route.ts` - Export endpoint
- `components/packet/export-button.tsx` - Export UI component

---

### 5.6 Testing Strategy

**Unit Tests:**
- Schema validation (Zod)
- Database queries (sessions, perspectives, assumptions, decisions)
- Packet builder (data aggregation)
- Formatters (JSON, Markdown, PDF)

**Integration Tests:**
- API routes (export endpoint)
- End-to-end export flow

**E2E Tests:**
- UI interaction (export button → download)
- Copy to clipboard

---

## 6. Data Model Changes

### Modified Tables
- `sessions` - Add 9 new columns for Dojo data

### New Tables
- `session_perspectives` - Store multiple perspectives per session
- `session_assumptions` - Store assumptions and challenged flag
- `session_decisions` - Store decisions with rationale

### Migration Path
1. Create migration `004_add_dojo_sessions.ts`
2. Run migration on app start (auto-migration pattern exists)
3. Existing sessions get NULL for new Dojo fields (acceptable)
4. New sessions can populate full Dojo data

---

## 7. API Changes

### New Endpoints
- `POST /api/packet/export` - Export session as DojoPacket
  - Body: `{ sessionId: string, format: 'json' | 'markdown' | 'pdf' }`
  - Response: File download (JSON/Markdown/PDF)
  
- `POST /api/packet/import` (optional, Phase 2) - Import packet to create session

### Modified Endpoints
- None (export is additive)

---

## 8. Verification Approach

### Manual Testing
1. Create test session with Dojo data
2. Export as JSON → validate schema
3. Export as Markdown → validate formatting
4. Export as PDF → validate rendering
5. Copy to clipboard → validate content

### Automated Testing
- Run: `npm run test:packet` (unit tests)
- Run: `npm run test:packet-api` (integration tests)
- Run: `npm run lint` (code quality)
- Run: `npm run type-check` (TypeScript validation)

### Success Criteria
- All tests pass (100% coverage on packet builder)
- Zero TypeScript errors
- Export completes in <2s for average session
- Exported packets validate against DojoPacket v1.0 schema

---

## 9. Open Questions for User

**REQUIRED DECISION:**

Which implementation approach should I proceed with?

**A) Full Implementation** (1.5-2 weeks)
- Complete Dojo schema migration
- Full DojoPacket v1.0 export
- Production-ready

**B) Minimal Viable Export** (3-5 days)
- No schema changes
- Export existing data only
- Many fields empty/null

**C) Staged Implementation** (Week 1: 4-5 days, Week 2: 5-7 days)
- Week 1: Basic Dojo columns + simplified export
- Week 2: Full related tables + complete export

**Additional Questions:**

1. **PDF Generation:** The task mentions using `manus-md-to-pdf` utility. Is this installed in the environment? Should I use an alternative (e.g., `puppeteer`, `wkhtmltopdf`)?

2. **Session Creation:** Currently no UI exists for creating Dojo sessions with situation/stake/perspectives. Should export be built first (with empty data) or should session creation be part of this task?

3. **Import Functionality:** The task mentions import as "optional Phase 3". Should I include it or defer entirely?

4. **Backward Compatibility:** Existing sessions in DB have no Dojo data. Should export handle these gracefully (empty fields) or error?

---

## 10. Risk Assessment

### Technical Risks
- **Database Migration Complexity:** Medium - Need to handle NULL values for existing sessions
- **PDF Generation:** Medium - May need to test multiple libraries if `manus-md-to-pdf` unavailable
- **Export Performance:** Low - Session data is small, export should be fast

### Scope Risks
- **Scope Creep:** High - Task assumes Dojo infrastructure exists, could expand significantly
- **Definition Ambiguity:** High - Need clarification on which approach to take

### Mitigation Strategies
1. Get user clarification on approach BEFORE coding
2. Start with database migration (foundational)
3. Build export incrementally (JSON → Markdown → PDF)
4. Test each format independently

---

## 11. Dependencies

### External Libraries (Already Installed)
- `zod` - Schema validation ✅
- `openai` - Already using for LLM, could use for PDF if needed

### New Libraries (May Need)
- PDF generation library (TBD based on available options)

### Internal Dependencies
- Harness Trace (for trace summary) ✅
- Cost Guard (for session cost data) ✅
- PGlite client (for database access) ✅

---

## 12. Next Steps

**Awaiting User Decision on Implementation Approach**

Once approach is confirmed, implementation will follow this order:

1. **Database Migration** (Option A/C)
   - Create `004_add_dojo_sessions.ts`
   - Add TypeScript types
   - Create database access layer
   - Test migration

2. **DojoPacket Schema** (All options)
   - Define Zod schema
   - Create packet builder
   - Test with mock data

3. **Formatters** (All options)
   - JSON formatter
   - Markdown formatter
   - PDF formatter (library TBD)
   - Test each format

4. **API & UI** (All options)
   - Export API route
   - Export button component
   - Integration tests
   - E2E tests

5. **Documentation** (All options)
   - Update JOURNAL.md
   - Create README in `lib/packet/`
   - Update AUDIT_LOG.md

---

## 13. Success Metrics

- **Stability:** 10/10 - Zero export failures, graceful error handling
- **Research Integration:** 10/10 - Pure DojoPacket v1.0 standard
- **Depth:** 10/10 - Complete schema, 3 formats, beautiful output
- **Usability:** 9/10 - One-click export, clear UI
- **Performance:** 9/10 - Export completes in <2s

---

**Specification Status:** ⏸️ Awaiting User Input  
**Next Action:** User to select implementation approach (A, B, or C)  
**Estimated Start Date:** Upon approval  
**Estimated Completion:** 3 days - 2 weeks (depending on approach)
