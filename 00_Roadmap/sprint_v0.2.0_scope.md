# Sprint v0.2.0: "Foundation & Growth"

**Date:** January 12, 2026  
**Version:** 0.1.1 → 0.2.0  
**Sprint Type:** Strategic Foundation + Multi-Route Feature Growth  
**Estimated Duration:** 7-10 days

---

## Executive Summary

This sprint represents a **strategic pivot** in the 11-11 development roadmap. We are migrating from Supabase to PGlite (local-first Postgres) to enable truly autonomous development while simultaneously delivering six high-value features across all major product areas.

**Core Philosophy:** This sprint embodies "Sustainable Innovation" by removing external dependencies (Phase 0) before building new features (Phases 1-6), ensuring a solid foundation for future growth.

---

## Sprint Objectives

### Primary Goals

1. **Remove External Dependencies:** Migrate from Supabase to PGlite for local-first development
2. **Deliver Broad Value:** Ship one high-value feature from each of the 6 product routes
3. **Maintain Quality:** Follow spec-driven development with PRD + Tech Spec for each feature
4. **Zero Regressions:** All existing features continue to work flawlessly

### Success Metrics

- ✅ PGlite migration complete with zero data loss
- ✅ All 6 features delivered and visually validated
- ✅ No new P0/P1 bugs introduced
- ✅ Performance targets maintained or improved
- ✅ Documentation updated (JOURNAL.md, AUDIT_LOG.md, task_plan.md)

---

## Phase 0: Real Data Foundation (Migration to PGlite)

### Objective

Replace Supabase with PGlite to enable local-first development with zero external dependencies.

### Why PGlite?

**Strategic Rationale:**
- **Local-First:** Database is a file in the repo (aligns with "Planning with Files" philosophy)
- **Zero Setup:** No API keys, no cloud accounts, no external services
- **Real Postgres:** Full SQL support, pgvector for semantic search, easy migration path
- **Autonomous Development:** Agents can develop without environment setup
- **Cost:** Literally $0 (runs in Node.js/browser)
- **Future-Proof:** Can sync to Turso/Supabase later for multi-user collaboration

### Requirements

**FR-0.1: PGlite Installation & Configuration**
- Install `@electric-sql/pglite` npm package
- Create database initialization script
- Configure database file location (`/data/11-11.db`)
- Add to `.gitignore` (database file should not be committed)

**FR-0.2: Schema Migration**
- Port existing Supabase schema to PGlite
- Maintain table structure: `prompts`, `prompt_metadata`, `critiques`
- Preserve indexes and constraints
- Add seed data script (20-30 realistic prompts)

**FR-0.3: Data Access Layer Refactor**
- Replace `lib/supabase/client.ts` with `lib/pglite/client.ts`
- Update `lib/supabase/prompts.ts` → `lib/pglite/prompts.ts`
- Update `lib/supabase/critiques.ts` → `lib/pglite/critiques.ts`
- Maintain identical API surface (no component changes needed)

**FR-0.4: Remove Supabase Dependencies**
- Uninstall `@supabase/supabase-js`
- Remove Supabase environment variables from `.env.example`
- Update README.md with PGlite setup instructions
- Deprecate mock data fallbacks (use real DB instead)

**FR-0.5: Migration Testing**
- Verify all existing features work with PGlite
- Test CRUD operations (create, read, update, delete)
- Validate critique engine integration
- Confirm status transitions work correctly

### Acceptance Criteria

- [ ] PGlite installed and configured
- [ ] Database schema migrated with seed data
- [ ] All data access layers updated
- [ ] Supabase dependencies removed
- [ ] All existing features work with PGlite
- [ ] Zero regressions in functionality
- [ ] Documentation updated

### Technical Decisions

**Database File Location:** `/data/11-11.db` (gitignored, created on first run)  
**Seed Data Strategy:** Auto-seed on first run if database is empty  
**Backup Strategy:** Manual export to JSON (can add cloud sync in v0.3+)  
**Migration Path:** PGlite (v0.2-0.5) → Turso sync (v0.6+) → Full cloud (v1.0+)

---

## Phase 1: Multi-File Tabs (Workbench Enhancement)

### Objective

Enable users to open and work on multiple prompts simultaneously with a tabbed interface.

### User Story

**As a** prompt engineer  
**I want** to open multiple prompts in tabs  
**So that** I can compare, reference, and switch between prompts quickly

### Requirements

**FR-1.1: Tab Bar Component**
- Display open files as tabs above the Monaco editor
- Show file name and source badge (Drive/GitHub)
- Highlight active tab
- Support up to 10 concurrent tabs

