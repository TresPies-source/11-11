# Technical Specification
## Library and Gallery Pages - Sprint 3 Completion

**Date:** January 11, 2026  
**Status:** Draft  
**Sprint:** Sprint 3  
**Based on:** requirements.md

---

## 1. Technical Context

### Framework & Dependencies
- **Framework**: Next.js 14.2.24 (App Router, React Server Components)
- **Runtime**: React 18.3.1
- **Language**: TypeScript 5.7.2
- **Animations**: Framer Motion 11.15.0
- **Icons**: lucide-react 0.469.0
- **Frontmatter Parsing**: gray-matter 4.0.3
- **Google Drive**: googleapis 131.0.0
- **Event Bus**: mitt 3.0.1
- **Styling**: Tailwind CSS 3.4.17
- **Build Tool**: Next.js built-in

### Existing Architecture Patterns
1. **Client Components**: All interactive UI components use `"use client"` directive
2. **API Routes**: Next.js App Router API handlers in `app/api/` directory
3. **Custom Hooks**: Data fetching and state management via hooks in `hooks/` directory
4. **Context Providers**: Global state via React Context (RepositoryProvider, ContextBusProvider, SyncStatusProvider)
5. **Event Bus**: Global events via mitt-based ContextBus
6. **Dev Mode**: Mock data fallback via `isDevMode()` helper
7. **Type Safety**: Full TypeScript typing for all components and API routes

---

## 2. Implementation Approach

### Phase 1: Toast Notification System

**Objective**: Create lightweight, custom toast notification system aligned with the "Hardworking" aesthetic.

**Rationale**: Avoid external dependencies (react-hot-toast) and maintain full control over styling/animations.

**Components**:
1. **`components/shared/Toast.tsx`** - Individual toast UI component
2. **`components/providers/ToastProvider.tsx`** - Toast state management and rendering
3. **`hooks/useToast.ts`** - Hook for emitting toasts from any component

**Technical Design**:
```typescript
// Toast state interface
interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
  duration?: number;
}

// ToastProvider manages array of toasts
// - Auto-dismiss after duration (default 3000ms)
// - Framer Motion AnimatePresence for enter/exit animations
// - Portal rendering to avoid z-index issues

// useToast hook exposes:
const { toast } = useToast();
toast.success(message);
toast.error(message);
```

**Animation Specs**:
- Enter: `{ y: -100, opacity: 0 }` → `{ y: 0, opacity: 1 }` (200ms)
- Exit: `{ opacity: 1 }` → `{ opacity: 0 }` (200ms)
- Stagger: No stagger (toasts stack vertically)

---

### Phase 2: Multi-Agent Integration (Run in Chat)

**Objective**: Enable Library prompts to be loaded directly into Multi-Agent chat sessions.

**Current State Analysis**:
- `PromptCard.tsx:34` - Already navigates to `/?loadPrompt=${promptId}`
- `MultiAgentView.tsx` - Does NOT yet handle URL parameters
- Session creation logic exists in `MultiAgentView.tsx:13-28`

**Required Changes**:

**File: `components/multi-agent/MultiAgentView.tsx`**
```typescript
// Add useSearchParams hook
import { useSearchParams } from 'next/navigation';

export function MultiAgentView() {
  const searchParams = useSearchParams();
  const [sessions, setSessions] = useState<Session[]>([]);
  
  // New: Handle loadPrompt URL parameter
  useEffect(() => {
    const loadPromptId = searchParams.get('loadPrompt');
    if (!loadPromptId) return;
    
    async function loadPromptIntoChat() {
      try {
        // 1. Fetch prompt content
        const response = await fetch(`/api/drive/content/${loadPromptId}`);
        if (!response.ok) throw new Error('Failed to load prompt');
        
        const { content } = await response.json();
        const { content: rawContent } = matter(content);
        
        // 2. Create new session with prompt pre-loaded
        const persona = AGENT_PERSONAS[0]; // Default to first persona
        const userMessage: ChatMessage = {
          id: `msg-${Date.now()}-user`,
          role: 'user',
          content: rawContent,
          timestamp: new Date(),
        };
        
        const newSession: Session = {
          id: `session-${Date.now()}`,
          title: `Prompt Session`,
          persona: persona.id,
          messages: [userMessage],
          createdAt: new Date(),
          updatedAt: new Date(),
          isMinimized: false,
        };
        
        setSessions([newSession]);
        
        // 3. Show success toast
        toast.success('Prompt loaded into chat');
        
        // 4. Clear URL parameter
        router.replace('/');
      } catch (error) {
        toast.error('Failed to load prompt');
        console.error('Error loading prompt:', error);
      }
    }
    
    loadPromptIntoChat();
  }, [searchParams]);
  
  // ... rest of component
}
```

