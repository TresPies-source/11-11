# Technical Specification: Librarian Agent (Semantic Search & Retrieval)

**Feature:** v0.3.3 Librarian Agent - Semantic Search & Retrieval  
**Release:** v0.3.0 Premium "Intelligence & Foundation"  
**Date:** January 13, 2026  
**Complexity:** **Hard**

---

## 1. Complexity Assessment

**Rating: Hard**

**Justification:**
- **Multiple Integration Points**: Database (pgvector), OpenAI (embeddings), Supervisor Router, Cost Guard, existing Librarian UI
- **New Technology**: pgvector extension in PGlite (not yet enabled), vector embeddings, similarity search
- **Performance Requirements**: Search response <300ms (p95), batch embedding <2min for 100 prompts
- **Architectural Considerations**: Backward compatibility with existing Librarian page (Seedlings/Greenhouse), integration with agent routing
- **High Quality Bar**: Excellence criteria require 9-10/10 on Stability, Research Integration, and Depth
- **Data Migration**: Need to backfill embeddings for existing prompts without breaking current functionality

**Why Not Medium:** 
- Vector database integration is non-trivial
- Performance constraints are strict
- Multiple interdependent systems (agent, routing, cost, search, UI)
- Research integration requires deep understanding of Dataiku patterns

---

## 2. Technical Context

### 2.1 Language & Framework
- **Primary Language**: TypeScript
- **Framework**: Next.js 14 (App Router)
- **Runtime**: Node.js (server), Browser (client)
- **Database**: PGlite (IndexedDB in browser, memory in server)
- **UI Library**: React 18 with Framer Motion, Tailwind CSS
- **State Management**: React hooks, optimistic updates

### 2.2 Dependencies (Already Installed)
```json
{
  "@electric-sql/pglite": "^0.3.14",  // PGlite database
  "openai": "^4.77.0",                 // OpenAI client
  "zod": "^3.23.8",                    // Schema validation
  "tiktoken": "^1.0.22",               // Token counting
  "framer-motion": "^11.15.0"          // Animations
}
```

### 2.3 New Dependencies Required
**IMPORTANT**: PGlite does NOT support extensions like pgvector. We need to implement vector search using JavaScript-based similarity calculations instead.

**Alternative Approach**: Store embeddings as JSON arrays in PostgreSQL and calculate cosine similarity in JavaScript or SQL.

### 2.4 Existing Architecture Patterns

**Database Patterns:**
- Migration files: `lib/pglite/migrations/00X_description.ts`
- Schema initialization: `lib/pglite/schema.ts`
- Query patterns: `lib/pglite/prompts.ts`

**Agent Patterns:**
- Agent registry: `lib/agents/registry.json`
- Supervisor routing: `lib/agents/supervisor.ts`
- Cost tracking: `lib/agents/cost-tracking.ts`
- Agent types: `lib/agents/types.ts`

**API Patterns:**
- Route files: `app/api/[resource]/[action]/route.ts`
- Auth handling: Dev mode bypass, NextAuth for production
- Error handling: Try/catch with proper status codes
- Response format: JSON with `success`, `error`, `data` fields

**UI Patterns:**
- Page components: `app/[page]/page.tsx`
- View components: `components/[domain]/[Component]View.tsx`
- Custom hooks: `hooks/use[Feature].ts`
- Loading states: Skeleton components, optimistic updates
- Error boundaries: Per-section error handling

---

## 3. Implementation Approach

### 3.1 High-Level Strategy

**Phase 1: Database Foundation**
1. Add embedding column to `prompts` table (JSONB array)
2. Create helper functions for vector operations (cosine similarity)
3. Add indices for performance

**Phase 2: Embedding Generation**
1. Create embedding service using OpenAI's `text-embedding-3-small`
2. Implement batch embedding for existing prompts
3. Add automatic embedding on prompt create/update

**Phase 3: Semantic Search**
1. Implement search function with cosine similarity in SQL
2. Add search API endpoint
3. Integrate with Cost Guard for tracking

**Phase 4: Agent Integration**
1. Create Librarian agent handler (already registered in supervisor)
2. Implement handoff logic from Dojo to Librarian
3. Add context preservation for handoffs

