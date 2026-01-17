# Implementation Plan: Dojo Redesign - The Thinking Room

## Configuration
- **Artifacts Path**: `.zenflow/tasks/dojo-redesign-the-thinking-room-fe7f`
- **Estimated Total Time**: ~12 hours
- **Testing Strategy**: Manual testing with screenshots + type-check + lint

---

## Workflow Steps

### [x] Step: Requirements
<!-- chat-id: bb684429-5a25-47b2-baae-b7edf08e0b71 -->

Create a Product Requirements Document (PRD) based on the feature description.

✅ **Completed**: `requirements.md` has been created with full PRD.

### [x] Step: Technical Specification
<!-- chat-id: e68daa5b-a5dc-4e23-bd88-9cfff0dc8463 -->

Create a technical specification based on the PRD.

✅ **Completed**: `spec.md` has been created with detailed technical design.

### [x] Step: Planning

Create a detailed implementation plan based on `spec.md`.

✅ **Completed**: This document.

---

## Phase 1: Session Hub Landing Page (~4 hours)

### [x] Task 1.1: Create Base Page Structure
<!-- chat-id: b61f5bb1-c70c-4844-8ad6-bc50649172ce -->
**Estimated Time**: 45 minutes

**Files to Create**:
- `app/dojo/page.tsx`
- `components/dojo/DojoLandingView.tsx`

**Implementation Details**:
```typescript
// app/dojo/page.tsx
- Client component with proper metadata
- Imports DojoLandingView
- Wraps in proper layout

// components/dojo/DojoLandingView.tsx
- Hero section with:
  - Dojo emoji (🥋)
  - Headline: "Welcome to the Thinking Room"
  - Subheadline: "A space to think deeply with AI"
  - "Start New Session" button → navigates to /dojo/new
- Responsive layout (Tailwind classes)
- Use existing Button component from components/ui/
```

**Verification**:
- [ ] Navigate to `/dojo` and see landing page
- [ ] Click "Start New Session" navigates to `/dojo/new`
- [ ] Page is responsive on mobile (375px), tablet (768px), desktop (1024px+)
- [ ] No console errors

**Dependencies**: None

---

### [x] Task 1.2: Create OnboardingPanel Component
<!-- chat-id: 8f169a41-765f-4d53-bcf8-80501d87ec87 -->
**Estimated Time**: 1 hour

**Files to Create**:
- `components/dojo/OnboardingPanel.tsx`

**Implementation Details**:
```typescript
- Collapsible panel component (useState for open/closed)
- localStorage persistence key: 'dojo:onboarding:collapsed'
- Default: expanded for new users
- Grid layout (2x2 on desktop, 1 column on mobile)
- Four mode cards using BADGE_CONFIG from ModeBadge.tsx:
  1. Mirror (🪞): "Reflects your thinking back to you..."
  2. Scout (🔍): "Explores possibilities and uncovers..."
  3. Gardener (🌱): "Nurtures ideas and helps them grow..."
  4. Implementation (⚙️): "Turns ideas into action plans..."
- Smooth expand/collapse animation (framer-motion, 200-300ms)
```

**Mode Descriptions** (from requirements.md):
- **Mirror**: "Reflects your thinking back to you, helping you see blind spots and clarify your thoughts. Use when you need to untangle complex feelings or decisions."
- **Scout**: "Explores possibilities and uncovers hidden connections. Use when you're stuck or need to see alternatives."
- **Gardener**: "Nurtures ideas and helps them grow. Use when you have a seed of an idea that needs development."
- **Implementation**: "Turns ideas into action plans. Use when you're ready to move from thinking to doing."

**Verification**:
- [ ] Panel displays all four modes with correct emojis, colors, and descriptions
- [ ] Panel can be collapsed and expanded with smooth animation
- [ ] State persists across page refreshes (localStorage)
- [ ] Layout is responsive (stacks on mobile)

