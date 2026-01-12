# Technical Specification: The Librarian's Home v0.1

**Version**: 1.0  
**Created**: January 11, 2026  
**Based on**: requirements.md  

---

## 1. Technical Context

### 1.1 Current Technology Stack
- **Framework**: Next.js 14.2.24 (App Router)
- **Runtime**: React 18.3.1, TypeScript 5.7.2
- **Styling**: Tailwind CSS 3.4.17
- **UI Components**: Framer Motion 11.15.0 (already installed)
- **Icons**: lucide-react 0.469.0
- **Authentication**: NextAuth v5.0.0-beta.25
- **Storage**: Google Drive API (googleapis 131.0.0)
- **Markdown**: gray-matter 4.0.3 (frontmatter parsing)
- **State Management**: React hooks, context API
- **Dev Tools**: ESLint, TypeScript compiler

### 1.2 New Dependencies Required
```json
{
  "@supabase/supabase-js": "^2.39.0"
}
```

### 1.3 Environment Variables
New variables to add to `.env.local`:
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 1.4 Existing Architecture Patterns
- **Page Structure**: `/app/[route]/page.tsx` → `components/[route]/[Route]View.tsx`
- **Data Fetching**: Custom hooks (`useLibrary`, `useGallery`)
- **Shared Components**: `PromptCard`, `SearchInput`, `LoadingState`, `ErrorState`, `EmptySearchState`
- **Types**: Centralized in `lib/types.ts`
- **Utilities**: `lib/utils.ts` (cn utility for classnames)
- **API Routes**: `/app/api/drive/*` for Google Drive operations
- **Dev Mode**: Mock data when `NEXT_PUBLIC_DEV_MODE=true`

---

## 2. Implementation Approach

### 2.1 Hybrid Storage Strategy

**Current State**: All prompt data stored in Google Drive as markdown files with frontmatter.

**Target State**: Dual storage model:
- **Google Drive**: Source of truth for file content (backward compatible)
- **Supabase**: Metadata, critique scores, user preferences, status tracking

**Sync Flow**:
```
User creates/edits prompt
    ↓
Save to Google Drive (existing)
    ↓
Extract metadata + content
    ↓
Save/update Supabase record
    ↓
Calculate critique score
    ↓
Store critique in Supabase
```

**Sync Strategy**:
- **On Save**: Immediate sync when user saves a prompt
- **Background Sync**: Every 5 minutes, sync all Drive changes to Supabase
- **On Page Load**: Initial sync when user visits `/librarian` (if last sync > 5 min ago)
- **Manual Trigger**: Refresh button for user-initiated sync

**Benefits**:
- Zero disruption to existing library/gallery functionality
- Enables fast queries on metadata without Drive API calls
- Foundation for future semantic search and AI features
- Maintains offline-first capability with Drive
- Background sync ensures data freshness without blocking UI

### 2.2 Critique Engine Architecture

**Design**: Rule-based, synchronous, client-side capable

**Structure**:
```typescript
lib/critique/
  ├── engine.ts          // Main critique orchestrator
  ├── rules/
  │   ├── conciseness.ts
  │   ├── specificity.ts
  │   ├── context.ts
  │   └── taskDecomposition.ts
  └── types.ts           // Critique-related types
```

**Execution Strategy**:
- Runs on client-side for instant feedback (< 1s for 2000 chars)
- Debounced during editing (500ms delay)
- Server-side validation on save
- Results cached in Supabase for performance

**Rule Implementations**:
1. **Conciseness** (0-25 points):
   - Detect filler words: "very", "really", "just", "basically", etc.
   - Measure word efficiency: length vs. information density
   - Penalize redundancy: repeated phrases, circular definitions
   
2. **Specificity** (0-25 points):
   - Flag vague terms: "good", "nice", "better", "optimal"
   - Reward concrete examples, numbers, constraints
   - Check for clear success criteria
   
3. **Context** (0-25 points):
   - Verify audience is defined
   - Check for input/output specifications
   - Assess background information sufficiency
   
