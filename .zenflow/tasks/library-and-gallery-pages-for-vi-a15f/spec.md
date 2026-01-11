# Technical Specification: Library and Gallery Pages

## 1. Technical Context

### 1.1 Technology Stack
- **Framework**: Next.js 14.2 (App Router)
- **Language**: TypeScript 5.7
- **Styling**: Tailwind CSS 3.4
- **Icons**: Lucide React
- **Animation**: Framer Motion 11.15
- **Authentication**: Next-Auth 5.0 (beta)

### 1.2 Dependencies

**Existing:**
- `react` 18.3.1
- `next` 14.2.24
- `tailwindcss` 3.4.17
- `lucide-react` 0.469.0
- `framer-motion` 11.15.0
- `clsx` 2.1.1
- `tailwind-merge` 2.6.0

**New (to be installed):**
- `gray-matter` ^4.0.3 - YAML frontmatter parser

### 1.3 Existing Architecture Patterns

**Provider Pattern:**
- `RepositoryProvider` - File content management
- `ContextBusProvider` - Event bus for cross-component communication
- `SyncStatusProvider` - Sync operation tracking
- `MockSessionProvider` - Authentication mock/wrapper

**API Routes:**
- `GET /api/drive/files?folder=prompts|prds` - List files from specific folder
- `GET /api/drive/content/[fileId]` - Fetch file content
- `PATCH /api/drive/content/[fileId]` - Update file content

**Component Structure:**
- `app/` - Next.js App Router pages
- `components/layout/` - Header, Sidebar, MainContent
- `components/providers/` - Context providers
- `components/shared/` - Reusable components
- `lib/` - Utilities, types, API clients

**Type Definitions:**
- `FileNode` - File tree nodes
- `DriveFile` - Google Drive file metadata
- `User`, `Session` - Auth types

## 2. Implementation Approach

### 2.1 Task 1: Repository Hygiene

**Files Modified:**
- `.gitignore` (create or update)

**Approach:**
1. Create `.gitignore` if it doesn't exist (currently missing)
2. Add `05_Logs/AUDIT_LOG.md` entry
3. Verify with `git status`

**No code changes required** - Configuration only

### 2.2 Task 2: Library Page Implementation

#### 2.2.1 New Type Definitions

**File:** `lib/types.ts`

Add new interfaces:
```typescript
export interface PromptMetadata {
  title?: string;
  description?: string;
  tags?: string[];
  public?: boolean;
  author?: string;
  created?: string;
  version?: string;
}

export interface PromptFile extends DriveFile {
  metadata?: PromptMetadata;
  rawContent?: string; // Content without frontmatter
}
```

#### 2.2.2 Custom Hooks

**File:** `hooks/useLibrary.ts` (new)

```typescript
export function useLibrary() {
  const [prompts, setPrompts] = useState<PromptFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all prompts from /03_Prompts folder
  // Parse frontmatter using gray-matter
  // Return prompts with metadata
}
```

**File:** `hooks/useGallery.ts` (new)

```typescript
export function useGallery() {
  const { prompts, isLoading, error } = useLibrary();
  
  // Filter for public: true prompts only
  const publicPrompts = prompts.filter(p => p.metadata?.public === true);
  
  return { prompts: publicPrompts, isLoading, error };
}
```

#### 2.2.3 Component Hierarchy

**Page:** `app/library/page.tsx`
```
LibraryPage (Server Component)
└─> LibraryView (Client Component)
    └─> PromptCard[] (Client Component)
```

**Page:** `app/gallery/page.tsx`
```
GalleryPage (Server Component)
└─> GalleryView (Client Component)
    └─> PromptCard[] (Client Component)
```

#### 2.2.4 Component Design

**PromptCard Components:**
- Reusable card layout with variant prop ("library" | "gallery")
- Library variant: "Quick Copy" + "Run in Chat" buttons
- Gallery variant: "Quick Copy" + "Fork to My Library" buttons

**Grid Layout:**
- Use Tailwind grid classes: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6`
- Responsive breakpoints: 640px (sm), 1024px (lg)

**Loading States:**
- Skeleton loaders using Tailwind `animate-pulse`
- Grid of 6 skeleton cards during loading

**Empty States:**
- Library: "No prompts yet. Create your first prompt in Google Drive."
- Gallery: "No public prompts available yet."

### 2.3 Task 3: Header Navigation

**Files Modified:**
- `components/layout/Header.tsx`

**Approach:**
1. Add navigation links between logo and WorkspaceSelector
2. Use Next.js `usePathname()` for active state detection
3. Style active link with blue accent color
4. Structure:
```tsx
<div className="flex items-center gap-4">
  <Logo />
  <Divider />
  <NavLinks> {/* NEW */}
    <Link href="/library">Library</Link>
    <Link href="/gallery">Gallery</Link>
  </NavLinks>
  <WorkspaceSelector />
