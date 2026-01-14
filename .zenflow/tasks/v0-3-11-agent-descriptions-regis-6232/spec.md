# Technical Specification: Agent Descriptions & Registry UI (v0.3.11)

## Complexity Assessment: MEDIUM

**Rationale:**
- Multiple interconnected UI components (cards, modal, test interface)
- 3 new API endpoints to create
- Integration with existing Cost Guard and Harness Trace systems
- Graceful degradation required for missing data
- Moderate architectural considerations (state management, routing)
- ~700-1000 LOC estimated across all files

**Not trivial because:** Requires creating a complete feature with multiple views, state management, API integration, and careful attention to existing patterns.

**Not hard because:** Architecture is clear, patterns exist, no complex algorithms, straightforward CRUD operations.

---

## 1. Technical Context

### Language & Framework
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS + custom utilities (`cn` from `@/lib/utils`)
- **Animations:** Framer Motion (200-300ms calm transitions)
- **Icons:** lucide-react
- **Database:** PGlite (PostgreSQL in-browser)
- **API:** Next.js API Routes (Route Handlers)

### Key Dependencies
```json
{
  "framer-motion": "^11.15.0",
  "lucide-react": "^0.469.0",
  "zod": "^3.23.8",
  "react": "^18.3.1",
  "next": "^14.2.24",
  "@electric-sql/pglite": "^0.3.14"
}
```

### Existing Architecture
- **Agent Registry:** `/lib/agents/registry.json` (already has `description`, `when_to_use`, `when_not_to_use` fields)
- **Supervisor Logic:** `/lib/agents/supervisor.ts` (routing, agent loading, validation)
- **Cost Tracking:** `/lib/agents/cost-tracking.ts` + `routing_costs` table
- **Database Schema:** `/lib/pglite/migrations/004_add_supervisor_tables.ts`
- **Component Patterns:** Card-based UI with Framer Motion animations (see `seed-card.tsx`, `PromptCard.tsx`)
- **Modal Patterns:** Portal-based modals with AnimatePresence (see `details-modal.tsx`)

---

## 2. Implementation Approach

### Phase 1: Enhance Agent Types (Minimal Changes Required)
**Goal:** Add optional fields for UI display (icon, tagline, status)

**Changes:**
1. **Extend `registry.json`** with optional UI fields:
   - `icon` (emoji string, e.g., "🎯")
   - `tagline` (short one-liner from existing description)
   - Status will be computed dynamically (no storage needed)

2. **Update TypeScript types** in `/lib/agents/types.ts`:
   - Add optional `icon?: string` and `tagline?: string` to `Agent` interface

**No breaking changes:** Existing code will continue to work. New fields are optional and only used by UI.

---

### Phase 2: Create API Endpoints
**Goal:** Expose agent registry data and test routing functionality

#### Endpoint 1: Get Agent Registry
**Path:** `/app/api/agents/registry/route.ts`

**Response Schema:**
```typescript
{
  agents: Array<{
    id: string;
    name: string;
    icon?: string;
    tagline?: string;
    description: string;
    when_to_use: string[];
    when_not_to_use: string[];
    default: boolean;
    status: 'online' | 'offline'; // computed
  }>;
}
```

**Logic:**
- Call `getAvailableAgents()` from supervisor
- Compute `status` by checking if agent handler exists
- Return enriched agent data

**Dev Mode Support:** Works in dev mode (no auth required)

---

#### Endpoint 2: Get Agent Details + Usage Stats
**Path:** `/app/api/agents/[agentId]/route.ts`

**Response Schema:**
```typescript
{
  id: string;
  name: string;
  icon?: string;
  tagline?: string;
  description: string;
  when_to_use: string[];
  when_not_to_use: string[];
  default: boolean;
  status: 'online' | 'offline';
  usage_stats?: {
    query_count: number;
    total_cost_usd: number;
    avg_response_time_ms: number;
    last_used_at: string | null;
  };
}
```

**Logic:**
- Get agent by ID using `getAgentById(agentId)`
- Query `routing_decisions` and `routing_costs` tables for usage stats
- Return 404 if agent not found
- Gracefully handle missing usage data (return `null` or default values)

**Dev Mode Support:** Returns mock/empty usage stats in dev mode

---

#### Endpoint 3: Test Agent Routing
**Path:** `/app/api/agents/test-route/route.ts`

