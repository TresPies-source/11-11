# Technical Specification: One-Click Publish v0.2.5

**Task ID**: one-click-publish-v0-2-5-f605  
**Complexity**: Medium  
**Estimated Duration**: 2-3 days  
**Date**: January 12, 2026

---

## 1. Overview

### 1.1 Objective
Enable users to make prompts public with a single toggle, laying the foundation for the Global Commons (the "Wikipedia of Prompts"). This feature allows users to share their best prompts with the community while maintaining ownership and privacy controls.

### 1.2 Complexity Assessment
**Complexity Level**: Medium

**Rationale**:
- Database schema migration required (4 new columns)
- Multiple UI components need updates (toggle, badges, cards)
- Privacy rules and ownership logic need careful implementation
- API routes for publish/unpublish/copy operations
- Filter and sort functionality for Commons view
- Existing infrastructure (PGlite, prompt system) provides solid foundation

**Key Challenges**:
- Database migration on existing PGlite instances
- Maintaining backwards compatibility with existing prompts
- Ensuring privacy rules are enforced at database query level
- Copy functionality that preserves content but creates new ownership
- Seed data updates to include public prompts for testing

---

## 2. Technical Context

### 2.1 Technology Stack
- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Database**: PGlite (PostgreSQL in browser via IndexedDB)
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **State Management**: React hooks (useState, useMemo, useCallback)

### 2.2 Current Architecture

**Database Layer** (`lib/pglite/`):
- `client.ts` - PGlite singleton with auto-initialization
- `schema.ts` - Database schema definition (SQL)
- `prompts.ts` - Prompt CRUD operations
- `critiques.ts` - Critique scoring operations
- `seed.ts` - Sample data generator (31 prompts)
- `types.ts` - TypeScript interfaces for database rows

**Current Schema**:
```sql
-- prompts table
- id (UUID)
- user_id (TEXT)
- title (TEXT)
- content (TEXT)
- status ('draft' | 'active' | 'saved' | 'archived')
- drive_file_id (TEXT, nullable)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)

-- prompt_metadata table
- id (UUID)
- prompt_id (UUID, FK to prompts)
- description (TEXT, nullable)
- tags (TEXT[], nullable)
- is_public (BOOLEAN, default false) ← Already exists!
- author (TEXT, nullable)
- version (TEXT, nullable)
- created_at (TIMESTAMPTZ)
```

**Existing Public Prompts Flow**:
- Commons view already exists at `/librarian/commons`
- `useGallery` hook filters prompts by `metadata.public === true`
- `CommonsView` component displays public prompts
- Currently shows only current user's public prompts (needs update)

---

## 3. Database Schema Changes

### 3.1 Schema Migration

**New Columns to Add**:

```sql
-- Add to prompt_metadata table
ALTER TABLE prompt_metadata 
ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ NULL,
ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'private' CHECK (visibility IN ('private', 'unlisted', 'public')),
ADD COLUMN IF NOT EXISTS author_name TEXT NULL,
ADD COLUMN IF NOT EXISTS author_id TEXT NULL;

-- Add index for efficient public prompts queries
CREATE INDEX IF NOT EXISTS idx_prompt_metadata_visibility_published 
ON prompt_metadata(visibility, published_at DESC NULLS LAST);

-- Add index for author queries
CREATE INDEX IF NOT EXISTS idx_prompt_metadata_author_id 
ON prompt_metadata(author_id);
```

**Column Descriptions**:
- `published_at`: Timestamp when prompt was first made public (NULL if never published)
- `visibility`: Enum ('private', 'unlisted', 'public') - replaces boolean `is_public`
- `author_name`: Display name of prompt creator (for attribution)
- `author_id`: User ID of prompt owner (for ownership verification)

**Migration Strategy**:
1. Add new columns with NULL defaults (non-breaking)
2. Backfill existing prompts:
   - Set `visibility = 'public'` where `is_public = true`
   - Set `visibility = 'private'` where `is_public = false`
   - Set `published_at = created_at` for public prompts
   - Set `author_id = user_id` from parent prompts table
   - Set `author_name = 'Dev User'` for dev mode