4. **Task Decomposition** (0-25 points):
   - Identify if multiple tasks exist
   - Reward numbered steps, clear structure
   - Penalize ambiguous scope

### 2.3 Component Architecture

**Pattern**: Follow existing structure with new specialized components

**New Components**:
```
components/librarian/
  ├── LibrarianView.tsx           // Main page component
  ├── SeedlingSection.tsx         // Active prompts grid
  ├── GreenhouseSection.tsx       // Saved prompts grid
  ├── SeedlingCard.tsx            // Card for active prompts
  ├── GreenhouseCard.tsx          // Card for saved prompts
  ├── CritiqueScore.tsx           // Score display component
  ├── CritiqueDetails.tsx         // Expandable feedback
  └── StatusTransitionButton.tsx  // Move to Greenhouse button
```

**Reused Components**:
- `SearchInput` (from shared)
- `LoadingState` (from shared)
- `ErrorState` (from shared)
- `EmptySearchState` (from shared, with custom messages)

**Component Hierarchy**:
```
/app/librarian/page.tsx
  └── LibrarianView.tsx
      ├── SeedlingSection.tsx
      │   ├── Filters/Sort Controls
      │   └── SeedlingCard[] (grid)
      │       ├── CritiqueScore
      │       └── StatusTransitionButton
      └── GreenhouseSection.tsx
          ├── SearchInput
          ├── Filters/Sort Controls
          └── GreenhouseCard[] (grid)
              ├── CritiqueScore
              └── Action Buttons (Run, Copy, Edit)
```

### 2.4 Data Access Layer

**Structure**:
```typescript
lib/supabase/
  ├── client.ts         // Supabase client initialization
  ├── prompts.ts        // Prompt CRUD operations
  ├── critiques.ts      // Critique operations
  ├── types.ts          // Supabase-specific types
  └── migrations/       // SQL migration files
      └── 001_initial_schema.sql
```

**Key Functions**:
```typescript
// lib/supabase/prompts.ts
export async function getPromptsByStatus(userId: string, status: PromptStatus)
export async function updatePromptStatus(promptId: string, status: PromptStatus)
export async function syncPromptFromDrive(driveFile: DriveFile, userId: string)
export async function searchPrompts(userId: string, query: string, filters: PromptFilters)

// lib/supabase/critiques.ts
export async function saveCritique(promptId: string, critique: CritiqueResult)
export async function getLatestCritique(promptId: string)
export async function getCritiqueHistory(promptId: string)
```

### 2.5 Custom Hooks

**New Hooks**:
```typescript
hooks/
  ├── useLibrarian.ts           // Main data hook for /librarian page
  ├── useCritique.ts            // Critique calculation and caching
  ├── usePromptStatus.ts        // Status management (draft/active/saved)
  └── useSupabaseSync.ts        // Drive ↔ Supabase sync
```

**Hook Responsibilities**:

`useLibrarian`:
- Fetch prompts from Supabase (with Drive fallback)
- Filter by status (active/saved)
- Handle loading/error states
- Integrate with existing `useLibrary` where possible

`useCritique`:
- Calculate critique scores on demand
- Debounce during editing
- Cache results in Supabase
- Provide real-time feedback
- Trigger auto-suggest notification when score > 80

`usePromptStatus`:
- Transition prompts between states
- Update Supabase + Drive metadata
- Optimistic UI updates

---

## 3. Source Code Structure Changes

### 3.1 New Files

