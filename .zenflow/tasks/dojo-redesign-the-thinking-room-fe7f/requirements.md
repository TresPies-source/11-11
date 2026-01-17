# Product Requirements Document: Dojo Redesign - The Thinking Room

**Version:** 1.0  
**Date:** 2026-01-16  
**Status:** Approved for Implementation

---

## 1. Executive Summary

### 1.1 Vision
Transform the Dojo from a functional chat interface into a world-class "Thinking Room" that serves as one of the two core pillars of the 11-11 platform. The redesigned experience will provide a welcoming entry point, clear onboarding, session management, and an immersive thinking environment.

### 1.2 Problem Statement
The current Dojo implementation has four critical UX gaps:

1. **No Landing Page**: Users are thrown directly into `/dojo/new` with no context or ability to see past sessions
2. **Weak Onboarding**: The welcome message doesn't explain the unique value of the four Dojo modes (Mirror, Scout, Gardener, Implementation)
3. **No Session Management**: No way to browse, search, rename, delete, or resume past sessions
4. **Limited Context Awareness**: The session page lacks contextual information and relationship visualization

### 1.3 Solution Overview
Create a two-page experience:
- **Page 1**: `/dojo` - The Session Hub (landing page with session management)
- **Page 2**: `/dojo/[sessionId]` - The Session Page (redesigned with two-column layout and context panel)

---

## 2. User Stories

### 2.1 New User Experience
**As a new user**, I want to:
- Understand what the Dojo is and what makes it unique when I first visit
- Learn about the four thinking modes (Mirror, Scout, Gardener, Implementation) before starting
- See examples of good situations and perspectives
- Start my first session with confidence

**Acceptance Criteria**:
- Landing page includes a clear value proposition
- OnboardingPanel displays all four modes with icons, descriptions, and visual examples
- "Start New Session" button is prominent and inviting
- First-time visitors see helpful guidance

### 2.2 Returning User Experience
**As a returning user**, I want to:
- See my recent sessions when I visit `/dojo`
- Resume a previous conversation without losing context
- Search for past sessions by title or content
- Delete sessions I no longer need

**Acceptance Criteria**:
- Recent sessions are displayed in a grid using ArtifactGridView
- Each session card shows title, timestamp, and content preview
- Sessions are clickable to resume
- Search functionality filters sessions in real-time

### 2.3 Session Interaction
**As an active user**, I want to:
- See which mode the Dojo agent is using for each response
- Understand how my current session connects to my knowledge graph
- Access session metadata (mode, situation, created date)
- Get contextual help while formulating my situation and perspectives

**Acceptance Criteria**:
- ModeBadge is displayed for each AI response
- ContextPanel shows session details, trail of thought, and related artifacts
- DojoInput includes inline examples and tips
- TrailOfThoughtPanel is integrated into the ContextPanel

### 2.4 Session Management
**As a user**, I want to:
- Save my session with a meaningful title
- Export my session for external use
- Delete sessions I no longer need
- See session statistics (message count, tokens used)

**Acceptance Criteria**:
- Header includes Save, Export, and Delete actions
- Save modal allows custom title editing
- Delete confirmation prevents accidental deletion
- Session stats are visible in the Details tab

---

## 3. Functional Requirements

### 3.1 Phase 1: The Session Hub (`/dojo`)

#### 3.1.1 Page Structure
- **Hero Section**
  - Dojo emoji (🥋) as the icon
  - Headline: "Welcome to the Thinking Room"
  - Subheadline explaining the Dojo's purpose
  - "Start New Session" button (primary CTA)

- **Recent Sessions Grid**
  - Use existing `ArtifactGridView` component
  - Filter by type='session'
  - Display 6 sessions initially with "Load More" pagination
  - Each card shows:
    - Session title (default: "Untitled Session")
    - Created date (relative time)
    - First message preview (truncated)
    - Quick actions: Resume, Delete

- **OnboardingPanel Component**
  - Collapsible section (default: expanded for new users, collapsed for returning users)
  - Title: "Four Ways to Think"
  - Four mode cards, each with:
    - Icon (emoji from ModeBadge config)
    - Mode name
    - Brief description (2-3 sentences)
    - Example use case

