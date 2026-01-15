# Design Specification: The Knowledge Hub (Prompt Bridge v2)

**Author:** Manus AI (Dojo)  
**Date:** January 15, 2026  
**Version:** 2.0

---

## 1. Introduction

This document provides the detailed technical design for the **Knowledge Hub**, the second version of the Prompt Bridge. This redesign elevates the bridge from a simple transfer mechanism to the central nervous system of the 11-11 platform, creating a unified knowledge graph that connects **Sessions, Prompts, Seeds, and Files**.

This specification is based on the analysis detailed in `11-11-prompt-bridge-redesign-analysis.md` and addresses the critical workflow gaps identified in the v0.4.5 MVP.

## 2. Architecture: The Knowledge Graph

The Knowledge Hub transforms the isolated data silos into an interconnected graph. This is achieved through a new database table and a set of context-aware UI actions.

### 2.1. Database Schema

A new table, `knowledge_links`, will be created to track the relationships between different knowledge artifacts.

**`knowledge_links` Table Schema:**
```sql
CREATE TABLE knowledge_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type TEXT NOT NULL CHECK (source_type IN ('session', 'prompt', 'seed', 'file')),
  source_id UUID NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('session', 'prompt', 'seed', 'file')),
  target_id UUID NOT NULL,
  relationship TEXT NOT NULL CHECK (relationship IN ('extracted_from', 'discussed_in', 'refined_in', 'created_from')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES auth.users(id)
);

CREATE INDEX idx_knowledge_links_source ON knowledge_links(source_type, source_id);
CREATE INDEX idx_knowledge_links_target ON knowledge_links(target_type, target_id);
```

### 2.2. API Endpoints

A new set of API endpoints will be created to manage these workflows.

-   **`POST /api/hub/transfer`**: A single, intelligent endpoint for all transfer operations. The request body will specify the source, destination, and content, and the API will handle the database logic and create the `knowledge_links` entry.

-   **`GET /api/hub/lineage/{type}/{id}`**: Retrieves the full history of an artifact, allowing the UI to display a "trail of thought."

## 3. UI/UX Implementation

The implementation is broken down into four key user-facing workflows.

### 3.1. Workflow A: Extracting from a Dojo Session

**Location:** `app/dojo/[sessionId]/page.tsx`

**UI Changes:**
1.  **Header "Save Session" Button:** This button will now open a `SaveSessionModal`.
2.  **Message Context Menu:** Each agent message in `ChatMessage.tsx` will have a `...` button that opens a context menu.

**`SaveSessionModal` Component:**
-   **Trigger:** Clicking the header "Save Session" button.
-   **Content:**
    -   Title, Description, Tags fields.
    -   A checkbox group: "What would you like to extract?"
        -   `[ ] Full conversation (as a new Prompt)`
        -   `[ ] Key insights (select messages to save as Seeds)`
        -   `[ ] Code artifacts (open in Workbench)`
-   **Action:** On save, calls the `POST /api/hub/transfer` endpoint with the appropriate payload.

**Message Context Menu:**
-   **Trigger:** Clicking `...` on an agent message.
-   **Options:**
    -   `Save as Prompt`: Opens a simplified save modal pre-filled with the message content.
    -   `Extract as Seed`: Opens the seed save modal pre-filled with the message content.
    -   `Open in Workbench`: (Visible only if message contains a code block) Opens the Workbench with the code in a new tab.

### 3.2. Workflow B: Starting a Session from an Artifact

**Location:** `app/librarian/page.tsx`, `app/seeds/page.tsx`

**UI Changes:**
-   Add a **"Discuss in Dojo"** button to each `PromptCard` and `SeedCard` component.

**Behavior:**
-   Clicking the button calls a new function, `startDojoSessionFromContext(artifact)`.
-   This function makes a `POST` request to a new endpoint (`/api/dojo/create-from-context`) with the artifact's content and ID.
-   The backend creates a new session, pre-populates the `situation` field, creates a `knowledge_links` entry, and returns the new `sessionId`.
-   The frontend then redirects the user to `/dojo/{newSessionId}`.

### 3.3. Workflow C: Sending Workbench Content to Dojo

**Location:** `app/workbench/page.tsx`

**UI Changes:**
-   Add a **"Discuss with Dojo"** button to the `ActionBar.tsx` component in the Workbench.

**Behavior:**
-   Clicking the button opens a modal: `DiscussWithDojoModal`.
-   The modal has a single textarea: "What would you like to ask the Dojo agent about this file?"
-   On submit, it calls `startDojoSessionFromContext`, passing the user's question as the `situation` and the active file's content as the first `perspective`.
-   The user is then redirected to the new Dojo session.

### 3.4. Workflow D: The Unified Save Modal from Workbench

**Location:** `app/workbench/page.tsx`

**UI Changes:**
-   The existing "Save" button in `ActionBar.tsx` will open a redesigned `SaveArtifactModal`.

**`SaveArtifactModal` Component:**
-   This modal is context-aware. It will be the single source for saving new Prompts and Seeds from the Workbench.
-   **Fields:**
    -   `Name`, `Description`, `Tags`
    -   `Save as:` Radio group: `( ) Prompt` or `( ) Seed`
    -   A conditional section appears if `Seed` is selected, showing `Type` and `Status` dropdowns.
    -   `Public:` toggle switch.
-   **Action:** On save, calls `POST /api/hub/transfer`.

## 4. Phased Implementation Plan

To manage complexity, the implementation will be rolled out in three phases:

1.  **Phase 1 (Core Save/Load):** Implement the unified `SaveArtifactModal` from the Workbench and the "Open in Workbench" functionality from the Library/Seeds pages. This delivers the original Prompt Bridge promise.
2.  **Phase 2 (Session Extraction):** Implement the `SaveSessionModal` and the message context menus to allow users to extract knowledge *from* Dojo sessions.
3.  **Phase 3 (Context Injection):** Implement the "Discuss in Dojo" and "Discuss with Dojo" workflows to allow users to inject knowledge *into* new Dojo sessions.

---

This design creates a powerful, interconnected system that aligns with the 11-11 vision of a Sustainable Intelligence OS, where every piece of knowledge is captured, refined, and reusable.