```
/app/librarian/
  └── page.tsx                    [NEW] Route entry point

/components/librarian/
  ├── LibrarianView.tsx           [NEW] Main view component
  ├── SeedlingSection.tsx         [NEW] Active prompts section
  ├── GreenhouseSection.tsx       [NEW] Saved prompts section
  ├── SeedlingCard.tsx            [NEW] Seedling card component
  ├── GreenhouseCard.tsx          [NEW] Greenhouse card component
  ├── CritiqueScore.tsx           [NEW] Score display
  ├── CritiqueDetails.tsx         [NEW] Detailed feedback
  └── StatusTransitionButton.tsx  [NEW] Save to Greenhouse button

/lib/supabase/
  ├── client.ts                   [NEW] Client initialization
  ├── prompts.ts                  [NEW] Prompt operations
  ├── critiques.ts                [NEW] Critique operations
  ├── types.ts                    [NEW] Supabase types
  └── migrations/
      └── 001_initial_schema.sql  [NEW] Database schema

/lib/critique/
  ├── engine.ts                   [NEW] Main critique engine
  ├── types.ts                    [NEW] Critique types
  └── rules/
      ├── conciseness.ts          [NEW]
      ├── specificity.ts          [NEW]
      ├── context.ts              [NEW]
      └── taskDecomposition.ts    [NEW]

/hooks/
  ├── useLibrarian.ts             [NEW] Librarian data hook
  ├── useCritique.ts              [NEW] Critique hook
  ├── usePromptStatus.ts          [NEW] Status management
  └── useSupabaseSync.ts          [NEW] Sync operations

/app/api/librarian/
  ├── sync/route.ts               [NEW] Manual sync endpoint
  └── critique/route.ts           [NEW] Server-side critique
```

### 3.2 Modified Files

```
/lib/types.ts                     [MODIFY] Add new types (see section 4.1)
/components/layout/Header.tsx     [MODIFY] Add /librarian nav link
/components/layout/Sidebar.tsx    [MODIFY] Add /librarian nav link (if applicable)
/.env.example                     [MODIFY] Add Supabase env vars
```

### 3.3 Unchanged Files (Critical for Stability)

**No changes to**:
- `/app/library/*` - Existing library functionality
- `/app/gallery/*` - Existing gallery functionality
- `/components/library/*` - Library components
- `/components/gallery/*` - Gallery components
- `/app/api/drive/*` - Google Drive API routes
- `hooks/useLibrary.ts` - Existing library hook

---

## 4. Data Model / API / Interface Changes

### 4.1 TypeScript Type Definitions

**New Types in `lib/types.ts`**:

```typescript
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
```

**Extended Types**:

```typescript
export interface PromptFile extends DriveFile {
  metadata?: PromptMetadata;
  rawContent?: string;
  status?: PromptStatus;
  critiqueScore?: number;
  critiqueDetails?: CritiqueResult;
}
```

### 4.2 Supabase Schema

**Database Tables** (`lib/supabase/migrations/001_initial_schema.sql`):

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Prompts table
CREATE TABLE prompts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'active', 'saved', 'archived')),
  drive_file_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Prompt metadata table (separate for flexibility)
CREATE TABLE prompt_metadata (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  description TEXT,
  tags TEXT[],
  is_public BOOLEAN DEFAULT false,
  author TEXT,
  version TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT prompt_metadata_prompt_id_unique UNIQUE (prompt_id)
);

-- Critiques table
CREATE TABLE critiques (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  conciseness_score INTEGER NOT NULL CHECK (conciseness_score >= 0 AND conciseness_score <= 25),
  specificity_score INTEGER NOT NULL CHECK (specificity_score >= 0 AND specificity_score <= 25),
  context_score INTEGER NOT NULL CHECK (context_score >= 0 AND context_score <= 25),
  task_decomposition_score INTEGER NOT NULL CHECK (task_decomposition_score >= 0 AND task_decomposition_score <= 25),
  feedback JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_prompts_user_id ON prompts(user_id);
CREATE INDEX idx_prompts_status ON prompts(status);
CREATE INDEX idx_prompts_user_status ON prompts(user_id, status);
CREATE INDEX idx_prompts_updated_at ON prompts(updated_at DESC);
CREATE INDEX idx_prompts_drive_file_id ON prompts(drive_file_id);
CREATE INDEX idx_critiques_prompt_id ON critiques(prompt_id);
CREATE INDEX idx_prompt_metadata_prompt_id ON prompt_metadata(prompt_id);
CREATE INDEX idx_prompt_metadata_tags ON prompt_metadata USING GIN(tags);

-- Updated at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_prompts_updated_at
  BEFORE UPDATE ON prompts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE critiques ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own prompts
CREATE POLICY "Users can view own prompts"
  ON prompts FOR SELECT
  USING (user_id = current_setting('app.user_id', true)::text);

CREATE POLICY "Users can insert own prompts"
  ON prompts FOR INSERT
  WITH CHECK (user_id = current_setting('app.user_id', true)::text);

CREATE POLICY "Users can update own prompts"
  ON prompts FOR UPDATE
  USING (user_id = current_setting('app.user_id', true)::text);

CREATE POLICY "Users can delete own prompts"
  ON prompts FOR DELETE
  USING (user_id = current_setting('app.user_id', true)::text);

-- Metadata policies (inherit from prompts via JOIN)
CREATE POLICY "Users can view own metadata"
  ON prompt_metadata FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM prompts
    WHERE prompts.id = prompt_metadata.prompt_id
    AND prompts.user_id = current_setting('app.user_id', true)::text
  ));