#### 3.1.2 Mode Descriptions
- **Mirror** (🪞): "Reflects your thinking back to you, helping you see blind spots and clarify your thoughts. Use when you need to untangle complex feelings or decisions."
- **Scout** (🔍): "Explores possibilities and uncovers hidden connections. Use when you're stuck or need to see alternatives."
- **Gardener** (🌱): "Nurtures ideas and helps them grow. Use when you have a seed of an idea that needs development."
- **Implementation** (⚙️): "Turns ideas into action plans. Use when you're ready to move from thinking to doing."

#### 3.1.3 Routing
- Navigating to `/dojo` loads `app/dojo/page.tsx`
- "Start New Session" navigates to `/dojo/new`
- Clicking a session card navigates to `/dojo/[sessionId]`

#### 3.1.4 Empty State
- Show when user has no sessions
- Display encouraging message: "Your thinking room is empty. Start your first session to begin."
- Single "Start New Session" button

### 3.2 Phase 2: The Session Page (`/dojo/[sessionId]`)

#### 3.2.1 Layout Structure
```
┌─────────────────────────────────────────────────────────────────┐
│                          Header                                  │
│  [Session Title Input] [Mode Indicator] [Save] [Export] [Delete]│
├─────────────────────────────────┬───────────────────────────────┤
│                                 │                               │
│        Main Chat Area           │      Context Panel            │
│   (SessionHistory + Input)      │  [Details│Trail│Related]      │
│                                 │                               │
│                                 │  - Collapsible                │
│                                 │  - Three tabs                 │
│                                 │  - Default: collapsed         │
│                                 │                               │
└─────────────────────────────────┴───────────────────────────────┘
```

#### 3.2.2 Header Enhancements
- **Left Section**: Editable session title (existing)
- **Center Section**: Mode indicator badge (NEW)
  - Shows current/last used mode
  - Small, non-intrusive
- **Right Section**: Action buttons (enhanced)
  - Save (existing)
  - Export (NEW) - exports as markdown
  - Delete (NEW) - with confirmation dialog

#### 3.2.3 Context Panel Component (`components/dojo/ContextPanel.tsx`)
**Location**: Right column, collapsible

**Three Tabs**:

1. **Details Tab**
   - Session ID (copyable)
   - Created date
   - Last updated
   - Mode used
   - Total messages
   - Total tokens (if available)
   - Situation (from initial input)

2. **Trail Tab**
   - Embeds existing `TrailOfThoughtPanel` component
   - Shows knowledge graph connections
   - Displays related seeds, prompts, and sessions

3. **Related Tab**
   - Shows similar sessions (based on situation similarity)
   - Shows referenced seeds or prompts
   - "No related artifacts yet" empty state

**Behavior**:
- Default: collapsed on mobile, expanded on desktop
- Toggle button with icon (ChevronLeft/ChevronRight)
- Width: 320px on desktop
- Persists state in localStorage

#### 3.2.4 Enhanced Message Display
Update `SessionHistory.tsx` and `ChatMessage.tsx`:
- Display `ModeBadge` for each AI response (already supported by types)
- Show timestamp for each message (relative time)
- Enable markdown rendering with code syntax highlighting
- Add copy button for code blocks
- Show "thinking" indicator while agent is responding

#### 3.2.5 Enhanced Input Experience
Update `DojoInput.tsx`:
- Add collapsible "Tips" section with examples
- Show character count for situation
- Add "Quick Start" dropdown with templates:
  - "Career decision"
  - "Project planning"
  - "Problem solving"
  - "Personal reflection"
- Template selection pre-fills situation and perspectives

### 3.3 Phase 3: Routing and Cleanup

#### 3.3.1 Navigation Flow
```
/dojo (Session Hub)
  ↓ Click "Start New Session"
/dojo/new (Empty Session Page)
  ↓ Submit initial message
/dojo/[sessionId] (Active Session Page)
  ↓ Click "Back" or logo
/dojo (Session Hub)
```

#### 3.3.2 Existing Component Updates
- **DojoInput**: Add inline examples and tips (Phase 2)
- **SessionHistory**: Add mode badges and timestamps (Phase 2)
- **TrailOfThoughtPanel**: Integrate into ContextPanel (Phase 2)
- **SaveSessionModal**: Keep as-is (already functional)