**Dependencies**:
- Import `gray-matter` for frontmatter parsing
- Import `useToast` hook
- Import `useRouter` from `next/navigation`

**Edge Cases**:
- Invalid prompt ID → Show error toast, don't create session
- Empty prompt content → Create session but show warning
- Prompt fetch fails → Show error toast with retry option

---

### Phase 3: Fork API Implementation

**Objective**: Enable Gallery users to copy public prompts to their personal Library.

**New API Route**: `app/api/drive/fork/route.ts`

**Request/Response Contract**:
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

**Implementation Strategy**:

```typescript
export async function POST(request: NextRequest) {
  const { sourceFileId } = await request.json();
  
  // Dev Mode: Simulate fork operation
  if (isDevMode()) {
    const mockFileId = `mock_file_forked_${Date.now()}`;
    // Add to MOCK_CONTENT in content/[fileId]/route.ts
    return NextResponse.json({
      success: true,
      newFileId: mockFileId,
      newFileName: `forked-prompt-${Date.now()}.md`,
    });
  }
  
  // Production: Use DriveClient
  const session = await getAuthSession();
  const driveClient = await createDriveClient(session.accessToken);
  
  // 1. Get source file content
  const sourceFile = await driveClient.getFileContent(sourceFileId);
  
  // 2. Get target folder ID from environment
  const targetFolderId = process.env.GOOGLE_DRIVE_PROMPTS_FOLDER_ID;
  
  // 3. Create new file in target folder
  const newFile = await driveClient.createFile({
    folderId: targetFolderId,
    name: generateUniqueFileName(sourceFile.metadata.name),
    content: sourceFile.content,
  });
  
  return NextResponse.json({
    success: true,
    newFileId: newFile.id,
    newFileName: newFile.name,
  });
}
```

**Required DriveClient Extension**:
```typescript
// lib/google/drive.ts
async createFile(params: {
  folderId: string;
  name: string;
  content: string;
}): Promise<DriveFileMetadata> {
  const response = await this.drive.files.create({
    requestBody: {
      name: params.name,
      parents: [params.folderId],
      mimeType: 'text/markdown',
    },
    media: {
      mimeType: 'text/markdown',
      body: params.content,
    },
    fields: 'id, name, mimeType, modifiedTime',
  });
  
  return this.mapToFileMetadata(response.data);
}
```

**File Naming Strategy**:
- If file exists: Append `-copy` suffix (e.g., `prompt.md` → `prompt-copy.md`)
- If multiple copies: Append counter (e.g., `prompt-copy-2.md`)
- Helper function: `generateUniqueFileName(baseName: string): string`

**Error Handling**:
- Source file not found → 404
- Target folder not configured → 500
- Duplicate name conflict → Auto-resolve with suffix
- Drive API quota exceeded → 429 with retry-after

---

### Phase 4: PromptCard Enhancements

**Objective**: Add Framer Motion animations and integrate toast notifications.

**File: `components/shared/PromptCard.tsx`**

**Animation Implementation**:
```typescript
import { motion } from 'framer-motion';

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    }
  },
  hover: {
    scale: 1.02,
    transition: {
      duration: 0.2,
    }
  }
};

const tagVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: (index: number) => ({
    opacity: 1,
    scale: 1,
    transition: {
      delay: index * 0.05, // 50ms stagger
      duration: 0.2,
    }
  })
};

export function PromptCard({ prompt, variant }: PromptCardProps) {
  const { toast } = useToast();
  
  // Wrap root div with motion.div
  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      className="group bg-white rounded-lg..."
    >
      {/* Animate tags */}
      {tags.map((tag, index) => (
        <motion.span
          key={index}
          custom={index}
          variants={tagVariants}
          initial="hidden"
          animate="visible"
        >
          {tag}
        </motion.span>
      ))}
    </motion.div>
  );
}
```

**Fork Button Integration**:
```typescript
const handleFork = async () => {
  try {
    const response = await fetch('/api/drive/fork', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sourceFileId: prompt.id }),
    });
    
    if (!response.ok) throw new Error('Fork failed');
    
    const { newFileName } = await response.json();
    toast.success(`Prompt forked to your library: ${newFileName}`);
  } catch (error) {
    toast.error('Failed to fork prompt');
    console.error('Fork error:', error);
  }
};
```