CREATE POLICY "Users can manage own metadata"
  ON prompt_metadata FOR ALL
  USING (EXISTS (
    SELECT 1 FROM prompts
    WHERE prompts.id = prompt_metadata.prompt_id
    AND prompts.user_id = current_setting('app.user_id', true)::text
  ));

-- Critique policies
CREATE POLICY "Users can view own critiques"
  ON critiques FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM prompts
    WHERE prompts.id = critiques.prompt_id
    AND prompts.user_id = current_setting('app.user_id', true)::text
  ));

CREATE POLICY "Users can manage own critiques"
  ON critiques FOR ALL
  USING (EXISTS (
    SELECT 1 FROM prompts
    WHERE prompts.id = critiques.prompt_id
    AND prompts.user_id = current_setting('app.user_id', true)::text
  ));
```

### 4.3 API Endpoints

**New Endpoints**:

```typescript
// POST /api/librarian/sync
// Sync prompts from Google Drive to Supabase
Request: { userId: string }
Response: { success: boolean, syncedCount: number, errors: string[] }

// POST /api/librarian/critique
// Generate critique for a prompt (server-side validation)
Request: { promptId: string, content: string }
Response: { critique: CritiqueResult }

// PATCH /api/librarian/status
// Update prompt status
Request: { promptId: string, status: PromptStatus }
Response: { success: boolean, prompt: Prompt }
```

**Existing Endpoints (Unchanged)**:
- `GET /api/drive/files?folder=prompts`
- `GET /api/drive/content/:fileId`
- `POST /api/drive/fork`

---

## 5. Delivery Phases

### Phase 1: Infrastructure Setup (Critical Path)
**Goal**: Database and data layer ready

**Tasks**:
1. Install `@supabase/supabase-js` dependency
2. Update `.env.example` with Supabase variables
3. Create Supabase project and run migration `001_initial_schema.sql`
4. Implement `lib/supabase/client.ts` with connection logic
5. Create mock data generators for dev mode (10-15 prompts with varied scores)
6. Implement `lib/supabase/prompts.ts` with CRUD functions
7. Implement `lib/supabase/critiques.ts` with CRUD functions
8. Write unit tests for data layer

**Verification**:
- [ ] Supabase client connects successfully
- [ ] Can create, read, update, delete prompts via data layer
- [ ] RLS policies enforced (cannot access other users' data)
- [ ] Mock data populates correctly in dev mode

**Estimated Time**: 2 days

---

### Phase 2: Critique Engine (Can Parallel with Phase 3)
**Goal**: Working critique algorithm with tests

**Tasks**:
1. Define types in `lib/critique/types.ts`
2. Implement `lib/critique/rules/conciseness.ts`
3. Implement `lib/critique/rules/specificity.ts`
4. Implement `lib/critique/rules/context.ts`
5. Implement `lib/critique/rules/taskDecomposition.ts`
6. Implement `lib/critique/engine.ts` orchestrator
7. Write comprehensive unit tests for each rule
8. Create test prompts with known expected scores
9. Implement `useCritique` hook for client-side usage

**Verification**:
- [ ] Critique completes in < 1 second for 2000-char prompts
- [ ] Scores are deterministic (same input = same output)
- [ ] Edge cases handled (empty prompts, very long prompts)
- [ ] All unit tests pass

**Estimated Time**: 2 days

---

### Phase 3: Core UI Components (Can Parallel with Phase 2)
**Goal**: Reusable components ready for integration

**Tasks**:
1. Create `components/librarian/CritiqueScore.tsx`
   - Visual score display with color coding
   - Progress bar animation
2. Create `components/librarian/CritiqueDetails.tsx`
   - Expandable feedback sections
   - Issue and suggestion lists
3. Create `components/librarian/SeedlingCard.tsx`
   - Extends PromptCard pattern
   - Includes critique score
   - "Save to Greenhouse" button
4. Create `components/librarian/GreenhouseCard.tsx`
   - Similar to PromptCard with garden theme
   - Tag display, search highlight
5. Create `components/librarian/StatusTransitionButton.tsx`
   - State transition logic
   - Loading states, confirmations

**Verification**:
- [ ] Components render without errors
- [ ] Animations smooth (60fps)
- [ ] Responsive on mobile/tablet/desktop
- [ ] Matches design specifications (colors, spacing)

**Estimated Time**: 2 days

---

### Phase 4: Section Components
**Goal**: Seedling and Greenhouse sections functional

**Tasks**:
1. Create `components/librarian/SeedlingSection.tsx`
   - Grid layout (responsive)
   - Sort controls (Recent, Score)
   - Filter controls (Score range)
   - Empty state
   - Loading state
2. Create `components/librarian/GreenhouseSection.tsx`
   - Grid layout (responsive)
   - Search integration
   - Tag filters
   - Sort controls
   - Empty state with encouragement message
3. Implement `hooks/usePromptStatus.ts` for status transitions
4. Implement `hooks/useLibrarian.ts` for data fetching

**Verification**:
- [ ] Sections display correct prompts based on status
- [ ] Sorting works correctly
- [ ] Filtering works correctly
- [ ] Empty states display appropriately
- [ ] Loading states smooth

**Estimated Time**: 2 days

---

### Phase 5: Main View and Routing
**Goal**: Complete `/librarian` page functional

**Tasks**:
1. Create `app/librarian/page.tsx` (route entry)
2. Create `components/librarian/LibrarianView.tsx`
   - Two-column layout
   - Section coordination
   - Global loading/error states
3. Update `components/layout/Header.tsx` with nav link
4. Update `components/layout/Sidebar.tsx` with nav link (if exists)
5. Implement `hooks/useSupabaseSync.ts` for Drive ↔ Supabase sync
6. Create API route `app/api/librarian/sync/route.ts`
7. Create API route `app/api/librarian/critique/route.ts`

**Verification**:
- [ ] Page accessible at `/librarian` URL
- [ ] Navigation links work
- [ ] Sync process works (Drive → Supabase)
- [ ] Critique calculation triggered on save
- [ ] No regressions in existing `/library` or `/gallery` pages

**Estimated Time**: 2 days

---

### Phase 6: Polish and Edge Cases
**Goal**: Production-ready quality

**Tasks**:
1. Implement status transition animations
2. Add keyboard shortcuts (optional)
3. Improve accessibility (ARIA labels, focus management)
4. Add error boundary components
5. Implement retry logic for failed syncs
6. Add optimistic UI updates for better UX
7. Performance optimization (memoization, lazy loading)
8. Responsive design testing on multiple devices
9. Browser compatibility testing

**Verification**:
- [ ] WCAG 2.1 AA compliance checked
- [ ] Keyboard navigation works
- [ ] Error states recoverable
- [ ] Performance meets targets (< 2s load, 60fps animations)
- [ ] No console errors or warnings

**Estimated Time**: 2 days

---

### Phase 7: Testing and Documentation
**Goal**: Comprehensive coverage and maintainability

**Tasks**:
1. Integration tests for Supabase operations
2. E2E tests for critical flows (create → critique → save)
3. Update README with setup instructions
4. Document Supabase schema and RLS policies
5. Create developer guide for critique engine
6. Add inline code comments for complex logic
7. Generate TypeScript documentation

**Verification**:
- [ ] All tests pass (`npm run lint`, `npm run type-check`)
- [ ] Documentation complete and accurate
- [ ] New developers can set up Supabase following guide

**Estimated Time**: 1 day

---

## 6. Verification Approach

### 6.1 Development Commands

```bash
# Install dependencies
npm install