**Phase 5: Proactive Suggestions**
1. Implement suggestion engine based on conversation context
2. Add suggestion API endpoint
3. Trigger suggestions at key moments

**Phase 6: Search UI**
1. Add search interface to Librarian page
2. Display search results with similarity scores
3. Add recent searches and suggestions sections

### 3.2 Vector Operations Without pgvector

**Cosine Similarity Calculation (SQL):**
```sql
-- Calculate cosine similarity between two vectors
CREATE OR REPLACE FUNCTION cosine_similarity(a JSONB, b JSONB)
RETURNS REAL AS $$
DECLARE
  dot_product REAL := 0;
  magnitude_a REAL := 0;
  magnitude_b REAL := 0;
  i INTEGER;
  a_array REAL[];
  b_array REAL[];
BEGIN
  -- Convert JSONB to arrays
  SELECT ARRAY(SELECT jsonb_array_elements_text(a)::REAL) INTO a_array;
  SELECT ARRAY(SELECT jsonb_array_elements_text(b)::REAL) INTO b_array;
  
  -- Calculate dot product and magnitudes
  FOR i IN 1..array_length(a_array, 1) LOOP
    dot_product := dot_product + (a_array[i] * b_array[i]);
    magnitude_a := magnitude_a + (a_array[i] * a_array[i]);
    magnitude_b := magnitude_b + (b_array[i] * b_array[i]);
  END LOOP;
  
  -- Return cosine similarity
  IF magnitude_a = 0 OR magnitude_b = 0 THEN
    RETURN 0;
  END IF;
  
  RETURN dot_product / (sqrt(magnitude_a) * sqrt(magnitude_b));
END;
$$ LANGUAGE plpgsql IMMUTABLE;
```

**Alternative: JavaScript Implementation (for better performance):**
```typescript
function cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    magnitudeA += a[i] * a[i];
    magnitudeB += b[i] * b[i];
  }
  
  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }
  
  return dotProduct / (Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB));
}
```

**Recommendation**: Use JavaScript implementation for better performance (avoid heavy SQL operations in browser PGlite).

### 3.3 Integration with Existing Systems

**With Supervisor Router:**
- Librarian agent already registered in `registry.json`
- Routing logic already handles "search" keywords
- Need to implement actual search handler

**With Cost Guard:**
- Track embedding generation costs (text-embedding-3-small: $0.02/1M tokens)
- Track search costs (minimal, no LLM involved)
- Use existing `trackCost` function from `lib/cost/tracking.ts`

**With Existing Librarian UI:**
- Current Librarian page (`app/librarian/page.tsx`) shows Seedlings/Greenhouse
- Add new "Search" section/tab to Librarian page
- Preserve existing functionality (status management, critique, etc.)

---

## 4. Source Code Structure

### 4.1 Files to Create

**Database Migration:**
```
lib/pglite/migrations/005_add_vector_search.ts
```

**Embedding Service:**
```
lib/librarian/embeddings.ts        // Embedding generation
lib/librarian/search.ts             // Semantic search
lib/librarian/suggestions.ts        // Proactive suggestions
lib/librarian/vector.ts             // Vector operations (cosine similarity)
```

**Agent Handler:**
```
lib/agents/librarian-handler.ts    // Librarian agent execution logic
```

**API Routes:**
```
app/api/librarian/search/route.ts      // POST - Semantic search
app/api/librarian/embed/route.ts       // POST - Generate embeddings
app/api/librarian/suggestions/route.ts // GET - Proactive suggestions
```

**UI Components:**
```
components/librarian/SearchBar.tsx          // Search input
components/librarian/SearchResults.tsx      // Results list
components/librarian/SearchResultCard.tsx   // Individual result
components/librarian/SuggestionsPanel.tsx   // Proactive suggestions
components/librarian/RecentSearches.tsx     // Recent searches
```

**Hooks:**
```
hooks/useSemanticSearch.ts         // Search state management
hooks/useSuggestions.ts            // Suggestions fetching
```

**Tests:**
```
__tests__/librarian/embeddings.test.ts
__tests__/librarian/search.test.ts
__tests__/librarian/vector.test.ts
```

### 4.2 Files to Modify

**Database Schema:**
- `lib/pglite/schema.ts` - Add embedding column documentation

