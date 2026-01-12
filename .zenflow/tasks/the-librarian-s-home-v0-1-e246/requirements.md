# Product Requirements Document (PRD)
## The Librarian's Home v0.1

**Version**: 1.0  
**Created**: January 11, 2026  
**Status**: Draft  

---

## 1. Executive Summary

The Librarian's Home v0.1 establishes a dedicated, immersive page for prompt engineering that transforms the user's interaction from a simple file browser to an intelligent garden metaphor. This initial version focuses on personal prompt management with reactive critiques, laying the foundation for future collaborative features.

**Key Deliverables:**
- New `/librarian` page with Seedling and Greenhouse sections
- Rule-based critique system with visual feedback
- Supabase integration for metadata and critique storage
- Migration path from Google Drive-only to hybrid storage model

---

## 2. Current State Analysis

### 2.1 Existing Architecture
- **Framework**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Storage**: Google Drive (markdown files with frontmatter)
- **Authentication**: NextAuth v5 (mock mode in development)
- **UI Library**: Framer Motion (already installed)
- **Data Patterns**: 
  - Prompts stored as markdown files in Google Drive
  - Metadata in frontmatter (title, description, tags, public, author, created, version)
  - `PromptFile` interface extends `DriveFile` with `metadata` and `rawContent`

### 2.2 Existing Features
- `/library` page: Browse personal prompts from Google Drive
- `/gallery` page: Browse public/shared prompts
- Search and filtering capabilities
- Prompt cards with quick copy and fork functionality
- File tree navigation

### 2.3 Technical Constraints
- No Supabase integration exists yet
- Current prompt storage relies entirely on Google Drive
- Development mode uses mock data (`NEXT_PUBLIC_DEV_MODE=true`)
- Existing component patterns: View components in `components/*/View.tsx`

---

## 3. Goals and Objectives

### 3.1 Primary Goals
1. **Create an immersive prompt engineering experience** via the garden metaphor
2. **Provide actionable feedback** through reactive critiques
3. **Establish data foundation** for future AI-powered features via Supabase
4. **Maintain backwards compatibility** with existing library/gallery pages

### 3.2 Success Metrics
- Users can view all their prompts categorized by status (active/saved)
- Critique scores display correctly and update reactively
- All data persists to Supabase successfully
- Page loads in < 2 seconds with 50+ prompts
- 90%+ of existing library functionality preserved

### 3.3 Out of Scope (Future Versions)
- Global Commons section with 2D map UI
- AI-generated imagery for plants
- Proactive suggestions using semantic search
- Automated tagging/categorization
- Multi-user collaboration features
- Garden beds (collections)

---

## 4. User Stories and Requirements

### 4.1 The Librarian's Home Page

**User Story**: As a prompt engineer, I want a dedicated space to manage and improve my prompts, so I can work more efficiently and create higher-quality outputs.

**Requirements:**
- [ ] New route at `/librarian`
- [ ] Navigation link in main header/sidebar
- [ ] Responsive layout (mobile, tablet, desktop)
- [ ] Two-column grid layout: Seedling (left) and Greenhouse (right)
- [ ] Consistent styling with existing pages (library, gallery)
- [ ] Loading states, error states, empty states

**Acceptance Criteria:**
- Page accessible at `/librarian` URL
- Renders without console errors
- Maintains visual consistency with existing pages
- Responsive across viewports (320px - 2560px)

---

### 4.2 The Seedling Section (Active Prompts)

**User Story**: As a prompt engineer, I want to see all my work-in-progress prompts with quality indicators, so I can prioritize which ones need improvement.

**Requirements:**
- [ ] Display grid of seedling cards (2-3 columns on desktop)
- [ ] Each card shows:
  - Prompt title
  - First 2-3 lines of content (snippet)
  - Critique score (0-100)
  - Visual indicator (seedling icon/illustration)
  - Status badge ("Active", "Draft", etc.)
  - Last modified timestamp
- [ ] Click card to navigate to editor/detail view
- [ ] Sort options: Recent, Score (low to high), Score (high to low)
- [ ] Filter by critique score range
- [ ] Empty state when no active prompts exist

**Acceptance Criteria:**
- Displays all prompts with status = "active" or "draft"
- Critique scores accurately reflect prompt quality
- Cards are clickable and navigate correctly
- Performance: Renders 50+ cards without lag
- Animations are smooth (60fps target)