</div>
```

## 3. Source Code Structure Changes

### 3.1 New Files
```
app/
  library/
    page.tsx                  # Library route (Server Component)
  gallery/
    page.tsx                  # Gallery route (Server Component)

components/
  library/
    LibraryView.tsx           # Main library view (Client Component)
    PromptCard.tsx            # Prompt card for library
  gallery/
    GalleryView.tsx           # Main gallery view (Client Component)
    PromptCard.tsx            # Prompt card for gallery (could be shared)

hooks/
  useLibrary.ts               # Hook to fetch and parse all prompts
  useGallery.ts               # Hook to fetch public prompts only
```

### 3.2 Modified Files
```
components/layout/Header.tsx  # Add Library/Gallery nav links
lib/types.ts                  # Add PromptMetadata, PromptFile types
.gitignore                    # Add AUDIT_LOG.md exclusion
```

### 3.3 File Organization Decision

**PromptCard Component Strategy:**
- Option A: Shared component with variant prop
- Option B: Separate components per page

**Decision: Option A** (Shared Component)
- Create `components/shared/PromptCard.tsx`
- Use variant prop: `variant: "library" | "gallery"`
- Reduces code duplication
- Easier to maintain consistent styling

## 4. Data Model / API / Interface Changes

### 4.1 API Endpoint Usage

**No new API endpoints required.** Use existing:
- `GET /api/drive/files?folder=prompts` - Returns all prompt files
- `GET /api/drive/content/[fileId]` - Returns file content with frontmatter

**Client-side parsing:**
- Use `gray-matter` to parse frontmatter from content
- Extract metadata and raw content

### 4.2 Data Flow

```
User visits /library
  └─> LibraryView component mounts
      └─> useLibrary() hook executes
          └─> Fetch: GET /api/drive/files?folder=prompts
          └─> For each file: GET /api/drive/content/[fileId]
          └─> Parse frontmatter with gray-matter
          └─> Set prompts state with metadata
      └─> Render grid of PromptCard components