3. Keep `is_public` column for backwards compatibility (mark as deprecated)

**Files to Modify**:
- `lib/pglite/schema.ts` - Add migration SQL
- `lib/pglite/types.ts` - Update TypeScript interfaces
- `lib/pglite/prompts.ts` - Update queries to use new columns
- `lib/pglite/seed.ts` - Update seed data with public prompts

### 3.2 Updated TypeScript Interfaces

```typescript
// lib/pglite/types.ts
export type PromptVisibility = 'private' | 'unlisted' | 'public';

export interface PromptMetadataRow {
  id: string;
  prompt_id: string;
  description: string | null;
  tags: string[] | null;
  is_public: boolean; // Deprecated - use visibility instead
  author: string | null; // Deprecated - use author_name instead
  author_name: string | null;
  author_id: string | null;
  visibility: PromptVisibility;
  published_at: string | null;
  version: string | null;
  created_at: string;
}

// lib/types.ts
export interface PromptMetadata {
  title?: string;
  description?: string;
  tags?: string[];
  public?: boolean; // Deprecated
  visibility?: PromptVisibility;
  published_at?: string | null;
  author?: string; // Deprecated
  author_name?: string;
  author_id?: string;
  created?: string;
  version?: string;
}

export interface Prompt {
  id: string;
  userId: string;
  title: string;
  content: string;
  status: PromptStatus;
  driveFileId: string | null;
  createdAt: string;
  updatedAt: string;
  metadata: PromptMetadata;
}
```

---

## 4. API Routes

### 4.1 New API Endpoints

**1. Publish Prompt**
- **Route**: `POST /api/librarian/publish`
- **Purpose**: Make a prompt public
- **Request Body**:
  ```typescript
  {
    promptId: string;
    authorName: string;
  }
  ```
- **Response**:
  ```typescript
  {
    success: boolean;
    prompt: PromptWithCritique;
    message?: string;
  }
  ```
- **Logic**:
  1. Verify user owns the prompt
  2. Update `prompt_metadata`:
     - Set `visibility = 'public'`
     - Set `published_at = NOW()` (if first publish)
     - Set `author_name` and `author_id`
  3. Return updated prompt

**2. Unpublish Prompt**
- **Route**: `POST /api/librarian/unpublish`
- **Purpose**: Make a prompt private
- **Request Body**:
  ```typescript
  {
    promptId: string;
  }
  ```
- **Response**:
  ```typescript
  {
    success: boolean;
    prompt: PromptWithCritique;
  }
  ```
- **Logic**:
  1. Verify user owns the prompt
  2. Update `visibility = 'private'`
  3. Keep `published_at` for history
  4. Return updated prompt

**3. Get Public Prompts**
- **Route**: `GET /api/librarian/public`
- **Purpose**: Fetch all public prompts (with filters)
- **Query Parameters**:
  ```typescript
  {
    sortBy?: 'recent' | 'popular' | 'score';
    filterBy?: 'all' | 'mine';
    userId?: string; // For "mine" filter
    page?: number;
    limit?: number;
  }
  ```
- **Response**:
  ```typescript
  {
    prompts: PromptWithCritique[];
    total: number;
    page: number;
    hasMore: boolean;
  }
  ```
- **Logic**:
  1. Query prompts where `visibility = 'public'`
  2. Apply filters (mine vs all)
  3. Apply sorting (recent, popular, score)
  4. Return paginated results

**4. Copy Public Prompt**
- **Route**: `POST /api/librarian/copy`
- **Purpose**: Copy a public prompt to user's library
- **Request Body**:
  ```typescript
  {
    promptId: string;
    userId: string;
  }
  ```
- **Response**:
  ```typescript
  {
    success: boolean;
    newPrompt: PromptWithCritique;
  }
  ```
- **Logic**:
  1. Verify source prompt is public
  2. Create new prompt:
     - Copy content and metadata
     - Set `user_id = current_user`
     - Set `status = 'saved'`
     - Set `visibility = 'private'` (copies are private by default)
     - Clear `drive_file_id` (unlink from source)
  3. Return new prompt