#### 3.3.3 New Components to Create
1. `app/dojo/page.tsx` - Session Hub page
2. `components/dojo/DojoLandingView.tsx` - Main landing view
3. `components/dojo/OnboardingPanel.tsx` - Mode explanation panel
4. `components/dojo/ContextPanel.tsx` - Session context sidebar
5. `components/dojo/SessionExportDialog.tsx` - Export modal (optional enhancement)

---

## 4. Non-Functional Requirements

### 4.1 Performance
- Session Hub should load recent sessions within 500ms
- ArtifactGridView pagination should be smooth
- Context Panel toggle should be instant (< 100ms)
- Session search should filter in real-time (< 200ms debounce)

### 4.2 Accessibility
- All interactive elements must be keyboard navigable
- ARIA labels for all icons and actions
- Color contrast ratios must meet WCAG AA standards
- Screen reader support for mode badges and status updates

### 4.3 Responsive Design
- Mobile: Single column layout, context panel becomes bottom sheet
- Tablet: Two-column with collapsible context panel
- Desktop: Two-column with expanded context panel by default

### 4.4 Data Persistence
- Sessions are persisted to PGlite database using existing schema
- Messages use `session_messages` table (already implemented)
- Context panel state persists in localStorage
- Session list fetches from database using existing feed system

---

## 5. Design Principles

### 5.1 Calm and Focused
- Minimal clutter, generous whitespace
- Neutral color palette from 11-11 brand guide
- Smooth, subtle animations (200-300ms)
- No distracting elements during thinking

### 5.2 Premium is Subtle
- Elegant transitions (framer-motion)
- Refined typography
- Thoughtful micro-interactions
- High-quality empty states

### 5.3 Open and Free
- No paywalls or upgrade prompts
- All features available to all users
- Clear, honest communication

### 5.4 Agent-Native
- Mode badges are prominent but non-intrusive
- AI responses are clearly differentiated from user messages
- Thinking process is transparent (via Trail of Thought)
- Agent's reasoning is accessible in context panel

---

## 6. Technical Constraints

### 6.1 Existing Architecture
- **Database**: PGlite with existing `sessions` and `session_messages` tables
- **State Management**: Zustand stores (dojo.store.ts)
- **Routing**: Next.js App Router
- **Styling**: Tailwind CSS with design tokens
- **Components**: React with TypeScript

### 6.2 Reusable Components
Must leverage:
- `ArtifactGridView` for session grid
- `TrailOfThoughtPanel` for knowledge lineage
- `ModeBadge` for mode indicators
- `Button`, `Input`, `Modal` from UI library
- `useFeed` hook for artifact fetching
- `useLineage` hook for trail of thought

### 6.3 Database Schema
Session table fields (from `SessionRow`):
```typescript
{
  id: string;
  user_id: string;
  title: string | null;
  mode: DojoMode | null;
  situation: string | null;
  total_tokens: number;
  total_cost_usd: number;
  created_at: string;
  updated_at: string;
}
```

Message table fields (from `SessionMessage`):
```typescript
{
  id: string;
  session_id: string;
  role: 'user' | 'agent';
  content: string;
  mode?: DojoMode;
  timestamp: string;
  metadata?: Record<string, any>;
  created_at: string;
}
```

---

## 7. Out of Scope (Future Enhancements)

### 7.1 Not in This Phase
- Real-time collaboration on sessions
- Voice input for situation and perspectives
- Session templates with custom fields
- Advanced search with semantic matching
- Session tagging and categorization
- Favorite sessions
- Session sharing via public links
- Analytics dashboard for thinking patterns
- Integration with external tools (Notion, etc.)

### 7.2 Potential Future Features
- Multi-agent sessions (different agents in conversation)
- Branching conversations (explore alternative paths)
- Session replay (step through conversation history)
- Export to various formats (PDF, DOCX)
- Session merging (combine related sessions)

---

## 8. Success Metrics

### 8.1 User Engagement
- **Primary**: Number of sessions created per user per week
- **Secondary**: Session length (number of messages)
- **Tertiary**: Return rate to previous sessions

### 8.2 User Experience
- **Onboarding**: % of users who start a session after viewing onboarding
- **Navigation**: % of users who navigate between Session Hub and sessions
- **Context Panel**: % of sessions where context panel is opened

### 8.3 Technical Performance
- **Load Time**: Time to interactive for Session Hub < 2s
- **Search Performance**: Session search completes < 500ms
- **Error Rate**: < 1% of session operations fail