**Database Client:**
- `lib/pglite/client.ts` - Add migration 005 to initialization

**Librarian Page:**
- `app/librarian/page.tsx` - Add metadata for search
- `components/librarian/LibrarianView.tsx` - Add search section

**Agent Registry:**
- No changes needed (already registered)

**Types:**
- `lib/pglite/types.ts` - Add embedding field to PromptRow

---

## 5. Data Model Changes

### 5.1 Database Schema Changes

**Migration 005: Add Vector Search Support**

```typescript
// lib/pglite/migrations/005_add_vector_search.ts

export const migration005 = `
-- Migration 005: Add vector search support
-- Date: 2026-01-13
-- Purpose: Enable semantic search using embeddings

-- Add embedding column to prompts table
ALTER TABLE prompts 
ADD COLUMN IF NOT EXISTS embedding JSONB DEFAULT NULL;

-- Add embedding_model column to track which model was used
ALTER TABLE prompts 
ADD COLUMN IF NOT EXISTS embedding_model TEXT DEFAULT NULL;

-- Add embedding_updated_at to track when embedding was last updated
ALTER TABLE prompts 
ADD COLUMN IF NOT EXISTS embedding_updated_at TIMESTAMPTZ DEFAULT NULL;

-- Create index on embedding_updated_at for batch operations
CREATE INDEX IF NOT EXISTS idx_prompts_embedding_updated_at 
  ON prompts(embedding_updated_at DESC NULLS LAST);

-- Create cosine similarity function for vector operations
-- Note: This is a pure SQL implementation since PGlite doesn't support pgvector
CREATE OR REPLACE FUNCTION cosine_similarity(a JSONB, b JSONB)
RETURNS REAL AS $$
DECLARE
  dot_product REAL := 0;
  magnitude_a REAL := 0;
  magnitude_b REAL := 0;
  i INTEGER;
  len INTEGER;
  a_val REAL;
  b_val REAL;
BEGIN
  -- Get array length
  len := jsonb_array_length(a);
  
  -- Calculate dot product and magnitudes
  FOR i IN 0..(len - 1) LOOP
    a_val := (a->i)::TEXT::REAL;
    b_val := (b->i)::TEXT::REAL;
    
    dot_product := dot_product + (a_val * b_val);
    magnitude_a := magnitude_a + (a_val * a_val);
    magnitude_b := magnitude_b + (b_val * b_val);
  END LOOP;
  
  -- Return cosine similarity
  IF magnitude_a = 0 OR magnitude_b = 0 THEN
    RETURN 0;
  END IF;
  
  RETURN dot_product / (sqrt(magnitude_a) * sqrt(magnitude_b));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create table for tracking search history
CREATE TABLE IF NOT EXISTS search_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  query TEXT NOT NULL,
  results_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_search_history_user_id 
  ON search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_search_history_session_id 
  ON search_history(session_id);
CREATE INDEX IF NOT EXISTS idx_search_history_created_at 
  ON search_history(created_at DESC);
`;

export async function applyMigration005(db: any): Promise<void> {
  try {
    console.log('[Migration 005] Adding vector search support...');
    await db.exec(migration005);
    console.log('[Migration 005] Successfully added embedding column and cosine_similarity function');
  } catch (error) {
    console.error('[Migration 005] Error applying migration:', error);
    throw error;
  }
}
```

### 5.2 Updated TypeScript Types

```typescript
// lib/pglite/types.ts

export interface PromptRow {
  id: string;
  user_id: string;
  title: string;
  content: string;
  status: PromptStatus;
  status_history: StatusHistoryEntry[];
  drive_file_id: string | null;
  published_at: string | null;
  visibility: 'private' | 'unlisted' | 'public';
  author_name: string | null;
  author_id: string | null;
  created_at: string;
  updated_at: string;
  
  // New fields for vector search
  embedding: number[] | null;
  embedding_model: string | null;
  embedding_updated_at: string | null;
}
```

---

## 6. API Specification

### 6.1 POST /api/librarian/search

**Purpose:** Perform semantic search across prompts