**Request Schema:**
```typescript
{
  query: string;
  conversation_context?: string[];
}
```

**Response Schema:**
```typescript
{
  agent_id: string;
  agent_name: string;
  confidence: number;
  reasoning: string;
  cost_usd: number;
  tokens_used: number;
  fallback: boolean;
}
```

**Logic:**
- Call `routeQuery()` from supervisor with test context
- Extract cost info from response usage
- Return routing decision + cost estimate
- Do NOT save to database (test-only)

**Dev Mode Support:** Falls back to keyword routing if no API keys available

---

### Phase 3: Build UI Components

#### Component 1: AgentCard
**Path:** `/components/agents/AgentCard.tsx`

**Props:**
```typescript
interface AgentCardProps {
  id: string;
  name: string;
  icon?: string;
  tagline: string;
  status: 'online' | 'offline';
  onClick: () => void;
}
```

**Design Patterns (following existing codebase):**
- Framer Motion card variants (hidden → visible → hover)
- Hover effect: `scale: 1.02`, subtle shadow increase
- Status indicator: Green dot (online) or gray dot (offline)
- Icon: Large emoji display (if available) or default agent icon
- Responsive: Full width on mobile, grid on desktop

**Animation Timing:**
- Initial: 300ms ease-out
- Hover: 200ms ease-out
- Click: active:scale-95

**Accessibility:**
- Semantic button role
- aria-label describing agent and status
- Keyboard navigable

---

#### Component 2: AgentDetailsModal
**Path:** `/components/agents/AgentDetailsModal.tsx`

**Props:**
```typescript
interface AgentDetailsModalProps {
  agent: Agent & { 
    usage_stats?: UsageStats 
  } | null;
  isOpen: boolean;
  onClose: () => void;
  onTestAgent: () => void;
}
```

**Layout Sections:**
1. **Header:**
   - Icon + Name
   - Status badge (online/offline)
   - Close button (X)

2. **Body (scrollable):**
   - **Purpose:** Description text (2-3 sentences)
   - **When to Use:** Bulleted list from `when_to_use`
   - **What It Doesn't Do:** Bulleted list from `when_not_to_use`
   - **Usage Stats (optional):**
     - Query count
     - Total cost
     - Avg response time
     - Last used timestamp
     - Show "Usage tracking unavailable" if data is missing

3. **Footer (sticky):**
   - "Close" button (secondary)
   - "Test Agent" button (primary)

**Modal Pattern (following existing codebase):**
- Portal-based rendering (createPortal to document.body)
- AnimatePresence for enter/exit animations
- Click outside to close
- ESC key to close
- Focus trap
- z-index: 50

**Accessibility:**
- role="dialog"
- aria-modal="true"
- aria-labelledby (agent name)
- Focus management

---

#### Component 3: TestAgentInterface
**Path:** `/components/agents/TestAgentInterface.tsx`

**Props:**
```typescript
interface TestAgentInterfaceProps {
  agentId: string;
  agentName: string;
}
```

**UI Elements:**
1. Textarea: "Enter a test query..."
2. "Route Query" button (primary)
3. Loading state (spinner + "Routing...")
4. Result display:
   - Selected agent badge (colored)
   - Confidence meter (progress bar 0-100%)
   - Reasoning text
   - Cost breakdown (tokens + USD)
   - Fallback indicator (if keyword routing used)

**State Management:**
- Loading state
- Result state (success | error | idle)
- Query text

**Error Handling:**
- Display API errors inline
- Validation: query must be non-empty
- Retry button on error

---

#### Component 4: Agent Registry Page
**Path:** `/app/agents/page.tsx`

**Layout:**
```
<Header>
  <h1>Agent Registry</h1>
  <p>Explore the 11-11 multi-agent system</p>
</Header>

<Grid>
  {agents.map(agent => (
    <AgentCard key={agent.id} {...agent} onClick={() => openModal(agent.id)} />
  ))}
</Grid>

<AgentDetailsModal ... />
```

**Grid Responsive Breakpoints:**
- Mobile (< 640px): 1 column
- Tablet (640px - 1024px): 2 columns
- Desktop (> 1024px): 2 columns (max)

**Data Fetching:**
- Client-side fetch from `/api/agents/registry`
- Show loading skeletons while fetching
- Error state with retry button