**FR-1.2: Unsaved Indicators**
- Show orange dot on tabs with unsaved changes
- Persist across tab switches
- Clear indicator when changes are saved

**FR-1.3: Tab Actions**
- Close tab with X button
- Close all tabs action
- Close other tabs action
- Reorder tabs via drag-and-drop (v0.3+, deferred)

**FR-1.4: Tab State Management**
- Persist open tabs in localStorage
- Restore tabs on page reload
- Track active tab index
- Handle tab close with unsaved changes (confirmation dialog)

**FR-1.5: Keyboard Shortcuts**
- `Cmd/Ctrl + W` - Close active tab
- `Cmd/Ctrl + Tab` - Next tab
- `Cmd/Ctrl + Shift + Tab` - Previous tab
- `Cmd/Ctrl + 1-9` - Jump to tab by index

### Acceptance Criteria

- [ ] Tab bar displays above editor
- [ ] Multiple files can be opened simultaneously
- [ ] Unsaved indicators work correctly
- [ ] Tab close actions work with confirmation
- [ ] Keyboard shortcuts functional
- [ ] Tab state persists across reloads
- [ ] Responsive design (mobile collapses to dropdown)

---

## Phase 2: Full Status Lifecycle UI (Librarian Enhancement)

### Objective

Complete the status management vision by implementing all status transitions in the UI.

### User Story

**As a** prompt engineer  
**I want** to manage prompts through their full lifecycle (draft → active → saved → archived)  
**So that** I can organize my prompt library effectively

### Requirements

**FR-2.1: Status Transition Buttons**
- Draft → Active: "Move to Seedlings"
- Active → Saved: "Save to Greenhouse" (already implemented)
- Saved → Active: "Move to Seedlings"
- Saved → Archived: "Archive"
- Archived → Active: "Restore"

**FR-2.2: Archive View**
- New route: `/librarian/archive`
- Display archived prompts in grid layout
- Show archive date and original status
- Restore action available

**FR-2.3: Status History Tracking**
- Add `status_history` JSONB column to `prompts` table
- Track all status transitions with timestamps
- Display status history in prompt details (v0.3+, deferred)

**FR-2.4: Bulk Status Operations**
- Select multiple prompts (checkbox UI)
- Bulk archive, bulk restore, bulk delete
- Confirmation dialog for bulk actions

**FR-2.5: Status Filters**
- Filter by status in Greenhouse view
- "Show archived" toggle
- Status badge in prompt cards

### Acceptance Criteria

- [ ] All status transitions available in UI
- [ ] Archive view functional
- [ ] Status history tracked in database
- [ ] Bulk operations work correctly
- [ ] Status filters functional
- [ ] Fixes [P2-003] bug
- [ ] Zero regressions in existing status transitions

---

## Phase 3: Real-Time File Operations (Storage Enhancement)

### Objective

Enable users to create, rename, and delete files directly from the 11-11 UI without external file system access.

### User Story

**As a** prompt engineer  
**I want** to create, rename, and delete prompt files from the UI  
**So that** I don't need to switch to external file managers

### Requirements

**FR-3.1: Create File/Folder**
- Right-click context menu in FileTree
- "New File" and "New Folder" actions
- Modal dialog for name input
- Create in Google Drive via API
- Update FileTree immediately (optimistic UI)

**FR-3.2: Rename File/Folder**
- Right-click context menu: "Rename"
- Inline editing in FileTree (double-click to edit)
- Update Google Drive via API
- Handle name conflicts gracefully

**FR-3.3: Delete File/Folder**
- Right-click context menu: "Delete"
- Confirmation dialog with warning
- Move to Google Drive Trash (soft delete)
- Remove from FileTree immediately

**FR-3.4: Context Menu Component**
- Reusable context menu component
- Position near cursor on right-click
- Close on outside click or Escape
- Keyboard navigation (arrow keys, Enter)

**FR-3.5: Error Handling**
- Handle API failures gracefully
- Show error toasts with retry option
- Rollback optimistic UI on failure
- Log errors to console for debugging

### Acceptance Criteria

- [ ] Create file/folder works via UI
- [ ] Rename works via inline editing and context menu
- [ ] Delete moves to Google Drive Trash
- [ ] Context menu functional and accessible
- [ ] Error handling robust
- [ ] Optimistic UI with rollback on failure
- [ ] All operations sync to Google Drive

---

## Phase 4: Dark Mode / Light Mode Toggle (UI/UX Enhancement)

