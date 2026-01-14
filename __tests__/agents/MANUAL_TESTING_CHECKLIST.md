# Manual Testing Checklist - Agent Registry UI

## Setup
- [ ] Start dev server: `npm run dev`
- [ ] Navigate to http://localhost:3000/agents
- [ ] Open browser DevTools (Network, Console, Performance tabs)

---

## Page Load Tests

### Registry Page (`/agents`)
- [ ] Page loads without errors (check console)
- [ ] All agents display in grid layout
- [ ] Loading skeletons show briefly while fetching
- [ ] Grid is responsive (test at 320px, 768px, 1024px, 1920px widths)
- [ ] Header displays correctly: "Agent Registry" + subtitle
- [ ] No layout shift after data loads (CLS check)

### Agent Cards
- [ ] Each card displays: icon, name, tagline, status indicator
- [ ] Status indicator is green for online agents
- [ ] Status indicator is gray for offline agents
- [ ] Icons are visible (not broken/missing)
- [ ] Text is readable (sufficient contrast)

---

## Interaction Tests

### Agent Card Interactions
- [ ] Hover over card shows scale/shadow animation
- [ ] Hover animation is smooth (no jank)
- [ ] Click card opens agent details modal
- [ ] Correct agent data loads in modal
- [ ] Multiple cards can be clicked in sequence

### Agent Details Modal
- [ ] Modal opens smoothly with animation
- [ ] Modal displays over dark overlay
- [ ] Header shows: agent icon, name, status badge
- [ ] "Purpose" section displays description
- [ ] "When to Use" section displays bulleted list
- [ ] "What It Doesn't Do" section displays bulleted list
- [ ] Usage stats section displays (if available):
  - [ ] Query count
  - [ ] Total cost (formatted as USD)
  - [ ] Average tokens used
  - [ ] Last used timestamp (formatted)
- [ ] Usage stats shows "No usage data yet" if stats are null
- [ ] "Test Agent" button is visible and clickable
- [ ] "Close" button is visible and clickable

### Modal Close Behaviors
- [ ] Click "Close" button closes modal
- [ ] Press ESC key closes modal
- [ ] Click outside modal (on overlay) closes modal
- [ ] Modal exit animation plays smoothly
- [ ] Focus returns to clicked card after close

### Test Agent Interface
- [ ] Click "Test Agent" button opens test interface
- [ ] Textarea is visible and focusable
- [ ] Placeholder text is helpful
- [ ] "Route Query" button is visible
- [ ] Submit empty query shows validation error
- [ ] Submit valid query shows loading state (spinner)
- [ ] Result displays after routing:
  - [ ] Selected agent name
  - [ ] Confidence score (0.00 to 1.00)
  - [ ] Reasoning text
  - [ ] Cost breakdown (tokens + USD)
  - [ ] Fallback indicator (if keyword routing used)
- [ ] Multiple test queries can be submitted
- [ ] Loading state prevents double submission
- [ ] Error messages display for API failures

---

## Accessibility Tests

### Keyboard Navigation
- [ ] Tab through all interactive elements in order
- [ ] Focus indicators are visible on all elements
- [ ] Enter key opens modal from card
- [ ] ESC key closes modal
- [ ] Tab focus stays trapped inside modal (focus trap)
- [ ] First focusable element in modal receives focus on open

### Screen Reader
- [ ] Agent cards have descriptive labels
- [ ] Modal has `role="dialog"` and `aria-modal="true"`
- [ ] Modal has accessible name (via `aria-labelledby`)
- [ ] Status indicators have accessible text (not just color)
- [ ] All buttons have descriptive labels
- [ ] Form inputs have associated labels
- [ ] Error messages are announced

### ARIA Attributes
- [ ] Cards have appropriate ARIA roles/labels
- [ ] Modal has proper ARIA attributes
- [ ] Loading states use `aria-busy="true"`
- [ ] Error messages use `aria-live="polite"`

---

## Performance Tests

### Page Load Performance
- [ ] Page loads in <500ms (check Network tab)
- [ ] First Contentful Paint <300ms
- [ ] Largest Contentful Paint <500ms
- [ ] No long tasks (>50ms)
- [ ] Total Blocking Time <200ms

### Modal Performance
- [ ] Modal opens in <200ms (visual inspection)
- [ ] Modal animations run at 60fps (no jank)
- [ ] No layout recalculations on open

### Test Routing Performance
- [ ] Test routing completes in <2s
- [ ] API response time <1s (check Network tab)
- [ ] No memory leaks (test 10+ consecutive queries)

### Lighthouse Audit
- [ ] Run Lighthouse audit (DevTools → Lighthouse)
- [ ] Performance score ≥90
- [ ] Accessibility score ≥90
- [ ] Best Practices score ≥90
- [ ] SEO score ≥90

