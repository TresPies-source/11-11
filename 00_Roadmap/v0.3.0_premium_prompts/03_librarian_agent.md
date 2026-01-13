# Feature 3: Librarian Agent (Semantic Search & Retrieval)

**Release:** v0.3.0 Premium "Intelligence & Foundation"  
**Branch:** `feature/librarian-agent`  
**Wave:** 2 (Intelligence)  
**Zenflow Instance:** #1  
**Duration:** 3-4 weeks (flexible until excellence achieved)  
**Dependencies:** Feature 1 (Supervisor Router) must be merged first

---

## Context: You Have Full Repo Access

You are working in the **11-11 repository** with complete access to all documentation. Before starting, review these key files:

**Foundation Documents (Read from tail first, then head):**
- `/00_Roadmap/task_plan.md` - Current roadmap and sprint status
- `/JOURNAL.md` - Development log and architectural decisions
- `/05_Logs/BUGS.md` - Known issues and bug tracking
- `/05_Logs/AUDIT_LOG.md` - Sprint summaries and technical decisions

**Architecture & Patterns:**
- `/04_System/EXCELLENCE_CRITERIA_FRAMEWORK.md` - 8 dimensions of excellence
- `/04_System/V0.3.0_FEATURE_SEEDS.md` - Seed 3 (Librarian Agent pattern)
- `/04_System/AGENT_BEST_PRACTICES.md` - Development standards
- `/04_System/REPO_AWARE_PROMPTS_MEMORY.md` - Integration-first guidelines
- `/04_System/WINDOWS_BASH_MEMORY.md` - Environment notes

**Dojo Genesis Ecosystem:**
- Review the Master Blueprint v3.0 in project instructions
- Understand the Dojo Agent Protocol v1.0
- Study the Librarian Agent pattern from Dataiku research

**Current Codebase:**
- `/lib/` - Existing utilities and helpers (check for search/vector utilities)
- `/components/` - UI components and patterns (check for search UI)
- `/app/` - Next.js app router structure (check for existing pages)
- `/db/` - Database schema and migrations (PGlite with pgvector)

**Wave 1 Features (Already Merged):**
- Feature 1: Supervisor Router (agent registry, routing logic, handoffs)
- Feature 2: Cost Guard (three-tier budgeting, estimation, tracking)

---

## Feature Overview

Deploy the Librarian Agent as a specialized semantic search and retrieval agent that helps users find seed patches, search project memory, and discover similar prompts. This implements Dataiku's specialized agent pattern with proactive suggestions and artifact retrieval.

**Research Foundation:** This feature is grounded in Dataiku's enterprise agent patterns, specifically the "Specialized Agent" pattern where agents have narrow, well-defined responsibilities (search and retrieval) and integrate with the Supervisor for routing.

**Seed Reference:** See `/04_System/V0.3.0_FEATURE_SEEDS.md` - Seed 3

---

## Excellence Criteria (v0.3.0 Priorities)

**Must Be Excellent (9-10/10):**
- **Stability:** Zero search failures, accurate results
- **Research Integration:** Pure Librarian pattern from Dataiku
- **Depth:** Complete search system with proactive suggestions

**Must Be Very Good (7-8/10):**
- **Performance:** Search response <300ms
- **Usability:** Intuitive search UI, clear results

**Can Be Good (6-7/10):**
- **Beauty:** Clean UI, not necessarily stunning
- **Creativity:** Solid implementation, not necessarily novel

---

## Core Requirements

### 1. Semantic Search with pgvector

**Purpose:** Enable vector-based semantic search across all prompts and seed patches using PGlite's pgvector extension.

**Integration Points:**
- Check if pgvector is already installed in PGlite schema (`/db/`)
- Review existing database query patterns for prompts table
- Use existing prompt metadata structure
- Follow existing database migration patterns

**Implementation:**

