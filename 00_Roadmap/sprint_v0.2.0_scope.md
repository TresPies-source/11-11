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
3. **Maintain Quality:** Follow spec-driven development (PRD + Tech Spec generated in Zenflow sandbox)
4. **Zero Regressions:** All existing features continue to work flawlessly

### Success Metrics

- ✅ PGlite migration complete with zero data loss
- ✅ All 6 features delivered and visually validated
- ✅ No new P0/P1 bugs introduced
- ✅ Performance targets maintained or improved
- ✅ Documentation updated (JOURNAL.md, AUDIT_LOG.md, task_plan.md)

---

## Documentation Strategy

### Zenflow Sandbox Approach

Zenflow will generate **PRD and Tech Spec in its own sandbox** during execution. These documents guide implementation but are **not committed to the repository**.

**What gets committed to the repo:**
- ✅ Implementation code (components, hooks, APIs)
- ✅ JOURNAL.md updates (architectural decisions, build log)
- ✅ AUDIT_LOG.md updates (sprint summary, technical decisions)
- ✅ task_plan.md updates (roadmap status)
- ✅ README.md updates (setup instructions)
- ✅ BUGS.md updates (if issues discovered)

**What stays in Zenflow sandbox:**
- PRD (product requirements)
- Tech Spec (technical specification)
- Implementation plan
- Internal task tracking

**Why this approach?**
- Reduces repository documentation bloat
- Zenflow maintains its own working context
- Repository stays focused on code and essential documentation
- Aligns with "Planning with Files" for code, not planning artifacts

---

## Phase 0: Real Data Foundation (PGlite Migration)

### Objective

Replace Supabase with PGlite to enable local-first development with zero external dependencies.

### Why PGlite?

- **Local-First:** Database is a file in the repo (aligns with "Planning with Files" philosophy)
- **Zero Setup:** No API keys, no cloud accounts, no external services
- **Real Postgres:** Full SQL support, pgvector for semantic search, easy migration path
- **Autonomous Development:** Agents can develop without environment setup
- **Cost:** $0 (runs in Node.js/browser)
- **Future-Proof:** Can sync to Turso/Supabase later for multi-user collaboration

### Requirements Summary

- Install `@electric-sql/pglite` npm package
- Port existing Supabase schema to PGlite (prompts, prompt_metadata, critiques tables)
- Refactor data access layer (maintain identical API surface—no component changes)
- Remove Supabase dependencies completely
- Create seed data script (20-30 realistic prompts)
- Comprehensive migration testing

### Acceptance Criteria

- [ ] PGlite installed and configured at `/data/11-11.db`
- [ ] Database schema migrated with seed data
- [ ] All data access layers updated (no component changes needed)
- [ ] Supabase dependencies removed
- [ ] All existing features work with PGlite
- [ ] Zero regressions in functionality

---

## Phase 1: Multi-File Tabs (Workbench Enhancement)

### Objective

Enable users to open and work on multiple prompts simultaneously with a tabbed interface.

### Requirements Summary

- Tab bar component above Monaco editor
- Unsaved indicators (orange dot)
- Tab actions (close, close all, close others)
- State management (persist in localStorage)
- Keyboard shortcuts (Cmd/Ctrl+W, Cmd/Ctrl+Tab, Cmd/Ctrl+1-9)

### Acceptance Criteria

- [ ] Tab bar displays above editor
- [ ] Multiple files can be opened (up to 10 tabs)
- [ ] Unsaved indicators work correctly
- [ ] Tab close with unsaved changes shows confirmation
- [ ] Keyboard shortcuts functional
- [ ] Tab state persists across reloads
- [ ] Responsive design (mobile collapses to dropdown)

---

## Phase 2: Full Status Lifecycle UI (Librarian Enhancement)

### Objective

Complete the status management vision by implementing all status transitions in the UI. Fixes bug [P2-003].

### Requirements Summary

- All status transition buttons (draft→active, active→saved, saved→active, saved→archived, archived→active)
- Archive view at `/librarian/archive`
- Status history tracking (add `status_history` JSONB column)
- Bulk operations (select multiple, bulk archive/restore/delete)
- Status filters in Greenhouse view

### Acceptance Criteria

- [ ] All status transitions available in UI
- [ ] Archive view functional
- [ ] Status history tracked in database
- [ ] Bulk operations work correctly
- [ ] Status filters functional
- [ ] Bug [P2-003] resolved
- [ ] Zero regressions in existing status transitions

---

