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
<!-- chat-id: 6bc93a3b-dab7-4b2c-b41b-7b96faba5980 -->

Assess the task's difficulty, as underestimating it leads to poor outcomes.
- easy: Straightforward implementation, trivial bug fix or feature
- medium: Moderate complexity, some edge cases or caveats to consider
- hard: Complex logic, many caveats, architectural considerations, or high-risk changes

Create a technical specification for the task that is appropriate for the complexity level:
- Review the existing codebase architecture and identify reusable components.
- Define the implementation approach based on established patterns in the project.
- Identify all source code files that will be created or modified.
- Define any necessary data model, API, or interface changes.
- Describe verification steps using the project's test and lint commands.

Save the output to `{@artifacts_path}/spec.md` with:
- Technical context (language, dependencies)
- Implementation approach
- Source code structure changes
- Data model / API / interface changes
- Verification approach

If the task is complex enough, create a detailed implementation plan based on `{@artifacts_path}/spec.md`:
- Break down the work into concrete tasks (incrementable, testable milestones)
- Each task should reference relevant contracts and include verification steps
- Replace the Implementation step below with the planned tasks

Rule of thumb for step size: each step should represent a coherent unit of work (e.g., implement a component, add an API endpoint, write tests for a module). Avoid steps that are too granular (single function).

Save to `{@artifacts_path}/plan.md`. If the feature is trivial and doesn't warrant this breakdown, keep the Implementation step below as is.

---

### [x] Phase 1: Database Schema Migration
<!-- chat-id: 46537fb1-7b89-4682-8a99-4b0b4de3ef3d -->

Create complete Dojo session schema with perspectives, assumptions, decisions, and artifacts.

**Tasks:**
1. Create migration `004_add_dojo_sessions.ts` with:
   - Add Dojo columns to `sessions` table (title, mode, situation, stake, agent_path, next_move fields, artifacts)
   - Create `session_perspectives` table
   - Create `session_assumptions` table
   - Create `session_decisions` table
   - Add indexes for performance
2. Update TypeScript types in `lib/pglite/types.ts`
3. Create database access layer in `lib/pglite/sessions.ts`
4. Test migration with mock data

**Verification:**
- Migration runs without errors
- All tables created with correct schema
- TypeScript types match database schema
- Can insert/query test data successfully

---

### [x] Phase 2: DojoPacket Schema & Builder
<!-- chat-id: de2fedea-bf99-4d8a-aff9-cbc7c1bb9cf8 -->

Implement DojoPacket v1.0 schema and packet building logic.

**Tasks:**
1. Create `lib/packet/schema.ts` with Zod schema for DojoPacket v1.0
2. Create `lib/packet/builder.ts` to aggregate session data:
   - Fetch session data from database
   - Fetch perspectives, assumptions, decisions
   - Fetch trace summary from Harness Trace (with graceful fallback)
   - Build complete DojoPacket
3. Write unit tests for packet builder

**Verification:**
- Zod schema validates correctly
- Packet builder handles missing data gracefully
- Unit tests pass (100% coverage on builder)
- Can build valid packet from test session

---

### [x] Phase 3: Export Formatters
<!-- chat-id: afde75e6-6f26-4bcb-b108-8bade9d14c82 -->

Implement JSON, Markdown, and PDF export formats.

**Tasks:**
1. Create `lib/packet/formatters.ts`:
   - `formatAsJSON()` - Pretty-printed JSON
   - `formatAsMarkdown()` - Human-readable Markdown
   - `formatAsPDF()` - Professional PDF using `manus-md-to-pdf`
2. Test each formatter with sample packets
3. Handle edge cases (empty arrays, null fields, long content)

**Verification:**
- JSON is valid and pretty-printed
- Markdown is readable and well-formatted
- PDF generates successfully using `manus-md-to-pdf`
- All formats handle edge cases gracefully

---

### [x] Phase 4: Export API
<!-- chat-id: 43a2d3b2-533a-40cb-ac10-690cd9951386 -->

Create API endpoint for exporting DojoPackets.

**Tasks:**
1. Create `app/api/packet/export/route.ts`:
   - Accept `sessionId` and `format` parameters
   - Build DojoPacket from session
   - Return formatted output with appropriate headers
   - Handle authentication (dev mode + production)
   - Error handling (session not found, export failure)
2. Write integration tests for API endpoint

**Verification:**
- API returns 200 for valid requests
- Returns 400 for invalid format
- Returns 404 for non-existent session
- Correct Content-Type and Content-Disposition headers
- Downloads file correctly

---

### [x] Phase 5: Import API
<!-- chat-id: b866c64a-1cca-41c9-bb56-32e6755a610c -->

Create API endpoint for importing DojoPackets.

**Tasks:**
1. Create `app/api/packet/import/route.ts`:
   - Accept DojoPacket JSON in request body
   - Validate against DojoPacket v1.0 schema
   - Create new session with imported data
   - Insert perspectives, assumptions, decisions
   - Return new session ID
2. Write integration tests for import endpoint

**Verification:**
- API validates packet schema correctly
- Creates complete session with all related data
- Returns new session ID
- Handles invalid packets gracefully
- Handles duplicate imports

---

### [x] Phase 6: Export UI Component
<!-- chat-id: 046baa25-510e-4bbd-a8b7-a5a0782a0830 -->

Create user interface for exporting DojoPackets.

**Tasks:**
1. Create `components/packet/export-button.tsx`:
   - Dropdown menu with format options (JSON, Markdown, PDF)
   - "Copy to Clipboard" option for Markdown
   - Loading states during export
   - Error handling with user-friendly messages
2. Match existing UI patterns (buttons, menus, icons)
3. Add to session page/view

**Verification:**
- Export button appears in correct location
- Dropdown menu works smoothly
- Downloads trigger correctly
- Copy to clipboard works
- Error messages display appropriately

---

### [x] Phase 7: Testing & Documentation
<!-- chat-id: 7dec5a9e-7c38-458e-ac13-85575006a516 -->

Comprehensive testing and documentation.

**Tasks:**
1. Write unit tests:
   - Schema validation tests
   - Packet builder tests
   - Formatter tests
   - Database query tests
2. Write integration tests:
   - Export API tests
   - Import API tests
   - End-to-end export flow
3. Create documentation:
   - Update `JOURNAL.md` with architectural decisions
   - Create `lib/packet/README.md` with usage examples
   - Update `AUDIT_LOG.md` with completion summary
4. Run full test suite and linters

**Verification:**
- All unit tests pass
- All integration tests pass
- `npm run lint` passes
- `npm run type-check` passes
- Documentation is complete and accurate

---

### [x] Phase 8: Final Report
<!-- chat-id: 07899e46-8882-4212-98fd-49dd8a1cdc0d -->

Write completion report summarizing implementation.

**Tasks:**
1. Write report to `{@artifacts_path}/report.md` describing:
   - What was implemented
   - How the solution was tested
   - Performance metrics (export time, file sizes)
   - Known limitations
   - Biggest challenges encountered
   - Future enhancements (deferred to v0.4.0+)