**A) Database Schema (Migration)**
```sql
-- /db/migrations/003_add_vector_search.sql

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column to prompts table
ALTER TABLE prompts ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- Create index for fast similarity search
CREATE INDEX IF NOT EXISTS prompts_embedding_idx 
ON prompts USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Add embedding column to seed_patches table (if exists)
ALTER TABLE seed_patches ADD COLUMN IF NOT EXISTS embedding vector(1536);
CREATE INDEX IF NOT EXISTS seed_patches_embedding_idx 
ON seed_patches USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
```

**B) Embedding Generation**
```typescript
// /lib/librarian/embeddings.ts

import { OpenAI } from 'openai'; // Use existing OpenAI client if available

const openai = new OpenAI(); // Should be pre-configured

export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small', // 1536 dimensions, $0.02/1M tokens
    input: text,
  });

  return response.data[0].embedding;
}

export async function embedPrompt(promptId: string, content: string): Promise<void> {
  const embedding = await generateEmbedding(content);

  // Update prompt with embedding (use existing db patterns)
  await db
    .update(prompts)
    .set({ embedding: JSON.stringify(embedding) }) // pgvector format
    .where(eq(prompts.id, promptId));
}

// Batch embedding for existing prompts
export async function embedAllPrompts(): Promise<void> {
  const allPrompts = await db.select().from(prompts).where(isNull(prompts.embedding));

  for (const prompt of allPrompts) {
    await embedPrompt(prompt.id, prompt.content);
    console.log(`Embedded prompt ${prompt.id}`);
  }
}
```

**C) Semantic Search Query**
```typescript
// /lib/librarian/search.ts

export interface SearchResult {
  id: string;
  title: string;
  content: string;
  similarity: number;
  metadata: Record<string, any>;
}

export async function semanticSearch(
  query: string,
  limit: number = 10,
  threshold: number = 0.7
): Promise<SearchResult[]> {
  // Generate query embedding
  const queryEmbedding = await generateEmbedding(query);

  // Perform vector similarity search (use existing db patterns)
  const results = await db.execute(sql`
    SELECT 
      id,
      title,
      content,
      metadata,
      1 - (embedding <=> ${JSON.stringify(queryEmbedding)}::vector) as similarity
    FROM prompts
    WHERE embedding IS NOT NULL
      AND 1 - (embedding <=> ${JSON.stringify(queryEmbedding)}::vector) > ${threshold}
    ORDER BY similarity DESC
    LIMIT ${limit}
  `);

  return results.rows as SearchResult[];
}
```

**Requirements:**
- [ ] pgvector extension enabled in PGlite
- [ ] Embedding column added to prompts table
- [ ] IVFFlat index created for fast search
- [ ] Embedding generation uses text-embedding-3-small
- [ ] Semantic search returns top 10 results by default
- [ ] Similarity threshold is configurable (default 0.7)
- [ ] Follows existing database patterns in `/db/`
- [ ] Batch embedding script for existing prompts

---

### 2. Librarian Agent Integration with Supervisor

**Purpose:** Register Librarian Agent with Supervisor Router and handle routing/handoffs.

**Integration Points:**
- Review Feature 1 (Supervisor Router) agent registry structure
- Follow existing agent registration patterns
- Use existing handoff logic
- Integrate with existing Cost Guard tracking

**Implementation:**

**A) Agent Registry Entry**
```json
// /lib/agents/registry.json (add to existing registry)

{
  "id": "librarian",
  "name": "Librarian Agent",
  "description": "Semantic search and retrieval. Use when the user wants to find seed patches, search project memory, or discover similar prompts. Does NOT provide thinking partnership or generate new ideas.",
  "when_to_use": [
    "User wants to search for seed patches",
    "User needs to find information in project memory",
    "User wants to discover similar prompts",
    "User asks 'what did I build before?' or 'find X'",
    "User says 'search', 'find', 'show me', 'retrieve'"
  ],
  "when_not_to_use": [
    "User wants thinking partnership",
    "User wants to explore perspectives",
    "User needs conflict resolution",
    "User wants to generate new content"
  ],
  "default": false
}
```

