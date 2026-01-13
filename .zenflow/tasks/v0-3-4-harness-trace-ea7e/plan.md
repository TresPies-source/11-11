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

**Complexity Assessment:** HARD

This is a complex feature requiring:
- New database schema with JSONB support
- Nested event structure with parent-child relationships
- Integration with multiple existing features (Supervisor, Cost Guard, Librarian)
- Multiple UI views (tree, timeline, summary)
- Performance requirements (<10ms overhead)

Technical specification created in `spec.md` covering:
- Architecture patterns and design decisions
- Complete source code structure (new files and modifications)
- Database schema with JSONB for nested events
- API endpoints and data models
- Comprehensive verification approach
- Phase-based implementation plan (6 phases)
- Risk assessment and mitigation strategies
- Excellence criteria self-assessment framework

---

### [ ] Step: Phase 1 - Core Infrastructure
<!-- chat-id: ce583431-8e06-4c7a-94c1-85ea8dcf60e3 -->

**Goal:** Establish tracing foundation with types, utilities, and database schema.

**Tasks:**
1. Create `/lib/harness/types.ts` - Define TypeScript interfaces for HarnessEvent, HarnessTrace, HarnessSummary
2. Create `/lib/harness/utils.ts` - Implement helper functions (generateId, addNestedEvent, updateSpan)
3. Create `/lib/harness/trace.ts` - Core tracing API (startTrace, logEvent, startSpan, endSpan, endTrace)
4. Create `/lib/harness/trace.test.ts` - Unit tests for tracing API
5. Create `/lib/pglite/migrations/005_add_harness_traces.ts` - Database migration for harness_traces table
6. Create `/lib/pglite/harness.ts` - Database operations (insertTrace, queryTraces)
7. Update `/lib/pglite/types.ts` - Add HarnessTraceRow and HarnessTraceInsert interfaces
8. Update `/lib/pglite/client.ts` - Add migration 005 to initialization sequence

**Verification:**
- [ ] Unit tests pass: `tsx lib/harness/trace.test.ts`
- [ ] Database migration runs successfully on fresh database
- [ ] TypeScript compilation passes: `npm run type-check`
- [ ] No regressions in existing tests

**Deliverables:**
- Functional tracing API with nested span support
- Database schema ready for trace persistence
- Comprehensive test coverage (90%+)

---

### [ ] Step: Phase 2 - Retrieval & API Routes

**Goal:** Enable trace retrieval via database queries and REST API.

**Tasks:**
1. Create `/lib/harness/retrieval.ts` - Query functions (getTrace, getSessionTraces, getUserTraces)
2. Create `/lib/harness/retrieval.test.ts` - Unit tests for retrieval functions
3. Create `/app/api/harness/trace/route.ts` - GET endpoint for single trace
4. Create `/app/api/harness/session/route.ts` - GET endpoint for session traces
5. Create `/app/api/harness/user/route.ts` - GET endpoint for user traces
6. Test API endpoints manually (curl/Postman) or with integration tests

**Verification:**
- [ ] Retrieval functions return correct data from database
- [ ] API endpoints respond with proper JSON format
- [ ] 404 errors for missing traces
- [ ] Auth validation works (401/403 for unauthorized)
- [ ] TypeScript compilation passes

**Deliverables:**
- Working API endpoints for trace retrieval
- Database query functions with proper indexing
- Error handling (graceful 404s, auth checks)

---

### [ ] Step: Phase 3 - Integration with Existing Features

**Goal:** Retrofit Supervisor, Cost Guard, and Handoffs to log trace events.

**Tasks:**
1. Update `/lib/agents/supervisor.ts` - Add trace logging to routeQuery() function
   - Log AGENT_ROUTING events with query, agent_id, confidence
   - Wrap in try-catch (never throw)
2. Update `/lib/cost/tracking.ts` - Add trace logging to trackCost() function
   - Log COST_TRACKED events with tokens, cost, operation_type
3. Update `/lib/agents/handoff.ts` - Add trace logging to handoff functions
   - Log AGENT_HANDOFF events with from_agent, to_agent, reason
4. Create `/scripts/test-harness-integration.ts` - Integration test script
5. Run integration tests to verify full trace lifecycle

**Verification:**
- [ ] Supervisor logs AGENT_ROUTING events during routing
- [ ] Cost Guard logs COST_TRACKED events during tracking
- [ ] Handoffs log AGENT_HANDOFF events
- [ ] Integration test passes (full trace lifecycle)
- [ ] No regressions in existing functionality
- [ ] Existing tests still pass

**Deliverables:**
- Complete integration with Wave 1 & 2 features
- Integration test suite
- Trace events captured automatically

---

### [ ] Step: Phase 4 - UI Components & Visualization

**Goal:** Build three trace visualization views (tree, timeline, summary).