**Data Model Decision:**
```typescript
interface Prompt {
  id: string;
  title: string;
  content: string;
  status: 'draft' | 'active' | 'saved' | 'archived';
  critiqueScore: number; // 0-100
  critiqueDetails: CritiqueDetails;
  createdAt: string;
  updatedAt: string;
  userId: string;
  driveFileId?: string; // Link to Google Drive file
  metadata: PromptMetadata; // Existing metadata structure
}
```

---

### 4.3 The Greenhouse Section (Personal Library)

**User Story**: As a prompt engineer, I want to save my best prompts in a beautiful, searchable library, so I can easily reuse them and feel proud of my work.

**Requirements:**
- [ ] Display grid of flowering plant cards (2-3 columns)
- [ ] Each card shows:
  - Prompt title
  - Description or snippet
  - Tags (color-coded)
  - Visual indicator (plant/flower icon)
  - Critique score badge
  - Last used/accessed timestamp
- [ ] Search functionality (title, description, tags, content)
- [ ] Filter by tags
- [ ] Sort options: Recent, Title (A-Z), Score (high to low)
- [ ] "Move to Greenhouse" action from Seedling cards
- [ ] Click card to view full prompt or run in chat
- [ ] Empty state with encouragement to save prompts

**Acceptance Criteria:**
- Displays all prompts with status = "saved"
- Search returns results within 300ms
- Tag filtering works correctly (multi-select)
- "Save to Greenhouse" action updates status and moves card
- Maintains existing PromptCard functionality (copy, fork, run)

---

### 4.4 Reactive Critique System

**User Story**: As a prompt engineer, I want immediate feedback on my prompt quality, so I can learn and improve my writing skills.

**Requirements:**

**Critique Dimensions:**
1. **Conciseness** (0-25 points)
   - Penalties: Excessive length, repetition, filler words
   - Rewards: Clear, direct language

2. **Specificity** (0-25 points)
   - Penalties: Vague terms ("good", "nice"), ambiguous pronouns
   - Rewards: Concrete examples, specific metrics, clear constraints

3. **Context** (0-25 points)
   - Penalties: Missing background, unclear audience
   - Rewards: Clear context, defined inputs/outputs, audience specification

4. **Task Decomposition** (0-25 points)
   - Penalties: Multiple unrelated tasks, unclear steps
   - Rewards: Single clear task OR well-structured subtasks, numbered steps

**Implementation:**
- [ ] Rule-based analysis engine (no AI required for v0.1)
- [ ] Critique runs on prompt save/update
- [ ] Critique details stored in Supabase
- [ ] Visual score display (progress bar, color-coded)
- [ ] Expandable detailed feedback per dimension
- [ ] Suggestions for improvement (text-based)

**Acceptance Criteria:**
- Critique completes in < 1 second for 2000-character prompts
- Scores are deterministic (same input = same output)
- Detailed feedback is actionable
- Visual indicators are intuitive (red < 50, yellow 50-75, green > 75)

**Critique Display:**
```
┌─────────────────────────────────┐
│ Critique Score: 78/100      ⭐  │
├─────────────────────────────────┤
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓░░░ (78%)         │
│                                 │
│ Conciseness:        20/25   ✓  │
│ Specificity:        18/25   ⚠  │
│ Context:            22/25   ✓  │
│ Task Decomposition: 18/25   ⚠  │
│                                 │
│ [View Detailed Feedback]        │
└─────────────────────────────────┘
```

---

### 4.5 Supabase Integration

**User Story**: As a developer, I want a scalable database backend, so the system can handle future features like semantic search, collaboration, and analytics.

**Requirements:**

**Database Schema:**

