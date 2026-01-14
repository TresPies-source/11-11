# Dojo Genesis - Agent Visual Identities

**Version:** 1.0  
**Date:** January 2026  
**Status:** Excellence Sprint - Complete

---

## Overview

Each agent in Dojo Genesis has a distinct visual identity derived from the bonsai sunset logo. These identities create a cohesive family while giving each agent a unique personality that reflects their role in the system.

---

## 1. Supervisor (🎯) - The Orchestrator

**Role:** Routes queries to the right agent at the right time. The central coordinator of the multi-agent system.

**Color Palette:**
```css
--supervisor-primary:   #f5a623;  /* Amber - Matches "GENESIS" in logo */
--supervisor-secondary: #f7b84d;  /* Light amber */
--supervisor-bg:        #f5a62315; /* 8% opacity background */
--supervisor-border:    #f5a62340; /* 25% opacity border */
--supervisor-glow:      #f5a6234d; /* 30% opacity glow */
```

**Icon:** 🎯 (Target/Bullseye)
- **Rationale:** Represents precision, focus, and hitting the right target (agent) for each task.
- **Alternative Icons:** ⚡ (Lightning - fast routing), 🌟 (Star - central point)

**Visual Metaphor:** The sun orchestrating the day. Amber represents wisdom, coordination, and the "genesis" moment of each query.

**UI Application:**
- **Agent Card:** Amber icon with 8% amber background tint
- **Status Dot:** Amber, pulsing when working
- **Activity Log:** `[🎯 Supervisor]` prefix in amber
- **Progress Bar:** Amber fill with subtle glow

**Animation:**
- **Routing:** Arrow animates from Supervisor to target agent with amber trail
- **Thinking:** Pulsing amber glow around icon (1s cycle)
- **Complete:** Checkmark appears in amber with soft fade

---

## 2. Dojo (🧠) - The Thinking Partner

**Role:** Helps users explore perspectives, synthesize insights, and make decisions. The core thinking partner.

**Color Palette:**
```css
--dojo-primary:   #f39c5a;  /* Sunset orange - Warm, inviting */
--dojo-secondary: #f7b077;  /* Light sunset */
--dojo-bg:        #f39c5a15; /* 8% opacity background */
--dojo-border:    #f39c5a40; /* 25% opacity border */
--dojo-glow:      #f39c5a4d; /* 30% opacity glow */
```

**Icon:** 🧠 (Brain)
- **Rationale:** Represents thinking, cognition, and the mental process of exploring ideas.
- **Alternative Icons:** 💭 (Thought bubble), 🌱 (Seedling - growth)

**Visual Metaphor:** The sunset representing the transition from learning to mastery. Orange represents warmth, growth, and the "practice" of thinking.

**UI Application:**
- **Agent Card:** Orange brain icon with 8% orange background tint
- **Status Dot:** Orange, pulsing when synthesizing
- **Activity Log:** `[🧠 Dojo]` prefix in orange
- **Mode Indicators:**
  - **Mirror:** Reflective icon (🪞)
  - **Scout:** Compass icon (🧭)
  - **Gardener:** Pruning shears icon (✂️)
  - **Implementation:** Hammer icon (🔨)

**Animation:**
- **Thinking:** Brain icon pulses with soft orange glow (1.5s cycle)
- **Synthesizing:** Concentric circles expand from brain icon
- **Mode Transition:** Icon morphs from one mode to another (300ms)
- **Complete:** Checkmark with warm orange fade

---

## 3. Librarian (📚) - The Knowledge Keeper

**Role:** Searches prompts, seeds, and the Commons to surface relevant wisdom. The knowledge discoverer.

**Color Palette:**
```css
--librarian-primary:   #ffd699;  /* Sunrise yellow - Bright, illuminating */
--librarian-secondary: #ffe4b3;  /* Pale sunrise */
--librarian-bg:        #ffd69915; /* 8% opacity background */
--librarian-border:    #ffd69940; /* 25% opacity border */
--librarian-glow:      #ffd6994d; /* 30% opacity glow */
```

**Icon:** 📚 (Books)
- **Rationale:** Represents knowledge, library, and the collection of wisdom.
- **Alternative Icons:** 🔍 (Magnifying glass - search), 💡 (Light bulb - illumination)

**Visual Metaphor:** The sunrise illuminating knowledge like the sun illuminates the world. Yellow represents clarity, discovery, and the "aha!" moment.

**UI Application:**
- **Agent Card:** Yellow books icon with 8% yellow background tint
- **Status Dot:** Yellow, pulsing when searching
- **Activity Log:** `[📚 Librarian]` prefix in yellow
- **Search Results:** Similarity scores shown with yellow progress bars

**Animation:**
- **Searching:** Books icon opens/closes with shimmer effect (1s cycle)
- **Discovering:** Light rays emanate from icon (like sunrise)
- **Results Found:** Number badge appears with bounce (e.g., "15 results")
- **Complete:** Checkmark with bright yellow fade

---

## 4. Debugger (🔍) - The Validator

**Role:** Analyzes conflicts, validates reasoning, and ensures quality. The analytical validator.

**Color Palette:**
```css
--debugger-primary:   #6b7f91;  /* Mountain blue-gray - Stable, analytical */
--debugger-secondary: #8a9dad;  /* Light mountain */
--debugger-bg:        #6b7f9115; /* 8% opacity background */
--debugger-border:    #6b7f9140; /* 25% opacity border */
--debugger-glow:      #6b7f914d; /* 30% opacity glow */
```

**Icon:** 🔍 (Magnifying Glass)
- **Rationale:** Represents inspection, analysis, and close examination.
- **Alternative Icons:** ⚖️ (Balance - validation), 🛡️ (Shield - quality assurance)

