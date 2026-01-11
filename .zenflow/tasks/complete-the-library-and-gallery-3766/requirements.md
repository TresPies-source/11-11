# Product Requirements Document (PRD)
## Library and Gallery Pages - Sprint 3 Completion

**Date:** January 11, 2026  
**Status:** Draft  
**Sprint:** Sprint 3  

---

## 1. Executive Summary

This PRD defines the requirements for completing the Library and Gallery pages in the 11-11 application. The Library allows users to browse their personal prompt collection stored in Google Drive's `/03_Prompts` folder, while the Gallery displays public prompts shared by users. Both pages will feature fully functional prompt cards with interactive actions and polished animations.

---

## 2. Goals & Objectives

### Primary Goals
1. Complete all interactive functionality for Library and Gallery prompt cards
2. Implement seamless integration between Library prompts and the Multi-Agent chat system
3. Enable users to fork public prompts from the Gallery to their personal Library
4. Apply visual polish with Framer Motion animations
5. Provide clear user feedback for all actions via toast notifications

### Success Metrics
- ✅ All buttons on PromptCard components are fully functional
- ✅ Zero TypeScript errors and ESLint warnings
- ✅ Smooth animations (200-300ms) following "Hardworking" aesthetic
- ✅ User actions receive immediate visual feedback
- ✅ Complete visual trace documentation with screenshots

---

## 3. User Stories

### US-1: Quick Copy Prompt Content
**As a** user  
**I want to** quickly copy a prompt's raw content to my clipboard  
**So that** I can paste it into other applications or tools  

**Acceptance Criteria:**
- Click "Quick Copy" button (Copy icon) on any PromptCard
- Prompt's raw content (excluding frontmatter metadata) is copied to clipboard
- Visual feedback: Icon changes from Copy to Check for 2 seconds
- No page reload or navigation occurs

**Current State:** ✅ Already implemented in PromptCard.tsx (lines 25-31)

---

### US-2: Run Prompt in Multi-Agent Chat
**As a** user  
**I want to** load a prompt directly into a new chat session  
**So that** I can immediately start working with an AI agent using that prompt  

**Acceptance Criteria:**
- Click "Run in Chat" button on Library PromptCard
- User is navigated to the Multi-Agent view (root `/`)
- A new ChatPanel spawns automatically with the first AI persona
- The prompt content is pre-loaded as the first user message
- Chat is ready to send (user can add more context or send immediately)
- Toast notification confirms: "Prompt loaded into chat"

**Current State:** ⚠️ Partially implemented
- Button exists and navigates with `?loadPrompt=${id}` param
- MultiAgentView does not yet handle the `loadPrompt` URL parameter
- Need to implement URL parameter parsing and session creation with pre-loaded prompt

---

### US-3: Fork Public Prompt to Personal Library
**As a** user  
**I want to** copy a public prompt from the Gallery to my personal Library  
**So that** I can customize and reuse community-contributed prompts  

**Acceptance Criteria:**
- Click "Fork to Library" button on Gallery PromptCard
- Prompt file is copied to user's `/03_Prompts` folder in Google Drive
- Forked file is created with same name (or name + suffix if duplicate exists)
- Toast notification confirms: "Prompt forked to your library"
- Forked prompt appears in Library page after refresh/refetch
- Original prompt in Gallery remains unchanged

**Current State:** ❌ Not implemented
- Button exists but shows placeholder alert (line 38)
- Need to create API route for file copy operation
- Need to integrate with RepositoryProvider for file operations

---

### US-4: Visual Polish and Animations
**As a** user  
**I want to** see smooth, professional animations when interacting with prompt cards  
**So that** the interface feels polished and responsive  

**Acceptance Criteria:**
- PromptCard has hover animation: subtle scale (1.02) + shadow increase
- Tags have fade-in animation when card appears
- Button hover states have smooth color transitions (200ms)
- Card entry animation: fade-in + slide-up (stagger by 50ms for grid)
- All animations follow "Hardworking" aesthetic (200-300ms, smooth easing)

**Current State:** ⚠️ Partially implemented
- Basic hover state exists (tailwind classes)
- No Framer Motion animations yet
- Need to add `motion.div` wrapper and animation variants

