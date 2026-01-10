# Product Requirements Document: Library and Gallery Pages

## 1. Overview

### 1.1 Feature Summary
Implement two new pages for visual discovery of prompts in the 11-11 application:
- **Library Page** (`/library`): Personal prompt collection for the authenticated user
- **Gallery Page** (`/gallery`): Public-facing discovery layer showcasing community-contributed prompts

### 1.2 Objectives
- Enable users to visually browse their personal prompt collection
- Provide a discovery mechanism for community-contributed public prompts
- Support quick actions: copying prompts, running prompts in chat, and forking public prompts
- Ensure repository hygiene by properly managing `AUDIT_LOG.md` in git

## 2. User Stories

### 2.1 Library Page
- As a user, I want to view all my personal prompts in a visual grid layout
- As a user, I want to see each prompt's title, description, and tags at a glance
- As a user, I want to quickly copy a prompt's raw content to my clipboard
- As a user, I want to load a prompt into a new chat session with one click
- As a user, I want to navigate to the Library from the main header

### 2.2 Gallery Page
- As a user, I want to discover public prompts contributed by the community
- As a user, I want to see visual cards for each public prompt with title, description, and tags
- As a user, I want to fork/copy a public prompt to my personal Library
- As a user, I want to navigate to the Gallery from the main header

### 2.3 Repository Hygiene
- As a developer, I want `AUDIT_LOG.md` to be ignored by Git to prevent it from being committed
- As a developer, I want `AUDIT_LOG.md` to continue functioning locally for tracking purposes

## 3. Functional Requirements

### 3.1 Task 1: Repository Hygiene - Audit Log Management

#### 3.1.1 Gitignore Configuration
**Requirement**: Update `.gitignore` to exclude `05_Logs/AUDIT_LOG.md`
- Add entry: `05_Logs/AUDIT_LOG.md`
- Verify that `git status` shows the file as untracked
- Ensure the file continues to be created and updated locally

**Acceptance Criteria**:
- ✅ `.gitignore` contains `05_Logs/AUDIT_LOG.md`
- ✅ `git status` output shows `AUDIT_LOG.md` as untracked
- ✅ Local systems can still read/write to `AUDIT_LOG.md`

### 3.2 Task 2: Library Page Implementation

#### 3.2.1 Route Setup
**Requirement**: Create Next.js App Router route at `/library`
- Create `app/library/page.tsx`
- Page should be accessible to authenticated users
- Page should render the LibraryView component

#### 3.2.2 LibraryView Component
**Requirement**: Implement `components/library/LibraryView.tsx`
- Fetch all prompt files from the `/03_Prompts` folder via RepositoryProvider
- Display prompts in a responsive grid layout (1/2/3 columns based on viewport)
- Handle loading states while fetching files
- Handle error states if fetch fails
- Display empty state when no prompts exist

**Data Requirements**:
- Fetch list of files from `/api/drive/files?folder=prompts`
- For each file, fetch content from `/api/drive/content/[fileId]`
- Parse frontmatter using `gray-matter` library
- Extract: title, description, tags, and other metadata

**Grid Layout**:
- Mobile (< 640px): 1 column
- Tablet (640px - 1024px): 2 columns
- Desktop (> 1024px): 3 columns
- Gap between cards: 1.5rem (24px)

#### 3.2.3 PromptCard Component
**Requirement**: Implement `components/library/PromptCard.tsx`
- Display prompt metadata visually
- Support two action buttons: "Quick Copy" and "Run in Chat"

**Visual Design**:
- Card should have subtle border and hover effect
- Title: Extracted from frontmatter `title` field or filename (without extension)
- Description: First 2-3 lines of content (excluding frontmatter) or frontmatter `description`
- Tags: Display as pills/badges from frontmatter `tags` array
- Quick Copy button: Copies raw prompt content (without frontmatter) to clipboard
- Run in Chat button: Opens new chat session with prompt content pre-loaded

**Metadata Schema** (Frontmatter):
```yaml
---
title: "Prompt Title"
description: "Short description of what this prompt does"
tags: ["category", "use-case", "domain"]
public: false
author: "User Name"
created: "2026-01-10"
---
```

**Button Behaviors**:
- **Quick Copy**: 
  - Copies raw prompt content (strips frontmatter)
  - Shows toast notification: "Prompt copied to clipboard"
  - Uses Clipboard API
  
- **Run in Chat**:
  - Creates new chat session in MultiAgentView
  - Pre-fills input with prompt content
  - Navigates to main page if not already there
  - Switches to Multi-Agent tab

#### 3.2.4 Header Navigation
**Requirement**: Update `components/layout/Header.tsx`
- Add "Library" navigation link between logo and WorkspaceSelector
- Link should navigate to `/library`
- Highlight active state when on Library page

