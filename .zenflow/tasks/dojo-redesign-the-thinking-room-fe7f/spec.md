# Technical Specification: Dojo Redesign - The Thinking Room

**Version:** 1.0  
**Date:** 2026-01-16  
**Status:** Ready for Implementation

---

## 1. Technical Context

### 1.1 Technology Stack
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript with strict mode
- **Styling**: Tailwind CSS with custom design tokens
- **State Management**: Zustand (`lib/stores/dojo.store.ts`)
- **Database**: PGlite (client-side PostgreSQL)
- **Animation**: Framer Motion
- **UI Library**: Custom components in `components/ui/`
- **Icons**: Lucide React

### 1.2 Existing Architecture
- **Data Layer**: PGlite with direct client-side access (no API routes for data operations)
- **Session Storage**: `sessions` table with `session_messages` child table
- **Feed System**: Unified artifact feed using `useFeed` hook
- **Knowledge Graph**: Lineage tracking via `knowledge_links` table
- **Routing**: File-based routing with Next.js App Router

### 1.3 Key Dependencies
```typescript
// Existing Components
- ArtifactGridView (components/artifacts/ArtifactGridView.tsx)
- TrailOfThoughtPanel (components/hub/TrailOfThoughtPanel.tsx)
- ModeBadge (components/dojo/ModeBadge.tsx)
- Button, Input, Modal (components/ui/)

// Existing Hooks
- useFeed (hooks/hub/useFeed.ts)
- useLineage (hooks/hub/useLineage.ts)
- useDojo (hooks/useDojo.ts)

// Existing Database Operations
- getSession, insertSession, getAllSessions (lib/pglite/sessions.ts)
- getSessionMessages, insertSessionMessage (lib/pglite/session-messages.ts)

// Existing Types
- SessionRow, DojoMode, DojoMessage (lib/pglite/types.ts, lib/stores/dojo.store.ts)
- FeedFilters, ArtifactType (lib/hub/types.ts)
```

---

## 2. Implementation Approach

### 2.1 Design Principles
Following the 11-11 brand guide:
- **Calm and Focused**: Minimal clutter, generous whitespace, subtle animations (200-300ms)
- **Premium is Subtle**: Refined typography, elegant transitions, high-quality empty states
- **Responsive**: Mobile-first with progressive enhancement
- **Accessible**: WCAG AA compliance, keyboard navigation, screen reader support

### 2.2 Architecture Decisions

#### Decision 1: Leverage Existing ArtifactGridView
**Rationale**: The `ArtifactGridView` component already supports session artifacts via the unified feed system. We'll use this with type filter `['session']` to display recent sessions.

**Implementation**: 
```typescript
<ArtifactGridView
  filters={{ 
    types: ['session'],
    dateFrom: null,
    dateTo: null,
    search: '',
  }}
  emptyState={{
    title: "Your thinking room is empty",
    message: "Start your first session to begin",
    action: {
      label: "Start New Session",
      onClick: () => router.push('/dojo/new')
    }
  }}
/>
```

#### Decision 2: Two-Column Layout with Collapsible Context Panel
**Rationale**: Balances focus on conversation with access to contextual information. Mobile users get a bottom sheet alternative.

**Breakpoints**:
- Mobile (< 768px): Single column, context panel as modal/bottom sheet
- Tablet (768px - 1024px): Two columns, context panel starts collapsed
- Desktop (> 1024px): Two columns, context panel starts expanded

#### Decision 3: Embed TrailOfThoughtPanel Instead of Reimplementing
**Rationale**: The `TrailOfThoughtPanel` is a battle-tested component. We'll embed it in the Context Panel's "Trail" tab rather than duplicating logic.

#### Decision 4: LocalStorage for Context Panel State
**Rationale**: Persist user preference for panel open/closed state across sessions.

**Key**: `dojo:contextPanel:isOpen`

---

## 3. Source Code Structure Changes

### 3.1 New Files to Create