```sql
-- Prompts table
CREATE TABLE prompts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'active', 'saved', 'archived')),
  drive_file_id TEXT, -- Link to Google Drive file
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT prompts_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- Prompt metadata table
CREATE TABLE prompt_metadata (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  description TEXT,
  tags TEXT[],
  is_public BOOLEAN DEFAULT false,
  author TEXT,
  version TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT prompt_metadata_prompt_id_unique UNIQUE (prompt_id)
);

-- Critiques table
CREATE TABLE critiques (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  conciseness_score INTEGER NOT NULL CHECK (conciseness_score >= 0 AND conciseness_score <= 25),
  specificity_score INTEGER NOT NULL CHECK (specificity_score >= 0 AND specificity_score <= 25),
  context_score INTEGER NOT NULL CHECK (context_score >= 0 AND context_score <= 25),
  task_decomposition_score INTEGER NOT NULL CHECK (task_decomposition_score >= 0 AND task_decomposition_score <= 25),
  feedback JSONB, -- Detailed feedback per dimension
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_prompts_user_id ON prompts(user_id);
CREATE INDEX idx_prompts_status ON prompts(status);
CREATE INDEX idx_prompts_updated_at ON prompts(updated_at DESC);
CREATE INDEX idx_critiques_prompt_id ON critiques(prompt_id);
CREATE INDEX idx_prompt_metadata_prompt_id ON prompt_metadata(prompt_id);
```

**Authentication Strategy:**
- [ ] Use existing NextAuth session for user identification
- [ ] Map NextAuth user ID to Supabase queries via RLS policies
- [ ] Development mode: Use mock user ID

**Data Access Layer:**
- [ ] Create `lib/supabase/client.ts` with Supabase client setup
- [ ] Create `lib/supabase/prompts.ts` for prompt CRUD operations
- [ ] Create `lib/supabase/critiques.ts` for critique operations
- [ ] Implement error handling and retry logic

**Migration Strategy:**
- [ ] Phase 1 (v0.1): Dual storage - Google Drive for files, Supabase for metadata/critiques
- [ ] Keep existing Google Drive integration unchanged
- [ ] Sync Google Drive file IDs to Supabase
- [ ] Future: Migrate entirely to Supabase with Drive as backup

**Acceptance Criteria:**
- Supabase client initializes correctly
- All CRUD operations work with proper error handling
- RLS policies prevent unauthorized access
- Data syncs between Drive and Supabase on prompt create/update
- Development mode works with mock data

---

## 5. Technical Decisions and Assumptions

### 5.1 Key Architectural Decisions

**Decision 1: Hybrid Storage Model**
- **Rationale**: Minimize disruption to existing Google Drive workflow while adding Supabase capabilities
- **Trade-off**: Additional complexity in sync logic
- **Future Path**: Full migration to Supabase when proven stable

**Decision 2: Active vs Saved Distinction**
- **Assumption**: "Active" = prompts with status 'draft' or 'active'; "Saved" = status 'saved'
- **User Action**: Manual "Save to Greenhouse" button
- **Alternative Considered**: Auto-save based on critique score (deferred to future version)

**Decision 3: Critique Execution**
- **Trigger**: On prompt save/update (debounced)
- **Mode**: Synchronous for v0.1 (< 1s execution time)
- **Alternative Considered**: Async with worker (deferred - adds complexity)

**Decision 4: Component Architecture**
- **Pattern**: Follow existing structure - `/app/librarian/page.tsx` → `components/librarian/LibrarianView.tsx`
- **Reuse**: Leverage existing `PromptCard`, `SearchInput`, loading/error states
- **New Components**: `SeedlingCard`, `GreenhouseCard`, `CritiqueScore`, `CritiqueDetails`

### 5.2 Assumptions

1. **User Authentication**: NextAuth session is available and provides user ID
2. **Environment Variables**: `.env.local` will include Supabase credentials
3. **Prompt Size**: Average prompt is 500-2000 characters
4. **Prompt Volume**: Users will have 10-100 prompts (not thousands)
5. **Browser Support**: Modern browsers (Chrome, Firefox, Safari, Edge) - last 2 versions
6. **Network**: Reasonable internet connection (critique < 1s, page load < 2s)

---

## 6. User Interface Specifications

### 6.1 Layout Structure