**Files to Create**:
- `app/api/librarian/publish/route.ts`
- `app/api/librarian/unpublish/route.ts`
- `app/api/librarian/public/route.ts`
- `app/api/librarian/copy/route.ts`

---

## 5. Component Updates

### 5.1 New Components

**1. PublicToggle** (`components/librarian/PublicToggle.tsx`)
- Toggle switch for making prompts public
- Shows confirmation dialog on first publish
- Displays current visibility state
- Accessible (keyboard navigation, ARIA labels)
- Props:
  ```typescript
  {
    promptId: string;
    isPublic: boolean;
    onToggle: (isPublic: boolean) => Promise<void>;
    disabled?: boolean;
  }
  ```

**2. PublicBadge** (`components/librarian/PublicBadge.tsx`)
- Visual indicator for public prompts
- Icon: 🌍 (globe emoji) or Globe icon from Lucide
- Displays "Public" text
- Props:
  ```typescript
  {
    variant?: 'default' | 'compact';
    className?: string;
  }
  ```

**3. PublishConfirmDialog** (`components/librarian/PublishConfirmDialog.tsx`)
- Confirmation dialog for first publish
- Explains what making prompt public means
- "Don't show again" checkbox (localStorage)
- Props:
  ```typescript
  {
    isOpen: boolean;
    onConfirm: () => void;
    onCancel: () => void;
  }
  ```

**4. CopyToLibraryButton** (`components/librarian/CopyToLibraryButton.tsx`)
- Button to copy public prompt to user's library
- Shows loading state during copy
- Toast notification on success
- Props:
  ```typescript
  {
    promptId: string;
    onCopyComplete?: (newPrompt: Prompt) => void;
    disabled?: boolean;
  }
  ```

### 5.2 Component Modifications

**1. SeedlingCard.tsx & GreenhouseCard.tsx**
- Add `<PublicToggle />` in card actions section
- Add `<PublicBadge />` when prompt is public
- Position toggle in card footer/header
- Update card layout for new elements

**2. CommonsView.tsx**
- Update to fetch public prompts from ALL users (not just current user)
- Add filter dropdown: "All Public Prompts" | "My Public Prompts"
- Add sort dropdown: "Recent" | "Popular" | "Highest Score"
- Add `<CopyToLibraryButton />` to each card
- Show author attribution (author_name)
- Show publish date (published_at)

**3. PromptCard.tsx**
- Add `variant="commons"` styling
- Show author name for public prompts
- Show "Copy to My Library" button for non-owned prompts
- Disable edit/delete for non-owned prompts
- Show PublicBadge for public prompts

**Files to Create**:
- `components/librarian/PublicToggle.tsx`
- `components/librarian/PublicBadge.tsx`
- `components/librarian/PublishConfirmDialog.tsx`
- `components/librarian/CopyToLibraryButton.tsx`

**Files to Modify**:
- `components/librarian/SeedlingCard.tsx`
- `components/librarian/GreenhouseCard.tsx`
- `components/librarian/CommonsView.tsx`
- `components/shared/PromptCard.tsx`

---

## 6. Hooks & Business Logic

### 6.1 New Hooks

**1. usePublicToggle** (`hooks/usePublicToggle.ts`)
- Manages publish/unpublish state
- Handles first-publish confirmation
- Calls publish/unpublish API
- Optimistic UI updates
- Returns:
  ```typescript
  {
    isPublic: boolean;
    isPublishing: boolean;
    publishPrompt: () => Promise<void>;
    unpublishPrompt: () => Promise<void>;
    togglePublic: () => Promise<void>;
  }
  ```

**2. useCopyPrompt** (`hooks/useCopyPrompt.ts`)
- Handles copying public prompts to library
- Shows toast notifications
- Tracks copy state
- Returns:
  ```typescript
  {
    copyPrompt: (promptId: string) => Promise<Prompt | null>;
    isCopying: boolean;
    error: string | null;
  }
  ```

### 6.2 Hook Modifications

