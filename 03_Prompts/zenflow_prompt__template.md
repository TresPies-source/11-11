# Zenflow Prompt Template: 11-11 Sustainable Intelligence OS

**Context & Documentation:**

Before starting any sprint, you MUST review these core documentation files to understand the current state of the project:

1. **`00_Roadmap/task_plan.md`** - Master roadmap showing completed sprints, current sprint, and future plans
2. **`05_Logs/AUDIT_LOG.md`** - Weekly Monday Morning Audit entries documenting technical decisions, debt, and action items
3. **`JOURNAL.md`** - Historical record of what has been built, architectural decisions, and component structure
4. **`05_Logs/BUGS.md`** - Active bug tracking with priority levels (P0-P3) and resolution status

**CRITICAL: Documentation Reading Strategy**

**Always read documentation from BOTH ends:**
- **Start at the END** (last 50-150 lines) to catch the most recent updates, decisions, and sprint completions
- **Then read the BEGINNING** (first 50-100 lines) to understand the foundational context and structure

This dual-pass approach ensures you have both the latest state AND the historical context. Use `tail -100 <file>` and `head -100 <file>` commands to efficiently scan both ends.

**Why this matters:** Recent sprints, bug fixes, and architectural decisions are always appended to the end of these files. Reading only from the beginning means missing critical context about what was just completed or changed.

**Current Project State (as of January 12, 2026):**

- **Version:** 0.1.1
- **Last Completed Sprint:** The Librarian's Home (v0.1) - ✅ Complete
- **Last Validation Sprint:** Hotfix & Validate - ✅ Complete
  - Resolved authentication issues
  - Fixed 5 bugs (2 P1, 3 P2)
  - 2 P2 bugs remain open (dev-mode refresh issue, limited status transitions)
- **Next Planned Sprint:** Hybrid Storage Enhancement (Google Drive + GitHub sync)

**Core Features Delivered:**

✅ UI Shell & Workbench (resizable panels, file tree, multi-agent layout)  
✅ Monaco-based Markdown Editor with auto-save  
✅ Google Drive Hybrid Sync v0.1  
✅ Shared Context Bus (Mitt event emitter)  
✅ The Librarian's Home with Seedling/Greenhouse sections  
✅ Reactive Critique Engine (4-dimension scoring)  
✅ Supabase Integration (prompts, metadata, critiques)  
✅ Status Management (draft, active, saved, archived)  

**Tech Stack:**

- **Frontend:** Next.js 14 (App Router), React, TypeScript, Tailwind CSS
- **Editor:** Monaco Editor
- **Animations:** Framer Motion
- **Database:** Supabase (PostgreSQL)
- **Storage:** Google Drive API (GitHub sync planned)
- **Auth:** NextAuth with Google OAuth
- **Event Bus:** Mitt

**Zenflow Automation Protocol:**

- **Setup Script:** `npm install`
- **Dev Server Script:** `npm run dev`
- **Cleanup Script:** `npm run lint && npm test`
- **Copy Files:** `.env.local` (for Supabase credentials and `AUTH_SECRET`)

---

## Sprint Template

**Sprint Name:** [Name of Sprint]

**Objective:** [Clear, one-sentence objective]

**Context & Rationale:**

[Why this sprint? What problem does it solve? How does it align with the Master Blueprint?]

**Key Features & Tasks:**

[Organized list of features and implementation tasks]

**Success Criteria:**

[Clear, measurable outcomes that define sprint completion]

**Out of Scope for this Sprint:**

[Explicitly state what is NOT included to maintain focus]

**Documentation Updates Required:**

- [ ] Update `JOURNAL.md` with architectural decisions and build log
- [ ] Update `AUDIT_LOG.md` if technical debt or decisions emerge
- [ ] Update `task_plan.md` to reflect sprint completion
- [ ] Create or update relevant PRDs/Specs in `/01_PRDs/` and `/02_Specs/`

**Testing & Validation:**

- [ ] Lint check passes (`npm run lint`)
- [ ] Type check passes (`npm run build`)
- [ ] Visual validation via localhost screenshots
- [ ] Update `BUGS.md` if issues are discovered

---

**Philosophy Reminder:**

This project follows **Sustainable Innovation** principles. Prioritize stability, documentation, and "calm" development over rapid feature accumulation. Every sprint should leave the codebase in a better state than it was found.