```
┌─────────────────────────────────────────────────────┐
│ Header (existing)                                   │
├─────────────────────────────────────────────────────┤
│                                                     │
│  🌱 The Librarian's Home                            │
│  Your personal garden of prompts                    │
│                                                     │
│  ┌───────────────────┬──────────────────────────┐  │
│  │  🌱 Seedlings     │  🌺 Greenhouse           │  │
│  │  Active Prompts   │  Saved Prompts           │  │
│  │                   │                          │  │
│  │  [Sort: Recent ▾] │  [Search...]             │  │
│  │  [Filter: All ▾]  │  [Tags: All ▾]           │  │
│  │                   │                          │  │
│  │  ┌─────────────┐  │  ┌─────────────┐        │  │
│  │  │ Seedling 1  │  │  │ Plant 1     │        │  │
│  │  │ Score: 65   │  │  │ Score: 92   │        │  │
│  │  │ ▓▓▓▓▓▓▓░░░  │  │  │ Tags: ...   │        │  │
│  │  └─────────────┘  │  └─────────────┘        │  │
│  │                   │                          │  │
│  │  ┌─────────────┐  │  ┌─────────────┐        │  │
│  │  │ Seedling 2  │  │  │ Plant 2     │        │  │
│  │  └─────────────┘  │  └─────────────┘        │  │
│  │                   │                          │  │
│  └───────────────────┴──────────────────────────┘  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 6.2 Visual Design Principles

**Garden Metaphor:**
- Seedlings: Young plants (🌱) - green/yellow tones
- Greenhouse: Mature plants (🌺, 🌸, 🌻) - vibrant colors
- Growth visual: Progress from seed → sprout → plant → flower based on score

**Color Palette:**
- Active/Seedling: Green shades (#10b981, #34d399)
- Saved/Greenhouse: Purple/Pink shades (#a855f7, #ec4899)
- Critique scores:
  - 0-49: Red (#ef4444)
  - 50-74: Yellow (#f59e0b)
  - 75-89: Light Green (#84cc16)
  - 90-100: Dark Green (#22c55e)

**Typography:**
- Headers: Bold, 24-32px
- Card titles: Semibold, 16-18px
- Body: Regular, 14px
- Captions: Regular, 12px

**Spacing:**
- Section padding: 24-32px
- Card gap: 16-24px
- Internal card padding: 16px

### 6.3 Animations (Framer Motion)

- **Page entrance**: Staggered card appearance (50ms delay between cards)
- **Card hover**: Subtle lift (2px translateY) + shadow
- **Score update**: Progress bar fill animation (300ms ease-out)
- **Status change**: Smooth transition from Seedling to Greenhouse (500ms)
- **Empty states**: Gentle fade-in

---

## 7. Non-Functional Requirements

### 7.1 Performance
- Page load: < 2 seconds (50 prompts)
- Critique execution: < 1 second (2000-char prompt)
- Search response: < 300ms
- Animations: 60fps target

### 7.2 Accessibility
- WCAG 2.1 AA compliance
- Keyboard navigation support
- Screen reader compatibility
- Color contrast ratios: 4.5:1 minimum

### 7.3 Browser Support
- Chrome (last 2 versions)
- Firefox (last 2 versions)
- Safari (last 2 versions)
- Edge (last 2 versions)

### 7.4 Security
- Supabase RLS policies enforce user data isolation
- No sensitive data in client-side code
- Environment variables for API keys
- HTTPS required in production

---

## 8. Dependencies and Setup

### 8.1 New Dependencies
```json
{
  "@supabase/supabase-js": "^2.x",
  "framer-motion": "^11.15.0" // Already installed
}
```

### 8.2 Environment Variables
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key # Server-side only

# Existing variables remain unchanged
```

### 8.3 Setup Scripts (Zenflow Automation)
- **Setup**: `npm install @supabase/supabase-js`
- **Dev Server**: `npm run dev`
- **Cleanup**: `npm run lint && npm run type-check`

---

## 9. Testing and Validation

### 9.1 Unit Testing
- Critique engine: Test each rule dimension
- Data layer: CRUD operations
- Utility functions: Score calculation, formatting

### 9.2 Integration Testing
- Supabase connection and queries
- Google Drive + Supabase sync
- User authentication flow

### 9.3 Manual Testing Checklist
- [ ] Create new prompt → appears in Seedlings
- [ ] Critique score calculates correctly
- [ ] Save to Greenhouse → moves card
- [ ] Search works in Greenhouse
- [ ] Filter by tags works
- [ ] Sort options work
- [ ] Responsive layout on mobile/tablet/desktop
- [ ] Empty states display correctly
- [ ] Error states display correctly
- [ ] Loading states display correctly
- [ ] Animations are smooth
- [ ] Existing library/gallery pages still work