**1. useGallery.ts**
- Update to fetch public prompts from database (not just filter)
- Add support for filters (all vs mine)
- Add support for sorting (recent, popular, score)
- Call new `/api/librarian/public` endpoint

**Files to Create**:
- `hooks/usePublicToggle.ts`
- `hooks/useCopyPrompt.ts`

**Files to Modify**:
- `hooks/useGallery.ts`

---

## 7. Privacy & Security Rules

### 7.1 Ownership Verification

**Rule**: Only prompt owner can toggle public/private

**Implementation**:
- All API routes verify `userId` matches `prompt.user_id`
- Database queries filter by `user_id`
- UI disables toggle for non-owned prompts

### 7.2 Read-Only Access

**Rule**: Non-owners can view but not edit public prompts

**Implementation**:
- Commons view shows read-only cards
- Edit/delete buttons hidden for non-owned prompts
- API routes reject updates from non-owners
- "Copy to My Library" creates new prompt with new owner

### 7.3 Unpublish Anytime

**Rule**: Users can unpublish prompts at any time

**Implementation**:
- Toggle works both ways (publish ↔ unpublish)
- No restrictions on unpublishing
- `published_at` timestamp preserved for history

### 7.4 Copy Privacy

**Rule**: Copied prompts are private by default

**Implementation**:
- Copies have `visibility = 'private'`
- Copies have new `author_id` (current user)
- Copies are unlinked from source (`drive_file_id = null`)

---

## 8. User Experience Flow

### 8.1 Publishing a Prompt

1. User navigates to Seedlings or Greenhouse
2. User clicks "Make Public" toggle on prompt card
3. First time: Confirmation dialog appears
   - "Are you sure you want to make this prompt public?"
   - Explains prompt will be visible to all users
   - "Don't show again" checkbox
4. User confirms
5. Toggle animates to "on" position
6. PublicBadge appears on card
7. Toast notification: "🌍 Prompt published to Commons!"
8. Prompt now appears in Commons view

### 8.2 Unpublishing a Prompt

1. User clicks "Make Private" toggle on public prompt
2. Toggle animates to "off" position
3. PublicBadge disappears
4. Toast notification: "Prompt made private"
5. Prompt removed from Commons view (for other users)

### 8.3 Browsing Commons

1. User navigates to `/librarian/commons`
2. Page shows public prompts from all users
3. Each card shows:
   - Prompt title and content preview
   - Author name ("by @username")
   - Publish date ("Published 2 days ago")
   - Critique score (if available)
   - Tags
   - "Copy to My Library" button (if not owned by user)
   - "View Details" button
4. User can filter: All | My Public Prompts
5. User can sort: Recent | Popular | Highest Score

### 8.4 Copying a Prompt

1. User browses Commons
2. User finds interesting public prompt
3. User clicks "Copy to My Library"
4. Button shows loading state
5. Toast notification: "✅ Copied to your Greenhouse!"
6. New prompt appears in user's Greenhouse (status: saved)
7. Prompt is private by default
8. User can edit, run, or delete the copy

---

## 9. Implementation Plan

### 9.1 Phase 1: Database Schema (1-2 hours)

**Tasks**:
- [ ] Update `lib/pglite/schema.ts` with new columns
- [ ] Create migration function `migrateTo_v0_2_5()`
- [ ] Update `lib/pglite/types.ts` with new interfaces
- [ ] Update `lib/pglite/prompts.ts` query logic
- [ ] Add backfill logic for existing prompts
- [ ] Test schema migration on fresh database

**Success Criteria**:
- All new columns exist in database
- Indexes created for performance
- Existing prompts migrated correctly
- No data loss or corruption

### 9.2 Phase 2: API Routes (2-3 hours)

**Tasks**:
- [ ] Create `app/api/librarian/publish/route.ts`
- [ ] Create `app/api/librarian/unpublish/route.ts`
- [ ] Create `app/api/librarian/public/route.ts`
- [ ] Create `app/api/librarian/copy/route.ts`
- [ ] Implement ownership verification
- [ ] Add error handling and validation
- [ ] Test all endpoints with mock data