```
app/
  dojo/
    page.tsx                           # NEW: Session Hub landing page
    [sessionId]/
      page.tsx                          # MODIFY: Add two-column layout

components/
  dojo/
    DojoLandingView.tsx                # NEW: Main landing view component
    OnboardingPanel.tsx                # NEW: Four modes explanation
    ContextPanel.tsx                   # NEW: Collapsible sidebar with tabs
    ContextPanelDetails.tsx            # NEW: Details tab content
    ContextPanelTrail.tsx              # NEW: Trail tab content (embeds TrailOfThoughtPanel)
    ContextPanelRelated.tsx            # NEW: Related artifacts tab
    SessionExportModal.tsx             # NEW: Export session as markdown
    SessionDeleteDialog.tsx            # NEW: Delete confirmation
    DojoInput.tsx                       # MODIFY: Add tips and templates
    SessionHistory.tsx                 # MODIFY: Enhance message display
    ChatMessage.tsx                     # MODIFY: Add timestamps
```

### 3.2 Files to Modify

#### 3.2.1 `app/dojo/[sessionId]/page.tsx`
**Changes**:
- Add two-column layout wrapper
- Integrate `ContextPanel` component
- Add Export and Delete buttons to header
- Move `TrailOfThoughtPanel` into `ContextPanel` (remove from current location)
- Add mode indicator badge in header

**Before**:
```typescript
// Current structure:
<div className="flex flex-col h-screen">
  <header>...</header>
  <TrailOfThoughtPanel />
  <main>
    <SessionHistory />
    <Input />
  </main>
</div>
```

**After**:
```typescript
<div className="flex flex-col h-screen">
  <header>
    <TitleInput />
    <ModeBadge />
    <ActionButtons /> // Save, Export, Delete
  </header>
  <div className="flex-1 flex overflow-hidden">
    <main className="flex-1">
      <SessionHistory />
      <Input />
    </main>
    <ContextPanel sessionId={sessionId} />
  </div>
</div>
```

#### 3.2.2 `components/dojo/DojoInput.tsx`
**Changes**:
- Add collapsible "Tips & Examples" section
- Add character count for situation textarea
- Add "Quick Start" dropdown with templates
- Templates pre-fill situation and perspectives

**New Props**:
```typescript
interface DojoInputProps {
  onSubmit: (data: DojoInputData) => void;
  isLoading?: boolean;
  disabled?: boolean;
  showExamples?: boolean; // NEW: default true
}
```

#### 3.2.3 `components/dojo/ChatMessage.tsx`
**Changes**:
- Add relative timestamp display
- Enhance markdown rendering (already supported by existing setup)
- Ensure mode badge is prominently displayed

---

## 4. Data Model / API / Interface Changes

### 4.1 Database Schema (Existing - No Changes)
```sql
-- Sessions table (already exists)
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  title VARCHAR(255),
  mode VARCHAR(50),
  situation TEXT,
  stake TEXT,
  agent_path TEXT[] DEFAULT '{}',
  next_move_action TEXT,
  next_move_why TEXT,
  next_move_test TEXT,
  artifacts JSONB DEFAULT '[]',
  total_tokens INTEGER DEFAULT 0,
  total_cost_usd NUMERIC(10,4) DEFAULT 0.0000,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Session messages table (already exists)
CREATE TABLE session_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL,
  content TEXT NOT NULL,
  mode VARCHAR(50),
  timestamp TIMESTAMPTZ NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 4.2 New TypeScript Interfaces

#### 4.2.1 Context Panel Types
```typescript
// components/dojo/ContextPanel.tsx
export type ContextPanelTab = 'details' | 'trail' | 'related';

export interface ContextPanelProps {
  sessionId: string;
  defaultOpen?: boolean;
  defaultTab?: ContextPanelTab;
}

export interface SessionDetails {
  id: string;
  title: string | null;
  mode: DojoMode | null;
  situation: string | null;
  created_at: string;
  updated_at: string;
  message_count: number;
  total_tokens: number;
  total_cost_usd: number;
}
```

#### 4.2.2 Quick Start Template Type
```typescript
// components/dojo/DojoInput.tsx
export interface QuickStartTemplate {
  id: string;
  label: string;
  emoji: string;
  situation: string;
  perspectives: string[];
}