---

## 10. Open Questions and Risks

### 10.1 Questions for Clarification

**Q1: Relationship to Existing Pages**
- Should `/librarian` eventually replace `/library`?
- Should we add a migration path for users?
- **Recommendation**: Keep both for v0.1, gather feedback, decide in v0.2

**Q2: Critique Thresholds**
- What score threshold moves a prompt to "ready for Greenhouse"?
- Should we auto-suggest saving prompts above 80?
- **Recommendation**: No auto-promotion in v0.1, manual control

**Q3: Google Drive Sync Timing**
- When does content sync from Drive to Supabase? (On load, on save, scheduled?)
- **Recommendation**: On demand when user views Librarian page + on save

**Q4: Editor Integration**
- Should clicking a seedling card open the existing editor or a new Librarian-specific editor?
- **Recommendation**: Use existing editor, inject critique sidebar

**Q5: Mock Data in Dev Mode**
- Should we create mock prompts with critique scores for development?
- **Recommendation**: Yes, create 10-15 mock prompts with varied scores

### 10.2 Risks and Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Supabase setup complexity | High | Medium | Create detailed setup guide, use Supabase CLI |
| Google Drive + Supabase sync issues | High | Medium | Implement robust error handling, log sync operations |
| Critique engine inaccuracy | Medium | Medium | Extensive testing, user feedback loop |
| Performance degradation with many prompts | Medium | Low | Implement pagination, virtual scrolling if needed |
| User confusion about Seedling vs Greenhouse | Medium | Medium | Clear onboarding, tooltips, help text |
| Breaking existing library functionality | High | Low | Comprehensive testing, no changes to existing code |

---

## 11. Implementation Phases

### Phase 1: Foundation (Days 1-2)
- Supabase setup and schema creation
- Data access layer implementation
- Mock data for development

### Phase 2: Critique Engine (Days 3-4)
- Rule-based critique algorithm
- Unit tests for critique rules
- Critique storage and retrieval

### Phase 3: UI Components (Days 5-7)
- LibrarianView layout
- SeedlingCard and GreenhouseCard components
- CritiqueScore and CritiqueDetails components
- Search and filter functionality

### Phase 4: Integration (Days 8-9)
- Connect UI to Supabase
- Google Drive + Supabase sync
- Status transitions (Seedling → Greenhouse)

### Phase 5: Polish and Testing (Days 10-11)
- Animations and transitions
- Error handling and edge cases
- Accessibility improvements
- Responsive design testing

### Phase 6: Documentation (Day 12)
- User guide
- Developer documentation
- Setup instructions

---

## 12. Future Considerations (Post v0.1)

### v0.2: Enhanced Features
- AI-generated plant imagery
- Automated tagging
- Garden beds (collections)
- Export prompts to various formats

### v0.3: Social and Collaboration
- Share prompts with specific users
- Collaborative editing
- Prompt versioning and history

### v0.4: Global Commons
- 2D map UI
- Community-driven prompt discovery
- Prompt evolution tracking
- Fork and remix functionality

### v1.0: Full Platform
- Semantic search with embeddings
- Proactive suggestions
- Analytics and insights
- Mobile app

---

## 13. Conclusion

The Librarian's Home v0.1 represents a significant evolution in the 11-11 platform, transforming prompt management from a utilitarian file browser into an engaging, intelligent workspace. By focusing on personal workflow and reactive feedback, we create immediate value while establishing the technical foundation for future collaborative and AI-powered features.

**Next Steps:**
1. Review and approve this PRD
2. Clarify open questions (Section 10.1)
3. Create technical specification
4. Begin implementation

---

**Appendix A: Glossary**

- **Seedling**: A work-in-progress prompt (status: draft or active)
- **Greenhouse**: A collection of mature, saved prompts
- **Critique**: Automated quality assessment of a prompt
- **Garden Metaphor**: Visual representation of prompts as plants at various growth stages
- **RLS**: Row-Level Security (Supabase security feature)

**Appendix B: References**

- [Original Librarian PRD](../../01_PRDs/Librarian_PRD.md)
- [Librarian Home Vision](../../02_Specs/librarian_home_vision.md)
- [Supabase Documentation](https://supabase.com/docs)
- [Framer Motion Documentation](https://www.framer.com/motion/)