**Request:**
```typescript
{
  query: string;           // Search query
  limit?: number;          // Max results (default: 10)
  threshold?: number;      // Similarity threshold (default: 0.7)
  filters?: {
    status?: PromptStatus;
    tags?: string[];
  };
}
```

**Response:**
```typescript
{
  success: boolean;
  results: Array<{
    id: string;
    title: string;
    content: string;
    similarity: number;     // 0-1 score
    metadata: {
      status: PromptStatus;
      tags: string[];
      created_at: string;
      updated_at: string;
    };
  }>;
  query: string;
  count: number;
  cost: {
    embedding_tokens: number;
    embedding_cost_usd: number;
  };
}
```

### 6.2 POST /api/librarian/embed

**Purpose:** Generate embedding for a prompt (triggered on create/update)

**Request:**
```typescript
{
  prompt_id: string;
  content: string;
}
```

**Response:**
```typescript
{
  success: boolean;
  prompt_id: string;
  embedding_generated: boolean;
  cost: {
    tokens: number;
    cost_usd: number;
  };
}
```

### 6.3 GET /api/librarian/suggestions

**Purpose:** Get proactive suggestions based on context

**Query Parameters:**
```
?prompt_id=xxx&session_id=xxx&limit=5
```

**Response:**
```typescript
{
  success: boolean;
  suggestions: Array<{
    type: 'similar_prompt' | 'related_seed' | 'recent_work';
    title: string;
    description: string;
    action: string;        // "View", "Open", "Apply"
    target_id: string;
    similarity?: number;   // Only for similar_prompt type
  }>;
}
```

---

## 7. Verification Approach

### 7.1 Unit Tests

**Test Files:**
- `__tests__/librarian/embeddings.test.ts`
- `__tests__/librarian/search.test.ts`
- `__tests__/librarian/vector.test.ts`

**Test Coverage:**
1. **Embedding Generation:**
   - Generates 1536-dimension vector
   - Handles empty content gracefully
   - Caches results appropriately
   - Tracks costs correctly

2. **Vector Operations:**
   - Cosine similarity returns value between 0-1
   - Identical vectors return 1.0
   - Orthogonal vectors return 0.0
   - Handles edge cases (empty vectors, single dimension)

3. **Semantic Search:**
   - Returns results ordered by similarity
   - Respects threshold parameter
   - Applies filters correctly
   - Handles queries with no results

4. **Batch Embedding:**
   - Processes multiple prompts efficiently
   - Handles API errors gracefully
   - Resumes from failures

### 7.2 Integration Tests

**Test Scenarios:**
1. **End-to-End Search Flow:**
   - Create prompt → Auto-embed → Search → Find result
   - Verify similarity scores are accurate

2. **Supervisor Routing:**
   - User query "search for budget prompts" → Routes to Librarian
   - Librarian executes search → Returns results
   - Cost is tracked in Cost Guard

3. **Proactive Suggestions:**
   - User in Dojo session → Mentions "planning"
   - Librarian suggests similar prompts
   - User clicks suggestion → Prompt opens

### 7.3 Performance Tests

**Requirements:**
- Search response time: <300ms (p95)
- Embedding generation: <500ms per prompt
- Batch embedding: <2 minutes for 100 prompts

**Test Approach:**
- Use `console.time()` and `console.timeEnd()` for measurements
- Test with varying prompt counts (1, 10, 100, 1000)
- Test search with different query complexities

### 7.4 Manual Verification

**Checklist:**
1. **Database Migration:**
   - [ ] Migration 005 runs without errors
   - [ ] Embedding column is added to prompts table
   - [ ] Cosine similarity function is created

2. **Embedding Generation:**
   - [ ] Create new prompt → Embedding is auto-generated
   - [ ] Update existing prompt → Embedding is updated
   - [ ] Batch script embeds all existing prompts

3. **Semantic Search:**
   - [ ] Search for "budget planning" finds related prompts
   - [ ] Similarity scores are reasonable (0.7-1.0 for good matches)
   - [ ] Empty query returns error or all prompts
   - [ ] No results found shows appropriate message

4. **Agent Integration:**
   - [ ] Supervisor routes search queries to Librarian
   - [ ] Librarian returns search results
   - [ ] Handoff back to Dojo preserves context