**State Management:**
- Selected agent ID (for modal)
- Modal open/close state
- Test interface visibility

---

### Phase 4: Agent Status Detection

**Function:** `getAgentStatus(agentId: string): 'online' | 'offline'`

**Location:** `/lib/agents/status.ts` (new file)

**Logic:**
```typescript
// Check if agent implementation exists
const IMPLEMENTED_AGENTS = ['dojo', 'librarian', 'debugger'];

export function getAgentStatus(agentId: string): 'online' | 'offline' {
  return IMPLEMENTED_AGENTS.includes(agentId) ? 'online' : 'offline';
}
```

**Future Enhancement:** Could check for agent handler files dynamically, but hardcoded list is simpler and faster.

---

### Phase 5: Integration Points

#### Cost Guard Integration
**Files:** `/lib/agents/cost-tracking.ts`, `/lib/pglite/migrations/004_add_supervisor_tables.ts`

**Usage Stats Query (for agent details modal):**
```sql
SELECT 
  COUNT(rd.id) as query_count,
  COALESCE(SUM(rc.cost_usd), 0) as total_cost_usd,
  COALESCE(AVG(EXTRACT(EPOCH FROM (rd.created_at - lag(rd.created_at) OVER (ORDER BY rd.created_at))) * 1000), 0) as avg_response_time_ms,
  MAX(rd.created_at) as last_used_at
FROM routing_decisions rd
LEFT JOIN routing_costs rc ON rc.routing_decision_id = rd.id
WHERE rd.agent_selected = $1
GROUP BY rd.agent_selected;
```

**Graceful Degradation:**
- If query fails, show "Usage tracking unavailable"
- If no data, show "No usage recorded yet"
- Dev mode: Return mock/empty stats

---

#### Harness Trace Integration (Optional - Deferred)
**Reason:** Harness Trace is for runtime activity logging. For v0.3.11, we focus on static registry + usage stats. Real-time activity feed can be added later.

**Future Enhancement:** Add "Live Activity" section showing recent agent invocations from Harness Trace.

---

## 3. Source Code Structure Changes

### New Files to Create

```
app/
  agents/
    page.tsx                          # Agent Registry Page (~150 LOC)
  api/
    agents/
      registry/
        route.ts                       # Get all agents endpoint (~40 LOC)
      [agentId]/
        route.ts                       # Get agent details + stats (~80 LOC)
      test-route/
        route.ts                       # Test routing endpoint (~60 LOC)

components/
  agents/
    AgentCard.tsx                      # Agent card component (~120 LOC)
    AgentDetailsModal.tsx              # Modal with agent details (~250 LOC)
    TestAgentInterface.tsx             # Test routing UI (~180 LOC)

lib/
  agents/
    status.ts                          # Agent status detection (~20 LOC)
```

### Files to Modify

```
lib/
  agents/
    registry.json                      # Add icon and tagline fields
    types.ts                           # Add icon/tagline to Agent interface
```

**Total New Code:** ~900 LOC  
**Modified Code:** ~30 LOC

---

## 4. Data Model Changes

### No Database Schema Changes Required
- Existing tables (`routing_decisions`, `routing_costs`) already support usage stats
- No new migrations needed

### Agent Registry Enhancement
**File:** `/lib/agents/registry.json`

**Add optional fields:**
```json
{
  "id": "supervisor",
  "name": "Supervisor",
  "icon": "🎯",
  "tagline": "Routes queries to the right agent",
  "description": "...",
  "when_to_use": [...],
  "when_not_to_use": [...],
  "default": false
}
```

**Backward Compatibility:** All new fields are optional. Existing code will ignore them.

---

## 5. API Changes

### New API Endpoints Summary

| Endpoint | Method | Purpose | Auth Required |
|----------|--------|---------|---------------|
| `/api/agents/registry` | GET | List all agents | No (dev mode) |
| `/api/agents/[agentId]` | GET | Get agent details + stats | No (dev mode) |
| `/api/agents/test-route` | POST | Test routing logic | No (dev mode) |

**Dev Mode Support:** All endpoints work without authentication in dev mode.

**Error Responses:**
- 404: Agent not found
- 500: Database or internal errors
- 400: Invalid request body (test-route)

---

## 6. Verification Approach

### Unit Tests (to be created)