**Success Criteria**:
- All endpoints return correct responses
- Ownership rules enforced
- Error cases handled gracefully
- TypeScript types are correct

### 9.3 Phase 3: Core Components (3-4 hours)

**Tasks**:
- [ ] Create `PublicToggle` component
- [ ] Create `PublicBadge` component
- [ ] Create `PublishConfirmDialog` component
- [ ] Create `CopyToLibraryButton` component
- [ ] Create `usePublicToggle` hook
- [ ] Create `useCopyPrompt` hook
- [ ] Test components in Storybook/localhost

**Success Criteria**:
- Components render correctly
- Toggle works with confirmation
- Badge displays properly
- Copy button functions
- Hooks manage state correctly

### 9.4 Phase 4: Integration (2-3 hours)

**Tasks**:
- [ ] Update `SeedlingCard` with PublicToggle
- [ ] Update `GreenhouseCard` with PublicToggle
- [ ] Update `CommonsView` with filters/sort
- [ ] Update `PromptCard` for commons variant
- [ ] Update `useGallery` to fetch public prompts
- [ ] Add author attribution to cards

**Success Criteria**:
- Toggle appears on prompt cards
- Badge appears on public prompts
- Commons view shows all public prompts
- Filter and sort work correctly
- Author attribution displayed

### 9.5 Phase 5: Seed Data & Testing (1-2 hours)

**Tasks**:
- [ ] Update `lib/pglite/seed.ts` with public prompts
- [ ] Add varied author names and publish dates
- [ ] Test publish/unpublish flow
- [ ] Test copy flow
- [ ] Test filter and sort
- [ ] Test privacy rules (non-owner access)

**Success Criteria**:
- Seed data includes 5-10 public prompts
- All user flows work end-to-end
- Privacy rules enforced
- No console errors

### 9.6 Phase 6: Documentation & Cleanup (1 hour)

**Tasks**:
- [ ] Update `JOURNAL.md` with architecture decisions
- [ ] Document database schema changes
- [ ] Document privacy model
- [ ] Document copy mechanism
- [ ] Run `npm run lint` (fix errors)
- [ ] Run `npm run build` (fix type errors)
- [ ] Capture screenshots for verification

**Success Criteria**:
- Zero lint errors
- Zero TypeScript errors
- Production build succeeds
- Documentation complete
- Screenshots captured

---

## 10. Verification Approach

### 10.1 Manual Testing Checklist

**Publish Prompt**:
- [ ] Click "Make Public" toggle on a prompt
- [ ] Confirmation dialog appears (first time only)
- [ ] Confirm and verify PublicBadge appears
- [ ] Verify prompt appears in Commons
- [ ] Verify `published_at` set in database

**Unpublish Prompt**:
- [ ] Click "Make Private" toggle on public prompt
- [ ] Verify PublicBadge disappears
- [ ] Verify prompt removed from Commons (for other users)
- [ ] Verify `visibility = 'private'` in database

**View Public Prompts**:
- [ ] Navigate to `/librarian/commons`
- [ ] Verify public prompts from all users display
- [ ] Verify author name and publish date shown
- [ ] Filter by "My Public Prompts" - shows only mine
- [ ] Sort by "Recent" - newest first
- [ ] Sort by "Highest Score" - highest critique score first

**Copy to Library**:
- [ ] Click "Copy to My Library" on public prompt
- [ ] Verify toast notification appears
- [ ] Verify copy appears in Greenhouse
- [ ] Verify copy is private by default
- [ ] Verify copy is editable
- [ ] Verify original prompt unchanged

**Privacy Rules**:
- [ ] View public prompt owned by another user
- [ ] Verify cannot toggle public/private
- [ ] Verify cannot edit content
- [ ] Verify "Copy to My Library" button available

### 10.2 Automated Checks

**Lint Check**:
```bash
npm run lint
```

**Type Check**:
```bash
npm run build
```

**Database Integrity**:
- Check all new columns exist
- Check indexes created
- Check existing prompts migrated

### 10.3 Performance Targets