**Tasks:**
1. Create `/hooks/useTrace.ts` - Custom hook to fetch single trace
2. Create `/hooks/useSessionTraces.ts` - Custom hook to fetch session traces
3. Create `/hooks/useUserTraces.ts` - Custom hook to fetch user traces
4. Create `/components/harness/TraceEventNode.tsx` - Recursive tree node component
5. Create `/components/harness/TraceTreeView.tsx` - Tree view with expand/collapse
6. Create `/components/harness/TraceTimelineView.tsx` - Timeline view with duration bars
7. Create `/components/harness/TraceSummaryView.tsx` - Summary metrics view
8. Create `/components/harness/TraceEventDetails.tsx` - Event details modal/panel
9. Create `/components/harness/index.ts` - Barrel export
10. Create `/app/traces/[traceId]/page.tsx` - Main trace viewer page with tab switcher
11. Add loading states, error boundaries, and responsive design
12. Style with Tailwind CSS and Framer Motion animations

**Verification:**
- [ ] All three views render correctly
- [ ] Tree view expand/collapse works
- [ ] Timeline view shows duration bars
- [ ] Summary view displays metrics
- [ ] Loading states appear during data fetch
- [ ] Error states handle missing traces gracefully
- [ ] Responsive design (mobile-friendly)
- [ ] Manual testing in browser

**Deliverables:**
- Three complementary trace visualization views
- Dedicated trace viewer page
- Polished UI with animations

---

### [ ] Step: Phase 5 - Testing & Documentation

**Goal:** Comprehensive testing, documentation, and quality assurance.

**Tasks:**
1. Write JSDoc comments for all public functions in `/lib/harness/`
2. Create `/lib/harness/README.md` - Usage guide with code examples
3. Update `JOURNAL.md` - Document architectural decisions and self-assessment
4. Run full test suite:
   - Unit tests: `tsx lib/harness/*.test.ts`
   - Integration tests: `tsx scripts/test-harness-integration.ts`
5. Run quality checks:
   - Linting: `npm run lint`
   - Type-check: `npm run type-check`
   - Build: `npm run build`
6. Performance testing:
   - Measure logging overhead (<10ms per event)
   - Measure trace retrieval time (<500ms for 100 events)
   - Measure UI render time (<1s for tree view)
7. Manual acceptance testing:
   - Test full workflow (start trace → log events → end trace → view UI)
   - Test all three visualization views
   - Test error states (missing trace, database offline)
   - Test accessibility (keyboard navigation, screen reader)

**Verification:**
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] `npm run lint` passes (zero errors)
- [ ] `npm run type-check` passes (zero errors)
- [ ] `npm run build` succeeds
- [ ] Performance targets met
- [ ] Manual testing complete
- [ ] Documentation complete

**Deliverables:**
- Comprehensive documentation (JSDoc, README, JOURNAL)
- Passing test suite
- Performance validation
- Ready for code review

---

### [ ] Step: Phase 6 - Polish & Edge Cases

**Goal:** Handle edge cases, optimize, and finalize for release.

**Tasks:**
1. Handle edge cases:
   - Empty trace (zero events)
   - Very long trace (100+ events) - Add pagination warning
   - Database offline - Graceful console logging fallback
   - Span mismatch - Warn but don't crash
2. Optimize bundle size:
   - Lazy load trace visualization components
   - Code-split `/app/traces/[traceId]/page.tsx`
3. Accessibility audit:
   - WCAG AA compliance check
   - Keyboard navigation test
   - Screen reader test (NVDA/JAWS)
4. Cross-browser testing:
   - Chrome (latest)
   - Firefox (latest)
   - Safari (latest)
5. Final bug sweep:
   - Fix any P0/P1 bugs discovered
   - Document P2/P3 bugs for future sprints
6. Self-assessment against Excellence Criteria:
   - Stability: 10/10
   - Research Integration: 10/10
   - Depth: 10/10
   - Performance: 9/10
   - Usability: 9/10
   - Beauty: 7/10
   - Creativity: 7/10

**Verification:**
- [ ] All edge cases handled gracefully
- [ ] Bundle size acceptable (check with `npm run analyze`)
- [ ] WCAG AA compliance verified
- [ ] Cross-browser compatibility confirmed
- [ ] Zero P0/P1 bugs
- [ ] Excellence criteria met
- [ ] Ready to ship

**Deliverables:**
- Production-ready Harness Trace feature
- Zero critical bugs
- Complete self-assessment
- Ready for merge to main

---

### [ ] Step: Final Report

After completing all phases, write a comprehensive report to `{@artifacts_path}/report.md` covering:

1. **What was implemented:**
   - Core tracing API with nested span support
   - Database schema with JSONB storage
   - Integration with Supervisor, Cost Guard, Handoffs
   - Three visualization views (tree, timeline, summary)
   - API endpoints for trace retrieval
   - Comprehensive test suite

2. **How the solution was tested:**
   - Unit tests for tracing API and retrieval functions
   - Integration tests for full trace lifecycle
   - Manual testing of UI components
   - Performance testing (overhead, retrieval, rendering)
   - Accessibility testing (keyboard nav, screen reader)
   - Cross-browser testing

3. **The biggest issues or challenges encountered:**
   - Technical challenges (JSONB schema design, nested events)
   - Integration challenges (retrofitting existing features)
   - Performance optimizations needed
   - Edge cases discovered during testing
   - Lessons learned for future features

4. **Excellence criteria self-assessment:**
   - Score for each of the 8 dimensions
   - Evidence for scores
   - Areas of excellence
   - Areas for improvement