---

## 4. Functional Requirements

### FR-1: Library Page (`/library`)
- **FR-1.1:** Display all Markdown files from `/03_Prompts` Google Drive folder
- **FR-1.2:** Each prompt card shows:
  - Title (from frontmatter `title` or filename)
  - Description (from frontmatter `description` or first 150 chars)
  - Tags (from frontmatter `tags` array)
- **FR-1.3:** Quick Copy button copies raw prompt content (excluding frontmatter)
- **FR-1.4:** Run in Chat button loads prompt into new Multi-Agent session
- **FR-1.5:** Loading state shows skeleton cards
- **FR-1.6:** Empty state shows message: "Your library is empty"
- **FR-1.7:** Error state shows retry option

**Dependencies:**
- `useLibrary` hook (already exists)
- `PromptCard` component (already exists)
- Multi-Agent view integration (needs implementation)

---

### FR-2: Gallery Page (`/gallery`)
- **FR-2.1:** Display prompts where frontmatter `public: true`
- **FR-2.2:** Each prompt card shows same content as Library cards
- **FR-2.3:** Quick Copy button works identically to Library
- **FR-2.4:** Fork to Library button copies prompt to user's `/03_Prompts` folder
- **FR-2.5:** Loading, empty, and error states mirror Library behavior

**Dependencies:**
- `useGallery` hook (already exists)
- `PromptCard` component (already exists)
- File copy API route (needs implementation)

---

### FR-3: Toast Notification System
- **FR-3.1:** Display temporary notifications for user actions
- **FR-3.2:** Toast positions: top-center
- **FR-3.3:** Toast duration: 3 seconds auto-dismiss
- **FR-3.4:** Toast types:
  - Success (green): "Prompt copied to clipboard"
  - Success (green): "Prompt loaded into chat"
  - Success (green): "Prompt forked to your library"
  - Error (red): "Failed to fork prompt" (if copy fails)
- **FR-3.5:** Toast animations: slide-in from top (200ms), fade-out (200ms)

**Implementation Options:**
1. **Option A (Recommended):** Create simple custom toast component with Framer Motion
   - Pros: No new dependencies, full control, follows existing aesthetic
   - Cons: Need to implement from scratch
2. **Option B:** Use react-hot-toast library
   - Pros: Battle-tested, feature-rich
   - Cons: New dependency, may not match aesthetic

**Decision:** Option A - Align with "zero unnecessary dependencies" philosophy

---

### FR-4: Multi-Agent Integration
- **FR-4.1:** MultiAgentView reads `loadPrompt` URL parameter on mount
- **FR-4.2:** If `loadPrompt` parameter exists:
  1. Parse prompt ID from parameter
  2. Fetch prompt content via `/api/drive/content/${id}`
  3. Create new session with first available persona
  4. Pre-populate session with user message containing prompt content
  5. Clear URL parameter after processing
- **FR-4.3:** If fetch fails, show error toast

**Technical Approach:**
- Add `useEffect` in MultiAgentView to check `useSearchParams()`
- Use ContextBus to broadcast "PROMPT_LOADED" event (optional)
- Maintain existing session creation logic

---

### FR-5: File Fork API
- **FR-5.1:** Create `POST /api/drive/fork` endpoint
- **FR-5.2:** Request body: `{ sourceFileId: string }`
- **FR-5.3:** Response: `{ success: boolean, newFileId: string }`
- **FR-5.4:** Implementation:
  1. Fetch source file content via DriveClient
  2. Get target folder ID from `GOOGLE_DRIVE_PROMPTS_FOLDER_ID`
  3. Create new file in target folder with same content
  4. Handle duplicate names (append `-copy` suffix)
  5. Return new file ID for confirmation
- **FR-5.5:** Dev mode: Simulate fork by adding to mock data

---

## 5. Non-Functional Requirements

### NFR-1: Performance
- Page load time: < 2 seconds on 3G connection
- Animation frame rate: 60fps on modern devices
- API response time: < 500ms for file fetch
- API response time: < 1000ms for file fork

