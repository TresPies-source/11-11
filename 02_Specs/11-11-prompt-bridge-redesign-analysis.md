# Prompt Bridge Redesign: Incorporating Dojo Sessions

**Author:** Manus AI (Dojo)  
**Date:** January 15, 2026  
**Purpose:** Redesign the Prompt Bridge to incorporate Dojo sessions as a first-class knowledge artifact alongside Prompts and Seeds.

---

## 1. Current State Analysis

After reviewing the latest MVP (v0.4.4 and v0.4.5), the following components are now in place:

### Implemented Features

| Component | Status | Key Details |
|:---|:---|:---|
| **Dojo Session Page** | ✅ Complete | Full-page chat interface at `/dojo/{sessionId}` |
| **Session State** | ✅ Complete | Zustand store (`dojo.store.ts`) manages messages, mode, loading |
| **Session Database** | ✅ Complete | `sessions` table with DojoPacket schema (migration 009) |
| **Workbench File System** | ✅ Complete | File tree panel with CRUD operations |
| **Workbench Store** | ✅ Complete | Manages tabs, file content, and save state |

### Database Schema for Sessions

The `sessions` table now includes rich DojoPacket metadata:
- `title`, `mode`, `situation`, `stake`
- `agent_path` (JSONB array tracking which agents were involved)
- `next_move_action`, `next_move_why`, `next_move_test`
- `artifacts` (JSONB array of generated outputs)

Related tables:
- `session_perspectives`: Multiple perspectives per session
- `session_assumptions`: Assumptions with challenged flag
- `session_decisions`: Decisions with rationale

---

## 2. The Three Knowledge Artifacts

The 11-11 platform now has **three distinct types of knowledge artifacts**, each with different purposes and workflows:

| Artifact | Purpose | Primary Location | Typical Lifecycle |
|:---|:---|:---|:---|
| **Prompts** | Reusable templates for specific tasks | Library (Librarian page) | Create → Execute → Refine → Share |
| **Seeds** | Conceptual knowledge (principles, patterns, insights) | Seeds page | Capture → Grow → Mature → Compost/Replant |
| **Sessions** | Conversational thinking records with the Dojo agent | Dojo page | Start → Converse → Save → Extract insights |

---

## 3. The Missing Workflows

Currently, these three artifact types exist in **isolated silos**. The Prompt Bridge redesign must create seamless workflows between them.

### Gap 1: Session → Seed
**User Story:** "I had a great Dojo conversation about pricing strategy. I want to save the key insight as a Seed."

**Current State:** No way to extract a specific insight from a session and save it as a Seed.

**Needed:** An "Extract as Seed" action within the Dojo session interface.

### Gap 2: Session → Prompt
**User Story:** "The Dojo agent suggested a great prompt template. I want to save it to my Library."

**Current State:** No way to extract a prompt from a session message.

**Needed:** A "Save as Prompt" action on individual agent messages.

### Gap 3: Session → Workbench
**User Story:** "I want to refine the code artifact the Builder agent generated in my Dojo session."

**Current State:** Artifacts are stored in the `artifacts` JSONB column but not easily editable.

**Needed:** An "Open in Workbench" action for session artifacts.

### Gap 4: Workbench → Session
**User Story:** "I'm working on a complex prompt in the Workbench. I want to ask the Dojo agent for feedback."

**Current State:** No way to send Workbench content to a Dojo session.

**Needed:** A "Discuss with Dojo" action in the Workbench.

### Gap 5: Prompt/Seed → Session
**User Story:** "I have a Seed about 'First Principles Thinking.' I want to explore it further with the Dojo agent."

**Current State:** No way to start a Dojo session with a Seed or Prompt as context.

**Needed:** A "Discuss in Dojo" action on Prompt and Seed cards.

---

## 4. The Unified Knowledge Transfer Architecture

The redesigned Prompt Bridge creates a **knowledge graph** where all three artifact types can flow into each other.

### Visual Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    KNOWLEDGE ECOSYSTEM                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐      ┌──────────────┐      ┌────────────┐ │
│  │   SESSIONS   │◄────►│  WORKBENCH   │◄────►│  LIBRARY   │ │
│  │  (Thinking)  │      │   (Editing)  │      │ (Prompts)  │ │
│  └──────┬───────┘      └──────┬───────┘      └─────┬──────┘ │
│         │                     │                     │        │
│         │                     │                     │        │
│         └─────────────────────┼─────────────────────┘        │
│                               │                              │
│                        ┌──────▼──────┐                       │
│                        │    SEEDS    │                       │
│                        │ (Knowledge) │                       │
│                        └─────────────┘                       │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Key Principles

1. **Bidirectional Flow:** Every artifact type can send to and receive from every other type.
2. **Context Preservation:** When transferring, metadata (source, timestamp, related artifacts) is preserved.
3. **User Control:** All transfers require explicit user action (no automatic syncing).
4. **Unified Interface:** The "Save/Extract" modal adapts based on the source and destination.

---