**Quick Copy Enhancement**:
```typescript
const handleQuickCopy = async () => {
  if (prompt.rawContent) {
    await navigator.clipboard.writeText(prompt.rawContent);
    setCopied(true);
    toast.success('Prompt copied to clipboard'); // Add toast
    setTimeout(() => setCopied(false), 2000);
  }
};
```

---

### Phase 5: Visual Trace Documentation

**File: `JOURNAL.md`**

**Entry Template**:
```markdown
## [2026-01-11] Sprint 3: Library and Gallery Completion

### Implementation Summary
- ✅ Toast notification system created
- ✅ Multi-Agent integration for "Run in Chat"
- ✅ Fork API endpoint implemented
- ✅ PromptCard animations added

### Screenshots
1. **Library Page** (`/library`)
   ![Library with functional prompt cards](path/to/screenshot1.png)
   - Shows Quick Copy in action (toast notification visible)
   - Demonstrates hover animation

2. **Gallery Page** (`/gallery`)
   ![Gallery with Fork functionality](path/to/screenshot2.png)
   - Shows Fork to Library button
   - Demonstrates success toast after fork

3. **Multi-Agent Integration**
   ![Prompt loaded into chat](path/to/screenshot3.png)
   - Shows prompt content pre-loaded in ChatPanel
   - Demonstrates URL parameter handling

### Technical Notes
- Custom toast system avoids external dependencies
- Fork operation handles duplicate names via suffix strategy
- Animations use 200-300ms timing for "Hardworking" aesthetic

### Verification
- [x] All TypeScript errors resolved
- [x] ESLint warnings cleared
- [x] Manual testing completed
- [x] Visual trace requirements met
```

---

## 3. Source Code Structure

### New Files

```
app/api/drive/fork/
  route.ts                        # Fork API endpoint

components/shared/
  Toast.tsx                        # Toast component UI

components/providers/
  ToastProvider.tsx                # Toast state management

hooks/
  useToast.ts                      # Toast hook
```

### Modified Files

```
components/shared/
  PromptCard.tsx                   # Add animations, toast integration

components/multi-agent/
  MultiAgentView.tsx               # Add URL parameter handling

lib/google/
  drive.ts                         # Add createFile method

JOURNAL.md                         # Add Sprint 3 completion entry
```

### File Dependency Graph

```
ToastProvider.tsx
  ├─ Toast.tsx
  └─ useToast.ts (context)

PromptCard.tsx
  ├─ useToast.ts
  └─ /api/drive/fork (fetch)

MultiAgentView.tsx
  ├─ useToast.ts
  ├─ /api/drive/content/[id] (fetch)
  └─ useSearchParams (next/navigation)

/api/drive/fork/route.ts
  ├─ lib/google/drive.ts
  └─ lib/google/auth.ts
```

---

## 4. Data Model & API Changes

### New Types

**File: `lib/types.ts`** (additions only)
```typescript
// Toast types
export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
  duration?: number;
}

// Fork API types
export interface ForkRequest {
  sourceFileId: string;
}

export interface ForkResponse {
  success: boolean;
  newFileId: string;
  newFileName: string;
  error?: string;
}

// Context Bus - Add new event type
export type ContextBusEvent =
  | { type: 'PLAN_UPDATED'; payload: { content: string; timestamp: Date } }
  | { type: 'FILE_SAVED'; payload: { fileId: string; fileName: string } }
  | { type: 'AGENT_SPAWNED'; payload: { agentId: string; persona: string } }
  | { type: 'SYNC_STATUS_CHANGED'; payload: { status: 'synced' | 'syncing' | 'error' } }
  | { type: 'PROMPT_LOADED'; payload: { promptId: string; sessionId: string } }; // NEW
```

### API Endpoints

**Existing** (no changes):
- `GET /api/drive/files?folder=prompts` - List prompts
- `GET /api/drive/content/[fileId]` - Get file content
- `PATCH /api/drive/content/[fileId]` - Update file content

**New**:
- `POST /api/drive/fork` - Fork prompt to personal library

### Environment Variables

**Required** (should already exist):
```env
GOOGLE_DRIVE_PROMPTS_FOLDER_ID=<folder-id>
```

**Dev Mode Detection** (already implemented):
```typescript
// lib/google/auth.ts
export function isDevMode(): boolean {
  return !process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET;
}
```

---