### NFR-2: Accessibility
- All buttons have descriptive `aria-label` attributes
- Keyboard navigation: Tab order follows visual order
- Focus indicators: Visible on all interactive elements
- Screen reader: Toast messages announced via `aria-live="polite"`

### NFR-3: Error Handling
- Network failures show user-friendly error messages
- API errors logged to console for debugging
- Failed operations allow retry (where applicable)
- No silent failures - all errors visible to user

### NFR-4: Code Quality
- Zero TypeScript type errors
- Zero ESLint warnings
- All functions have clear, single responsibilities
- Props interfaces fully typed
- API routes handle all error cases

---

## 6. User Interface Requirements

### UI-1: PromptCard Component
**Layout:**
```
┌─────────────────────────────────┐
│ Title                    [Copy] │
│                                 │
│ Description (3 lines max)       │
│                                 │
│ [tag1] [tag2] [tag3]           │
│                                 │
│ ─────────────────────────────── │
│ [  Run in Chat / Fork Button  ] │
└─────────────────────────────────┘
```

**Styling:**
- Card: White background, subtle border, rounded corners
- Hover: Slight scale (1.02), shadow increase
- Title: Bold, 1-2 lines max (truncate with ellipsis)
- Description: Gray text, 3 lines max (truncate)
- Tags: Small badges, blue background
- Action button: Full width, colored (blue for Library, green for Gallery)

**Animations (Framer Motion):**
- Initial: `opacity: 0, y: 20`
- Animate: `opacity: 1, y: 0`
- Transition: `duration: 0.3, ease: "easeOut"`
- Stagger: 50ms delay between cards in grid

---

### UI-2: Toast Component
**Layout:**
```
┌──────────────────────────────────┐
│ [✓] Prompt copied to clipboard  │
└──────────────────────────────────┘
```

**Styling:**
- Position: Fixed top-center, 16px from top
- Background: Green (success) or Red (error)
- Text: White, medium font weight
- Padding: 12px 24px
- Border radius: 8px
- Shadow: Medium elevation

**Animations:**
- Enter: Slide down from -100% to 0 (200ms)
- Exit: Fade out (200ms)

---

## 7. Data Model

### PromptFile Interface (already exists)
```typescript
interface PromptFile extends DriveFile {
  metadata?: PromptMetadata;
  rawContent?: string;
}

interface PromptMetadata {
  title?: string;
  description?: string;
  tags?: string[];
  public?: boolean;
  author?: string;
  created?: string;
  version?: string;
}
```

### Fork API Request/Response
```typescript
// POST /api/drive/fork
interface ForkRequest {
  sourceFileId: string;
}

interface ForkResponse {
  success: boolean;
  newFileId: string;
  newFileName: string;
  error?: string;
}
```

---

## 8. Technical Constraints

### Existing Dependencies (No Changes)
- Next.js 14 (App Router)
- Framer Motion 11.15.0
- React 18.3.1
- gray-matter 4.0.3 (frontmatter parsing)
- Google Drive API (googleapis 131.0.0)

### Browser Compatibility
- Modern browsers with ES2020+ support
- Chrome 90+, Firefox 88+, Safari 14+
- No IE11 support required

### API Limitations
- Google Drive API quota: 1000 requests/100 seconds
- File size limit: 10MB per prompt (reasonable for Markdown)
- No offline mode (requires active internet connection)

---

## 9. Implementation Phases

### Phase 1: Toast Notification System
**Scope:** Create reusable toast component and provider  
**Estimated Effort:** 1-2 hours  
**Deliverables:**
- `components/shared/Toast.tsx`
- `components/providers/ToastProvider.tsx`
- `hooks/useToast.ts`

### Phase 2: Multi-Agent Integration
**Scope:** Handle `loadPrompt` URL parameter in MultiAgentView  
**Estimated Effort:** 2-3 hours  
**Deliverables:**
- Updated `MultiAgentView.tsx` with URL param handling
- Prompt content loading logic
- Error handling for failed fetches

### Phase 3: Fork API Implementation
**Scope:** Create file copy endpoint  
**Estimated Effort:** 2-3 hours  
**Deliverables:**
- `app/api/drive/fork/route.ts`
- DriveClient method: `copyFile(sourceId, targetFolderId, newName)`
- Dev mode mock implementation