- **Public prompts query**: < 1 second (50 prompts)
- **Publish action**: < 500ms
- **Copy action**: < 1 second
- **Filter/sort**: < 300ms

---

## 11. Known Limitations & Future Work

### 11.1 Deferred to v0.3+

**Out of Scope**:
- ❌ Likes/favorites for public prompts
- ❌ Comments on public prompts
- ❌ Report/moderation system
- ❌ License selection (CC0, MIT, etc.)
- ❌ View count tracking
- ❌ Search across public prompts
- ❌ Tags/categories for public prompts (tags exist but no category system)

### 11.2 Technical Limitations

**PGlite Constraints**:
- Data stored in browser (not synced across devices)
- No server-side enforcement of privacy rules
- Limited to single-user scenarios in current implementation

**Performance Considerations**:
- Large numbers of public prompts may require pagination
- Critique calculations may slow down with many prompts

### 11.3 Future Enhancements

**Phase 6+ Features**:
- Server-side PGlite or PostgreSQL backend
- Multi-user real-time collaboration
- Advanced moderation tools
- Semantic search with pgvector
- Prompt versioning and history

---

## 12. Success Criteria

### 12.1 Functional Requirements

- ✅ Users can toggle prompts public/private
- ✅ Confirmation dialog on first publish
- ✅ PublicBadge displays on public prompts
- ✅ Commons view shows all public prompts
- ✅ Filter works: All | My Public Prompts
- ✅ Sort works: Recent | Popular | Highest Score
- ✅ "Copy to My Library" creates private copy
- ✅ Privacy rules enforced (ownership)
- ✅ Author attribution displayed

### 12.2 Technical Requirements

- ✅ Database schema updated
- ✅ All API routes functional
- ✅ Zero lint errors
- ✅ Zero TypeScript errors
- ✅ Production build succeeds
- ✅ All components accessible (WCAG 2.1 AA)
- ✅ Performance targets met

### 12.3 Quality Requirements

- ✅ Zero regressions in existing features
- ✅ Seed data includes public prompts
- ✅ Documentation updated (JOURNAL.md)
- ✅ Screenshots captured for verification
- ✅ Privacy rules tested and verified

---

## 13. Risk Assessment

### 13.1 High Risks

**Database Migration**:
- Risk: Data loss during migration
- Mitigation: Non-destructive migration, backfill logic, test on copy

**Privacy Leaks**:
- Risk: Non-owners can edit public prompts
- Mitigation: Ownership verification in all API routes, database-level checks

### 13.2 Medium Risks

**Performance Degradation**:
- Risk: Slow queries with many public prompts
- Mitigation: Database indexes, pagination, query optimization

**UI Complexity**:
- Risk: Toggle confusing to users
- Mitigation: Clear labels, confirmation dialog, help text

### 13.3 Low Risks

**Seed Data**:
- Risk: Seed data overwrites user data
- Mitigation: Only seed on first run, check if initialized

---

## 14. Timeline Estimate

**Total Estimated Time**: 10-13 hours

| Phase | Description | Time |
|-------|-------------|------|
| 1 | Database Schema | 1-2 hours |
| 2 | API Routes | 2-3 hours |
| 3 | Core Components | 3-4 hours |
| 4 | Integration | 2-3 hours |
| 5 | Testing | 1-2 hours |
| 6 | Documentation | 1 hour |

**Buffer for unexpected issues**: +4-6 hours  
**Realistic Total**: 14-19 hours (2-3 days)

---

## 15. References

### 15.1 Related Files
- `00_Roadmap/task_plan.md` - Project roadmap
- `05_Logs/AUDIT_LOG.md` - Technical decisions
- `JOURNAL.md` - Architecture documentation
- `04_System/AGENT_BEST_PRACTICES.md` - Development standards

### 15.2 Dependencies
- PGlite v0.3.14
- Next.js 14
- React 18
- Tailwind CSS
- Framer Motion
- Lucide React

---

**Author**: AI Assistant (Zencoder)  
**Status**: Technical Specification Complete  
**Date**: January 12, 2026  
**Version**: 1.0