5. **UI/UX:**
   - [ ] Search bar is visible on Librarian page
   - [ ] Search results display correctly
   - [ ] Similarity scores are shown as badges
   - [ ] Suggestions appear proactively
   - [ ] Recent searches are tracked

6. **Cost Tracking:**
   - [ ] Embedding costs are tracked
   - [ ] Search costs are minimal (no LLM)
   - [ ] Costs appear in Cost Guard dashboard

### 7.5 Test Commands

**Run Unit Tests:**
```bash
npm test __tests__/librarian
```

**Run Type Check:**
```bash
npm run type-check
```

**Run Lint:**
```bash
npm run lint
```

**Build Check:**
```bash
npm run build
```

---

## 8. Implementation Plan

### 8.1 Step-by-Step Breakdown

**Step 1: Database Foundation (1-2 hours)**
- Create migration 005
- Add embedding column to prompts table
- Implement cosine similarity function
- Test migration on clean database

**Step 2: Vector Operations (1 hour)**
- Implement JavaScript cosine similarity
- Add utility functions for vector operations
- Write unit tests

**Step 3: Embedding Service (2-3 hours)**
- Implement embedding generation using OpenAI
- Add batch embedding script
- Add cost tracking integration
- Write unit tests

**Step 4: Semantic Search (2-3 hours)**
- Implement search function with vector similarity
- Add filtering and ranking logic
- Optimize for performance (<300ms)
- Write unit tests

**Step 5: Search API (1-2 hours)**
- Create `/api/librarian/search` endpoint
- Create `/api/librarian/embed` endpoint
- Add auth and error handling
- Test API endpoints

**Step 6: Agent Handler (1-2 hours)**
- Create Librarian agent handler
- Integrate with Supervisor routing
- Add context preservation
- Test handoffs

**Step 7: Proactive Suggestions (2 hours)**
- Implement suggestion engine
- Create `/api/librarian/suggestions` endpoint
- Add suggestion triggers
- Test suggestions

**Step 8: Search UI (3-4 hours)**
- Add SearchBar component
- Add SearchResults component
- Add SuggestionsPanel component
- Integrate with Librarian page

**Step 9: Testing & Optimization (2-3 hours)**
- Run all unit tests
- Run integration tests
- Performance testing and optimization
- Fix any bugs discovered

**Step 10: Documentation (1 hour)**
- Update JOURNAL.md with implementation notes
- Document API endpoints
- Add usage examples
- Self-assess against Excellence Criteria

**Total Estimated Time: 16-24 hours**

### 8.2 Risk Mitigation

**Risk 1: PGlite doesn't support pgvector**
- **Impact:** High - Core feature requirement
- **Mitigation:** Use JSONB arrays + JavaScript cosine similarity (already planned)
- **Status:** Addressed in approach

**Risk 2: Performance degradation with large datasets**
- **Impact:** Medium - Search may be slow with >1000 prompts
- **Mitigation:** 
  - Implement pagination
  - Cache embeddings
  - Consider in-memory index for frequently searched prompts
- **Status:** Monitor during testing

**Risk 3: OpenAI API rate limits**
- **Impact:** Medium - Batch embedding may fail
- **Mitigation:**
  - Add retry logic with exponential backoff
  - Batch in smaller chunks (10-20 prompts at a time)
  - Add progress tracking
- **Status:** Implement retry logic

**Risk 4: Backward compatibility with existing Librarian UI**
- **Impact:** Low - May break existing functionality
- **Mitigation:**
  - Preserve existing Seedlings/Greenhouse sections
  - Add Search as new section
  - Test all existing features after changes
- **Status:** Design preserves existing UI

---

## 9. Excellence Criteria Self-Assessment

### Target Scores (from task description)

**Must Be Excellent (9-10/10):**
- Stability: 10/10
- Research Integration: 10/10
- Depth: 10/10

**Must Be Very Good (7-8/10):**
- Performance: 9/10
- Usability: 9/10

**Can Be Good (6-7/10):**
- Beauty: 7/10
- Creativity: 7/10

### Success Criteria

**Stability (10/10):**
- [ ] Zero search failures in 100 test queries
- [ ] Embedding generation handles all edge cases
- [ ] Database migration is idempotent
- [ ] No regressions in existing features
- [ ] Graceful error handling everywhere