### 3.3 Task 3: Gallery Page Implementation

#### 3.3.1 Route Setup
**Requirement**: Create Next.js App Router route at `/gallery`
- Create `app/gallery/page.tsx`
- Page should be publicly accessible (no auth required)
- Page should render the GalleryView component

#### 3.3.2 GalleryView Component
**Requirement**: Implement `components/gallery/GalleryView.tsx`
- Fetch all prompt files from `/03_Prompts` folder
- Filter for prompts with `public: true` in frontmatter
- Display public prompts in a responsive grid (same layout as Library)
- Handle loading/error/empty states

**Filtering Logic**:
- Only show prompts where frontmatter contains `public: true`
- If frontmatter missing or `public: false`, exclude from gallery

#### 3.3.3 PromptCard Component (Gallery)
**Requirement**: Implement `components/gallery/PromptCard.tsx`
- Can reuse/adapt from Library PromptCard
- Similar visual design with title, description, tags
- Replace "Run in Chat" with "Fork to My Library" button

**Button Behaviors**:
- **Quick Copy**: Same as Library version
- **Fork to My Library**:
  - Copies the prompt file to user's `/03_Prompts` folder
  - Strips `public: true` from forked copy (make it private by default)
  - Shows toast notification: "Prompt forked to your Library"
  - Requires authentication (show sign-in prompt if not authenticated)

#### 3.3.4 Header Navigation
**Requirement**: Update `components/layout/Header.tsx`
- Add "Gallery" navigation link next to Library link
- Link should navigate to `/gallery`
- Highlight active state when on Gallery page

### 3.4 Data Layer Enhancements

#### 3.4.1 RepositoryProvider Extension
**Current State**: RepositoryProvider only handles single file operations

**Required Enhancements**:
- Add method to fetch all files from a specific folder (e.g., `/03_Prompts`)
- Add method to parse frontmatter from file content
- Add method to copy/fork a file (for Gallery → Library fork action)

**Proposed New Methods**:
```typescript
interface RepositoryContextValue {
  // Existing methods...
  
  // New methods
  fetchFolderFiles: (folder: 'prompts' | 'prds') => Promise<FileNode[]>;
  parseFileFrontmatter: (content: string) => { data: any; content: string };
  forkPrompt: (sourceFileId: string, destinationName: string) => Promise<void>;
}
```

**Implementation Notes**:
- `fetchFolderFiles`: Calls `/api/drive/files?folder={folder}` endpoint
- `parseFileFrontmatter`: Uses `gray-matter` library to parse YAML frontmatter
- `forkPrompt`: Creates new file by calling POST endpoint (to be created)

#### 3.4.2 New API Endpoint (Optional)
**Requirement**: Create POST endpoint for forking prompts
- Endpoint: `/api/drive/content/fork`
- Method: POST
- Body: `{ sourceFileId: string, newFileName: string, content: string }`
- Action: Creates new file in user's Drive folder
- Returns: `{ fileId: string, success: boolean }`

**Note**: This is out of scope for basic implementation. For MVP, forking can download content and require manual save.

## 4. Non-Functional Requirements

### 4.1 Performance
- Library/Gallery pages should load within 2 seconds on 3G connection
- Card rendering should be optimized (virtualization not required for MVP)
- Image/icon loading should be lazy-loaded

### 4.2 Accessibility
- All interactive elements must be keyboard navigable
- Buttons must have proper ARIA labels
- Color contrast must meet WCAG AA standards
- Screen reader support for card content

### 4.3 Responsive Design
- Mobile-first approach
- Breakpoints: 640px (sm), 1024px (lg)
- Touch-friendly button sizes (minimum 44x44px)

### 4.4 Code Quality
- Zero TypeScript errors (`npm run type-check` passes)
- Zero ESLint warnings (`npm run lint` passes)
- Follow existing codebase conventions:
  - Tailwind CSS for styling
  - Lucide React for icons
  - "use client" for client components
  - Framer Motion for animations (optional for MVP)

## 5. Technical Constraints

### 5.1 Dependencies
- **Existing**:
  - RepositoryProvider (file operations)
  - ContextBusProvider (event bus)
  - MockSessionProvider (authentication)
  - Next.js App Router
  - Tailwind CSS

- **New**:
  - `gray-matter` (frontmatter parsing)
  - Optional: `react-hot-toast` or similar for notifications

### 5.2 Assumptions
1. **Authentication**: Auth.js v5 is configured and handles user sessions
2. **Google Drive**: `/api/drive/*` endpoints are functional and return expected data
3. **Mock Data**: Development mode will use mock data from existing API responses
4. **File Structure**: `/03_Prompts` folder exists in Google Drive workspace
5. **Frontmatter Format**: Prompts use YAML frontmatter at the top of markdown files

