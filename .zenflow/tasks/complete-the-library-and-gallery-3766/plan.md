# Full SDD workflow

## Configuration
- **Artifacts Path**: {@artifacts_path} → `.zenflow/tasks/{task_id}`

---

## Workflow Steps

### [x] Step: Requirements
<!-- chat-id: ce487890-eed4-4b8a-931d-1ee3b75d55ef -->

Create a Product Requirements Document (PRD) based on the feature description.

1. Review existing codebase to understand current architecture and patterns
2. Analyze the feature definition and identify unclear aspects
3. Ask the user for clarifications on aspects that significantly impact scope or user experience
4. Make reasonable decisions for minor details based on context and conventions
5. If user can't clarify, make a decision, state the assumption, and continue

Save the PRD to `{@artifacts_path}/requirements.md`.

### [x] Step: Technical Specification
<!-- chat-id: 15112035-5504-43a8-aee8-39d5a57ace54 -->

Create a technical specification based on the PRD in `{@artifacts_path}/requirements.md`.

1. Review existing codebase architecture and identify reusable components
2. Define the implementation approach

Save to `{@artifacts_path}/spec.md` with:
- Technical context (language, dependencies)
- Implementation approach referencing existing code patterns
- Source code structure changes
- Data model / API / interface changes
- Delivery phases (incremental, testable milestones)
- Verification approach using project lint/test commands

### [x] Step: Planning
<!-- chat-id: 5e074818-0a33-4a20-9cd5-20e0869f5300 -->

Create a detailed implementation plan based on `{@artifacts_path}/spec.md`.

1. Break down the work into concrete tasks
2. Each task should reference relevant contracts and include verification steps
3. Replace the Implementation step below with the planned tasks

Rule of thumb for step size: each step should represent a coherent unit of work (e.g., implement a component, add an API endpoint, write tests for a module). Avoid steps that are too granular (single function) or too broad (entire feature).

If the feature is trivial and doesn't warrant full specification, update this workflow to remove unnecessary steps and explain the reasoning to the user.

Save to `{@artifacts_path}/plan.md`.

---

## Implementation Plan

### [x] Phase 1: Toast Notification System
<!-- chat-id: 187b769a-de07-4363-b587-65f3394d84af -->
**Goal**: Create reusable toast notification infrastructure  
**Estimated Effort**: 1-2 hours  
**Files**: `components/shared/Toast.tsx`, `components/providers/ToastProvider.tsx`, `hooks/useToast.ts`

**Tasks**:
1. Create `Toast.tsx` component with Framer Motion animations
   - Implement success/error/info variants with color coding
   - Add slide-in from top animation (200ms)
   - Add fade-out animation (200ms)
   - Style: top-center position, green/red backgrounds, white text

2. Create `ToastProvider.tsx` with toast queue management
   - Implement toast state array with add/remove methods
   - Auto-dismiss after 3 seconds (configurable duration)
   - Use Framer Motion AnimatePresence for enter/exit
   - Portal rendering to avoid z-index issues

3. Create `useToast.ts` hook
   - Context-based hook exposing `toast.success()`, `toast.error()`, `toast.info()`
   - Auto-generate unique IDs for each toast
   - Type-safe interface

4. Add ToastProvider to root layout
   - Wrap app with ToastProvider in `app/layout.tsx`

**Verification**:
```bash
# Manual browser test
# Open browser console
# Test toast.success('Success message')
# ✅ Toast appears at top-center
# ✅ Green background for success
# ✅ Auto-dismisses after 3 seconds
# ✅ Smooth slide-in and fade-out animations
```

---

### [x] Phase 2: Multi-Agent Integration (Run in Chat)
<!-- chat-id: c00f978b-a8c1-40df-83cd-a1ecef689cd7 -->
**Goal**: Enable "Run in Chat" functionality from Library page  
**Estimated Effort**: 2-3 hours  
**Files**: `components/multi-agent/MultiAgentView.tsx`

**Tasks**:
1. Add `useSearchParams` and `useRouter` imports to MultiAgentView
   - Import from `next/navigation`

2. Implement `loadPrompt` URL parameter handler in useEffect
   - Check for `searchParams.get('loadPrompt')`
   - Fetch prompt content via `/api/drive/content/[fileId]`
   - Parse frontmatter with gray-matter
   - Extract raw content (exclude frontmatter)