**B) Librarian Agent Handler**
```typescript
// /lib/agents/librarian.ts

export async function handleLibrarianQuery(
  query: string,
  conversationContext: Message[]
): Promise<LibrarianResponse> {
  // Extract search intent from query
  const searchQuery = extractSearchQuery(query);

  // Perform semantic search
  const results = await semanticSearch(searchQuery, 10, 0.7);

  // Format results for user
  const formattedResults = formatSearchResults(results);

  // Track cost (integrate with Cost Guard)
  await trackCost({
    user_id: getCurrentUserId(),
    session_id: getCurrentSessionId(),
    operation_type: 'search',
    tokens_used: estimateTokens(query, results),
    cost_usd: calculateSearchCost(results),
  });

  return {
    results: formattedResults,
    query: searchQuery,
    count: results.length,
    suggestion: generateProactiveSuggestion(results),
  };
}

function extractSearchQuery(userQuery: string): string {
  // Remove "search for", "find", "show me" prefixes
  return userQuery
    .replace(/^(search for|find|show me|retrieve)\s+/i, '')
    .trim();
}
```

**Requirements:**
- [ ] Librarian registered in Supervisor's agent registry
- [ ] Librarian handler processes search queries
- [ ] Search results formatted for user display
- [ ] Cost tracking integrated with Cost Guard
- [ ] Handoffs from Dojo to Librarian work seamlessly
- [ ] Handoffs from Librarian back to Dojo preserve context
- [ ] Follows existing agent patterns from Feature 1

---

### 3. Proactive Suggestions

**Purpose:** Suggest related prompts and seed patches without explicit user request.

**Integration Points:**
- Use existing conversation context from Supervisor
- Integrate with existing UI notification system (if available)
- Follow existing component patterns for suggestions UI

**Implementation:**

**A) Suggestion Engine**
```typescript
// /lib/librarian/suggestions.ts

export interface Suggestion {
  type: 'similar_prompt' | 'related_seed' | 'recent_work';
  title: string;
  description: string;
  action: string; // "View", "Open", "Apply"
  target_id: string;
}

export async function generateSuggestions(
  currentPromptId: string,
  conversationContext: Message[]
): Promise<Suggestion[]> {
  const suggestions: Suggestion[] = [];

  // 1. Find similar prompts based on current prompt
  const currentPrompt = await db.select().from(prompts).where(eq(prompts.id, currentPromptId)).limit(1);
  if (currentPrompt.length > 0) {
    const similarPrompts = await semanticSearch(currentPrompt[0].content, 3, 0.8);
    suggestions.push(...similarPrompts.map(p => ({
      type: 'similar_prompt',
      title: p.title,
      description: `${(p.similarity * 100).toFixed(0)}% similar`,
      action: 'View',
      target_id: p.id,
    })));
  }

  // 2. Find related seed patches based on conversation
  const conversationText = conversationContext.map(m => m.content).join(' ');
  const relatedSeeds = await searchSeedPatches(conversationText, 2, 0.75);
  suggestions.push(...relatedSeeds.map(s => ({
    type: 'related_seed',
    title: s.title,
    description: s.description,
    action: 'Apply',
    target_id: s.id,
  })));

  // 3. Show recent work (last 3 prompts)
  const recentPrompts = await db
    .select()
    .from(prompts)
    .orderBy(desc(prompts.updated_at))
    .limit(3);
  suggestions.push(...recentPrompts.map(p => ({
    type: 'recent_work',
    title: p.title,
    description: `Last edited ${formatRelativeTime(p.updated_at)}`,
    action: 'Open',
    target_id: p.id,
  })));

  return suggestions;
}
```

**B) Suggestion Trigger Logic**
```typescript
// When to show suggestions:
// - After user saves a prompt
// - After user completes a Dojo session
// - When user opens the Librarian page
// - When user idles for 30 seconds (optional)
```