export const QUICK_START_TEMPLATES: QuickStartTemplate[] = [
  {
    id: 'career',
    label: 'Career Decision',
    emoji: '💼',
    situation: 'I need to decide whether to...',
    perspectives: ['What matters to me in my career', 'What my family thinks']
  },
  // ... more templates
];
```

### 4.3 New Database Operations

#### 4.3.1 Get Session with Message Count
```typescript
// lib/pglite/sessions.ts
export async function getSessionWithStats(sessionId: string): Promise<SessionDetails> {
  const db = await getDB();
  const result = await db.query(`
    SELECT 
      s.id, s.title, s.mode, s.situation, s.created_at, s.updated_at,
      s.total_tokens, s.total_cost_usd,
      COUNT(sm.id) as message_count
    FROM sessions s
    LEFT JOIN session_messages sm ON s.id = sm.session_id
    WHERE s.id = $1
    GROUP BY s.id
  `, [sessionId]);
  
  return result.rows[0];
}
```

#### 4.3.2 Delete Session
```typescript
// lib/pglite/sessions.ts
export async function deleteSession(sessionId: string): Promise<void> {
  const db = await getDB();
  // Messages will cascade delete automatically
  await db.query('DELETE FROM sessions WHERE id = $1', [sessionId]);
}
```

#### 4.3.3 Export Session as Markdown
```typescript
// lib/dojo/export.ts (NEW FILE)
export interface ExportOptions {
  includeMetadata?: boolean;
  includeTimestamps?: boolean;
}

export async function exportSessionAsMarkdown(
  sessionId: string, 
  options: ExportOptions = {}
): Promise<string> {
  const session = await getSession(sessionId);
  const messages = await getSessionMessages(sessionId);
  
  let markdown = `# ${session.title || 'Untitled Session'}\n\n`;
  
  if (options.includeMetadata) {
    markdown += `**Created**: ${new Date(session.created_at).toLocaleString()}\n`;
    markdown += `**Mode**: ${session.mode || 'Not specified'}\n`;
    markdown += `**Situation**: ${session.situation || 'N/A'}\n\n`;
  }
  
  markdown += `---\n\n`;
  
  for (const msg of messages) {
    const timestamp = options.includeTimestamps 
      ? ` *${new Date(msg.timestamp).toLocaleTimeString()}*` 
      : '';
    const role = msg.role === 'user' ? 'You' : 'Dojo';
    const mode = msg.mode ? ` [${msg.mode}]` : '';
    
    markdown += `### ${role}${mode}${timestamp}\n\n`;
    markdown += `${msg.content}\n\n`;
  }
  
  return markdown;
}
```

### 4.4 LocalStorage Keys
```typescript
// lib/dojo/storage.ts (NEW FILE)
export const DOJO_STORAGE_KEYS = {
  CONTEXT_PANEL_OPEN: 'dojo:contextPanel:isOpen',
  CONTEXT_PANEL_TAB: 'dojo:contextPanel:activeTab',
  ONBOARDING_COLLAPSED: 'dojo:onboarding:collapsed',
} as const;

export function getContextPanelState(): boolean {
  if (typeof window === 'undefined') return true;
  const stored = localStorage.getItem(DOJO_STORAGE_KEYS.CONTEXT_PANEL_OPEN);
  return stored ? stored === 'true' : window.innerWidth >= 1024;
}