```

### 4.3 Clipboard API Integration

**Quick Copy Feature:**
```typescript
const handleQuickCopy = async (content: string) => {
  await navigator.clipboard.writeText(content);
  // Show toast notification (optional for MVP)
};
```

### 4.4 Run in Chat Feature

**Approach:**
- Use `useRouter()` to navigate to `/`
- Use ContextBus to emit event: `PROMPT_LOADED`
- MultiAgentView listens for event and pre-fills input

**Alternative (Simpler for MVP):**
- Navigate to `/?prompt=base64EncodedContent`
- Page reads URL param and loads into chat

**Decision: Use URL param approach** for simplicity

### 4.5 Fork to Library Feature

**MVP Implementation:**
- For MVP: Show toast "Fork to Library - Coming Soon"
- Full implementation requires:
  - POST endpoint to create new file
  - Copy file content and strip `public: true`
  - Refresh library view

**Decision: MVP shows placeholder message**

## 5. Delivery Phases

### Phase 1: Setup & Dependencies (30 min)
**Deliverables:**
- ✅ Update `.gitignore` with `05_Logs/AUDIT_LOG.md`
- ✅ Install `gray-matter` dependency
- ✅ Add new types to `lib/types.ts`
- ✅ Verify git status shows AUDIT_LOG as untracked

**Verification:**
```bash
git status | findstr AUDIT_LOG
npm list gray-matter
npm run type-check
```

### Phase 2: Custom Hooks (45 min)
**Deliverables:**
- ✅ Create `hooks/useLibrary.ts`
- ✅ Create `hooks/useGallery.ts`
- ✅ Test hooks with console logs

**Verification:**
- Hooks fetch and parse mock data correctly
- Frontmatter extraction works
- TypeScript types are correct

### Phase 3: Library Page (1.5 hours)
**Deliverables:**
- ✅ Create `app/library/page.tsx`
- ✅ Create `components/library/LibraryView.tsx`
- ✅ Create `components/shared/PromptCard.tsx` (library variant)
- ✅ Implement Quick Copy functionality
- ✅ Implement Run in Chat functionality

**Verification:**
```bash
npm run dev
# Navigate to http://localhost:3000/library
# Verify prompts display correctly
# Test Quick Copy button
# Test Run in Chat button
```

### Phase 4: Gallery Page (1 hour)
**Deliverables:**
- ✅ Create `app/gallery/page.tsx`
- ✅ Create `components/gallery/GalleryView.tsx`
- ✅ Update `PromptCard.tsx` to support gallery variant
- ✅ Implement Fork to Library placeholder

**Verification:**
```bash
# Navigate to http://localhost:3000/gallery
# Verify only public prompts display
# Test Fork button shows placeholder message
```

### Phase 5: Navigation & Polish (30 min)
**Deliverables:**
- ✅ Update `Header.tsx` with Library/Gallery links
- ✅ Add active state highlighting
- ✅ Test navigation between pages

**Verification:**
- Library link navigates to `/library`
- Gallery link navigates to `/gallery`
- Active link is highlighted
- Mobile responsive layout works

### Phase 6: Verification & Documentation (30 min)
**Deliverables:**
- ✅ Run linting: `npm run lint`
- ✅ Run type checking: `npm run type-check`
- ✅ Capture screenshots of all pages
- ✅ Update JOURNAL.md (if exists)

**Verification:**
```bash
npm run lint # 0 warnings
npm run type-check # 0 errors
npm run dev # Localhost verification
```

## 6. Verification Approach

### 6.1 Automated Checks

**Linting:**
```bash
npm run lint
```
Expected: 0 ESLint warnings/errors

**Type Checking:**
```bash
npm run type-check
```
Expected: 0 TypeScript errors

**Build Verification:**
```bash
npm run build
```
Expected: Successful production build

### 6.2 Manual Testing Checklist

**Repository Hygiene:**
- [ ] Run `git status` - AUDIT_LOG.md is untracked
- [ ] Verify AUDIT_LOG.md still exists locally

**Library Page:**
- [ ] Navigate to `/library`
- [ ] Verify all prompts from mock data display
- [ ] Verify prompt cards show title, description, tags
- [ ] Click "Quick Copy" - content copied to clipboard
- [ ] Click "Run in Chat" - navigates to home with prompt loaded
- [ ] Test responsive layout (mobile/tablet/desktop)
- [ ] Test loading state
- [ ] Test empty state (no prompts)

**Gallery Page:**
- [ ] Navigate to `/gallery`
- [ ] Verify only public prompts display (filter by `public: true`)
- [ ] Verify prompt cards display correctly
- [ ] Click "Fork to Library" - shows placeholder message
- [ ] Test responsive layout

**Navigation:**
- [ ] Header shows "Library" and "Gallery" links
- [ ] Active link is highlighted when on respective page
- [ ] Navigation works from all pages

### 6.3 Screenshot Requirements

Capture screenshots of:
1. `git status` output showing AUDIT_LOG.md as untracked
2. `/library` page with prompt cards displayed
3. `/gallery` page with public prompt cards
4. JOURNAL.md entry (if required)

## 7. Mock Data Strategy

### 7.1 Enhanced Mock Content

**File:** `app/api/drive/content/[fileId]/route.ts`

Update `MOCK_CONTENT` to include prompts with frontmatter:

```typescript
const MOCK_CONTENT: Record<string, string> = {
  mock_file_1: `---
title: "Task Planning Prompt"
description: "A prompt for creating detailed task plans"
tags: ["planning", "workflow", "productivity"]
public: true
author: "System"
created: "2026-01-10"
---

You are a task planning expert...`,
  
  mock_file_2: `---
title: "Code Review Prompt"
description: "Expert code review with best practices"
tags: ["code-review", "quality", "development"]
public: true
author: "Dev Team"
created: "2026-01-09"
---

You are an expert code reviewer...`,
  
  mock_file_3: `---
title: "Personal Note"
description: "Private prompt for internal use"
tags: ["personal", "notes"]
public: false
author: "User"
created: "2026-01-08"
---

Personal prompt content...`,
};
```

**Expected Behavior:**
- `/library` shows all 3 prompts
- `/gallery` shows only mock_file_1 and mock_file_2 (public: true)
- mock_file_3 is hidden from gallery (public: false)

## 8. Risk Mitigation

### 8.1 Potential Issues

**Issue 1: Gray-matter parsing errors**
- Risk: Malformed frontmatter breaks page
- Mitigation: Wrap parsing in try-catch, show error state
- Fallback: Display file without metadata if parsing fails

**Issue 2: Large number of prompts (100+)**
- Risk: Slow loading, poor UX
- Mitigation: For MVP, acceptable for <100 prompts
- Future: Implement pagination or virtualization

**Issue 3: Clipboard API browser support**
- Risk: Navigator.clipboard not available in older browsers
- Mitigation: Check for API availability, show error if unsupported
- Fallback: Use legacy document.execCommand('copy')

**Issue 4: Navigation state management**
- Risk: Active link highlighting doesn't update
- Mitigation: Use `usePathname()` hook from Next.js
- Test: Navigate between pages and verify highlighting

### 8.2 Browser Compatibility

**Target Browsers:**
- Chrome/Edge 90+ (Clipboard API support)
- Firefox 90+
- Safari 14+

**Polyfills:** None required for MVP

## 9. Out of Scope (Deferred to Future Sprints)

### 9.1 Explicitly Excluded Features

1. **Search and Filtering:**
   - Title search
   - Tag filtering
   - Sort options (date, title, etc.)

2. **Pagination:**
   - Infinite scroll
   - Page-based navigation

3. **Fork Implementation:**
   - POST /api/drive/content endpoint
   - File copying logic
   - Auto-refresh after fork

4. **Advanced Features:**
   - Prompt editing in-place
   - Prompt deletion
   - Bulk operations
   - Drag-and-drop reordering

5. **GitHub Sync:**
   - Deep GitHub integration
   - Bi-directional sync

6. **User Management:**
   - User authentication flows (handled by Next-Auth)
   - User profile pages
   - Collaborative editing

### 9.2 Future Enhancement Opportunities

1. **Performance Optimization:**
   - Virtual scrolling for large lists
   - Lazy loading images/content
   - Caching strategy

2. **UX Improvements:**
   - Keyboard shortcuts
   - Batch operations
   - Advanced search with fuzzy matching

3. **Social Features:**
   - Prompt ratings/reviews
   - Usage analytics
   - Trending prompts

## 10. Implementation Notes

### 10.1 Code Style Guidelines

**Follow existing patterns:**
- Use `"use client"` directive for client components
- Export default for page components
- Named exports for shared components
- Tailwind for all styling (no CSS modules)
- Use `cn()` utility for conditional classes
- Lucide React for all icons

**TypeScript Conventions:**
- Explicit return types for functions
- Interface over type for object shapes
- Avoid `any` type
- Use optional chaining (`?.`) for nested properties

### 10.2 File Naming Conventions

**Follow existing patterns:**
- PascalCase for components: `PromptCard.tsx`
- camelCase for hooks: `useLibrary.ts`
- camelCase for utilities: `utils.ts`
- kebab-case for API routes: `[fileId]/route.ts`

### 10.3 Component Patterns

**Client Components:**
```tsx
"use client";