### Objective

Implement theme switching to improve accessibility and user preference support.

### User Story

**As a** user  
**I want** to switch between dark and light themes  
**So that** I can work comfortably in different lighting conditions

### Requirements

**FR-4.1: Theme System**
- Define dark and light color palettes in Tailwind config
- Use CSS variables for theme colors
- Support system preference detection (`prefers-color-scheme`)
- Persist user preference in localStorage

**FR-4.2: Theme Toggle Component**
- Sun/Moon icon toggle in Header
- Smooth transition animation (200ms)
- Keyboard accessible (Tab, Enter, Space)
- ARIA labels for screen readers

**FR-4.3: Theme Application**
- Apply theme to all components
- Update Monaco editor theme (vs-dark / vs-light)
- Update syntax highlighting colors
- Ensure WCAG AA contrast compliance in both themes

**FR-4.4: Theme-Aware Components**
- Update all components to use theme variables
- Test all UI states in both themes
- Fix any contrast issues
- Ensure icons are visible in both themes

### Acceptance Criteria

- [ ] Dark and light themes defined
- [ ] Theme toggle works in Header
- [ ] Theme persists across reloads
- [ ] System preference detected on first load
- [ ] Monaco editor theme switches correctly
- [ ] All components work in both themes
- [ ] WCAG AA contrast compliance maintained
- [ ] Smooth transition animations

---

## Phase 5: One-Click Publish (Global Commons Foundation)

### Objective

Enable users to make prompts public with a single toggle, laying the foundation for the Global Commons.

### User Story

**As a** prompt engineer  
**I want** to publish my best prompts to the community  
**So that** others can discover and learn from my work

### Requirements

**FR-5.1: Public Toggle UI**
- Add "Make Public" toggle to prompt cards
- Show public badge on published prompts
- Confirmation dialog on first publish (explain implications)
- Optimistic UI update

**FR-5.2: Database Schema Update**
- `is_public` column already exists in `prompt_metadata`
- Add `published_at` timestamp column
- Add `visibility` enum: 'private' | 'unlisted' | 'public'
- Index on `is_public` for fast queries

**FR-5.3: Public Prompts View**
- Update `/librarian/commons` to show public prompts
- Filter: "My Public Prompts" vs "All Public Prompts"
- Sort by: Recent, Popular (view count), Highest Score
- Search and tag filtering

**FR-5.4: Privacy & Permissions**
- Only prompt owner can toggle public status
- Public prompts are read-only for others
- Add "Report" action for inappropriate content (v0.3+, deferred)
- Add license selection (CC0, MIT, etc.) (v0.3+, deferred)

**FR-5.5: Public Prompt Cards**
- Show author name
- Show publish date
- Show view count (v0.3+, deferred)
- "Copy to My Library" action
- "View Details" modal with full content

### Acceptance Criteria

- [ ] Public toggle works in UI
- [ ] Database schema updated
- [ ] Public prompts display in Commons view
- [ ] Privacy rules enforced
- [ ] Public prompt cards functional
- [ ] "Copy to My Library" works
- [ ] Zero regressions in existing Commons features

---

## Phase 6: Optimize Initial Page Load (Performance Enhancement)

### Objective

Reduce initial page load time from 4.6s to <2s target through code splitting and lazy loading.

### User Story

**As a** user  
**I want** the app to load quickly on first visit  
**So that** I can start working without waiting

### Requirements

**FR-6.1: Code Splitting**
- Split Monaco editor into separate chunk (lazy load)
- Split Framer Motion into separate chunk
- Split multi-agent components (load on demand)
- Use Next.js dynamic imports with `loading` states

**FR-6.2: Lazy Loading Strategy**
- Load critical path first (Header, Sidebar, FileTree)
- Defer Monaco editor until user opens a file
- Defer multi-agent panel until user switches tab
- Defer Librarian components until route is accessed

**FR-6.3: Bundle Analysis**
- Run `npm run build` with bundle analyzer
- Identify largest chunks
- Remove unused dependencies
- Tree-shake unused code

**FR-6.4: Asset Optimization**
- Optimize images (use WebP format)
- Lazy load images below fold
- Preload critical fonts
- Minimize CSS bundle

**FR-6.5: Performance Measurement**
- Measure First Contentful Paint (FCP)
- Measure Time to Interactive (TTI)
- Measure Largest Contentful Paint (LCP)
- Document results in JOURNAL.md

### Acceptance Criteria