### 5.3 Out of Scope
- Deep GitHub sync integration (future sprint)
- Advanced search and filtering (title-only search acceptable for MVP)
- Pagination (acceptable for < 100 prompts)
- User authentication flows (assume Auth.js handles this)
- File upload/creation from UI (prompts are created externally)
- Real-time collaboration features
- Prompt versioning

## 6. Success Metrics

### 6.1 Functional Verification
- ✅ `AUDIT_LOG.md` ignored by Git but locally functional
- ✅ `/library` page accessible and displays personal prompts
- ✅ `/gallery` page accessible and displays public prompts  
- ✅ Prompt cards render correctly with title, description, tags
- ✅ "Quick Copy" copies prompt to clipboard
- ✅ "Run in Chat" opens new chat with prompt content
- ✅ "Fork to My Library" creates copy (or shows coming soon message for MVP)
- ✅ Header navigation includes Library and Gallery links
- ✅ Active nav link is highlighted
- ✅ Zero TypeScript errors
- ✅ Zero ESLint warnings

### 6.2 Visual Verification (Screenshots Required)
1. `git status` showing `05_Logs/AUDIT_LOG.md` as untracked
2. `localhost:3000/library` displaying prompt cards
3. `localhost:3000/gallery` displaying public prompt cards
4. JOURNAL.md entry documenting implementation

## 7. Open Questions & Decisions

### 7.1 Questions
1. **Frontmatter Library**: Should we use `gray-matter` or alternative? 
   - **Decision**: Use `gray-matter` (industry standard, 11M weekly downloads)

2. **Fork Implementation**: Should forking be fully functional or show "Coming Soon"?
   - **Decision**: For MVP, show toast message "Forking coming soon" to unblock development

3. **Navigation Structure**: Should Library/Gallery be in Header or Sidebar?
   - **Decision**: Place in Header next to logo/workspace selector for prominence

4. **Empty State**: What should Library show when user has no prompts?
   - **Decision**: Show friendly message: "No prompts yet. Create your first prompt in Google Drive."

5. **Gallery Discovery**: How are prompts marked as public?
   - **Decision**: Users manually add `public: true` to frontmatter. Future: UI toggle.

### 7.2 Design Decisions
1. **Card Design**: Follow "Hardworking Workbench" aesthetic - clean, minimal, high-signal
2. **Animations**: Subtle hover effects only (no complex animations for MVP)
3. **Loading States**: Skeleton loaders for cards (Tailwind animate-pulse)
4. **Error Handling**: Show user-friendly error messages, log details to console

## 8. Implementation Phases

### Phase 1: Repository Hygiene
1. Update `.gitignore`
2. Verify git status
3. Document in JOURNAL.md

### Phase 2: Dependencies & Data Layer
1. Install `gray-matter`
2. Extend RepositoryProvider with new methods
3. Create custom hooks: `useLibrary()`, `useGallery()`

### Phase 3: Library Page
1. Create route and LibraryView component
2. Implement PromptCard component
3. Integrate with RepositoryProvider
4. Update Header navigation
5. Test and verify

### Phase 4: Gallery Page
1. Create route and GalleryView component
2. Adapt PromptCard for gallery use
3. Implement filtering logic
4. Update Header navigation
5. Test and verify

### Phase 5: Verification & Documentation
1. Run `npm run lint` and fix any warnings
2. Run `npm run type-check` and fix any errors
3. Run `npm run dev` and verify localhost
4. Capture screenshots
5. Update JOURNAL.md with implementation details

## 9. Appendix

### 9.1 Sample Prompt with Frontmatter
```markdown
---
title: "Code Review Prompt"
description: "A detailed prompt for conducting thorough code reviews"
tags: ["code-review", "development", "best-practices"]
public: true
author: "Jane Developer"
created: "2026-01-10"
version: "1.0"
---

You are an expert code reviewer. Review the following code and provide:

1. Code quality assessment
2. Potential bugs or issues
3. Performance improvements
4. Best practice recommendations

[Code to review will be inserted here]
```

### 9.2 API Response Examples

**GET /api/drive/files?folder=prompts**
```json
{
  "files": [
    {
      "id": "file_123",
      "name": "code-review.md",
      "mimeType": "text/markdown",
      "modifiedTime": "2026-01-10T12:00:00Z",
      "path": "03_Prompts/code-review.md"
    }
  ]
}
```

**GET /api/drive/content/file_123**
```json
{
  "fileId": "file_123",
  "content": "---\ntitle: \"Code Review Prompt\"\n---\n\nPrompt content...",
  "modifiedTime": "2026-01-10T12:00:00Z"
}
```