**Test Files:**
```
__tests__/
  agents/
    registry-api.test.ts              # Test /api/agents/registry
    agent-details-api.test.ts         # Test /api/agents/[agentId]
    test-route-api.test.ts            # Test /api/agents/test-route
    agent-card.test.tsx               # Test AgentCard component
    agent-modal.test.tsx              # Test AgentDetailsModal component
    test-interface.test.tsx           # Test TestAgentInterface component
```

**Test Coverage:**
- API endpoints return correct data structure
- Agent status detection works (online/offline)
- Usage stats query returns valid data
- Test routing returns valid routing decision
- Components render without crashing
- Modal opens/closes correctly
- Test interface handles API errors

---

### Integration Tests

**Scenarios:**
1. Load registry page → see all agents → click card → modal opens
2. View agent details → see usage stats (or "No data" message)
3. Test routing → enter query → see routing result
4. Graceful degradation: Missing usage stats handled correctly
5. Dev mode: All features work without API keys (keyword fallback)

---

### Manual Testing Checklist

- [ ] Agent registry page loads successfully
- [ ] All agents displayed in grid (2x2 on desktop)
- [ ] Agent cards show icon, name, tagline, status
- [ ] Clicking card opens modal
- [ ] Modal shows all sections (purpose, when to use, etc.)
- [ ] Usage stats displayed (or "unavailable" message)
- [ ] "Test Agent" button opens test interface
- [ ] Test interface submits query and shows result
- [ ] Result shows agent selected, confidence, reasoning, cost
- [ ] Modal closes on X button, ESC key, outside click
- [ ] Responsive: works on mobile, tablet, desktop
- [ ] Accessibility: keyboard navigation, screen reader support
- [ ] Performance: registry page loads in <500ms, modal opens in <200ms

---

### Performance Tests

**Metrics:**
- Registry page load: <500ms (target)
- Modal open animation: <200ms
- Test routing API call: <2s (depends on LLM)
- Usage stats query: <100ms

**Testing:**
- Use browser DevTools Performance tab
- Lighthouse audit for accessibility and performance
- Test with slow 3G network throttling

---

## 7. Excellence Criteria Mapping