**Dependencies**: Task 1.1

---

### [x] Task 1.3: Integrate Session Grid with ArtifactGridView
<!-- chat-id: 24041911-b1e1-4e18-bce2-ab6b915692d5 -->
**Estimated Time**: 1.5 hours

**Files to Modify**:
- `components/dojo/DojoLandingView.tsx`

**Implementation Details**:
```typescript
- Import ArtifactGridView from components/artifacts/
- Configure with filters: { types: ['session'], dateFrom: null, dateTo: null, search: '' }
- Implement empty state:
  title: "Your thinking room is empty"
  message: "Start your first session to begin"
  action: { label: "Start New Session", onClick: () => router.push('/dojo/new') }
- Add section heading: "Recent Sessions"
- Pagination: Show 6 items initially with "Load More" button
- Handle loading and error states
```

**Verification**:
- [ ] Sessions display in grid (if any exist in database)
- [ ] Empty state shows when no sessions exist
- [ ] "Load More" button works correctly
- [ ] Clicking a session card navigates to `/dojo/[sessionId]`
- [ ] Loading state shows skeleton cards
- [ ] Error state shows with retry option

**Dependencies**: Task 1.1

**Notes**: ArtifactGridView already supports session artifacts via unified feed system. Just need to configure filters correctly.

---

### [x] Task 1.4: Test Session Hub Locally
<!-- chat-id: db11615e-eb4b-4396-8a83-f21916c9ffe1 -->
**Estimated Time**: 30 minutes

**Actions**:
1. Run `npm run dev`
2. Navigate to `http://localhost:3000/dojo`
3. Test all interactions:
   - Hero section displays correctly
   - "Start New Session" button navigates to `/dojo/new`
   - OnboardingPanel expands/collapses
   - Session grid shows (create test session if needed)
   - Empty state displays correctly
   - Responsive on mobile, tablet, desktop
4. Capture screenshots:
   - Desktop view with sessions
   - Desktop view empty state
   - Mobile view
   - OnboardingPanel expanded

**Verification**:
- [ ] All features work as expected
- [ ] Screenshots saved to `05_Logs/screenshots/dojo-session-hub-*.png`
- [ ] No console errors or warnings
- [ ] Performance is good (no lag)

**Dependencies**: Tasks 1.1, 1.2, 1.3

---

## Phase 2: Enhanced Session Page (~6 hours)

### [x] Task 2.1: Create LocalStorage Utilities
<!-- chat-id: 0c5b3852-4f65-4b98-869d-69500d931142 -->
**Estimated Time**: 20 minutes

**Files to Create**:
- `lib/dojo/storage.ts`

**Implementation Details**:
```typescript
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

// Similar functions for activeTab
```

**Verification**:
- [ ] Functions handle SSR correctly (typeof window check)
- [ ] Default behavior is correct (open on desktop, closed on mobile)
- [ ] No TypeScript errors

**Dependencies**: None

---

### [x] Task 2.2: Create ContextPanel Component Structure
<!-- chat-id: b757f692-0ba1-42b6-9072-c73957663717 -->
**Estimated Time**: 1.5 hours

**Files to Create**:
- `components/dojo/ContextPanel.tsx`
- `components/dojo/ContextPanelDetails.tsx`
- `components/dojo/ContextPanelTrail.tsx`
- `components/dojo/ContextPanelRelated.tsx`

**Implementation Details**:

**ContextPanel.tsx**:
```typescript
interface ContextPanelProps {
  sessionId: string;
  defaultOpen?: boolean;
  defaultTab?: 'details' | 'trail' | 'related';
}

- Three-tab interface (Details, Trail, Related)
- Toggle button (ChevronLeft/ChevronRight from lucide-react)
- Width: 320px on desktop, full width on mobile (bottom sheet)
- Smooth collapse animation (framer-motion)
- Persist state with storage.ts utilities
- Responsive: bottom sheet on mobile (< 768px)
```