## 5. Delivery Phases

### Phase 1: Toast System (Estimated: 1-2 hours)
**Goal**: Create reusable toast notification infrastructure

**Tasks**:
1. Create `Toast.tsx` component with Framer Motion animations
2. Create `ToastProvider.tsx` with toast queue management
3. Create `useToast.ts` hook with success/error/info methods
4. Add ToastProvider to root layout
5. Manual test: Trigger all toast types

**Verification**:
```typescript
// Test in browser console
const { toast } = useToast();
toast.success('Success message');
toast.error('Error message');
// Verify toasts appear, animate, and auto-dismiss
```

---

### Phase 2: Multi-Agent Integration (Estimated: 2-3 hours)
**Goal**: Enable "Run in Chat" functionality

**Tasks**:
1. Add `useSearchParams` to MultiAgentView
2. Implement `loadPrompt` URL parameter handler
3. Fetch prompt content via API
4. Create session with pre-loaded message
5. Add toast notifications for success/error
6. Clear URL parameter after processing
7. Manual test: Click "Run in Chat" from Library

**Verification**:
```bash
# Navigate to /library
# Click "Run in Chat" on any prompt
# ✅ Redirected to /
# ✅ New ChatPanel created
# ✅ Prompt content pre-loaded as first user message
# ✅ Toast notification: "Prompt loaded into chat"
# ✅ URL parameter cleared
```

---

### Phase 3: Fork API (Estimated: 2-3 hours)
**Goal**: Implement prompt forking from Gallery to Library

**Tasks**:
1. Extend DriveClient with `createFile` method
2. Create `app/api/drive/fork/route.ts` endpoint
3. Implement dev mode mock behavior
4. Implement production Google Drive fork logic
5. Handle duplicate file names with suffix
6. Add error handling for all failure modes
7. Manual test: Fork from Gallery

**Verification**:
```bash
# Dev Mode Test
curl -X POST http://localhost:3000/api/drive/fork \
  -H "Content-Type: application/json" \
  -d '{"sourceFileId":"mock_file_1"}'
# ✅ Returns success with new file ID

# Browser Test
# Navigate to /gallery
# Click "Fork to Library" on any prompt
# ✅ Toast notification: "Prompt forked to your library"
# ✅ File appears in Library after refresh
```

---

### Phase 4: PromptCard Polish (Estimated: 2-3 hours)
**Goal**: Add animations and wire up new functionality

**Tasks**:
1. Convert PromptCard root div to `motion.div`
2. Add card animation variants (initial, animate, whileHover)
3. Add tag stagger animation
4. Integrate toast notifications in Quick Copy
5. Integrate toast notifications in Fork handler
6. Test animations on both Library and Gallery pages
7. Verify responsive behavior

**Verification**:
```bash
# Library Page
# ✅ Cards fade-in with slide-up on load
# ✅ Hover scales card to 1.02
# ✅ Tags fade-in with 50ms stagger
# ✅ Quick Copy shows toast notification
# ✅ Run in Chat navigates to Multi-Agent

# Gallery Page
# ✅ Same animations as Library
# ✅ Fork to Library shows toast notification
# ✅ Forked prompt appears in Library
```

---

### Phase 5: Documentation (Estimated: 1 hour)
**Goal**: Update JOURNAL.md with visual trace

**Tasks**:
1. Start dev server: `npm run dev`
2. Navigate to `localhost:3000/library`
3. Take screenshot of Library with functional cards
4. Navigate to `localhost:3000/gallery`
5. Take screenshot of Gallery with Fork action
6. Trigger toast notifications for screenshots
7. Update JOURNAL.md with entry and screenshots
8. Take screenshot of JOURNAL.md entry

**Verification**:
```bash
# ✅ JOURNAL.md contains dated entry
# ✅ Screenshot of /library included
# ✅ Screenshot of /gallery included
# ✅ Screenshot of JOURNAL.md entry included
```

---

## 6. Verification Approach

### Automated Checks

**TypeScript Type Check**:
```bash
npm run type-check
# Expected: 0 errors
```

**ESLint**:
```bash
npm run lint
# Expected: 0 warnings, 0 errors
```

**Build Verification**:
```bash
npm run build
# Expected: Successful build with no errors
```

### Manual Testing

**Test Suite: Library Page**
1. Navigate to `/library`
2. Verify prompt cards render correctly
3. Click Quick Copy → Verify toast notification
4. Paste clipboard → Verify prompt content (no frontmatter)
5. Click "Run in Chat" → Verify navigation to `/`
6. Verify new ChatPanel created with prompt content
7. Verify toast notification: "Prompt loaded into chat"