# Type checking
npm run type-check

# Linting
npm run lint

# Development server
npm run dev

# Production build
npm run build

# All checks (CI/CD simulation)
npm run lint && npm run type-check && npm run build
```

### 6.2 Manual Testing Checklist

**Seedling Section**:
- [ ] Displays all prompts with status 'draft' or 'active'
- [ ] Critique scores display correctly
- [ ] Sort by Recent works
- [ ] Sort by Score (low to high) works
- [ ] Sort by Score (high to low) works
- [ ] Filter by score range works
- [ ] Click card navigates to editor (or detail view)
- [ ] Empty state displays when no active prompts
- [ ] Loading state displays during fetch
- [ ] Error state displays on failure with retry

**Greenhouse Section**:
- [ ] Displays all prompts with status 'saved'
- [ ] Search by title works
- [ ] Search by description works
- [ ] Search by tags works
- [ ] Filter by tags works (multi-select)
- [ ] Sort options work correctly
- [ ] Empty state displays with encouragement
- [ ] Loading state displays during fetch
- [ ] Error state displays on failure with retry

**Status Transitions**:
- [ ] "Save to Greenhouse" button works
- [ ] Prompt moves from Seedling to Greenhouse
- [ ] Status updates in both UI and database
- [ ] Optimistic update feels responsive
- [ ] Rollback works on failure

**Critique Engine**:
- [ ] Critique calculates on prompt save
- [ ] Scores are consistent for same input
- [ ] Feedback is actionable
- [ ] Color coding matches score ranges
- [ ] Detailed feedback expands/collapses

**Sync Operations**:
- [ ] Initial sync from Drive to Supabase works
- [ ] Creating prompt in Drive syncs to Supabase
- [ ] Editing prompt in Drive syncs changes
- [ ] Deleting prompt in Drive removes from Supabase
- [ ] Sync errors handled gracefully

**Responsive Design**:
- [ ] Mobile (320px - 767px): Single column, stacked sections
- [ ] Tablet (768px - 1023px): Two columns with adjusted spacing
- [ ] Desktop (1024px+): Full two-column layout
- [ ] Ultra-wide (1920px+): Max width constraint, centered

**Performance**:
- [ ] Page loads in < 2 seconds with 50 prompts
- [ ] Critique executes in < 1 second
- [ ] Search responds in < 300ms
- [ ] Animations run at 60fps
- [ ] No memory leaks on repeated navigation

**Backward Compatibility**:
- [ ] `/library` page still works
- [ ] `/gallery` page still works
- [ ] Existing prompts still load
- [ ] Google Drive integration unchanged
- [ ] Authentication flow unchanged

### 6.3 Automated Testing Strategy

**Unit Tests** (Jest + React Testing Library):
- Critique rules (each dimension)
- Data layer functions (prompts, critiques)
- Utility functions (score calculation, formatters)
- Component rendering (CritiqueScore, SeedlingCard, etc.)

**Integration Tests**:
- Supabase CRUD operations with test database
- Drive + Supabase sync flow
- Status transitions end-to-end

**E2E Tests** (Playwright - future consideration):
- Create prompt → calculate critique → save to Greenhouse
- Search and filter in Greenhouse
- Navigation between pages

### 6.4 Code Quality Gates

**Pre-commit**:
- No TypeScript errors (`tsc --noEmit`)
- No ESLint errors (`npm run lint`)

**Pre-push**:
- All unit tests pass
- Build succeeds (`npm run build`)

**Pre-deploy**:
- Integration tests pass
- Manual testing checklist complete
- Performance benchmarks met

---

## 7. Risk Mitigation

### 7.1 Technical Risks

| Risk | Mitigation |
|------|------------|
| **Supabase RLS complexity** | Start with simple policies, test thoroughly, use service role key for admin operations |
| **Drive ↔ Supabase sync conflicts** | Drive is source of truth, Supabase is cache/index. Always resync from Drive on conflict |
| **Critique engine performance** | Profile with large prompts, optimize regex patterns, consider web worker for heavy computation |
| **Breaking existing functionality** | Zero changes to existing `/library` and `/gallery` code, comprehensive regression testing |
| **Mock data in dev mode** | Create realistic mock data with varied scores and statuses, document toggle in README |

### 7.2 User Experience Risks

| Risk | Mitigation |
|------|------------|
| **Confusion about Seedling vs Greenhouse** | Clear labels, tooltips, empty state messaging, onboarding hints |
| **Frustration with low critique scores** | Emphasize growth metaphor, provide actionable suggestions, celebrate improvements |
| **Slow initial sync** | Show progress indicator, sync in background, cache results |
| **Status transition accidents** | Add undo/rollback, confirmation for bulk actions |

---

## 8. Success Criteria

**Functional**:
- ✅ `/librarian` page accessible and functional
- ✅ Seedlings display active prompts with critique scores
- ✅ Greenhouse displays saved prompts with search/filter
- ✅ Status transitions work reliably
- ✅ Critique engine provides accurate, actionable feedback
- ✅ Supabase integration persists all data correctly

**Non-Functional**:
- ✅ Page load < 2 seconds (50 prompts)
- ✅ Critique < 1 second (2000 chars)
- ✅ Search < 300ms response time
- ✅ Animations at 60fps
- ✅ WCAG 2.1 AA compliance
- ✅ Zero regressions in existing features

**Quality**:
- ✅ No TypeScript errors
- ✅ No ESLint warnings
- ✅ All unit tests pass
- ✅ Build succeeds
- ✅ Code review approved

---

## 9. Future Extensibility

**Designed for Growth**:

The architecture supports these future enhancements without major refactoring:

1. **AI-Powered Critiques** (v0.2):
   - Replace rule-based engine with LLM calls
   - Maintain same `CritiqueResult` interface
   - Add confidence scores

2. **Semantic Search** (v0.3):
   - Add embeddings column to `prompts` table
   - Use pgvector extension
   - Implement similarity search

3. **Global Commons** (v0.4):
   - Add `visibility` column to prompts
   - Create `shared_prompts` table for community
   - Extend RLS policies for public access

4. **Garden Beds (Collections)** (v0.5):
   - Add `collections` table
   - Add `prompt_collections` junction table
   - UI for organizing Greenhouse

5. **Collaboration** (v1.0):
   - Add `collaborators` table
   - Real-time sync with Supabase Realtime
   - Conflict resolution UI

---

## 10. Design Decisions

### 10.1 Answered Questions from Requirements

**Q1: Should `/librarian` eventually replace `/library`?**
- **Decision**: Yes, eventually. `/librarian` should become the primary interface.
- **Implementation**: Keep `/library` for now as a fallback, but deprecate it in the roadmap.
- **Timeline**: Mark `/library` as legacy in v0.2, remove in v1.0.

**Q2: Critique Thresholds - Auto-suggest saving prompts?**
- **Decision**: Yes. Prompt users when a prompt scores >80.
- **Implementation**: Subtle notification: "This prompt is ready for the Greenhouse 🌺"
- **UX**: Non-intrusive toast with "Save to Greenhouse" action button.

**Q3: Google Drive Sync Timing**
- **Decision**: On save + scheduled background sync (every 5 minutes).
- **Rationale**: Ensures data freshness without blocking the UI.
- **Implementation**: Use Next.js API route with cron-like scheduling or manual trigger.

**Q4: Editor Integration - Click behavior for Seedling cards**
- **Decision**: Open in the existing editor if it's empty, otherwise open in a new tab.
- **Rationale**: Respects the user's current work while allowing quick access.
- **Implementation**: Check editor state before navigation, use `router.push()` or `window.open()`.

**Q5: Mock Data in Dev Mode**
- **Decision**: Yes. Create 5-10 realistic mock prompts with varying scores (20-95).
- **Implementation**: Mock data generator in `lib/supabase/mockData.ts`.
- **Coverage**: Test all critique score ranges and status transitions.

### 10.2 Engineering Decisions

**Supabase Realtime**: Deferred to v0.2 (adds complexity, not critical for v0.1)

**Critique Execution**: Client-side for v0.1 with server-side validation

**Pagination**: Not for v0.1, virtual scrolling if needed later (< 100 prompts expected)

### 10.3 Design Decisions

**Score Color Ranges**: Using Tailwind defaults
- 0-49: Red (#ef4444)
- 50-74: Yellow (#f59e0b)
- 75-89: Light Green (#84cc16)
- 90-100: Dark Green (#22c55e)

**Plant Icons**: Simple emoji for v0.1 (🌱 seedling, 🌺 flower)

**Animation Durations**: 200-300ms Framer Motion defaults

### 10.4 Additional Design Decisions

**Card Prominence Based on Score**:
- **Decision**: Yes, subtly. Higher scores get slightly larger cards (1.05x scale) and brighter colors.
- **Rationale**: Keep it calm, not aggressive. Visual hierarchy without overwhelming users.
- **Implementation**: Apply scale transform on hover for high-scoring cards (>80), use vibrant colors for score badges.

**Gamification (Badges/Achievements)**:
- **Decision**: No for v0.1. The "garden" metaphor is inherently rewarding.
- **Rationale**: Validate core value first before adding game mechanics.
- **Timeline**: Defer badges/achievements to v0.2+ after user feedback.

**Auto-Archive Low-Scoring Prompts**:
- **Decision**: No automatic archiving. Users should control their garden.
- **Alternative**: Offer a manual "Compost" action instead—feels more intentional.
- **Implementation**: Add "Compost" button (soft delete/archive) on low-scoring prompts as a gentle suggestion.

### 10.5 Remaining Open Questions (Low Priority)

**For Engineering**:
1. Should we use web workers for heavy critique computation? (Monitor performance first, likely unnecessary for v0.1)
2. Should we implement undo/redo for status changes? (Nice-to-have for v0.2)
3. Should we add bulk actions (select multiple prompts)? (Deferred to v0.2)

---

## 11. Conclusion

This technical specification provides a comprehensive blueprint for implementing The Librarian's Home v0.1. The hybrid storage model minimizes risk while enabling future capabilities. The phased delivery approach ensures incremental progress with continuous validation.

**Key Design Principles**:
- **Backward Compatible**: Zero breaking changes to existing features
- **Performance First**: Sub-second critique, sub-2s page load
- **Extensible**: Clear extension points for AI, search, collaboration
- **User-Centric**: Garden metaphor makes prompt quality tangible and rewarding

**Next Steps**:
1. Review and approve specification
2. Set up Supabase project and run migrations
3. Begin Phase 1 implementation
4. Daily standups to track progress against phases

---

**Appendix: Quick Reference**

**New Commands**:
```bash
npm install @supabase/supabase-js
npm run dev
npm run lint && npm run type-check
```

**New Environment Variables**:
```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

**Key Files**:
- `/app/librarian/page.tsx` - Main route
- `/components/librarian/LibrarianView.tsx` - Main component
- `/lib/supabase/client.ts` - Database client
- `/lib/critique/engine.ts` - Critique logic
- `/hooks/useLibrarian.ts` - Data fetching

**Database Tables**:
- `prompts` - Core prompt data
- `prompt_metadata` - Tags, description, etc.
- `critiques` - Critique scores and feedback
