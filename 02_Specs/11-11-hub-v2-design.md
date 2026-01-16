# Design Document: The Hub v2 Page

**Author:** Manus AI (Dojo)  
**Date:** January 15, 2026  
**Version:** 1.0

---

## 1. Vision: The Activity Feed

The Hub v2 page will serve as the central nervous system of the user's knowledge ecosystem. It will provide a chronological, filterable, and infinitely scrolling feed of all knowledge creation and connection activity.

This moves beyond the contextual `TrailOfThoughtPanel` to provide a macro-level view of how the user's ideas are evolving over time.

---

## 2. Layout and Features

### 2.1. Three-Column Layout

1.  **Left Sidebar (Filters):**
    -   Filter by artifact type (Sessions, Prompts, Seeds, Files).
    -   Filter by date range (Today, Last 7 Days, Last 30 Days, Custom).
    -   Search bar for full-text search across all artifacts.

2.  **Main Content (Activity Feed):**
    -   An infinitely scrolling list of `TrailOfThoughtPanel` components.
    -   Each panel represents a single knowledge artifact, showing its most recent connections.
    -   The feed is sorted by the most recent activity (creation or connection).

3.  **Right Sidebar (Global Graph Preview):**
    -   A small, non-interactive preview of the entire knowledge graph.
    -   Highlights the node corresponding to the item currently in view in the feed.
    -   A "View Full Graph" button that navigates to the full-screen graph visualization page.

### 2.2. API Requirements

1.  **`GET /api/hub/feed`:**
    -   A new endpoint that returns a paginated list of all knowledge artifacts, sorted by their most recent activity.
    -   Supports filtering by type and date range.
    -   Each item in the response should contain the necessary data to render a `TrailOfThoughtPanel`.

---

## 3. User Experience

-   **Discovery:** Users can scroll through the feed to discover connections they may have forgotten about.
-   **Serendipity:** The feed encourages serendipitous discovery of new relationships between ideas.
-   **On-Ramp to Graph:** The right-hand preview provides a gentle introduction to the graph visualization, making it less intimidating.

---

## 4. Implementation Plan

1.  **Create the API Endpoint:**
    -   `app/api/hub/feed/route.ts`

2.  **Create the Page Component:**
    -   `app/hub/page.tsx`

3.  **Build the Layout:**
    -   Use a responsive CSS grid for the three-column layout.

4.  **Implement the Feed:**
    -   Use `react-infinite-scroll-component` for the infinite scroll.
    -   Each item in the feed is a `TrailOfThoughtPanel`.

5.  **Implement the Filters:**
    -   Use Zustand to manage the filter state.
    -   The `useSWR` hook for the feed will re-fetch data when the filter state changes.

6.  **Implement the Graph Preview:**
    -   Use `react-force-graph` for the preview.
    -   The preview should be lightweight and non-interactive.