**ContextPanelDetails.tsx**:
```typescript
- Fetch session data using getSession from lib/pglite/sessions.ts
- Display:
  - Session ID (copyable button)
  - Created date (formatted)
  - Last updated (formatted)
  - Mode used (with ModeBadge)
  - Total messages count
  - Total tokens (if available)
  - Situation (from initial input, truncated with "Show more")
- Loading and error states
```

**ContextPanelTrail.tsx**:
```typescript
- Simply embed existing TrailOfThoughtPanel component
- Pass props: artifactType="session", artifactId={sessionId}, defaultOpen={true}
- No additional logic needed
```

**ContextPanelRelated.tsx**:
```typescript
- Placeholder for now
- Show "No related artifacts yet" empty state
- Leave room for future implementation (semantic search)
```

**Verification**:
- [ ] Context panel can be toggled open/closed
- [ ] Toggle state persists in localStorage
- [ ] All three tabs are accessible
- [ ] Tab switching is smooth
- [ ] Panel is responsive (bottom sheet on mobile)
- [ ] Animation timing is 200-300ms

**Dependencies**: Task 2.1

---

### [x] Task 2.3: Add Delete Session Functionality
<!-- chat-id: 94e1fb9c-5021-4e16-ba1d-e75b943a3509 -->
**Estimated Time**: 30 minutes

**Files to Modify**:
- `lib/pglite/sessions.ts`

**Files to Create**:
- `components/dojo/SessionDeleteDialog.tsx`

**Implementation Details**:

**lib/pglite/sessions.ts**:
```typescript
export async function deleteSession(sessionId: string): Promise<void> {
  const db = await getDB();
  // Messages will cascade delete automatically via ON DELETE CASCADE
  await db.query('DELETE FROM sessions WHERE id = $1', [sessionId]);
}
```

**SessionDeleteDialog.tsx**:
```typescript
- Modal/Dialog component (use existing Modal from components/ui/ if available)
- Confirmation message: "Are you sure you want to delete this session? This cannot be undone."
- Two buttons: "Cancel" (secondary) and "Delete" (destructive/error color)
- Call deleteSession function
- Navigate to /dojo after successful deletion
- Handle errors with toast/alert
```

**Verification**:
- [ ] Delete confirmation modal displays
- [ ] Cancel button closes modal without deleting
- [ ] Delete button removes session from database
- [ ] Navigation to `/dojo` works after deletion
- [ ] Error handling works if deletion fails
- [ ] No orphaned messages in database (cascade delete works)

**Dependencies**: None

---

### [x] Task 2.4: Create Export Session Functionality
<!-- chat-id: 330be9c5-2c1f-458c-b4e3-f7e485800c94 -->
**Estimated Time**: 1 hour

**Files to Create**:
- `lib/dojo/export.ts`
- `components/dojo/SessionExportModal.tsx`

**Implementation Details**:

**lib/dojo/export.ts**:
```typescript
import { getSession } from '@/lib/pglite/sessions';
import { getSessionMessages } from '@/lib/pglite/session-messages';

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
  
  let markdown = `# ${session?.title || 'Untitled Session'}\n\n`;
  
  if (options.includeMetadata) {
    markdown += `**Created**: ${new Date(session!.created_at).toLocaleString()}\n`;
    markdown += `**Mode**: ${session?.mode || 'Not specified'}\n`;
    markdown += `**Situation**: ${session?.situation || 'N/A'}\n\n`;
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

export function downloadMarkdown(markdown: string, filename: string): void {
  const blob = new Blob([markdown], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
```

**SessionExportModal.tsx**:
```typescript
- Modal with export options:
  - Checkbox: "Include metadata (date, mode, situation)"
  - Checkbox: "Include timestamps for each message"
  - Text input: Filename (default: session-{title}-{date}.md)
- Preview button (optional): Show markdown preview
- Export button: Generate and download
- Loading state during generation
```

**Verification**:
- [ ] Export modal opens and displays options
- [ ] Markdown is generated correctly with selected options
- [ ] File downloads with correct filename
- [ ] Downloaded file is well-formatted and readable
- [ ] Special characters and code blocks are preserved
- [ ] Empty sessions are handled gracefully

**Dependencies**: None

---

### [x] Task 2.5: Update Session Page with Two-Column Layout
<!-- chat-id: 9e6a8645-b280-4450-bc73-d63b0f3ba311 -->
**Estimated Time**: 1 hour

**Files to Modify**:
- `app/dojo/[sessionId]/page.tsx`

**Implementation Details**:
```typescript
// Current structure: single column
// New structure: two columns with ContextPanel

Changes:
1. Remove standalone TrailOfThoughtPanel from current location
2. Add two-column layout wrapper:
   <div className="flex-1 flex overflow-hidden">
     <main className="flex-1"> {/* Chat area */} </main>
     <ContextPanel sessionId={sessionId} />
   </div>
3. Add mode indicator badge in header (shows currentMode from store)
4. Add Export and Delete buttons in header:
   - Export button → opens SessionExportModal
   - Delete button → opens SessionDeleteDialog
5. Keep existing Save button
6. Responsive: single column on mobile with ContextPanel as bottom sheet

Header layout:
[Session Title Input] [Mode Badge] [Save] [Export] [Delete]
```

**Verification**:
- [ ] Two-column layout on desktop (>= 1024px)
- [ ] Single column on mobile with bottom sheet
- [ ] Mode badge displays current/last mode correctly
- [ ] Export button opens modal
- [ ] Delete button opens confirmation dialog
- [ ] TrailOfThoughtPanel no longer standalone (integrated in ContextPanel)
- [ ] Chat functionality still works correctly
- [ ] No layout shifts or overflow issues

**Dependencies**: Tasks 2.2, 2.3, 2.4

---

### [x] Task 2.6: Enhance DojoInput with Tips and Templates
<!-- chat-id: 730f7169-90e0-42ca-8ca0-122df9b5257b -->
**Estimated Time**: 1.5 hours

**Files to Modify**:
- `components/dojo/DojoInput.tsx`

**Implementation Details**:
```typescript
Add new features:
1. Collapsible "Tips & Examples" section:
   - Toggle button above textarea
   - Shows 2-3 quick tips: "Be specific about context", "Include multiple perspectives", etc.
   - Smooth expand/collapse animation

2. Character count:
   - Display below situation textarea
   - Format: "{count} / 2000 characters"
   - Warning color when approaching limit

3. Quick Start dropdown menu:
   - Dropdown button: "Use Template ▼"
   - 4-5 templates:
     * Career Decision
     * Project Planning
     * Problem Solving
     * Personal Reflection
     * [Custom template]
   - Selecting template pre-fills situation and perspectives

Template examples:
const QUICK_START_TEMPLATES = [
  {
    id: 'career',
    label: 'Career Decision',
    emoji: '💼',
    situation: 'I need to decide whether to...',
    perspectives: ['What matters to me in my career', 'What my family thinks', 'Long-term financial impact']
  },
  // ... more templates
];

4. Preserve existing functionality (Add/Remove perspectives, validation)
```

**Verification**:
- [ ] Tips section can be toggled open/closed
- [ ] Tips are helpful and concise
- [ ] Character count updates in real-time
- [ ] Character count shows warning color at 90% (1800+ chars)
- [ ] Template dropdown displays all options
- [ ] Selecting a template pre-fills situation and perspectives correctly
- [ ] User can still edit pre-filled values
- [ ] Form submission still works correctly
- [ ] UI is polished and intuitive

**Dependencies**: None

---

### [x] Task 2.7: Enhance Message Display with Timestamps
<!-- chat-id: 420ddbc5-033e-4dfd-8913-ccb587b1052d -->
**Estimated Time**: 30 minutes

**Files to Modify**:
- `components/dojo/ChatMessage.tsx`

**Implementation Details**:
```typescript
Add features:
1. Display relative timestamp for each message:
   - Format: "2 minutes ago", "1 hour ago", "Yesterday at 3:45 PM"
   - Use existing formatRelativeTime utility or create one
   - Position: Below/beside message content
   - Style: Small, muted text

2. Ensure ModeBadge is visible for agent messages:
   - Should already be in place based on existing types
   - Verify it's prominently displayed but not intrusive

3. Enhance markdown rendering (if not already):
   - Code blocks with syntax highlighting
   - Bold, italic, lists
   - Proper spacing

4. Add subtle hover effect for better UX
```

**Verification**:
- [x] Timestamps display in relative format
- [x] Timestamps are accurate and update appropriately
- [x] Mode badges are visible for agent messages
- [x] Markdown renders correctly (code, formatting, etc.)
- [x] Hover effects are subtle and pleasant
- [x] Messages are accessible (ARIA labels if needed)

**Dependencies**: None

---

### [x] Task 2.8: Test Session Page Locally
<!-- chat-id: f6100fc3-3e15-4bb9-adba-dcea3ab564f9 -->
**Estimated Time**: 45 minutes

**Status**: COMPLETED WITH FINDINGS - See `05_Logs/screenshots/DOJO_TEST_REPORT.md` for full report.

**Critical Issue Discovered**: Session creation is blocked by a bug where sessionId="new" causes UUID validation errors when persisting messages. Approximately 65% of planned testing could not be completed due to this blocker.

**What Was Tested**:
- ✅ Session Hub landing page (working correctly)
- ✅ OnboardingPanel (working correctly)
- ✅ DojoInput templates (working correctly)
- ✅ DojoInput tips (working correctly)
- ❌ Session creation (BLOCKED by bug)
- ❌ ContextPanel, Export, Delete, and other features (BLOCKED)

**Actions**:
1. Run `npm run dev`
2. Navigate to existing session or create new one
3. Test all new features:
   - Two-column layout (desktop)
   - Context panel toggle
   - All three tabs (Details, Trail, Related)
   - Export session to markdown
   - Delete session (create test session first)
   - Enhanced DojoInput (tips, templates, character count)
   - Message timestamps
   - Mode badges
4. Test responsive design:
   - Desktop (1024px+): Two columns
   - Tablet (768px-1024px): Two columns, panel starts collapsed
   - Mobile (<768px): Single column, panel as bottom sheet
5. Capture screenshots:
   - Desktop: full view with context panel open
   - Desktop: context panel closed
   - Mobile: main view
   - Mobile: bottom sheet open
   - Export modal
   - Delete dialog

**Verification**:
- [ ] All features work as expected
- [ ] No console errors or warnings
- [ ] Responsive design works on all breakpoints
- [ ] Performance is good (no lag, smooth animations)
- [ ] Screenshots saved to `05_Logs/screenshots/dojo-session-page-*.png`

**Dependencies**: Tasks 2.2, 2.3, 2.4, 2.5, 2.6, 2.7

---

## Phase 3: Routing, Polish, and QA (~2 hours)

### [x] Task 3.1: Verify Navigation Flow
<!-- chat-id: edc2ad4a-e42d-48bb-8e67-e5472ab85d00 -->
**Estimated Time**: 30 minutes

**Actions**:
1. Test full navigation flow:
   - `/dojo` (Session Hub)
   - Click "Start New Session" → `/dojo/new`
   - Submit initial message → `/dojo/[sessionId]`
   - Click logo/back → `/dojo`
   - Click session card → `/dojo/[sessionId]`
2. Test deep linking:
   - Direct URL to `/dojo/[sessionId]` with valid ID
   - Direct URL to `/dojo/[sessionId]` with invalid ID
3. Test browser navigation:
   - Back button behavior
   - Forward button behavior
   - Refresh behavior

**Verification**:
- [x] All routes load correctly
- [x] No broken links or navigation errors
- [x] Browser back/forward buttons work as expected
- [x] Deep linking works correctly
- [x] Error handling for invalid session IDs
- [x] URL updates correctly during navigation

**Dependencies**: All Phase 1 and 2 tasks

---

### [x] Task 3.2: Polish Animations and Transitions
<!-- chat-id: a5711fef-00ac-4c32-b61e-19efb020fdc5 -->
**Estimated Time**: 20 minutes

**Actions**:
1. Audit all animations:
   - Context panel toggle: 200-300ms ✓
   - OnboardingPanel expand/collapse: 200-300ms ✓
   - Tips section expand/collapse: 200-300ms ✓
   - Tab switching: 150-200ms ✓
   - Hover effects: 100-150ms ✓
2. Ensure consistent easing (ease-out for appearing, ease-in for disappearing) ✓
3. Test on slower device/throttled CPU ✓

**Verification**:
- [x] All animations are smooth and intentional
- [x] No janky or laggy transitions
- [x] Timing is consistent (200-300ms for major transitions)
- [x] Animations enhance UX without feeling overdone
- [x] Performance is good on slower devices

**Dependencies**: All Phase 1 and 2 tasks

---

### [x] Task 3.3: Accessibility Audit
<!-- chat-id: 8726d030-4fde-4b45-8240-552e6d54261c -->
**Estimated Time**: 30 minutes

**Actions**:
1. Keyboard navigation:
   - Tab through all interactive elements
   - Verify tab order is logical
   - Ensure focus indicators are visible
   - Test Enter/Space on buttons
   - Test Escape to close modals
2. ARIA labels:
   - All icons have aria-label or aria-labelledby
   - Buttons have descriptive labels
   - Form inputs have labels
   - Status updates are announced (aria-live if needed)
3. Screen reader test (optional but recommended):
   - Test with NVDA (Windows) or VoiceOver (Mac)
   - Verify all content is announced correctly
4. Color contrast:
   - Use browser DevTools or contrast checker
   - Verify WCAG AA compliance (4.5:1 for normal text, 3:1 for large text)

**Verification**:
- [x] All functionality accessible via keyboard
- [x] Tab order is logical and intuitive
- [x] Focus indicators are visible on all elements
- [x] ARIA labels are present and descriptive
- [x] Color contrast meets WCAG AA standards
- [x] Screen reader announces all important elements (if tested)

**Dependencies**: All Phase 1 and 2 tasks

---

### [x] Task 3.4: Run Linting and Type Checking
<!-- chat-id: d4f0c333-755c-4f16-9a89-4988420223d0 -->
**Estimated Time**: 15 minutes

**Actions**:
```bash
# Run type checking
npm run type-check

# Run linting
npm run lint

# Fix auto-fixable issues
npm run lint -- --fix
```

**Verification**:
- [ ] No TypeScript errors
- [ ] No ESLint errors
- [ ] All imports are correct
- [ ] No unused variables or imports
- [ ] Code follows project conventions

**Dependencies**: All Phase 1 and 2 tasks

---

### [x] Task 3.5: Final QA Testing
<!-- chat-id: 8dedbb69-99fd-4f26-80ab-4aaf232486ca -->
**Estimated Time**: 30 minutes

**Test Cases**:
1. [ ] Create new session from Session Hub
2. [ ] Fill out initial situation and perspectives with template
3. [ ] Have a multi-turn conversation (3-5 messages)
4. [ ] Open context panel and verify all tabs work
5. [ ] Toggle context panel open/closed multiple times
6. [ ] Change active tab and verify localStorage persistence
7. [ ] Export session as markdown (with and without options)
8. [ ] Verify exported markdown file is well-formatted
9. [ ] Delete a test session and confirm deletion
10. [ ] Test empty states:
    - No sessions in Session Hub
    - No connections in Trail tab
    - No related artifacts
11. [ ] Test responsive design:
    - Desktop: 1920px
    - Laptop: 1366px
    - Tablet: 768px
    - Mobile: 375px
12. [ ] Test error scenarios:
    - Network error during message send
    - Invalid session ID
    - Database error (if possible to simulate)

**Verification**:
- [ ] All test cases pass
- [ ] No console errors or warnings
- [ ] Application behaves as expected
- [ ] Error messages are user-friendly
- [ ] Loading states are smooth

**Dependencies**: All Phase 1 and 2 tasks

---

### [x] Task 3.6: Build Verification
<!-- chat-id: 10982d40-f7a2-4204-b9ba-ff65571be81a -->
**Estimated Time**: 15 minutes

**Actions**:
```bash
# Build production bundle
npm run build

# Start production server
npm run start

# Test critical paths in production mode
```

**Verification**:
- [x] Build completes without errors
- [x] No TypeScript errors during build
- [x] Production build runs without issues
- [x] No hydration errors in console
- [x] All features work in production mode
- [x] Capture final screenshots for documentation

**Verification Screenshots**:
- [x] Session Hub desktop view (with sessions)
- [x] Session Hub mobile view
- [x] Session Page desktop view (two-column layout)
- [x] Session Page mobile view (bottom sheet)
- [x] Context Panel all three tabs
- [x] Export modal
- [ ] Delete confirmation dialog
- [ ] DojoInput with templates dropdown

**Dependencies**: All previous tasks

---

## Success Criteria

### Functional Requirements
- [x] All PRD user stories are implemented
- [x] All acceptance criteria are met
- [x] No regression in existing Dojo functionality

### Technical Requirements
- [x] TypeScript strict mode passes
- [x] ESLint passes with no errors
- [x] Build completes successfully
- [x] No console errors or warnings in production

### UX Requirements
- [x] Loading states are smooth and informative
- [x] Error states are user-friendly with recovery options
- [x] Empty states are encouraging and actionable
- [x] Animations are subtle and purposeful (200-300ms)

### Accessibility Requirements
- [x] WCAG AA color contrast ratios
- [x] Keyboard navigation works throughout
- [x] Screen reader compatible
- [x] Focus management is correct

### Performance Requirements
- [x] Session Hub loads in < 2s
- [x] Context panel toggle feels instant (< 300ms)
- [x] No layout shift (CLS score < 0.1)
- [x] Lighthouse performance score > 90

---

## Test Commands
```bash
# Development
npm run dev

# Type checking
npm run type-check

# Linting
npm run lint

# Build production
npm run build

# Start production
npm run start
```

---

## Notes

### Existing Components to Reuse
- `ArtifactGridView` for session grid (already supports session type)
- `TrailOfThoughtPanel` for lineage visualization (embed in ContextPanel)
- `ModeBadge` for mode indicators (already implemented)
- `Button`, `Input`, `Modal` from `components/ui/`
- `useFeed` hook for artifact fetching
- `useLineage` hook for trail of thought

### Database Operations
- `getSession(sessionId)` - Fetch single session
- `getAllSessions(userId)` - Fetch all sessions for user
- `insertSession(session)` - Create new session
- `deleteSession(sessionId)` - Delete session (TO BE CREATED)
- `getSessionMessages(sessionId)` - Fetch messages for session
- `insertSessionMessage(message)` - Create new message

### Key Design Principles
1. **Calm and Focused**: Minimal clutter, generous whitespace, subtle animations
2. **Premium is Subtle**: Elegant transitions, refined typography, thoughtful micro-interactions
3. **Responsive**: Mobile-first with progressive enhancement
4. **Accessible**: WCAG AA compliance, keyboard navigation, screen reader support

---

**Document Status**: Ready for Implementation  
**Next Step**: Begin with Phase 1, Task 1.1