**Requirements:**
- [ ] Suggestions generated based on semantic similarity
- [ ] Suggestions include similar prompts, related seeds, recent work
- [ ] Suggestions are non-intrusive (don't block workflow)
- [ ] Suggestions are dismissible
- [ ] Suggestion clicks are tracked (analytics)
- [ ] Follows existing UI component patterns

---

### 4. Librarian UI (Dedicated Page)

**Purpose:** Provide a dedicated search interface for the Librarian Agent.

**Integration Points:**
- Review existing page structure in `/app/`
- Use existing UI components (Card, Input, Button, etc.)
- Follow existing design system (Material 3, Tailwind CSS)
- Integrate with existing navigation/routing

**Implementation:**

**A) Page Structure**
```typescript
// /app/librarian/page.tsx

export default function LibrarianPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Search Bar */}
      <LibrarianSearchBar />

      {/* Search Results */}
      <LibrarianSearchResults />

      {/* Proactive Suggestions */}
      <LibrarianSuggestions />

      {/* Recent Searches */}
      <LibrarianRecentSearches />
    </div>
  );
}
```

**B) Search Bar Component**
```typescript
// /components/LibrarianSearchBar.tsx

export function LibrarianSearchBar() {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    setIsSearching(true);
    const results = await semanticSearch(query);
    // Update results state
    setIsSearching(false);
  };

  return (
    <Card>
      <CardContent className="flex gap-4">
        <Input
          placeholder="Search prompts, seeds, or project memory..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <Button onClick={handleSearch} disabled={isSearching}>
          {isSearching ? 'Searching...' : 'Search'}
        </Button>
      </CardContent>
    </Card>
  );
}
```

**C) Search Results Component**
```typescript
// /components/LibrarianSearchResults.tsx

export function LibrarianSearchResults({ results }: { results: SearchResult[] }) {
  if (results.length === 0) {
    return <EmptyState message="No results found. Try a different query." />;
  }

  return (
    <div className="space-y-4">
      {results.map((result) => (
        <Card key={result.id}>
          <CardHeader>
            <CardTitle>{result.title}</CardTitle>
            <Badge>{(result.similarity * 100).toFixed(0)}% match</Badge>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground line-clamp-3">
              {result.content}
            </p>
            <Button variant="outline" className="mt-4">
              View Prompt
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

**Requirements:**
- [ ] Dedicated `/librarian` page (not sidebar panel)
- [ ] Search bar with auto-suggest (optional)
- [ ] Search results with similarity scores
- [ ] Proactive suggestions section
- [ ] Recent searches history
- [ ] Responsive design (mobile-friendly)
- [ ] Accessible (WCAG AA)
- [ ] Follows existing UI component patterns
- [ ] Integrates with existing navigation

---

### 5. Artifact Retrieval

**Purpose:** Retrieve and display full prompt content, seed patches, and project memory.

**Integration Points:**
- Use existing prompt display components
- Follow existing content rendering patterns
- Integrate with existing Monaco editor (if applicable)

**Implementation:**

```typescript
// /lib/librarian/retrieval.ts

export async function retrieveArtifact(
  artifactId: string,
  artifactType: 'prompt' | 'seed' | 'memory'
): Promise<Artifact> {
  switch (artifactType) {
    case 'prompt':
      return await db.select().from(prompts).where(eq(prompts.id, artifactId)).limit(1);
    case 'seed':
      return await db.select().from(seed_patches).where(eq(seed_patches.id, artifactId)).limit(1);
    case 'memory':
      return await db.select().from(project_memory).where(eq(project_memory.id, artifactId)).limit(1);
  }
}