---

## Error Handling Tests

### Network Errors
- [ ] Disconnect network, reload page
- [ ] Error state displays with retry button
- [ ] Click retry fetches data successfully
- [ ] Toast/error message is user-friendly

### API Errors
- [ ] Test with invalid agent ID (404)
- [ ] Test with malformed query (400)
- [ ] Test with API timeout
- [ ] All errors display helpful messages

### Missing Data
- [ ] Agent with no usage stats shows "No usage data yet"
- [ ] Agent with no icon shows fallback icon
- [ ] Agent with empty description shows fallback message

---

## Responsive Design Tests

### Mobile (320px - 767px)
- [ ] Grid shows 1 column
- [ ] Cards are full width
- [ ] Modal is full screen
- [ ] Text is readable (min 16px font size)
- [ ] Touch targets are ≥44px (buttons, cards)
- [ ] No horizontal scrolling

### Tablet (768px - 1023px)
- [ ] Grid shows 2 columns
- [ ] Cards are appropriately sized
- [ ] Modal is centered, max-width applied
- [ ] Layout adapts smoothly

### Desktop (1024px+)
- [ ] Grid shows 2 columns (or more if space)
- [ ] Modal is centered, max-width applied
- [ ] Hover effects work on all cards
- [ ] Layout is balanced and visually appealing

---

## Cross-Browser Tests

### Chrome
- [ ] All features work correctly
- [ ] Animations are smooth
- [ ] No console errors

### Firefox
- [ ] All features work correctly
- [ ] Animations are smooth
- [ ] No console errors

### Safari
- [ ] All features work correctly
- [ ] Animations are smooth
- [ ] No console errors

### Edge
- [ ] All features work correctly
- [ ] Animations are smooth
- [ ] No console errors

---

## Data Accuracy Tests

### Registry Data
- [ ] Supervisor agent is listed
- [ ] Dojo agent is listed
- [ ] Librarian agent is listed
- [ ] Debugger agent is listed (if implemented)
- [ ] All agents have unique icons
- [ ] All agents have descriptive taglines
- [ ] All agents have complete descriptions

### Usage Stats
- [ ] Stats match database records
- [ ] Costs are formatted correctly (2-5 decimal places)
- [ ] Timestamps are formatted as human-readable dates
- [ ] Query counts are accurate

### Test Routing
- [ ] Routing decisions match expected behavior
- [ ] Confidence scores are reasonable (0.7-1.0 for confident routing)
- [ ] Fallback indicator shows for keyword routing
- [ ] Cost estimates are accurate

---

## Integration Tests

### Cost Guard Integration
- [ ] Usage stats pull from `routing_costs` table
- [ ] Cost breakdowns match Cost Guard calculations
- [ ] No double counting of costs

### Harness Trace Integration
- [ ] (If available) Test queries are logged
- [ ] (If available) Activity history is accessible

### Supervisor Router Integration
- [ ] Test routing uses same logic as production routing
- [ ] Routing decisions are consistent
- [ ] All agents are routable

---

## Edge Cases

### Unusual Inputs
- [ ] Very long query (>1000 characters)
- [ ] Query with special characters
- [ ] Query in non-English language
- [ ] Empty query (validation)
- [ ] Only whitespace query (validation)

### State Management
- [ ] Open modal, navigate away, come back (state persists)
- [ ] Test query, close modal, reopen (state resets)
- [ ] Multiple modals in quick succession (no conflicts)

### Concurrency
- [ ] Click multiple cards rapidly (no race conditions)
- [ ] Submit multiple test queries rapidly (queued correctly)

---

## Visual Regression Tests

### Screenshots
- [ ] Take screenshots of:
  - [ ] Registry page (all agents visible)
  - [ ] Agent card hover state
  - [ ] Modal open state
  - [ ] Usage stats display
  - [ ] Test agent interface
  - [ ] Test routing results
  - [ ] Error states
  - [ ] Loading states

### Compare Against Design
- [ ] Colors match design system
- [ ] Typography matches design system
- [ ] Spacing matches design system
- [ ] Animations match design expectations

---

## Final Checks

- [ ] No console errors or warnings
- [ ] No TypeScript errors (`npm run type-check`)
- [ ] No lint errors (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] All existing features still work (zero regressions)
- [ ] Code is well-documented (JSDoc comments)
- [ ] README is updated
- [ ] JOURNAL.md is updated

---

## Sign-off

**Tester Name:** ___________________________  
**Date:** ___________________________  
**Browser/OS:** ___________________________  
**Pass/Fail:** ___________________________  
**Notes:** ___________________________