## Phase 3: Real-Time File Operations (Storage Enhancement)

### Objective

Enable users to create, rename, and delete files directly from the 11-11 UI via Google Drive API.

### Requirements Summary

- Create file/folder (right-click context menu)
- Rename (inline editing, context menu)
- Delete (move to Google Drive Trash, not permanent)
- Context menu component (reusable, accessible)
- Error handling (graceful failures, optimistic UI with rollback)

### Acceptance Criteria

- [ ] Create file/folder works via UI
- [ ] Rename works via inline editing and context menu
- [ ] Delete moves to Google Drive Trash
- [ ] Context menu functional and accessible
- [ ] Error handling robust with retry option
- [ ] Optimistic UI with rollback on failure
- [ ] All operations sync to Google Drive

---

## Phase 4: Dark Mode / Light Mode Toggle (UI/UX Enhancement)

### Objective

Implement theme switching to improve accessibility and user preference support.

### Requirements Summary

- Theme system (dark/light palettes in Tailwind config)
- Theme toggle component (Sun/Moon icon in Header)
- Theme application to all components
- Monaco editor theme switching
- System preference detection (`prefers-color-scheme`)
- Persist in localStorage

### Acceptance Criteria

- [ ] Dark and light themes defined with WCAG AA contrast
- [ ] Theme toggle works in Header
- [ ] Theme persists across reloads
- [ ] System preference detected on first load
- [ ] Monaco editor theme switches correctly
- [ ] All components work in both themes
- [ ] Smooth transition animations (200ms)

---

## Phase 5: One-Click Publish (Global Commons Foundation)

### Objective

Enable users to make prompts public with a single toggle, laying the foundation for the Global Commons.

### Requirements Summary

- Public toggle UI ("Make Public" in prompt cards)
- Database schema update (add `published_at`, `visibility` enum)
- Public prompts view in `/librarian/commons`
- Privacy rules (owner-only toggle, read-only for others)
- Public prompt cards (show author, publish date, "Copy to My Library")

### Acceptance Criteria

- [ ] Public toggle works with confirmation on first publish
- [ ] Database schema updated
- [ ] Public prompts display in Commons view
- [ ] Privacy rules enforced
- [ ] "Copy to My Library" works
- [ ] Filter: "My Public Prompts" vs "All Public Prompts"
- [ ] Sort by: Recent, Popular, Highest Score

---

## Phase 6: Optimize Initial Page Load (Performance Enhancement)

### Objective

Reduce initial page load time from 4.6s to <2s target through code splitting and lazy loading.

### Requirements Summary

- Code splitting (Monaco, Framer Motion, multi-agent into separate chunks)
- Lazy loading strategy (critical path first, defer non-critical)
- Bundle analysis (identify largest chunks, tree-shake)
- Asset optimization (WebP images, lazy load, preload fonts)
- Performance measurement (FCP, TTI, LCP)

### Acceptance Criteria

- [ ] Initial page load <2s (target met)
- [ ] First Contentful Paint (FCP) <1s
- [ ] Time to Interactive (TTI) <2s
- [ ] Largest Contentful Paint (LCP) <2.5s
- [ ] Bundle size reduced by 30%+
- [ ] Monaco editor loads on demand
- [ ] No regressions in functionality
- [ ] Performance metrics documented in JOURNAL.md

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

### Required Updates (Committed to Repo)

- [ ] **JOURNAL.md:** Document all architectural decisions, component changes, and build log
- [ ] **AUDIT_LOG.md:** Add sprint entry with technical decisions, dependencies, and known limitations
- [ ] **task_plan.md:** Update roadmap to reflect v0.2.0 completion
- [ ] **README.md:** Update setup instructions for PGlite (remove Supabase)
- [ ] **`.env.example`:** Remove Supabase variables, add any new variables

### Sandbox Documentation (Not Committed)

- PRD (product requirements) - Generated in Zenflow sandbox
- Tech Spec (technical specification) - Generated in Zenflow sandbox
- Implementation plan - Maintained in Zenflow sandbox

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
- ✅ Documentation updated (JOURNAL, AUDIT_LOG, task_plan)

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
**Cleanup Script:** `npm run lint; npm run build` (Windows bash compatible)  
**Copy Files:** `.env.local` (if any new variables added)

---

**Author:** Manus AI (Dojo)  
**Status:** Sprint Scope Final  
**Seed:** Sprint v0.2.0 Foundation & Growth (Sandbox PRD/Spec)  
**Date:** January 12, 2026