- [ ] Initial page load <2s (target met)
- [ ] FCP <1s
- [ ] TTI <2s
- [ ] LCP <2.5s
- [ ] Bundle size reduced by 30%+
- [ ] Monaco editor loads on demand
- [ ] No regressions in functionality
- [ ] Performance metrics documented

---

## Testing & Validation

### Per-Phase Testing

Each phase MUST include:
- [ ] Lint check passes (`npm run lint`)
- [ ] Type check passes (`npm run build`)
- [ ] Visual validation via localhost screenshots
- [ ] Manual testing of all acceptance criteria
- [ ] Regression testing of related features

### End-to-End Testing

After all phases complete:
- [ ] Full user flow testing (create → edit → save → publish)
- [ ] Cross-browser testing (Chrome, Firefox, Safari)
- [ ] Responsive design testing (mobile, tablet, desktop)
- [ ] Accessibility audit (WCAG 2.1 AA)
- [ ] Performance benchmarking

### Bug Tracking

- [ ] Update `05_Logs/BUGS.md` with any new issues
- [ ] Fix all P0/P1 bugs before sprint completion
- [ ] Document P2/P3 bugs for future sprints

---

## Documentation Requirements

### Required Updates

- [ ] **JOURNAL.md:** Document all architectural decisions, component changes, and build log
- [ ] **AUDIT_LOG.md:** Add sprint entry with technical decisions, dependencies, and known limitations
- [ ] **task_plan.md:** Update roadmap to reflect v0.2.0 completion
- [ ] **README.md:** Update setup instructions for PGlite
- [ ] **`.env.example`:** Remove Supabase variables, add any new variables

### New Documentation

- [ ] **`01_PRDs/PGLITE_MIGRATION_PRD.md`:** Migration rationale and requirements
- [ ] **`02_Specs/multi_file_tabs_spec.md`:** Technical specification for Phase 1
- [ ] **`02_Specs/status_lifecycle_spec.md`:** Technical specification for Phase 2
- [ ] **`02_Specs/file_operations_spec.md`:** Technical specification for Phase 3
- [ ] **`02_Specs/theme_system_spec.md`:** Technical specification for Phase 4
- [ ] **`02_Specs/public_prompts_spec.md`:** Technical specification for Phase 5
- [ ] **`02_Specs/performance_optimization_spec.md`:** Technical specification for Phase 6

---

## Risk Assessment

### High Risk

**Risk:** PGlite migration breaks existing features  
**Mitigation:** Maintain identical API surface, comprehensive regression testing  
**Contingency:** Keep Supabase code in git history for quick rollback

**Risk:** Six features in one sprint creates scope creep  
**Mitigation:** Strict acceptance criteria, phase-by-phase delivery, defer non-critical features  
**Contingency:** Ship phases incrementally (0.2.0, 0.2.1, 0.2.2, etc.)

### Medium Risk

**Risk:** Performance optimization doesn't hit 2s target  
**Mitigation:** Profile before optimizing, focus on biggest wins first  
**Contingency:** Ship incremental improvements, defer to v0.2.1

**Risk:** Real-time file operations have API rate limits  
**Mitigation:** Implement request throttling, batch operations  
**Contingency:** Add offline queue, retry logic

### Low Risk

**Risk:** Dark mode has contrast issues  
**Mitigation:** Use WCAG AA compliant color palette, automated contrast checking  
**Contingency:** Quick CSS fixes, user feedback loop

---

## Success Criteria Summary

### Must Have (Sprint Cannot Ship Without These)

- ✅ PGlite migration complete with zero data loss
- ✅ All 6 features delivered and functional
- ✅ No new P0/P1 bugs introduced
- ✅ All existing features work correctly
- ✅ Documentation updated

### Should Have (High Priority, But Can Defer)

- ✅ Performance target met (<2s page load)
- ✅ All acceptance criteria met for each phase
- ✅ Visual validation screenshots captured
- ✅ Accessibility compliance maintained

### Nice to Have (Can Defer to v0.2.1)

- Tab reordering via drag-and-drop
- Status history display in UI
- Report/moderation for public prompts
- License selection for public prompts
- View count tracking

---

## Zenflow Automation Protocol

**Setup Script:** `npm install`  
**Dev Server Script:** `npm run dev`  
**Cleanup Script:** `npm run lint && npm run build`  
**Copy Files:** `.env.local` (if any new variables added)

---

**Author:** Manus AI (Dojo)  
**Status:** Sprint Scope Approved  
**Seed:** Sprint v0.2.0 Foundation & Growth  
**Date:** January 12, 2026