export function setContextPanelState(isOpen: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(DOJO_STORAGE_KEYS.CONTEXT_PANEL_OPEN, String(isOpen));
}
```

---

## 5. Delivery Phases

### Phase 1: Session Hub Landing Page (~4 hours)

#### 1.1 Create Base Page Structure
**Files**:
- `app/dojo/page.tsx`
- `components/dojo/DojoLandingView.tsx`

**Tasks**:
- Create page component with proper metadata
- Implement hero section with Dojo emoji, headline, subheadline
- Add "Start New Session" button (navigates to `/dojo/new`)
- Ensure responsive layout

**Verification**:
- Navigate to `/dojo` and see landing page
- Click "Start New Session" navigates to `/dojo/new`
- Page is responsive on mobile, tablet, desktop

#### 1.2 Create Onboarding Panel
**Files**:
- `components/dojo/OnboardingPanel.tsx`

**Tasks**:
- Create collapsible panel component
- Display four mode cards (Mirror, Scout, Gardener, Implementation)
- Each card shows emoji, name, description, example use case
- Use `BADGE_CONFIG` from `ModeBadge.tsx` for consistency
- Add collapse/expand animation
- Persist collapsed state in localStorage

**Verification**:
- Panel displays all four modes with correct emojis and descriptions
- Panel can be collapsed and expanded
- State persists across page refreshes

#### 1.3 Integrate Session Grid
**Files**:
- `components/dojo/DojoLandingView.tsx`

**Tasks**:
- Import and configure `ArtifactGridView` with session filter
- Implement empty state with encouraging message
- Add proper loading and error states
- Configure pagination (6 items initially, load more)

**Verification**:
- Sessions display in grid (if any exist)
- Empty state shows when no sessions exist
- "Load More" button works correctly
- Clicking a session navigates to `/dojo/[sessionId]`

### Phase 2: Enhanced Session Page (~6 hours)

#### 2.1 Create Context Panel Component
**Files**:
- `components/dojo/ContextPanel.tsx`
- `components/dojo/ContextPanelDetails.tsx`
- `components/dojo/ContextPanelTrail.tsx`
- `components/dojo/ContextPanelRelated.tsx`

**Tasks**:
- Create collapsible sidebar with toggle button
- Implement three-tab interface (Details, Trail, Related)
- Wire up localStorage for open/closed state
- Make responsive (bottom sheet on mobile)
- Add smooth animations (200-300ms)

**Details Tab**:
- Display session metadata (ID, dates, mode, tokens, cost)
- Show situation from initial input
- Make session ID copyable

**Trail Tab**:
- Embed existing `TrailOfThoughtPanel` component
- Pass correct props (`artifactType="session"`, `artifactId={sessionId}`)

**Related Tab**:
- Query related sessions (placeholder for now)
- Show "No related artifacts yet" empty state

**Verification**:
- Context panel can be toggled open/closed
- State persists in localStorage
- All three tabs display correct content
- Trail tab shows knowledge graph connections
- Panel is responsive (bottom sheet on mobile)

#### 2.2 Update Session Page Layout
**Files**:
- `app/dojo/[sessionId]/page.tsx`

**Tasks**:
- Refactor to two-column layout
- Add `ContextPanel` to right column
- Remove standalone `TrailOfThoughtPanel` (now in ContextPanel)
- Add mode indicator badge in header
- Add Export and Delete buttons to header
- Ensure layout is responsive

**Verification**:
- Two-column layout on desktop
- Single column with bottom sheet on mobile
- Mode badge displays current/last mode
- Export and Delete buttons are visible and functional

#### 2.3 Create Export and Delete Modals
**Files**:
- `components/dojo/SessionExportModal.tsx`
- `components/dojo/SessionDeleteDialog.tsx`
- `lib/dojo/export.ts`

**Tasks**:
- Implement export modal with options (include metadata, timestamps)
- Use `exportSessionAsMarkdown` function
- Add download as `.md` file functionality
- Implement delete confirmation dialog
- Call `deleteSession` function
- Navigate to `/dojo` after successful deletion

**Verification**:
- Export modal allows customization
- Downloaded markdown file is well-formatted
- Delete confirmation prevents accidental deletion
- User navigates to session hub after deletion

#### 2.4 Enhance DojoInput with Tips and Templates
**Files**:
- `components/dojo/DojoInput.tsx`

**Tasks**:
- Add collapsible "Tips & Examples" section
- Add character count for situation textarea
- Implement "Quick Start" dropdown menu
- Create 4-5 templates (career, project, problem, reflection)
- Template selection pre-fills situation and perspectives
- Add smooth expand/collapse animations

**Verification**:
- Tips section can be toggled
- Character count updates in real-time
- Template dropdown shows all options
- Selecting a template pre-fills fields correctly
- UI is polished and intuitive

#### 2.5 Enhance Message Display
**Files**:
- `components/dojo/ChatMessage.tsx`
- `components/dojo/SessionHistory.tsx`

**Tasks**:
- Add relative timestamp to each message
- Ensure mode badge is visible for agent responses
- Improve markdown rendering (leverage existing setup)
- Add subtle hover effects
- Ensure messages are accessible (ARIA labels)

**Verification**:
- Timestamps display in relative format ("2 minutes ago")
- Mode badges are visible for agent messages
- Markdown (bold, italic, lists, code) renders correctly
- Messages are keyboard navigable

### Phase 3: Routing, Polish, and QA (~2 hours)

#### 3.1 Verify Navigation Flow
**Tasks**:
- Test full navigation flow: `/dojo` → `/dojo/new` → `/dojo/[sessionId]` → `/dojo`
- Ensure back button behavior is correct
- Verify deep linking works (direct link to specific session)
- Test session resume (click session card on hub)

**Verification**:
- All routes load correctly
- No broken links or navigation errors
- Browser back/forward buttons work as expected

#### 3.2 Polish Animations and Transitions
**Tasks**:
- Audit all animations for consistency (200-300ms duration)
- Ensure context panel toggle is smooth
- Polish onboarding panel expand/collapse
- Add subtle hover states to interactive elements
- Test animation performance on slower devices

**Verification**:
- All animations are smooth and intentional
- No janky or laggy transitions
- Animations enhance UX without feeling overdone

#### 3.3 Accessibility Audit
**Tasks**:
- Verify keyboard navigation works throughout
- Check ARIA labels on all interactive elements
- Test with screen reader (NVDA or VoiceOver)
- Verify color contrast ratios (WCAG AA)
- Test tab order and focus management

**Verification**:
- All functionality accessible via keyboard
- Screen reader announces all important elements
- Color contrast meets WCAG AA standards
- Focus indicators are visible

#### 3.4 Run Linting and Type Checking
**Commands**:
```bash
npm run lint
npm run typecheck
# or
yarn lint
yarn typecheck
```

**Verification**:
- No lint errors
- No TypeScript errors
- All imports are correct

#### 3.5 Final QA Testing
**Test Cases**:
1. Create new session from Session Hub
2. Fill out initial situation and perspectives
3. Have a multi-turn conversation
4. Open context panel and verify all tabs
5. Export session as markdown
6. Delete session and confirm deletion
7. Test empty states (no sessions, no connections)
8. Test loading states (slow network simulation)
9. Test error states (database error simulation)
10. Test responsive design (mobile, tablet, desktop)

**Verification**:
- All test cases pass
- No console errors or warnings
- Application behaves as expected

---

## 6. Verification Approach

### 6.1 Unit Testing (Optional but Recommended)
```bash
# Test utility functions
npm run test -- lib/dojo/export.test.ts
npm run test -- lib/dojo/storage.test.ts
```

**Test Coverage**:
- `exportSessionAsMarkdown` function
- LocalStorage get/set functions
- Template data structure validation

### 6.2 Integration Testing
**Manual Testing Checklist**:
- [ ] Session Hub loads with recent sessions
- [ ] Onboarding panel displays correctly
- [ ] New session creation flow works
- [ ] Session page layout is correct
- [ ] Context panel tabs all function
- [ ] Export modal generates correct markdown
- [ ] Delete dialog confirms before deletion
- [ ] DojoInput tips and templates work
- [ ] Message display includes timestamps and mode badges
- [ ] Responsive design works on all breakpoints

### 6.3 Performance Testing
**Metrics to Monitor**:
- Initial page load time (< 2s)
- Time to interactive (< 3s)
- Context panel toggle animation (< 300ms)
- Session grid load time (< 500ms)

**Tools**:
- Chrome DevTools Lighthouse
- Network throttling (Fast 3G simulation)

### 6.4 Browser Compatibility
**Test Browsers**:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

### 6.5 Build Verification
```bash
npm run build
npm run start
# or
yarn build
yarn start
```

**Verification**:
- Build completes without errors
- Production build runs without issues
- No hydration errors in console

---

## 7. Technical Risks and Mitigations

### Risk 1: Context Panel Performance on Long Sessions
**Impact**: High  
**Probability**: Medium  
**Mitigation**: 
- Implement virtualization for message lists if > 100 messages
- Lazy load context panel content (only fetch when tab is opened)
- Add pagination to Related tab if many connections

### Risk 2: LocalStorage State Sync Issues
**Impact**: Low  
**Probability**: Low  
**Mitigation**:
- Use try-catch blocks around localStorage access
- Provide sensible defaults if localStorage is unavailable
- Test in private/incognito mode

### Risk 3: Mobile Layout Complexity
**Impact**: Medium  
**Probability**: Medium  
**Mitigation**:
- Use CSS Grid and Flexbox for responsive layouts
- Test on real devices, not just DevTools
- Consider using Radix UI Sheet component for mobile bottom sheet

### Risk 4: Markdown Export Edge Cases
**Impact**: Low  
**Probability**: Medium  
**Mitigation**:
- Handle empty sessions gracefully
- Escape special characters in markdown
- Test with sessions containing code blocks, emojis, special chars

---

## 8. Component Dependencies Graph

```
app/dojo/page.tsx
  └── DojoLandingView.tsx
        ├── OnboardingPanel.tsx
        └── ArtifactGridView.tsx (existing)