### Phase 4: PromptCard Enhancements
**Scope:** Add Framer Motion animations and wire up new functionality  
**Estimated Effort:** 2-3 hours  
**Deliverables:**
- Updated `PromptCard.tsx` with motion variants
- Integration with toast notifications
- Fork button wired to API

### Phase 5: Visual Trace Documentation
**Scope:** Update JOURNAL.md with screenshots and implementation notes  
**Estimated Effort:** 1 hour  
**Deliverables:**
- Screenshots of `/library` with functional cards
- Screenshots of `/gallery` with fork action
- Screenshots of JOURNAL.md entry

---

## 10. Verification & Testing

### Manual Test Cases

**TC-1: Quick Copy (Library)**
1. Navigate to `/library`
2. Click Copy icon on any prompt card
3. ✅ Icon changes to Check for 2 seconds
4. ✅ Toast appears: "Prompt copied to clipboard"
5. Paste into text editor
6. ✅ Prompt content matches (no frontmatter)

**TC-2: Run in Chat (Library)**
1. Navigate to `/library`
2. Click "Run in Chat" button
3. ✅ Redirected to `/` (Multi-Agent view)
4. ✅ New chat panel spawns
5. ✅ Prompt content appears as first user message
6. ✅ Toast appears: "Prompt loaded into chat"

**TC-3: Fork to Library (Gallery)**
1. Navigate to `/gallery`
2. Click "Fork to Library" button
3. ✅ Toast appears: "Prompt forked to your library"
4. Navigate to `/library`
5. ✅ Forked prompt appears in grid

**TC-4: Animations (Both Pages)**
1. Navigate to `/library` or `/gallery`
2. ✅ Cards fade in with stagger effect
3. Hover over card
4. ✅ Card scales up slightly, shadow increases
5. Hover over tags
6. ✅ No jank, smooth 60fps transitions

### Automated Checks
- Run `npm run lint` - Zero warnings
- Run `npm run type-check` - Zero errors
- Manual lighthouse audit - Performance score > 90

---

## 11. Open Questions & Assumptions

### Questions
1. **Q:** Should forked prompts include author attribution in frontmatter?
   **A (Assumption):** Yes - preserve original author field, add `forkedFrom` field

2. **Q:** What happens if user forks the same prompt twice?
   **A (Assumption):** Append `-copy-2`, `-copy-3` suffix to filename

3. **Q:** Should "Run in Chat" support selecting which persona to use?
   **A (Assumption):** No - use first available persona for MVP (can enhance later)

### Assumptions
- Users have valid Google OAuth session (or dev mode enabled)
- Prompts folder exists in Google Drive (`/03_Prompts`)
- Frontmatter parsing never fails (valid YAML)
- Toast notifications don't stack (new toast replaces old)

---

## 12. Out of Scope

The following items are explicitly **not included** in this sprint:

❌ Search/filter functionality for Library and Gallery  
❌ Sorting prompts (by date, name, tags)  
❌ Editing prompts directly from Library/Gallery  
❌ Deleting prompts from Library  
❌ Sharing prompts (publishing to Gallery)  
❌ Prompt versioning or change history  
❌ Multi-select and batch operations  
❌ Deep GitHub sync integration  
❌ Offline mode with IndexedDB caching  

These features are deferred to future sprints.

---

## 13. Success Criteria Summary

✅ Library page displays all prompts from `/03_Prompts` folder  
✅ Gallery page displays prompts with `public: true` frontmatter  
✅ Quick Copy button copies prompt content to clipboard  
✅ Run in Chat button loads prompt into new Multi-Agent session  
✅ Fork to Library button copies public prompts to personal library  
✅ Toast notifications provide feedback for all actions  
✅ Framer Motion animations enhance visual polish  
✅ Zero TypeScript errors and ESLint warnings  
✅ All screenshots included in JOURNAL.md  
✅ `npm run dev` server runs without errors  
✅ `npm run lint && npm run type-check` passes  

---

**Document Status:** Ready for Technical Specification  
**Next Step:** Create `spec.md` with detailed implementation plan