---

## 9. Risks and Mitigations

### 9.1 Technical Risks
| Risk | Impact | Mitigation |
|------|--------|------------|
| Session load performance degradation with many sessions | High | Implement proper pagination (already exists in ArtifactGridView) |
| Context panel causes layout issues on small screens | Medium | Use responsive design with bottom sheet on mobile |
| TrailOfThoughtPanel integration breaks existing functionality | Medium | Keep existing component intact, only embed it |

### 9.2 UX Risks
| Risk | Impact | Mitigation |
|------|--------|------------|
| Onboarding panel is ignored by users | Low | Make collapsible and track engagement |
| Context panel is distracting during thinking | Medium | Default to collapsed, easy toggle |
| Two-column layout feels cramped | Medium | Test multiple viewport sizes, adjust breakpoints |

---

## 10. Dependencies

### 10.1 Internal Dependencies
- Existing session persistence system (✓ exists)
- ArtifactGridView component (✓ exists)
- TrailOfThoughtPanel component (✓ exists)
- ModeBadge component (✓ exists)
- Feed system with session support (✓ exists)

### 10.2 External Dependencies
- None (all features use existing tech stack)

---

## 11. Implementation Phases

### Phase 1: The Session Hub (~4 hours)
1. Create `/dojo/page.tsx`
2. Create `DojoLandingView.tsx` component
3. Create `OnboardingPanel.tsx` component
4. Integrate `ArtifactGridView` with session filters
5. Test navigation and session loading

### Phase 2: The Session Page (~6 hours)
1. Create `ContextPanel.tsx` with three tabs
2. Update session page layout to two-column
3. Enhance `SessionHistory` with mode badges
4. Update `DojoInput` with tips and examples
5. Add Export and Delete actions to header
6. Test context panel on various screen sizes

### Phase 3: Routing and Cleanup (~2 hours)
1. Ensure proper routing between pages
2. Test navigation flow end-to-end
3. Polish animations and transitions
4. Run linting and type checking
5. Final QA and edge case testing

**Total Estimated Time**: 12 hours

---

## 12. Acceptance Criteria

### 12.1 Phase 1 Complete
- [ ] `/dojo` page loads and displays Session Hub
- [ ] Recent sessions are displayed in a grid
- [ ] OnboardingPanel shows all four modes with descriptions
- [ ] "Start New Session" navigates to `/dojo/new`
- [ ] Clicking a session card navigates to that session
- [ ] Empty state is shown when no sessions exist
- [ ] Page is responsive on mobile, tablet, desktop

### 12.2 Phase 2 Complete
- [ ] Session page has two-column layout
- [ ] ContextPanel is collapsible and has three tabs
- [ ] Details tab shows session metadata
- [ ] Trail tab displays TrailOfThoughtPanel
- [ ] Related tab shows related artifacts or empty state
- [ ] Mode badges are displayed for AI responses
- [ ] Export and Delete buttons are functional
- [ ] DojoInput includes tips and examples
- [ ] Layout adapts to mobile (context panel as bottom sheet)

### 12.3 Phase 3 Complete
- [ ] Navigation between Session Hub and sessions works
- [ ] All routes are properly configured
- [ ] Application builds without errors
- [ ] TypeScript type checking passes
- [ ] Linting passes with no errors
- [ ] All animations are smooth and intentional
- [ ] No console errors or warnings

---

## 13. Appendix

### 13.1 Terminology
- **Session**: A single Dojo conversation with persistent history
- **Session Hub**: The landing page at `/dojo` for session management
- **Thinking Room**: The branded name for the Dojo experience
- **Context Panel**: The collapsible sidebar showing session details and connections
- **Trail of Thought**: The knowledge graph lineage visualization

### 13.2 References
- Current Dojo implementation: `app/dojo/[sessionId]/page.tsx`
- Session types: `lib/dojo/types.ts`
- Dojo store: `lib/stores/dojo.store.ts`
- Artifact system: `components/artifacts/ArtifactGridView.tsx`
- 11-11 brand guide: `00_Roadmap/DOJO_GENESIS_BRAND_GUIDE.md`

---

**Document Status**: Ready for Technical Specification
**Next Step**: Create technical specification document (`spec.md`)
