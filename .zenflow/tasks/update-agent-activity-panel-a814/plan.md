# Spec and build

## Configuration
- **Artifacts Path**: {@artifacts_path} → `.zenflow/tasks/{task_id}`

---

## Agent Instructions

Ask the user questions when anything is unclear or needs their input. This includes:
- Ambiguous or incomplete requirements
- Technical decisions that affect architecture or user experience
- Trade-offs that require business context

Do not make assumptions on important decisions — get clarification first.

---

## Workflow Steps

### [x] Step: Technical Specification

**Complexity Assessment**: Medium

This task requires:
- Integrating react-resizable-panels into the root layout
- Creating responsive components with collapsed/expanded states
- Connecting to existing agent status hooks
- Following strict design system constraints

See `spec.md` for full technical specification.

---

### [x] Step: Update Root Layout with Resizable Panel

**Goal**: Integrate ResizablePanelGroup into `app/layout.tsx` to support a resizable agent panel.

**Tasks**:
1. Import ResizablePanelGroup, ResizablePanel, ResizableHandle from react-resizable-panels
2. Replace the current `<div className="flex h-screen">` with ResizablePanelGroup
3. Wrap main content area in ResizablePanel with defaultSize={75}
4. Add ResizableHandle with Dojo brand styling
5. Add AgentActivityPanel inside ResizablePanel with:
   - defaultSize={25}
   - minSize={8} (80px)
   - maxSize={32} (320px)
   - collapsible={true}

**Verification**:
- [ ] Panel appears on the right side of all pages
- [ ] Panel can be resized by dragging handle
- [ ] Panel respects min/max size constraints
- [ ] No console errors

**Files Changed**:
- `app/layout.tsx`

---

### [x] Step: Create New AgentCard Component
<!-- chat-id: 58a5f0ec-aacb-42d0-8ce7-993ec6d3ccd5 -->

**Goal**: Build a new AgentCard component specifically for the activity panel (separate from the existing registry AgentCard).

**Tasks**:
1. Create `components/agent/AgentCard.tsx`
2. Define AgentCardProps interface with agentId, name, icon, status, message, progress, isCollapsed
3. Create AGENT_COLORS constant with agent-specific background colors (8% opacity)
4. Implement collapsed state rendering (icon + StatusDot only)
5. Implement expanded state rendering (icon + name + status + task + progress)
6. Use agent-specific colors from Tailwind config
7. Add proper ARIA labels and semantic HTML

**Verification**:
- [ ] Component renders correctly in collapsed mode (80px)
- [ ] Component renders correctly in expanded mode (320px)
- [ ] Agent colors match brand guide
- [ ] StatusDot displays with correct color and animation
- [ ] TypeScript types are correct

**Files Changed**:
- `components/agent/AgentCard.tsx` (NEW)

---

### [x] Step: Update AgentActivityPanel Component
<!-- chat-id: df3728a8-bfed-4f5e-9334-870992a6337b -->

**Goal**: Refactor AgentActivityPanel to use real agent data and support responsive layout.

**Tasks**:
1. Remove mock agent data
2. Import and use useAgentStatus() hook
3. Define AGENT_METADATA constant (name, icon for each agent)
4. Map over agents in order: supervisor → dojo → librarian → debugger
5. Pass real agent status to AgentCard components
6. Add panel width tracking (via ref or props)
7. Calculate isCollapsed based on panel width (< 150px)
8. Update header to show/hide based on panel width
9. Remove old toggle button (panel collapse is handled by drag)

**Verification**:
- [ ] All 4 agents display with correct icons and colors
- [ ] Agent status updates in real-time (test by checking useAgentStatus polling)
- [ ] Panel layout adapts to width changes
- [ ] No TypeScript errors

**Files Changed**:
- `components/layout/AgentActivityPanel.tsx`

---

### [x] Step: Update SystemInfo and ActivityLog Components
<!-- chat-id: 30ab1673-1953-46d2-95a6-d00c9bc6c6b5 -->

**Goal**: Make SystemInfo and ActivityLog responsive to panel width.

**Tasks for SystemInfo**:
1. Add optional `isCollapsed` prop
2. Update layout to be vertical in collapsed mode (if shown at all)
3. Use shorter labels in collapsed mode (e.g., "$0.0012" instead of "Cost: $0.0012")

**Tasks for ActivityLog**:
1. Add optional `isCollapsed` prop
2. Show fewer items in collapsed mode (3 instead of 5)
3. Add agent icon prefix with color coding
4. Truncate text more aggressively in collapsed mode
5. Use ellipsis for long messages

**Verification**:
- [ ] SystemInfo displays correctly in both collapsed and expanded states
- [ ] ActivityLog displays correctly in both states
- [ ] Agent icons and colors appear in activity entries
- [ ] Text truncation works properly

**Files Changed**:
- `components/agents/SystemInfo.tsx`
- `components/agents/ActivityLog.tsx`

---

### [x] Step: Polish, Test, and Build
<!-- chat-id: aabd305a-81c7-41d2-948e-c23cb60eebe8 -->

**Goal**: Add final polish, run full test suite, and verify build.

**Tasks**:
1. Add smooth transitions for panel resize (200ms ease-out)
2. Test panel on all major pages:
   - `/` (home)
   - `/workbench`
   - `/librarian`
   - `/dashboard`
   - `/agents`
3. Verify accessibility:
   - Keyboard navigation
   - Screen reader support
   - Color contrast (WCAG AA)
4. Run type-check: `npm run type-check`
5. Run lint: `npm run lint`
6. Run build: `npm run build`
7. Fix any errors or warnings

**Verification**:
- [ ] Panel works on all tested pages
- [ ] No console errors or warnings
- [ ] Type-check passes
- [ ] Lint passes (or only existing issues remain)
- [ ] Build completes successfully
- [ ] Accessibility requirements met

**Files Changed**:
- Various (bug fixes if needed)

---

### [x] Step: Write Implementation Report
<!-- chat-id: 470ff610-69f5-4a52-9e00-d7ca7c6bcc66 -->

**Goal**: Document what was implemented, how it was tested, and any issues encountered.

**Tasks**:
1. Create `{@artifacts_path}/report.md`
2. Document implementation details:
   - Components created/modified
   - Key technical decisions
   - How real-time status updates work
3. Document testing approach:
   - Manual testing steps
   - Build verification
   - Accessibility testing
4. Document challenges and solutions:
   - Any issues with react-resizable-panels
   - Layout or styling challenges
   - Performance considerations

**Verification**:
- [ ] Report is complete and accurate
- [ ] All acceptance criteria are addressed

**Files Changed**:
- `.zenflow/tasks/update-agent-activity-panel-a814/report.md` (NEW)
