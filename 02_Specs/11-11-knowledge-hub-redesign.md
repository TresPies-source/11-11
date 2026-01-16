# Redesign Document: The Knowledge Hub v2

**Author:** Manus AI (Dojo)  
**Date:** January 15, 2026  
**Version:** 2.0

---

## 1. Rethinking the Knowledge Hub

After a thorough review of the v0.4.6 implementation, it's clear that Zenflow correctly prioritized **workflows over visualization**. The backend for creating and linking knowledge artifacts is robust and performant. The missing piece is the user-facing interface to explore this graph.

Our initial design of a three-panel graph visualization page was ambitious. While visually impressive, it requires significant development effort and may not be the most practical way for users to explore their knowledge in their daily workflow.

**The new approach: Integrate lineage information directly into the existing UI.**

Instead of a separate, dedicated page, we will weave the "trail of thought" into the context where users are already working: the Library, the Seeds page, the Dojo, and the Workbench.

---

## 2. The "Trail of Thought" Panel

This is the core of the redesign. We will create a new, reusable component called `TrailOfThoughtPanel` that can be embedded in various parts of the application.

### 2.1. Design

-   **Layout:** A collapsible, vertical timeline that shows the history and connections of a selected artifact.
-   **Nodes:** Each item in the timeline is a "node" with an icon, title, and timestamp.
-   **Interactivity:** Clicking a node will navigate to that artifact's page.

### 2.2. Mockup

Imagine this panel at the bottom of a Prompt card in the Library:

```
┌──────────────────────────────────────────────────┐
│ 📝 My Awesome Prompt                             │
│    #design #ux                                   │
├──────────────────────────────────────────────────┤
│ ▼ Trail of Thought                               │
│                                                  │
│   ┌─> 💬 Discussed in "UI Brainstorm" (2 days ago) │
│   │                                              │
│   └── 🌱 Extracted from "Progressive Disclosure" │
│                                                  │
│   ┌─> 💼 Refined in "new-button.tsx"             │
│   │                                              │
│   └── 📝 Created from "My Awesome Prompt"        │
│                                                  │
└──────────────────────────────────────────────────┘
```

### 2.3. Implementation

1.  **Create `components/hub/TrailOfThoughtPanel.tsx`:**
    -   Takes `type` and `id` as props.
    -   Fetches data from the `GET /api/hub/lineage/[type]/[id]` endpoint.
    -   Renders the timeline view.

2.  **Integrate the Panel:**
    -   Add it to `components/shared/PromptCard.tsx`.
    -   Add it to `components/seeds/seed-card.tsx`.
    -   Add it to the header of `app/dojo/[sessionId]/page.tsx`.
    -   Add it to the `WorkbenchView.tsx` when a saved file is active.

---

## 3. The Future: A Dedicated Hub Page

This incremental approach doesn't abandon the idea of a dedicated Knowledge Hub page. Instead, it builds towards it.

**Phase 2: The Hub v2 Page**

Once the `TrailOfThoughtPanel` is in use, we can create a new `/hub` page that acts as a **feed of all knowledge activity**.

### 3.1. Design

-   **Layout:** A single-column, infinitely scrolling feed, similar to a social media timeline.
-   **Content:** Each item in the feed is a `TrailOfThoughtPanel`, showing the latest creations and connections.
-   **Filtering:** A simple set of filters at the top to view activity by type (Sessions, Prompts, etc.) or date range.

### 3.2. Why This is Better

-   **Familiar UX:** A feed is a more familiar and less intimidating interface than a complex graph.
-   **Focus on Recency:** It surfaces the most recent activity, which is often the most relevant.
-   **Path to the Graph:** The Hub v2 page can have a "View as Graph" toggle that transitions to the full graph visualization, providing a gentle on-ramp to the more advanced view.

---

## 4. Updated Implementation Plan

### Sprint 5: The Trail of Thought

1.  **Task 1: `TrailOfThoughtPanel` Component**
    -   Build the reusable component and the API endpoint.

2.  **Task 2: Integrate the Panel**
    -   Add the panel to the four key locations (Prompts, Seeds, Dojo, Workbench).

### Sprint 6: The Hub v2 Page

1.  **Task 1: Hub Feed Page**
    -   Create the `/hub` page with the activity feed.

2.  **Task 2: Graph Visualization (Optional)**
    -   Implement the `react-force-graph` visualization as a toggleable view on the Hub page.

This phased approach delivers immediate value to users by showing them the connections they're creating, while paving a clear path to the full graph visualization in the future.