import { useState } from "react";
import { SomeIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ComponentProps {
  // props
}

export function ComponentName({ prop }: ComponentProps) {
  // implementation
}
```

**Server Components:**
```tsx
import { ComponentName } from "@/components/path";

export default function Page() {
  // implementation
}
```

## 11. Success Criteria Summary

### 11.1 Functional Requirements
- ✅ `.gitignore` excludes `05_Logs/AUDIT_LOG.md`
- ✅ `/library` page displays all personal prompts
- ✅ `/gallery` page displays only public prompts
- ✅ Prompt cards show title, description, tags
- ✅ Quick Copy copies prompt to clipboard
- ✅ Run in Chat loads prompt into chat session
- ✅ Fork to Library shows placeholder message
- ✅ Header navigation includes Library and Gallery links
- ✅ Active nav link is highlighted

### 11.2 Technical Requirements
- ✅ Zero TypeScript errors (`npm run type-check`)
- ✅ Zero ESLint warnings (`npm run lint`)
- ✅ Successful build (`npm run build`)
- ✅ Localhost verification (`npm run dev`)

### 11.3 Visual Verification
- ✅ Screenshot of `git status` output
- ✅ Screenshot of `/library` page
- ✅ Screenshot of `/gallery` page
- ✅ JOURNAL.md entry (if applicable)

## 12. Conclusion

This specification provides a clear, incremental approach to implementing the Library and Gallery pages. The implementation leverages existing patterns and infrastructure while introducing minimal new complexity. The phased delivery approach ensures testable milestones and allows for course correction if issues arise.

**Estimated Total Implementation Time:** 4-5 hours

**Key Dependencies:**
- `gray-matter` package installation
- Existing API endpoints functional
- Mock data with frontmatter for testing

**Next Steps After Approval:**
1. Proceed to Planning phase
2. Break down into detailed implementation tasks
3. Begin Phase 1 (Setup & Dependencies)