export async function retrieveWithContext(
  artifactId: string
): Promise<ArtifactWithContext> {
  const artifact = await retrieveArtifact(artifactId, 'prompt');
  const relatedArtifacts = await semanticSearch(artifact.content, 5, 0.75);

  return {
    artifact,
    related: relatedArtifacts,
    metadata: artifact.metadata,
  };
}
```

**Requirements:**
- [ ] Retrieve full artifact content
- [ ] Retrieve related artifacts (semantic similarity)
- [ ] Display artifact metadata (author, date, tags)
- [ ] Support copy-to-clipboard
- [ ] Support open-in-editor
- [ ] Follows existing content display patterns

---

## API Specification

### POST /api/librarian/search

**Purpose:** Perform semantic search across prompts and seeds.

**Integration:**
- Follow existing API route patterns in `/app/api/`
- Use existing authentication middleware
- Integrate with Cost Guard for tracking

**Request:**
```json
{
  "query": "budget planning prompts",
  "limit": 10,
  "threshold": 0.7,
  "filters": {
    "status": "active",
    "tags": ["finance"]
  }
}
```

**Response:**
```json
{
  "results": [
    {
      "id": "prompt_123",
      "title": "Monthly Budget Planning",
      "content": "...",
      "similarity": 0.92,
      "metadata": {
        "author": "user_456",
        "created_at": "2026-01-01",
        "tags": ["finance", "planning"]
      }
    }
  ],
  "query": "budget planning prompts",
  "count": 5,
  "suggestions": [
    {
      "type": "similar_prompt",
      "title": "Annual Budget Review",
      "action": "View",
      "target_id": "prompt_789"
    }
  ]
}
```

---

### POST /api/librarian/embed

**Purpose:** Generate embeddings for new or updated prompts.

**Request:**
```json
{
  "prompt_id": "prompt_123",
  "content": "This is my prompt content..."
}
```

**Response:**
```json
{
  "success": true,
  "prompt_id": "prompt_123",
  "embedding_generated": true
}
```

---

### GET /api/librarian/suggestions

**Purpose:** Get proactive suggestions based on current context.

**Request:**
```
GET /api/librarian/suggestions?prompt_id=prompt_123
```

**Response:**
```json
{
  "suggestions": [
    {
      "type": "similar_prompt",
      "title": "Related Budget Prompt",
      "description": "85% similar",
      "action": "View",
      "target_id": "prompt_456"
    }
  ]
}
```

---

## Testing Requirements

### Unit Tests
- [ ] Embedding generation works correctly
- [ ] Semantic search returns accurate results
- [ ] Similarity scores are within expected range (0-1)
- [ ] Suggestion engine generates relevant suggestions
- [ ] Follow existing test patterns in `/tests/` or `__tests__/`

### Integration Tests
- [ ] End-to-end search from query to results
- [ ] Supervisor routes "search" queries to Librarian
- [ ] Handoffs from Dojo to Librarian preserve context
- [ ] Cost tracking integrated with Cost Guard
- [ ] Use existing test infrastructure

### Performance Tests
- [ ] Search response time <300ms (p95)
- [ ] Embedding generation <500ms per prompt
- [ ] Batch embedding processes 100 prompts in <2 minutes

---

## Documentation Requirements

### JOURNAL.md Updates
Document the following architectural decisions:
- [ ] Why pgvector over external vector database (simplicity, local-first)
- [ ] Why text-embedding-3-small over ada-002 (cost, performance)
- [ ] Why dedicated page over sidebar (scalability, UX)
- [ ] How semantic search integrates with Supervisor routing
- [ ] How proactive suggestions are triggered
- [ ] Integration points with Cost Guard
- [ ] Self-assessment against Excellence Criteria (score each dimension)

### Code Documentation
- [ ] JSDoc comments for all public functions
- [ ] README in `/lib/librarian/` explaining the search system
- [ ] Examples of semantic search queries
- [ ] Troubleshooting guide for embedding issues

### User Documentation
- [ ] How to use the Librarian search
- [ ] How to interpret similarity scores
- [ ] How proactive suggestions work
- [ ] How to apply seed patches from search results

---

## Acceptance Criteria

### Stability (10/10)
- [ ] Zero search failures in 100 test queries
- [ ] Embedding generation never fails (graceful degradation)
- [ ] Search results are always accurate and relevant
- [ ] All edge cases handled (empty query, no results, etc.)
- [ ] No regressions in existing features

### Research Integration (10/10)
- [ ] Implements Dataiku's Librarian pattern exactly
- [ ] Semantic search using vector embeddings
- [ ] Proactive suggestions without explicit request
- [ ] Documentation cites Dataiku research
- [ ] Seed 3 patterns are followed

### Depth (10/10)
- [ ] Complete search system (semantic, filters, suggestions)
- [ ] Dedicated Librarian page (not sidebar)
- [ ] Artifact retrieval with context
- [ ] Comprehensive documentation (architecture, API, usage, JOURNAL updates)
- [ ] Code is clean, readable, and follows existing patterns

### Performance (9/10)
- [ ] Search response <300ms (p95)
- [ ] Embedding generation <500ms per prompt
- [ ] Batch embedding efficient (<2 min for 100 prompts)
- [ ] No performance regressions

### Usability (9/10)
- [ ] Intuitive search UI
- [ ] Clear similarity scores
- [ ] Helpful suggestions
- [ ] Easy artifact retrieval
- [ ] Accessible (WCAG AA)

---

## Integration with Wave 1 Features

### With Feature 1 (Supervisor Router):
- [ ] Librarian registered in agent registry
- [ ] Supervisor routes "search" queries to Librarian
- [ ] Handoffs from Dojo to Librarian work seamlessly
- [ ] Handoffs from Librarian to Dojo preserve context

### With Feature 2 (Cost Guard):
- [ ] Search costs tracked (embedding + query)
- [ ] Cost appears in Cost Guard dashboard
- [ ] Budget checks before expensive searches
- [ ] Mode downgrade if budget low

---

## Deferred to Future Releases

- Advanced filters (date range, author, tags)
- Full-text search (in addition to semantic)
- Search analytics dashboard
- Collaborative filtering (user behavior)
- Cross-project search (search across multiple projects)

---

## Zenflow Automation Protocol

**Setup Script:**
```
npm install
```

**Dev Server Script:**
```
npm run dev
```

**Cleanup Script:**
```
npm run lint; npm run build
```

**Copy Files:**
```
.env.local
```

---

## Notes for Zenflow

1. **Read Documentation from Both Ends:** Start with JOURNAL.md (tail), then BUGS.md (tail), then this prompt (head to tail).

2. **Review Existing Codebase:** Before writing any code, review:
   - `/lib/` for existing utilities and patterns
   - `/db/` for database schema and PGlite usage (check if pgvector is already enabled)
   - `/app/api/` for API route patterns
   - `/components/` for UI component patterns
   - Feature 1 (Supervisor Router) for agent registration patterns
   - Feature 2 (Cost Guard) for cost tracking patterns

3. **Follow Existing Patterns:** Match the code style, error handling, and architecture patterns already in the repo.

4. **Generate PRD + Tech Spec in Sandbox:** Create detailed PRD and tech spec in your sandbox before coding. Do NOT commit these to the repo.

5. **Commit Only Implementation:** Commit code, tests, and documentation updates. Do NOT commit PRD/spec.

6. **Update JOURNAL.md:** Log architectural decisions, implementation notes, and self-assessment against Excellence Criteria.

7. **Update BUGS.md:** Log any bugs discovered during development. Fix all P0 and P1 bugs before finishing your testing. After completing your testing, complete a premium micro sprint solving any P2/P3 bugs for the user.

8. **Self-Assess:** Use the Excellence Rubric to score your implementation before marking complete.

9. **Windows Bash Compatible:** Use `;` instead of `&&` for command chaining.

10. **Integration Readiness:** This feature depends on Feature 1 (Supervisor Router). Ensure it's merged before starting.

11. **Database Migrations:** Create PGlite migration for pgvector extension and embedding columns.

12. **Dedicated Page:** Create `/app/librarian/page.tsx` (not a sidebar panel) for better scalability and UX.

---

**Author:** Manus AI (Dojo)  
**Status:** v0.3.0 Premium Feature Prompt  
**Date:** January 13, 2026
