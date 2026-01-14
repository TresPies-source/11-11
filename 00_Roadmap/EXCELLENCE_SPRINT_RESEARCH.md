# Excellence Sprint - Visual Research & Micro-Interactions

**Date:** January 2026  
**Status:** In Progress  
**Goal:** Elevate Dojo Genesis to 11/10 with premium micro-interactions and visual polish

---

## Research Source 1: Premium Micro-Interactions

**Source:** [5 micro-interactions to make any product feel premium](https://medium.com/@ryan.almeida86/5-micro-interactions-to-make-any-product-feel-premium-68e3b3eae3bf)

### Key Insights

**Philosophy:** "Premium is subtle. Desperate is not."

---

### 1. Tap/Click Feedback

**The Problem:** Most products dim buttons by 1% which no one can see.

**Premium Solution:**
- Light pulse
- Tiny shrink (scale: 0.98)
- Soft bounce
- Micro vibration (mobile)

**Why It Works:** Instant acknowledgment. "Humans love acknowledgment. That's why people like dogs."

**Timing:** < 100ms response time

**Dojo Genesis Application:**
- Agent cards: Soft pulse when clicked
- CTA buttons: Tiny shrink + amber glow
- Sidebar items: Gentle highlight + micro lift

---

### 2. Loading States

**The Problem:** Spinning wheels from Windows XP era. Users assume the world is ending.

**Premium Solutions:**

**A. Skeleton Screen**
- Shows shape of content before it loads
- "Hold on, your food is coming, we're just plating it"

**B. Progress Bar (Real, Not Fake)**
- Smooth, honest progress
- Communicates actual loading state
- More comforting than pretending everything is instant

**C. Animated Nudge**
- Pulse, shimmer, or soft slide
- Not fireworks, just a tiny hint of motion

**Why It Works:** "Luxury isn't speed. It's calm."

**Messaging:** Avoid "Loading..." Say "Preparing your dashboard" or "Analyzing query..."

**Dojo Genesis Application:**
- Agent thinking: Pulsing agent icon + "Supervisor is routing your query..."
- Librarian search: Skeleton cards + "Searching 1,000+ prompts..."
- Dojo synthesis: Progress bar + "Synthesizing perspectives..."

---

### 3. Hover States (Desktop)

**The Problem:** Nothing happens = dead product. Too much happens = clown explosion.

**Premium Solutions:**

**A. Gentle Highlights**
- Small color shift
- Thin border fade
- Soft shadow
- "Hey, I'm active," not "LOOK AT ME"

**B. Cursor Changes**
- Right cursor for right moment
- Pointer for clickable, text for editable

**C. Micro Movements**
- Tiny lift (translateY: -2px)
- Slight tilt
- Micro shift

**Why It Works:** "The UI is paying attention. Like a maître d' at a high-end restaurant."

**Warning:** Avoid hover effects that shift layout. "No one wants a checkbox that dodges their mouse like a ninja."

**Dojo Genesis Application:**
- Agent cards: Soft shadow + 2px lift
- Prompt cards: Border fade (amber) + gentle highlight
- Seed cards: Micro tilt + color shift
- Sidebar items: Background fade + icon color shift

---

### 4. Transitions

**The Problem:** Fade in, fade out = low-budget movie scene.

**Premium Solutions:**

**A. Directional Sliding**
- Left-to-right for navigation
- Bottom-up for modals
- Not random. "Random is chaos."

**B. Smooth Scrolling**
- No jittering, no harsh jumps
- "Scrolls like butter on a warm pan"

**C. Context Connections**
- Click something → thing appears connected to it
- Close something → returns to where it came from
- Mirrors how real objects behave

**Why It Works:** "Users don't just see transitions. They feel them."

**Warning:** "If your transition looks like a PowerPoint animation, delete it."

**Dojo Genesis Application:**
- Agent panel: Slide from right (expand), slide to right (collapse)
- Modals: Bottom-up with backdrop fade
- Sidebar: Smooth width transition (300ms ease-out)
- Page transitions: Fade + slight slide (200ms)

---

### 5. Success Feedback

**The Problem:** Confetti is fun once. Second time = mocking. Third time = life choices questioned.

**Premium Solutions:**

**A. Clean Checkmark Animation**
- Not spinning, not exploding
- Confident tick

**B. Subtle Color Shift**
- Premium green (not radioactive)
- Matches brand palette

**C. Short, Warm Message**
- "Saved" or "All set"
- Not "Yay, you did it!" (users aren't toddlers)

**D. Small Sound (Optional)**
- Soft click or chime
- Not video game victory tune

**Why It Works:** "Real confidence is quiet."

**Warning:** "If your success animation takes longer than the task you completed, rethink your life."

**Dojo Genesis Application:**
- Prompt saved: Checkmark + "Saved" + soft green glow (500ms)
- Seed planted: Bonsai icon + "Seed planted" + amber glow
- Agent complete: Status dot green + "Complete" (no confetti)
- First prompt milestone: Subtle celebration (one-time only)

---

## Key Principles for Dojo Genesis

### Timing Guidelines

```css
--timing-instant:  100ms;  /* Tap feedback, hover states */
--timing-fast:     200ms;  /* Page transitions, fades */
--timing-normal:   300ms;  /* Sliding panels, width changes */
--timing-slow:     500ms;  /* Success animations, celebrations */
--timing-patient:  1000ms; /* Loading states, progress bars */
```

### Easing Functions

```css
--ease-out:     cubic-bezier(0.33, 1, 0.68, 1);      /* Decelerating */
--ease-in-out:  cubic-bezier(0.65, 0, 0.35, 1);     /* Smooth both ends */
--ease-bounce:  cubic-bezier(0.68, -0.55, 0.27, 1.55); /* Subtle bounce */
--ease-spring:  cubic-bezier(0.34, 1.56, 0.64, 1);  /* Spring effect */
```

### Animation Intensity Scale

**Subtle (Default):**
- Scale: 0.98 - 1.02
- Translate: -2px to 2px
- Opacity: 0.7 - 1.0
- Rotation: -1deg to 1deg

**Moderate (Emphasis):**
- Scale: 0.95 - 1.05
- Translate: -4px to 4px
- Opacity: 0.5 - 1.0
- Rotation: -3deg to 3deg

**Strong (Rare, Special Moments):**
- Scale: 0.9 - 1.1
- Translate: -8px to 8px
- Opacity: 0 - 1.0
- Rotation: -5deg to 5deg

---

## Next Research Topics

1. **Agent Handoff Visualization** - How to show Supervisor → Librarian → Dojo flow
2. **Multi-Agent Status Display** - How to show 4 agents without clutter
3. **Cost Counter Animation** - Real-time ticking without being distracting
4. **Seed Planting Animation** - How to visualize "planting" a seed
5. **Progress Indicators** - Beyond progress bars (circular, radial, organic)

---

**Status:** Research in progress. More sources to explore.


---

## Research Source 2: Multi-Agent UX Design Principles

**Source:** [4 UX Design Principles for Autonomous Multi-Agent AI Systems](https://newsletter.victordibia.com/p/4-ux-design-principles-for-multi) by Victor Dibia, PhD (AutoGen maintainer)

### Key Properties of Multi-Agent Systems

1. **Autonomy:** Can do many different things
2. **Action:** Can take action with side effects
3. **Duration:** Complex long-running tasks

---

### Principle 1: Capability Discovery

**Problem:** Users don't know which tasks will work well and which might fail.

**Solution:** Help users understand what the agents can do.

**Implementation:**
- Provide sample tasks as presets
- Nudge users towards high-reliability task examples
- Proactively suggest relevant tasks based on context

**Dojo Genesis Application:**
- **Onboarding:** Show 3 workflow presets (Dojo Session, Write Prompt, Search Knowledge)
- **Dashboard:** Quick actions with clear descriptions
- **Agent Cards:** Show what each agent specializes in
- **Librarian:** Proactive suggestions based on recent work
- **Dojo:** Example perspectives when asking for input

---

### Principle 2: Observability and Provenance

**Problem:** Non-deterministic trajectories make it hard to build trust.

**Solution:** Ensure users can observe/trace agent actions.

**Implementation:**
- Stream all agent updates in real-time
- Show structured plans, current steps, duration, cost
- Provide activity log with timestamps
- Allow users to inspect decision-making process

**Dojo Genesis Application:**
- **Agent Activity Panel:** Real-time streaming of agent actions
  - "Supervisor is routing your query..."
  - "Librarian searched 50 prompts (2s, $0.0012)"
  - "Dojo is synthesizing perspectives..."
- **Harness Trace:** Nested JSON log for debugging
- **Recent Activity:** Last 5-10 actions with timestamps
- **Cost Tracking:** Real-time cost display ($0.0023 session, $0.12 today)
- **Progress Indicators:** File-by-file or step-by-step progress

**Visual Patterns:**
- Activity log with agent icons
- Progress bars with percentage
- Cost counter with live updates
- Timeline view for complex workflows

---

### Principle 3: Interruptibility

**Problem:** Long-running agents may take expensive or problematic actions.

**Solution:** Allow users to pause, resume, or cancel agent actions.

**Implementation:**
- Persist agent and application state
- Provide pause/resume/cancel controls
- Allow users to provide feedback mid-execution
- Enable course-correction without losing progress

**Dojo Genesis Application:**
- **Agent Panel Controls:**
  - [Pause] button when agent is working
  - [Resume] button when paused
  - [Cancel] button to stop execution
- **State Persistence:** Save agent state to resume later
- **Human-in-the-Loop:** Dojo asks for perspectives (natural pause point)
- **Safety Switch:** Automatic pause on errors or conflicts

**Visual Patterns:**
- Prominent pause/cancel buttons
- Status indicator shows "Paused" state
- Resume button with context ("Resume from step 3/5")
- Progress saved indicator

---

### Principle 4: Cost-Aware Delegation

**Problem:** Agent actions have real-world resource implications (cost, time, API calls).

**Solution:** Communicate the cost of agent actions, allow users to decide when agents can act.

**Implementation:**
- Estimate and communicate cost before execution
- Show real-time cost during execution
- Provide cost breakdowns by agent
- Set budget limits and warnings
- Allow users to approve expensive operations

**Dojo Genesis Application:**
- **Cost Guard (Already Implemented!):**
  - Query-level cost estimation
  - Session-level cost tracking
  - Daily/monthly budget monitoring
  - Warnings before expensive operations
- **Agent Panel Cost Display:**
  - "This query will cost ~$0.05"
  - "Session: $0.12 | Today: $2.34 | Month: $45.67 / $100"
- **Cost Breakdown:**
  - Supervisor: $0.01
  - Librarian: $0.03 (searched 50 prompts)
  - Dojo: $0.08 (synthesized 3 perspectives)
- **Approval Gates:**
  - "This operation may cost $1.50. Continue?"
  - [Approve] [Cancel] [Always approve under $2]

**Visual Patterns:**
- Cost badge on agent cards
- Progress bar for monthly budget
- Warning icon for high-cost operations
- Cost history chart (optional, advanced)

---

## Multi-Agent Visualization Patterns

### Agent Handoff Flow

**Pattern 1: Linear Timeline**
```
Supervisor → Librarian → Dojo → Complete
   [1s]        [2s]       [5s]    [✓]
```

**Pattern 2: Branching Tree**
```
        Supervisor
           ↓
      ┌────┴────┐
      ↓         ↓
  Librarian   Dojo
      ↓         ↓
      └────┬────┘
           ↓
      Supervisor
           ↓
        Complete
```

**Pattern 3: Circular Status**
```
    [Supervisor]
       ↓     ↑
       ↓     ↑
  [Librarian] → [Dojo]
       ↓     ↑
       ↓     ↑
    [Debugger]
```

**Dojo Genesis Choice:** **Linear Timeline with Branching**
- Show current agent as highlighted
- Show previous agents as completed (checkmark)
- Show next agents as queued (gray)
- Use agent colors for visual identity
- Animate transitions between agents

---

### Multi-Agent Status Display

**Pattern 1: Stacked Cards (Vertical)**
```
┌─────────────────────┐
│ 🎯 Supervisor       │ ← Active (pulsing)
│ Status: Working     │
└─────────────────────┘
┌─────────────────────┐
│ 🧠 Dojo             │ ← Queued (gray)
│ Status: Idle        │
└─────────────────────┘
┌─────────────────────┐
│ 📚 Librarian        │ ← Idle
│ Status: Idle        │
└─────────────────────┘
┌─────────────────────┐
│ 🔍 Debugger         │ ← Idle
│ Status: Idle        │
└─────────────────────┘
```

**Pattern 2: Horizontal Pills**
```
[🎯 Supervisor: Working] [🧠 Dojo: Idle] [📚 Librarian: Idle] [🔍 Debugger: Idle]
```

**Pattern 3: Radial (Circular)**
```
       [Supervisor]
           ●
    ●           ●
[Debugger]   [Dojo]
    ●
  [Librarian]
```

**Dojo Genesis Choice:** **Stacked Cards (Pattern 1)**
- More space for details (task, progress, cost)
- Easier to scan vertically
- Works well in sidebar panel
- Can expand/collapse for more info

---

## Animation Specifications for Multi-Agent UI

### Agent Status Transitions

**Idle → Thinking:**
```css
/* Status dot fades from gray to agent color */
@keyframes statusThinking {
  0% {
    background: var(--neutral-400);
    opacity: 1;
  }
  50% {
    background: var(--agent-color);
    opacity: 0.7;
  }
  100% {
    background: var(--agent-color);
    opacity: 1;
  }
}
/* Duration: 500ms, repeat: infinite */
```

**Thinking → Working:**
```css
/* Status dot pulses with agent color */
@keyframes statusWorking {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.8;
  }
}
/* Duration: 1000ms, repeat: infinite */
```

**Working → Complete:**
```css
/* Status dot becomes checkmark */
@keyframes statusComplete {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.3);
    opacity: 0.8;
  }
  100% {
    transform: scale(1);
    opacity: 1;
    /* Replace dot with checkmark icon */
  }
}
/* Duration: 300ms, repeat: once */
```

---

### Agent Handoff Animation

**Supervisor → Librarian:**
```css
/* Supervisor card fades slightly, Librarian card highlights */
@keyframes agentHandoff {
  0% {
    /* Supervisor: full opacity */
    /* Librarian: gray */
  }
  50% {
    /* Arrow animates from Supervisor to Librarian */
  }
  100% {
    /* Supervisor: reduced opacity */
    /* Librarian: full opacity + agent color */
  }
}
/* Duration: 400ms, ease-out */
```

**Visual Elements:**
- Animated arrow between agents
- Color transition (gray → agent color)
- Subtle scale (1.0 → 1.05 → 1.0)
- Soft glow around active agent

---

### Cost Counter Animation

**Real-Time Ticking:**
```css
/* Number increments smoothly */
@keyframes costTick {
  0% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-2px);
  }
  100% {
    transform: translateY(0);
  }
}
/* Duration: 200ms per increment */
```

**Warning Threshold:**
```css
/* Cost badge pulses when approaching budget limit */
@keyframes costWarning {
  0%, 100% {
    background: var(--warning-bg);
    border-color: var(--warning-primary);
  }
  50% {
    background: var(--warning-primary);
    border-color: var(--warning-primary);
  }
}
/* Duration: 1000ms, repeat: 3 times, then stop */
```

---

## Key Takeaways for Dojo Genesis

1. **Transparency is Trust:** Show all agent activity in real-time
2. **Cost Awareness:** Display costs prominently, warn before expensive operations
3. **Interruptibility:** Always allow pause/cancel, save state
4. **Capability Discovery:** Guide users towards high-reliability tasks
5. **Observability:** Provide activity logs, traces, and progress indicators

**Unique Advantage:** Dojo Genesis already has Cost Guard and Harness Trace—we just need to make them visible and beautiful!

---

**Status:** Research complete for multi-agent UX. Next: Brand identity and visual polish.