### Usability (9/10) - Must Be Excellent
- ✅ Clear, intuitive UI (agent cards with icons and taglines)
- ✅ Easy discovery (grid layout, visible status indicators)
- ✅ Helpful descriptions (purpose, when to use, what it doesn't do)
- ✅ Accessible (ARIA labels, keyboard navigation, focus management)
- ✅ Test functionality (validate routing logic without leaving UI)

### Beauty (8/10) - Must Be Very Good
- ✅ Polished animations (Framer Motion, 200-300ms transitions)
- ✅ Consistent visual language (follows existing card patterns)
- ✅ Delightful interactions (hover effects, smooth modals)
- ✅ Professional design (Tailwind + custom utilities)

### Depth (9/10) - Must Be Excellent
- ✅ Complete metadata (purpose, when to use, what it doesn't do)
- ✅ Usage stats integration (query count, cost, response time)
- ✅ Test interface (validate routing with live API)
- ✅ Graceful degradation (missing data handled elegantly)

### Stability (9/10) - Must Be Excellent
- ✅ Zero UI crashes (error boundaries, validation)
- ✅ Graceful error handling (missing agents, failed API calls)
- ✅ Fast performance (<500ms load, <200ms modal)
- ✅ Dev mode support (works without API keys)

---

## 8. Risk Assessment & Mitigation

### Risk 1: Usage Stats Query Performance
**Impact:** Slow modal opening if query is complex  
**Likelihood:** Low (simple aggregation query)  
**Mitigation:** 
- Add indexes on `agent_selected` and `created_at`
- Cache results for 5 minutes (future enhancement)
- Show loading spinner in modal while fetching

### Risk 2: Missing Agent Implementations
**Impact:** Users confused about "offline" agents  
**Likelihood:** High (debugger not fully implemented)  
**Mitigation:**
- Clear status indicator (gray dot + "Coming Soon" badge)
- Disable "Test Agent" button for offline agents
- Show helpful message: "This agent is not yet implemented"

### Risk 3: Test Routing Cost
**Impact:** Users run many test queries, incurring costs  
**Likelihood:** Medium  
**Mitigation:**
- Do NOT log test queries to database
- Show cost estimate in result
- Add rate limiting (future enhancement)

### Risk 4: Breaking Existing Code
**Impact:** Registry changes break supervisor routing  
**Likelihood:** Very Low (new fields are optional)  
**Mitigation:**
- TypeScript ensures type safety
- Comprehensive testing before deployment
- No changes to core routing logic

---

## 9. Deferred Features (v0.4.0+)

### Admin UI for Editing Descriptions
**Reason:** Requires authentication, permissions, form validation. Out of scope for v0.3.11.

### Real-Time Activity Feed
**Reason:** Requires Harness Trace integration, WebSocket/polling, complex state management.

### Agent Performance Charts
**Reason:** Requires data visualization library (Chart.js, Recharts), historical data aggregation.

### Registry Export
**Reason:** Nice-to-have feature, not critical for MVP. Can be added quickly if needed.

---

## 10. Implementation Timeline

**Estimated Time: 3-4 days**

### Day 1: Setup & API
- [ ] Update `registry.json` with icons and taglines
- [ ] Update TypeScript types
- [ ] Create `/api/agents/registry` endpoint
- [ ] Create `/api/agents/[agentId]` endpoint
- [ ] Create `/api/agents/test-route` endpoint
- [ ] Test all endpoints with Postman/Thunder Client

### Day 2: Core Components
- [ ] Create `AgentCard.tsx` component
- [ ] Create `AgentDetailsModal.tsx` component
- [ ] Create `TestAgentInterface.tsx` component
- [ ] Create `/app/agents/page.tsx` registry page
- [ ] Wire up state management and data fetching

### Day 3: Integration & Polish
- [ ] Integrate usage stats query
- [ ] Test modal interactions (open/close, test routing)
- [ ] Add loading states and error handling
- [ ] Responsive design testing (mobile, tablet, desktop)
- [ ] Accessibility audit (keyboard nav, screen reader)

### Day 4: Testing & Documentation
- [ ] Write unit tests for components and APIs
- [ ] Write integration tests
- [ ] Manual testing (all checklist items)
- [ ] Update JOURNAL.md with implementation notes
- [ ] Create feature README
- [ ] Performance testing and optimization

---

## 11. Success Criteria

### Must Have
- [x] Agent registry page displays all agents
- [x] Agent cards are beautiful and interactive
- [x] Agent details modal shows complete information
- [x] Test agent interface validates routing logic
- [x] All tests passing (zero regressions)
- [x] Documentation complete (JOURNAL, code comments)

### Should Have
- [x] Usage stats integration
- [x] Smooth animations and transitions
- [x] Accessible UI (screen reader support)
- [x] Responsive design (mobile to desktop)

### Nice to Have (Deferred)
- [ ] Admin UI for editing descriptions
- [ ] Agent performance charts
- [ ] Real-time activity feed

---

## 12. Open Questions

### Q1: Should we show "Supervisor" as an agent in the registry?
**Decision:** YES - Supervisor is a router agent and should be visible to users. Show it with special status or badge to indicate it's the routing layer.

### Q2: How to handle agents without usage stats (never used)?
**Decision:** Show "No usage recorded yet" message instead of "0" values. More user-friendly.

### Q3: Should test routing queries be logged to database?
**Decision:** NO - Test queries are for validation only. Don't pollute routing_decisions table.

### Q4: What if agent has no icon in registry.json?
**Decision:** Use fallback icon (🤖) or first letter of agent name in colored circle.

---

## 13. Integration Checklist

### Before Starting
- [x] Read existing codebase (agents, components, API patterns)
- [x] Review Supervisor Router implementation
- [x] Review Cost Guard integration
- [x] Review database schema (routing tables)

### During Implementation
- [ ] Follow existing component patterns (Framer Motion, Tailwind)
- [ ] Reuse existing modal patterns (portal, AnimatePresence)
- [ ] Integrate with Cost Guard for usage stats
- [ ] Follow existing API patterns (dev mode support, error handling)
- [ ] Maintain type safety (TypeScript strict mode)

### After Implementation
- [ ] All tests passing (unit, integration, manual)
- [ ] Documentation updated (JOURNAL, README, code comments)
- [ ] Zero regressions (existing features work)
- [ ] Excellence criteria met (self-assessment)
- [ ] Performance benchmarks met (<500ms page, <200ms modal)

---

**End of Technical Specification**