3. Create new session with pre-loaded prompt
   - Use default persona (first in AGENT_PERSONAS array)
   - Create user message with prompt content
   - Add to sessions state
   - Generate session title: "Prompt Session"

4. Add toast notifications
   - Success: "Prompt loaded into chat"
   - Error: "Failed to load prompt" (if fetch fails)

5. Clear URL parameter after processing
   - Use `router.replace('/')` to remove query param

**Edge Cases**:
- Invalid prompt ID → Show error toast, don't create session
- Empty prompt content → Create session but show warning
- Prompt fetch fails → Show error toast

**Verification**:
```bash
# Navigate to /library
# Click "Run in Chat" on any prompt
# ✅ Redirected to / (Multi-Agent view)
# ✅ New ChatPanel created
# ✅ Prompt content pre-loaded as first user message
# ✅ Toast notification: "Prompt loaded into chat"
# ✅ URL parameter cleared from address bar
```

---

### [x] Phase 3: Fork API Implementation
<!-- chat-id: c3030fc5-7075-4028-be8a-66d1f100a9d1 -->
**Goal**: Implement prompt forking from Gallery to Library  
**Estimated Effort**: 2-3 hours  
**Files**: `app/api/drive/fork/route.ts`, `lib/google/drive.ts`

**Tasks**:
1. Extend DriveClient with `createFile` method in `lib/google/drive.ts`
   - Accept params: `{ folderId, name, content }`
   - Use `drive.files.create()` with media upload
   - Set mimeType: 'text/markdown'
   - Return DriveFileMetadata with new file ID

2. Create `app/api/drive/fork/route.ts` endpoint
   - Implement POST handler
   - Accept JSON body: `{ sourceFileId: string }`
   - Validate sourceFileId presence and type

3. Implement dev mode mock behavior
   - Check `isDevMode()` helper
   - Return mock success response with generated file ID
   - Log fork operation for debugging

4. Implement production Google Drive fork logic
   - Get auth session via `getAuthSession()`
   - Create DriveClient instance
   - Fetch source file content
   - Get target folder ID from `GOOGLE_DRIVE_PROMPTS_FOLDER_ID`
   - Create new file in target folder

5. Handle duplicate file names
   - Implement `generateUniqueFileName()` helper
   - Append `-copy` suffix if file exists
   - Append `-copy-N` if multiple copies exist
   - Check folder contents before creating

6. Add comprehensive error handling
   - 400: Invalid request (missing sourceFileId)
   - 404: Source file not found
   - 500: Target folder not configured
   - 429: Drive API quota exceeded

**Verification**:
```bash
# Dev Mode Test (curl)
curl -X POST http://localhost:3000/api/drive/fork \
  -H "Content-Type: application/json" \
  -d '{"sourceFileId":"mock_file_1"}'
# ✅ Returns { success: true, newFileId: '...', newFileName: '...' }

# Browser Test
# Navigate to /gallery
# Click "Fork to Library" on any prompt
# ✅ Toast notification: "Prompt forked to your library: [filename]"
# Navigate to /library
# ✅ Forked prompt appears in list
```

---

### [x] Phase 4: PromptCard Enhancements
<!-- chat-id: be00b413-e38c-4e78-be89-02259da2a058 -->
**Goal**: Add animations and wire up new functionality  
**Estimated Effort**: 2-3 hours  
**Files**: `components/shared/PromptCard.tsx`

**Tasks**:
1. Convert PromptCard root div to `motion.div`
   - Import `motion` from 'framer-motion'
   - Replace outer `<div>` with `<motion.div>`

2. Add card animation variants
   - `hidden`: `{ opacity: 0, y: 20 }`
   - `visible`: `{ opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } }`
   - `hover`: `{ scale: 1.02, transition: { duration: 0.2 } }`
   - Apply: `initial="hidden"`, `animate="visible"`, `whileHover="hover"`

3. Add tag stagger animation
   - Create `tagVariants` with custom index-based delay
   - Stagger delay: `index * 0.05` (50ms per tag)
   - Wrap each tag with `motion.span`

4. Integrate toast notifications in Quick Copy
   - Import `useToast` hook
   - Add `toast.success('Prompt copied to clipboard')` after clipboard write
   - Keep existing Check icon toggle behavior