## 5. Detailed Workflow Designs

### Workflow A: Extract from Session

**Trigger:** User is viewing a Dojo session and wants to save something.

**UI Elements:**
- A "Save Session" button in the header (already exists, currently just alerts).
- A "⋮" menu on each agent message with options:
  - "Save as Prompt"
  - "Extract as Seed"
  - "Open in Workbench" (if the message contains code or structured content)

**Modal Flow (Save Session):**
```
┌────────────────────────────────────────┐
│  Save Dojo Session                     │
├────────────────────────────────────────┤
│  Title: [Auto-filled from session]    │
│  Description: [Optional]               │
│  Tags: [tag1, tag2, ...]               │
│                                        │
│  What would you like to extract?      │
│  ☐ Full conversation (as Prompt)      │
│  ☐ Key insights (as Seeds)            │
│  ☐ Artifacts (to Workbench)           │
│                                        │
│  [Save] [Cancel]                       │
└────────────────────────────────────────┘
```

**Backend:**
- Saving "Full conversation" creates a new row in the `prompts` table with the entire session transcript.
- Saving "Key insights" opens a secondary modal where the user can select which messages to save as Seeds.
- Saving "Artifacts" opens the Workbench with each artifact as a new tab.

### Workflow B: Start Session from Artifact

**Trigger:** User is viewing a Prompt or Seed and wants to explore it with the Dojo agent.

**UI Elements:**
- A "Discuss in Dojo" button on Prompt and Seed cards.

**Behavior:**
1. User clicks "Discuss in Dojo" on a Seed titled "First Principles Thinking."
2. A new Dojo session is created with the Seed content pre-filled in the "Situation" field.
3. User is redirected to `/dojo/{newSessionId}`.
4. The session's `situation` column in the database is populated with the Seed text.
5. The session's metadata includes a reference to the source Seed ID.

### Workflow C: Send Workbench Content to Dojo

**Trigger:** User is editing a file in the Workbench and wants feedback.

**UI Elements:**
- A "Discuss with Dojo" button in the Workbench action bar.

**Behavior:**
1. User clicks "Discuss with Dojo."
2. A modal appears: "What would you like to ask the Dojo agent about this content?"
3. User enters a question (e.g., "How can I improve this prompt?").
4. A new Dojo session is created with:
   - `situation`: The user's question
   - `perspectives`: The file content is automatically added as the first perspective
5. User is redirected to the new session.

### Workflow D: Save from Workbench

**Trigger:** User clicks "Save" in the Workbench (already partially implemented).

**Modal Flow (Enhanced):**
```
┌────────────────────────────────────────┐
│  Save As...                            │
├────────────────────────────────────────┤
│  Name: [_____________]                 │
│  Description: [___________________]    │
│  Tags: [tag1, tag2, ...]               │
│                                        │
│  Save as:                              │
│  ( ) Prompt (to Library)               │
│  ( ) Seed                              │
│                                        │
│  [If Seed selected]                    │
│    Type: [Dropdown]                    │
│    Status: [Dropdown]                  │
│                                        │
│  Public: [Toggle]                      │
│                                        │
│  [Save] [Cancel]                       │
└────────────────────────────────────────┘
```

This is the same modal design from the original Prompt Bridge spec, now with the understanding that Sessions are a separate artifact type.

---

## 6. Implementation Priorities

Given the complexity of the full knowledge graph, I recommend a phased approach:

### Phase 1: Core Save Workflows (Highest Priority)
- Implement "Save Session" with full conversation export to Prompts.
- Implement "Save from Workbench" to Prompts and Seeds (original Prompt Bridge spec).
- Implement "Open in Workbench" from Library and Seeds (original spec).

### Phase 2: Session Extraction (Medium Priority)
- Implement "Extract as Seed" from individual session messages.
- Implement "Save as Prompt" from individual session messages.

### Phase 3: Context Injection (Lower Priority)
- Implement "Discuss in Dojo" from Prompts and Seeds.
- Implement "Discuss with Dojo" from Workbench.

---

## 7. Database Schema Updates Needed

### New Table: `knowledge_links`
To track relationships between artifacts:

```sql
CREATE TABLE knowledge_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type TEXT NOT NULL CHECK (source_type IN ('session', 'prompt', 'seed', 'file')),
  source_id UUID NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('session', 'prompt', 'seed', 'file')),
  target_id UUID NOT NULL,
  relationship TEXT NOT NULL CHECK (relationship IN ('extracted_from', 'discussed_in', 'refined_in')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

This table creates a knowledge graph, allowing users to trace the lineage of their ideas.

---

## 8. Conclusion

The Prompt Bridge is no longer just a bridge between the Workbench and the Library. It is now the **central nervous system** of the 11-11 knowledge ecosystem, connecting Sessions, Prompts, Seeds, and Files into a unified, explorable graph.

This redesign transforms 11-11 from a collection of tools into a true **Sustainable Intelligence OS** where every thought, conversation, and artifact can be captured, refined, and reused.