**Test Suite: Gallery Page**
1. Navigate to `/gallery`
2. Verify only public prompts (metadata.public === true) display
3. Click Quick Copy → Verify toast notification
4. Click "Fork to Library" → Verify toast notification
5. Navigate to `/library` → Verify forked prompt appears
6. Verify forked file has unique name if duplicate

**Test Suite: Animations**
1. Navigate to `/library`
2. Observe card fade-in animation on page load
3. Hover over card → Verify scale animation (1.02)
4. Observe tag stagger animation (50ms delay)
5. Verify smooth transitions (200-300ms)

**Test Suite: Error Handling**
1. Trigger invalid prompt load (bad ID in URL)
2. Verify error toast appears
3. Trigger fork operation with network failure (disconnect)
4. Verify error toast appears

---

## 7. Accessibility Considerations

### Keyboard Navigation
- All buttons focusable via Tab key
- Enter/Space activates buttons
- Focus indicators visible (Tailwind default)

### Screen Readers
- Toast messages announced via `aria-live="polite"` region
- Buttons have descriptive `aria-label` attributes
- Cards have proper semantic structure

### ARIA Labels
```typescript
<button aria-label="Copy prompt to clipboard">
  <Copy />
</button>

<button aria-label="Run prompt in chat">
  <PlayCircle /> Run in Chat
</button>

<button aria-label="Fork prompt to your library">
  <Download /> Fork to Library
</button>
```

---

## 8. Performance Considerations

### Animation Performance
- All animations use GPU-accelerated properties (opacity, transform)
- No layout thrashing (avoid animating width/height)
- Framer Motion automatic will-change optimization

### API Request Optimization
- Prompt content fetched in parallel (Promise.all in useLibrary)
- Fork operation single round-trip (create file in one request)
- No unnecessary re-fetches (useEffect dependency arrays)

### Bundle Size
- No new external dependencies (toast system custom-built)
- Framer Motion already included in package.json
- Tree-shaking via Next.js automatic

---

## 9. Security Considerations

### API Route Protection
- All API routes check authentication via `getAuthSession()`
- Unauthorized requests return 401
- File access scoped to user's Google Drive

### Input Validation
```typescript
// Fork API validation
if (!sourceFileId || typeof sourceFileId !== 'string') {
  return NextResponse.json(
    { error: 'Invalid request: sourceFileId required' },
    { status: 400 }
  );
}
```

### XSS Prevention
- All user content sanitized via React (automatic escaping)
- No dangerouslySetInnerHTML usage
- Clipboard API (navigator.clipboard) safe for text

---

## 10. Rollback Strategy

### Phase-Level Rollback
Each phase is independently committable, allowing rollback to last stable state:
- Phase 1 complete → Can roll back toast system, app still functional
- Phase 2 complete → Can roll back Multi-Agent integration, Library still works
- Phase 3 complete → Can roll back Fork API, Gallery still renders
- Phase 4 complete → Can roll back animations, functionality preserved

### Git Strategy
```bash
# After each phase
git add .
git commit -m "feat: Phase N - [description]"

# If rollback needed
git revert HEAD
```

---

## 11. Future Enhancements (Out of Scope)

- Search/filter prompts by tags
- Prompt versioning (track edits over time)
- Collaborative prompt editing (real-time sync)
- Prompt analytics (usage tracking)
- Advanced GitHub sync integration
- Prompt templates/scaffolding
- AI-assisted prompt generation

---

## Appendices

### A. Code Style Guidelines

**Followed from Existing Codebase**:
- 2-space indentation (TypeScript/TSX)
- Double quotes for strings
- Semicolons required
- Tailwind class ordering: layout → spacing → colors → effects
- Component file structure: imports → interfaces → component → export

### B. File Naming Conventions

- Components: PascalCase (e.g., `PromptCard.tsx`)
- Hooks: camelCase with `use` prefix (e.g., `useToast.ts`)
- API routes: lowercase with hyphens (e.g., `fork/route.ts`)
- Types: Interfaces in PascalCase (e.g., `ToastProps`)

### C. Testing Strategy (Future Work)

While not required for this sprint, future testing would include:
- Unit tests: Vitest for utility functions
- Component tests: React Testing Library for UI components
- E2E tests: Playwright for user flows
- API tests: Supertest for endpoint validation

---

**End of Technical Specification**