5. Integrate toast in Fork handler
   - Call `toast.success(\`Prompt forked to your library: ${newFileName}\`)`
   - Call `toast.error('Failed to fork prompt')` on catch

6. Test responsive behavior
   - Verify animations work on mobile/tablet
   - Ensure hover states don't break touch interactions

**Verification**:
```bash
# Library Page
# ✅ Cards fade-in with slide-up on page load
# ✅ Hover scales card to 1.02 (subtle zoom)
# ✅ Tags fade-in with 50ms stagger
# ✅ Quick Copy shows toast: "Prompt copied to clipboard"
# ✅ Quick Copy icon changes to Check for 2 seconds
# ✅ Run in Chat navigates to Multi-Agent view

# Gallery Page
# ✅ Same animations as Library
# ✅ Fork to Library shows toast: "Prompt forked to your library: [filename]"
# ✅ Forked prompt appears in Library after refresh
```

---

### [x] Phase 5: Visual Trace Documentation
<!-- chat-id: cb5cb9de-43c2-49b8-b3a0-5e179fd17590 -->
**Goal**: Update JOURNAL.md with screenshots and implementation notes  
**Estimated Effort**: 1 hour  
**Files**: `JOURNAL.md`

**Tasks**:
1. Start dev server
   - Run `npm run dev`
   - Wait for server to start on localhost:3000

2. Capture Library page screenshot
   - Navigate to `localhost:3000/library`
   - Ensure prompt cards are visible
   - Trigger Quick Copy to show toast notification
   - Take screenshot showing cards + toast

3. Capture Gallery page screenshot
   - Navigate to `localhost:3000/gallery`
   - Click "Fork to Library" to show toast
   - Take screenshot showing cards + fork toast

4. Capture Multi-Agent integration screenshot
   - Click "Run in Chat" from Library
   - Take screenshot showing prompt loaded in ChatPanel

5. Update JOURNAL.md
   - Add new dated entry: `## [2026-01-11] Sprint 3: Library and Gallery Completion`
   - Include implementation summary
   - Embed all three screenshots
   - Add technical notes about toast system, fork logic, animations

6. Capture JOURNAL.md screenshot
   - Open JOURNAL.md in editor
   - Take screenshot of the new entry

**Verification**:
```bash
# ✅ JOURNAL.md contains dated entry for 2026-01-11
# ✅ Screenshot of /library with functional cards
# ✅ Screenshot of /gallery with fork action
# ✅ Screenshot of Multi-Agent with loaded prompt
# ✅ Screenshot of JOURNAL.md entry itself
# ✅ Technical notes document toast system and animations
```

---

### [x] Phase 6: Final Verification
<!-- chat-id: 2e521211-e6d7-4e6d-87bf-e8da68fa276a -->
**Goal**: Ensure zero TypeScript errors and ESLint warnings  
**Estimated Effort**: 30 minutes  

**Tasks**:
1. Run TypeScript type check
   ```bash
   npm run type-check
   ```
   - ✅ Expected: 0 errors
   - Fix any type errors found

2. Run ESLint
   ```bash
   npm run lint
   ```
   - ✅ Expected: 0 warnings, 0 errors
   - Fix any lint warnings found

3. Test build
   ```bash
   npm run build
   ```
   - ✅ Expected: Successful build with no errors

4. Manual smoke test
   - Navigate to all pages: `/`, `/library`, `/gallery`, `/settings`
   - Verify no console errors
   - Test all interactive features one final time

**Verification**:
```bash
# ✅ npm run type-check → 0 errors
# ✅ npm run lint → 0 warnings
# ✅ npm run build → successful
# ✅ All pages load without console errors
# ✅ All interactive features functional
```

---

## Success Criteria (Final Checklist)

- [x] `/library` page displays fully functional and visually polished prompt cards
- [x] 'Quick Copy' button copies prompt content and shows toast notification
- [x] 'Run in Chat' button loads prompt into Multi-Agent view
- [x] `/gallery` page displays fully functional public prompt cards
- [x] 'Fork to Library' button copies prompt to user's library and shows toast
- [x] All Framer Motion animations working smoothly (200-300ms timing)
- [x] All required screenshots included in JOURNAL.md
- [x] Zero TypeScript errors (`npm run type-check`)
- [x] Zero ESLint warnings (`npm run lint`)
- [x] Successful build (`npm run build`)