app/dojo/[sessionId]/page.tsx
  ├── SessionHistory.tsx
  │     └── ChatMessage.tsx
  │           └── ModeBadge.tsx (existing)
  ├── DojoInput.tsx (enhanced)
  ├── SimpleTextInput.tsx (existing)
  ├── ContextPanel.tsx
  │     ├── ContextPanelDetails.tsx
  │     ├── ContextPanelTrail.tsx
  │     │     └── TrailOfThoughtPanel.tsx (existing)
  │     └── ContextPanelRelated.tsx
  ├── SessionExportModal.tsx
  └── SessionDeleteDialog.tsx
```

---

## 9. Success Criteria

### 9.1 Functional Requirements
- [x] All PRD user stories are implemented
- [x] All acceptance criteria are met
- [x] No regression in existing Dojo functionality

### 9.2 Technical Requirements
- [x] TypeScript strict mode passes
- [x] ESLint passes with no errors
- [x] Build completes successfully
- [x] No console errors or warnings in production

### 9.3 UX Requirements
- [x] Loading states are smooth and informative
- [x] Error states are user-friendly with recovery options
- [x] Empty states are encouraging and actionable
- [x] Animations are subtle and purposeful (200-300ms)

### 9.4 Accessibility Requirements
- [x] WCAG AA color contrast ratios
- [x] Keyboard navigation works throughout
- [x] Screen reader compatible
- [x] Focus management is correct

### 9.5 Performance Requirements
- [x] Session Hub loads in < 2s
- [x] Context panel toggle feels instant (< 300ms)
- [x] No layout shift (CLS score < 0.1)
- [x] Lighthouse performance score > 90

---

## 10. Next Steps After Implementation

### 10.1 User Testing
- Conduct usability testing with 5-10 users
- Collect feedback on onboarding effectiveness
- Measure time to first session creation
- Track context panel usage patterns

### 10.2 Analytics Implementation
- Add event tracking for key actions:
  - Session created
  - Template used
  - Context panel opened
  - Session exported
  - Session deleted

### 10.3 Future Enhancements (Out of Scope)
- Voice input for situation and perspectives
- Session templates with custom fields
- Collaborative sessions (multiplayer)
- Advanced search with semantic matching
- Session tagging and categorization
- Favorite sessions feature

---

**Document Status**: Ready for Planning Phase  
**Next Step**: Create detailed implementation plan (`plan.md`) breaking down each phase into concrete tasks