**Visual Metaphor:** The mountains representing stability, grounding, and precision. Blue-gray represents analytical thinking and careful validation.

**UI Application:**
- **Agent Card:** Blue-gray magnifying glass icon with 8% blue-gray background tint
- **Status Dot:** Blue-gray, pulsing when analyzing
- **Activity Log:** `[🔍 Debugger]` prefix in blue-gray
- **Conflict Indicators:** Red warning icon when conflicts detected

**Animation:**
- **Analyzing:** Magnifying glass scans back and forth (2s cycle)
- **Conflict Found:** Red warning pulse (3 pulses, then steady)
- **Validating:** Checkmarks appear one by one
- **Complete:** Checkmark with calm blue-gray fade

---

## Agent Status States

All agents share the same status states with consistent visual language:

| Status | Visual | Color | Animation |
|--------|--------|-------|-----------|
| **Idle** | Hollow circle | Gray (`#6b7f91`) | None |
| **Thinking** | Pulsing dot | Agent color (70% opacity) | Pulse (1s cycle) |
| **Working** | Filled dot | Agent color (100% opacity) | Pulse + glow (1s cycle) |
| **Complete** | Checkmark | Green (`#4ade80`) | Fade in (300ms) |
| **Error** | X mark | Red (`#ef4444`) | Shake (200ms) |
| **Paused** | Pause icon | Orange (`#f39c5a`) | None |

---

## Multi-Agent Visualization

### Agent Handoff Flow (Linear Timeline)

```
┌─────────────────────────────────────────────────────────────────┐
│                      AGENT HANDOFF FLOW                         │
└─────────────────────────────────────────────────────────────────┘

Step 1: Query Received
[🎯 Supervisor] ← User query
   Status: Working (amber pulsing)
   Task: "Routing query to appropriate agent..."

↓ (Animated arrow with amber trail)

Step 2: Librarian Search
[📚 Librarian] ← Supervisor handoff
   Status: Working (yellow pulsing)
   Task: "Searching 1,000+ prompts..."
   Progress: [████████░░] 80% (2s)
   Cost: $0.0012

↓ (Animated arrow with yellow trail)

Step 3: Dojo Synthesis
[🧠 Dojo] ← Librarian results
   Status: Working (orange pulsing)
   Task: "Synthesizing perspectives..."
   Mode: Scout
   Progress: [██████░░░░] 60% (5s)
   Cost: $0.0045

↓ (Animated arrow with orange trail)

Step 4: Debugger Validation (Optional)
[🔍 Debugger] ← Dojo output
   Status: Working (blue-gray pulsing)
   Task: "Validating reasoning..."
   Conflicts: 0
   Cost: $0.0008

↓ (Animated arrow with blue-gray trail)

Step 5: Supervisor Complete
[🎯 Supervisor] ← Final synthesis
   Status: Complete (green checkmark)
   Task: "Query complete"
   Total Time: 8s
   Total Cost: $0.0065
```

---

## Agent Card Design

### Collapsed State (80px width)

```
┌──────────┐
│   🎯     │ ← Icon (24px)
│          │
│   ●      │ ← Status dot (8px)
└──────────┘
```

### Expanded State (320px width)

```
┌─────────────────────────────────────┐
│ 🎯 Supervisor               [Pause] │ ← Header with controls
├─────────────────────────────────────┤
│ Status: Working                     │ ← Status text
│ Task: Routing query...              │ ← Current task
│ Progress: [████████░░] 80%          │ ← Progress bar (if applicable)
│ Duration: 2s                        │ ← Time elapsed
│ Cost: $0.0012                       │ ← Real-time cost
├─────────────────────────────────────┤
│ Recent Activity:                    │ ← Activity log
│ • Received query (0s ago)           │
│ • Routed to Librarian (1s ago)      │
│ • Awaiting results...               │
└─────────────────────────────────────┘
```

---

## Agent Personality Traits

### Supervisor (🎯)
- **Efficient:** Gets straight to the point
- **Decisive:** Makes clear routing decisions
- **Coordinating:** Always aware of the big picture

**Example Messages:**
- "Routing your query to the Librarian..."
- "Dojo will synthesize the results."
- "Query complete. Total cost: $0.0065."

---

### Dojo (🧠)
- **Thoughtful:** Takes time to consider perspectives
- **Guiding:** Asks questions to deepen thinking
- **Patient:** Encourages exploration

**Example Messages:**
- "Let's explore some perspectives on this problem."
- "What other angles should we consider?"
- "Here are three routes you could take..."

---

### Librarian (📚)
- **Knowledgeable:** Knows where to find information
- **Proactive:** Suggests related prompts and seeds
- **Organized:** Presents results with clarity

**Example Messages:**
- "Found 15 prompts related to 'product roadmap'."
- "Here are 3 seeds that might be relevant..."
- "This prompt has been forked 12 times."

---

### Debugger (🔍)
- **Analytical:** Examines details carefully
- **Precise:** Points out specific issues
- **Constructive:** Offers solutions, not just criticism

**Example Messages:**
- "Analyzing reasoning for conflicts..."
- "Found 2 conflicting claims in the synthesis."
- "Recommendation: Clarify assumption #3."

---

## Implementation Checklist

- [ ] Create agent icon components (React)
- [ ] Implement status dot animations (CSS + Framer Motion)
- [ ] Build agent card component (collapsed and expanded states)
- [ ] Create agent handoff visualization (animated timeline)
- [ ] Add agent color variables to Tailwind config
- [ ] Implement activity log with agent prefixes
- [ ] Add cost tracking display to agent cards
- [ ] Create agent personality message templates
- [ ] Test agent status transitions across all states
- [ ] Ensure accessibility (color contrast, screen readers)

---

**End of Agent Visual Identities**
