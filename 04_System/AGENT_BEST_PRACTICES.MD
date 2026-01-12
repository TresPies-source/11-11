# Agent Best Practices for 11-11 Development

**Last Updated:** January 12, 2026

This document outlines critical best practices for all AI agents (Manus, Zenflow, Supervisor, etc.) working on the 11-11 Sustainable Intelligence OS.

---

## 1. Documentation Reading Strategy

### CRITICAL: Always Read from BOTH Ends

When reviewing project documentation, you MUST use a **dual-pass approach**:

1. **Start at the END** (last 50-150 lines)
   - Captures the most recent sprint completions
   - Shows latest bug fixes and resolutions
   - Reveals current technical decisions
   - Identifies active work and next steps

2. **Then read the BEGINNING** (first 50-100 lines)
   - Provides foundational context
   - Explains document structure
   - Defines core principles and philosophy

### Why This Matters

Recent updates, sprint completions, and architectural decisions are **always appended to the end** of documentation files. Reading only from the beginning means missing critical context about what was just completed or changed.

### Implementation

Use these shell commands for efficient scanning:

```bash
# Read the END first (most recent updates)
tail -100 00_Roadmap/task_plan.md
tail -100 05_Logs/AUDIT_LOG.md
tail -150 JOURNAL.md
tail -100 05_Logs/BUGS.md

# Then read the BEGINNING (foundational context)
head -100 00_Roadmap/task_plan.md
head -100 05_Logs/AUDIT_LOG.md
head -100 JOURNAL.md
```

---

## 2. Core Documentation Files

### Must-Read Before Every Sprint

1. **`00_Roadmap/task_plan.md`**
   - Master roadmap and strategic direction
   - Completed sprints and current sprint status
   - Future plans and deferred features

2. **`05_Logs/AUDIT_LOG.md`**
   - Weekly Monday Morning Audit entries
   - Technical decisions and rationale
   - Known technical debt
   - Action items and next steps

3. **`JOURNAL.md`**
   - Historical build log
   - Architectural decisions
   - Component structure and relationships
   - Performance metrics and test results

4. **`05_Logs/BUGS.md`**
   - Active bug tracking (P0-P3 priority levels)
   - Resolution status
   - Testing progress
   - Known limitations

---

## 3. Sustainable Innovation Principles

### Philosophy

This project follows **Sustainable Innovation** principles:

- **Paced Development:** Prioritize stability over speed
- **Documentation First:** The filesystem is the source of truth
- **Visual Validation:** Every major component must be visually verified via localhost screenshots
- **Calm UX:** Subtle animations, clean interfaces, high-signal design
- **Creator Well-being:** No burnout, no crunch, no technical debt accumulation

### Practical Application

- ✅ Complete one sprint fully before starting the next
- ✅ Update documentation (JOURNAL.md, AUDIT_LOG.md) after every sprint
- ✅ Fix bugs before adding new features
- ✅ Write tests and validate performance
- ✅ Use dev-mode fallbacks for autonomous development
- ❌ Do not skip validation sprints
- ❌ Do not accumulate technical debt
- ❌ Do not rush features without documentation

---

## 4. Zenflow Automation Protocol

Every Zenflow prompt MUST include these four fields:

```markdown
**Zenflow Automation Protocol:**
- **Setup Script:** `npm install`
- **Dev Server Script:** `npm run dev`
- **Cleanup Script:** `npm run lint && npm test`
- **Copy Files:** `.env.local` (for Supabase credentials and `AUTH_SECRET`)
```

---

## 5. Sprint Completion Checklist

Before marking any sprint as complete:

- [ ] All acceptance criteria met
- [ ] Documentation updated (JOURNAL.md, AUDIT_LOG.md, task_plan.md)
- [ ] Lint check passes (`npm run lint`)
- [ ] Type check passes (`npm run build`)
- [ ] Visual validation via localhost screenshots
- [ ] BUGS.md updated with any discovered issues
- [ ] Performance metrics measured and documented
- [ ] No regressions in existing features

---

## 6. Communication Standards

### When Reporting Progress

- Use **concrete metrics** (page load time, FPS, bug count)
- Reference **specific files** and line numbers
- Include **visual evidence** (screenshots, console logs)
- Document **tradeoffs** and decisions made

### When Requesting Clarification

- State what you **know** vs. what you **need to know**
- Propose **2-3 options** with tradeoffs (Scout mode)
- Reference **relevant documentation** sections
- Suggest a **smallest test** to learn fast

---

## 7. Git & Version Control

### Commit Message Format

```
[Sprint Name] Brief description

- Detailed change 1
- Detailed change 2
- Detailed change 3

Closes: #issue-number (if applicable)
```

### Branch Strategy

- `main` - Production-ready code
- `dev` - Integration branch for testing
- `feature/sprint-name` - Individual sprint branches

---

## 8. Error Handling & Debugging

### When Encountering Errors

1. **Read the error message carefully** - Most errors are self-explanatory
2. **Check recent changes** - Use `git diff` to see what changed
3. **Review documentation** - Check if the issue is a known limitation
4. **Test in isolation** - Create a minimal reproduction case
5. **Document the fix** - Update BUGS.md or JOURNAL.md

### Dev Mode Fallbacks

Always implement **dev-mode fallbacks** for external dependencies:

```typescript
const isDev = !process.env.NEXT_PUBLIC_SUPABASE_URL;
if (isDev) {
  return mockData; // Seamless fallback
}
```

This enables autonomous development without requiring full environment setup.

---

## 9. Performance Standards

### Targets (from AUDIT_LOG.md)

- **Page load:** <2 seconds (50 prompts)
- **Critique calculation:** <1 second
- **Search response:** <300ms
- **Animations:** 60fps
- **Cumulative Layout Shift (CLS):** 0

### Measurement

Use browser DevTools Performance tab and document results in JOURNAL.md.

---

## 10. Accessibility Standards

### WCAG 2.1 Level AA Compliance

- ✅ Keyboard navigation (Tab, Enter, Space)
- ✅ Focus indicators (focus-visible:ring-2)
- ✅ ARIA labels and roles
- ✅ Semantic HTML structure
- ✅ Touch targets ≥44×44px
- ✅ Screen reader support

---

**Author:** Manus AI (Dojo)  
**Status:** Living Document  
**Seed:** Agent Best Practices v1.0