**Research Integration (10/10):**
- [ ] Implements Dataiku Librarian pattern (Connect + Analyze + Recommend)
- [ ] Semantic search using vector embeddings
- [ ] Proactive suggestions without explicit request
- [ ] Documentation cites research source
- [ ] Follows Seed 3 patterns exactly

**Depth (10/10):**
- [ ] Complete search system (query, filter, rank)
- [ ] Batch embedding for existing prompts
- [ ] Proactive suggestions with context
- [ ] Comprehensive tests (unit + integration)
- [ ] Full documentation (architecture, API, usage)

**Performance (9/10):**
- [ ] Search response <300ms (p95)
- [ ] Embedding generation <500ms per prompt
- [ ] Batch embedding <2min for 100 prompts
- [ ] No performance regressions

**Usability (9/10):**
- [ ] Intuitive search interface
- [ ] Clear similarity scores (badges, percentages)
- [ ] Helpful proactive suggestions
- [ ] Accessible (WCAG AA)
- [ ] Smooth loading states

---

## 10. Key Architectural Decisions

### Decision 1: JSONB Arrays Instead of pgvector

**Context:** PGlite (v0.3.14) does not support pgvector extension

**Options Considered:**
1. Wait for pgvector support in PGlite
2. Use external vector database (Supabase, Pinecone)
3. Use JSONB arrays + JavaScript similarity calculations

**Decision:** Option 3 - JSONB arrays + JavaScript

**Rationale:**
- Keeps everything local-first (aligns with project philosophy)
- No external dependencies or costs
- PGlite migration path: When pgvector is supported, can migrate easily
- Performance acceptable for <10k prompts (current scale)

**Trade-offs:**
- Slower than native pgvector for large datasets
- More complex query logic
- Limited to simple similarity metrics (cosine)

### Decision 2: text-embedding-3-small vs ada-002

**Decision:** Use `text-embedding-3-small`

**Rationale:**
- More cost-effective: $0.02/1M tokens vs $0.10/1M tokens (5x cheaper)
- Better performance: 1536 dimensions, SOTA quality
- Recommended by OpenAI for most use cases

### Decision 3: Preserve Existing Librarian UI

**Decision:** Add Search as new section, keep Seedlings/Greenhouse

**Rationale:**
- Backward compatibility (don't break existing features)
- Librarian page already has established UX patterns
- Users may use both status management AND search
- Follows existing two-column layout pattern

### Decision 4: JavaScript Cosine Similarity vs SQL Function

**Decision:** Use JavaScript for similarity calculations

**Rationale:**
- Better performance (avoid repeated SQL function calls)
- Easier to optimize and debug
- Can leverage browser performance for client-side filtering
- SQL function kept as fallback for server-side queries

---

## 11. Integration Points Reference

### With Supervisor Router
- **File:** `lib/agents/supervisor.ts`
- **Pattern:** Agent registry lookup → LLM routing → Execute handler
- **Handler Location:** `lib/agents/librarian-handler.ts` (to be created)

### With Cost Guard
- **File:** `lib/cost/tracking.ts`
- **Function:** `trackCost()`
- **Track:** Embedding generation, search operations

### With Existing Librarian
- **File:** `components/librarian/LibrarianView.tsx`
- **Pattern:** Add new section alongside Seedlings/Greenhouse
- **Preserve:** Status transitions, critique, publishing

### With OpenAI Client
- **File:** `lib/openai/client.ts`
- **Function:** `getOpenAIClient()`
- **Use:** Embedding generation only (no chat completions)

---

## 12. Next Steps

After spec approval:

1. **Create detailed implementation plan** (break down into smaller tasks)
2. **Set up test infrastructure** (test files, mocks, fixtures)
3. **Begin Phase 1** (Database foundation)
4. **Iterative development** (build, test, refine)
5. **Document progress** in JOURNAL.md
6. **Self-assess** against Excellence Criteria
7. **Final testing** and bug fixes

---

**Specification Status:** ✅ Ready for Implementation  
**Estimated Completion:** 3-4 days (16-24 hours of focused work)  
**Dependencies:** Feature 1 (Supervisor Router) - ✅ Already Merged  
**Blockers:** None
