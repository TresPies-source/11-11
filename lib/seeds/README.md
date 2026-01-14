# Seed Patch Management System

## Overview

The Seed Patch Management system implements the Dojo Protocol's **Memory Garden** pattern for managing knowledge seeds. It provides a beautiful UI for viewing, sorting, searching, filtering, and exporting knowledge seeds captured during AI sessions.

## Seed Types

Seeds are categorized into 6 types based on the nature of the knowledge:

- **`principle`** - Core beliefs, values, or fundamental truths
- **`pattern`** - Repeatable solutions, approaches, or design patterns
- **`question`** - Open questions, areas of inquiry, or research directions
- **`route`** - Strategic directions, paths, or navigation guides
- **`artifact`** - Tangible outputs, deliverables, or concrete examples
- **`constraint`** - Limitations, boundaries, or guardrails

Each type has a distinct color scheme in the UI (blue/green/yellow/purple/orange/red).

## Seed Statuses

Seeds progress through a lifecycle with 4 possible statuses:

- **`new`** - Recently created, not yet categorized (Keep)
- **`growing`** - Actively developing, needs attention (Grow)
- **`mature`** - Well-developed, ready for use
- **`compost`** - No longer useful, archived

## Database Schema

Seeds are stored in PGlite (client-side PostgreSQL) with the following schema:

```sql
CREATE TABLE seeds (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',
  content TEXT NOT NULL,
  why_matters TEXT,
  revisit_when TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  user_id TEXT,
  session_id TEXT,
  replanted BOOLEAN DEFAULT FALSE,
  replant_count INTEGER DEFAULT 0
);

CREATE INDEX idx_seeds_status ON seeds(status);
CREATE INDEX idx_seeds_type ON seeds(type);
CREATE INDEX idx_seeds_user_id ON seeds(user_id);
CREATE INDEX idx_seeds_session_id ON seeds(session_id);
CREATE INDEX idx_seeds_updated_at ON seeds(updated_at DESC);
```

Auto-updating trigger ensures `updated_at` stays current on every modification.

## API Routes

### List Seeds with Filters

```typescript
// GET /api/seeds
const response = await fetch('/api/seeds?status=growing,mature&type=principle&search=memory');
const seeds = await response.json();
```

**Query Parameters:**
- `status` - Comma-separated statuses (e.g., `"new,growing"`)
- `type` - Comma-separated types (e.g., `"principle,pattern"`)
- `search` - Search term (matches name and content)
- `dateFrom` - ISO date string (filter by created_at >= dateFrom)
- `dateTo` - ISO date string (filter by created_at <= dateTo)
- `user_id` - Filter by user
- `session_id` - Filter by session

**Response:** Array of seed objects ordered by `updated_at DESC`

### Create Seed

```typescript
// POST /api/seeds
const response = await fetch('/api/seeds', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Context Window Management',
    type: 'principle',
    status: 'new',
    content: 'Always prune context to essential files only...',
    why_matters: 'Prevents token bloat and improves AI response quality',
    revisit_when: 'Starting new complex feature',
    user_id: 'user_123',
    session_id: 'session_456'
  })
});
const seed = await response.json();
```

### Get Single Seed

```typescript
// GET /api/seeds/[id]
const response = await fetch('/api/seeds/seed_1234567890');
const seed = await response.json();
```

### Update Seed

```typescript
// PATCH /api/seeds/[id]
const response = await fetch('/api/seeds/seed_1234567890', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    status: 'growing',
    content: 'Updated content...'
  })
});
const updated = await response.json();
```

### Delete Seed

```typescript
// DELETE /api/seeds/[id]
const response = await fetch('/api/seeds/seed_1234567890', {
  method: 'DELETE'
});
```

### Export Memory Patch

```typescript
// POST /api/seeds/export
const response = await fetch('/api/seeds/export', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    seedIds: ['seed_123', 'seed_456', 'seed_789']
  })
});
const markdown = await response.text();
```

**Response:** Markdown-formatted Memory Patch with all seed details

## Database Layer (Direct Access)

For client-side usage without API routes (recommended for better performance):

```typescript
import { getSeeds, getSeed, insertSeed, updateSeed, deleteSeed } from '@/lib/pglite/seeds';

// List seeds with filters
const seeds = await getSeeds({
  status: ['growing', 'mature'],
  type: ['principle'],
  search: 'memory',
  user_id: 'user_123'
});

// Get single seed
const seed = await getSeed('seed_1234567890');

// Insert seed
const newSeed = await insertSeed({
  name: 'New Seed',
  type: 'principle',
  content: 'Seed content...'
});

// Update seed
const updated = await updateSeed('seed_1234567890', {
  status: 'growing',
  content: 'Updated content...'
});

// Delete seed
await deleteSeed('seed_1234567890');
```

## React Hook (useSeeds)

The `useSeeds` hook provides React-friendly access to seeds with automatic state management:

```typescript
import { useSeeds } from '@/hooks/useSeeds';

function MyComponent() {
  const { seeds, isLoading, error, refetch } = useSeeds({
    status: ['growing'],
    type: ['principle', 'pattern'],
    search: 'context'
  });
  
  if (isLoading) return <div>Loading seeds...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <div>
      {seeds.map(seed => (
        <div key={seed.id}>{seed.name}</div>
      ))}
      <button onClick={refetch}>Refresh</button>
    </div>
  );
}
```

## UI Components

### SeedCard

Displays a single seed with actions (view, update status, delete):

```tsx
import { SeedCard } from '@/components/seeds/seed-card';

<SeedCard
  seed={seed}
  onView={(seed) => console.log('View', seed)}
  onUpdateStatus={(seed, status) => console.log('Update', seed.id, status)}
  onDelete={(seed) => console.log('Delete', seed.id)}
/>
```

**Features:**
- Type badge with color coding
- Status icon (Leaf/TrendingUp/CheckCircle/X)
- Keep/Grow/Compost buttons
- View and Delete actions
- Hover animations
- Dark mode support

### FiltersPanel

Provides type and status filtering UI:

```tsx
import { SeedFiltersPanel } from '@/components/seeds/filters-panel';

<SeedFiltersPanel
  filters={filters}
  onFiltersChange={(newFilters) => setFilters(newFilters)}
/>
```

**Features:**
- Toggle type filters (6 badges)
- Toggle status filters (4 badges)
- Clear all filters button
- Active/inactive visual states

### DetailsModal

Full seed details with Memory Patch export:

```tsx
import { SeedDetailsModal } from '@/components/seeds/details-modal';

{selectedSeed && (
  <SeedDetailsModal
    seed={selectedSeed}
    onClose={() => setSelectedSeed(null)}
  />
)}
```

**Features:**
- Full seed information display
- Type and status badges
- Export Memory Patch (copy to clipboard)
- Close on ESC or click outside
- Replanted seed information
- Dark mode support
- Smooth animations

### SeedsView (Main Page Component)

Complete seeds library interface:

```tsx
import { SeedsView } from '@/components/seeds/seeds-view';

<SeedsView />
```

**Features:**
- Search bar with 300ms debounce
- Filters panel sidebar
- Responsive seed grid (1/2/3 columns)
- Loading states with skeleton
- Error states with retry
- Empty states (no seeds vs no matches)
- CRUD operations (update, delete)
- Modal integration

## Memory Patch Format

When exporting seeds, they are formatted as Markdown Memory Patches:

```markdown
# Memory Patch: Replanted Seeds

_Generated on 1/13/2026, 8:30:00 PM_

## Seed: Context Window Management

**Type:** principle  
**Status:** mature

**Why it matters:** Prevents token bloat and improves AI response quality  
**Revisit when:** Starting new complex feature

**Content:**
Always prune context to essential files only. Remove redundant dependencies and clean import structure.

---

## Seed: Component Memoization Pattern

**Type:** pattern  
**Status:** mature

**Why it matters:** Prevents unnecessary re-renders in complex UIs  
**Revisit when:** Building performance-critical components

**Content:**
Use React.memo with custom comparison function to prevent re-renders when props haven't meaningfully changed.

---

**Total Seeds:** 2
```

## Testing

The seed system includes comprehensive test coverage:

```bash
# Run all seed tests
npm run test:seeds

# Run specific test suites
npm run test:seeds-export      # Memory Patch export
npm run test:seeds-hook        # useSeeds hook
npm run test:seeds-card        # SeedCard component
npm run test:seeds-filters     # FiltersPanel component
npm run test:seeds-modal       # DetailsModal component
npm run test:seeds-view        # SeedsView component
npm run test:seeds-api         # Database layer CRUD
npm run test:seeds-integration # End-to-end workflows
```

## Performance Characteristics

- **Page Load:** Instant with skeleton loader
- **Search Response:** 300ms debounce for smooth typing
- **Filter Response:** Instant updates
- **CRUD Operations:** <100ms (database layer)
- **Animations:** 60fps with Framer Motion
- **Memory:** Efficient with React.memo optimization

## Known Limitations

### v0.3.10 Scope
- **PGlite Browser Issue:** Client-side PGlite initialization has issues in current environment (system-wide limitation)
- **No Drag-and-Drop:** Seed sorting via buttons only (deferred to v0.4.0)
- **No Bulk Actions:** Single seed operations only (deferred to v0.4.0)
- **No Semantic Search:** Text-only search (deferred to v0.4.0 with Librarian integration)
- **No Relationships:** Seeds are independent (deferred to v0.4.0)
- **No Versioning:** No change history tracking (deferred to v0.4.0)
- **No Sharing:** Local-only seeds (deferred to v0.4.0)

### Future Enhancements (v0.4.0+)
- Drag-and-drop sorting into Keep/Grow/Compost/Replant quadrants
- Bulk operations (select multiple seeds, apply actions)
- Semantic search via Librarian (search by meaning)
- Seed relationships (link related seeds)
- Seed versioning (track changes over time)
- Seed sharing (collaborate with others)
- Auto-tagging with AI

## Architecture Notes

### Database Layer Pattern
The system uses a **database-first architecture** where the database layer (`lib/pglite/seeds.ts`) is the primary interface. API routes are provided for compatibility but are currently affected by PGlite/webpack bundling issues.

**Recommended:** Use database layer directly in client components for best performance and reliability.

### Component Architecture
- **Atomic Design:** Components are small, focused, and reusable
- **Composition:** SeedsView composes SeedCard, FiltersPanel, and DetailsModal
- **Performance:** React.memo prevents unnecessary re-renders
- **Accessibility:** Proper ARIA labels, semantic HTML, keyboard navigation

### State Management
- **Local State:** Component state for UI (filters, modal open/close)
- **Server State:** useSeeds hook for data fetching
- **No Global State:** No Redux/Zustand needed (simple CRUD)

### Styling
- **Tailwind CSS:** Utility-first styling
- **Dark Mode:** All colors have `dark:` variants
- **Responsive:** Mobile-first with breakpoints (sm/md/lg/xl)
- **Animations:** Framer Motion for smooth transitions

## Example Usage

### Complete Seed Management Flow

```typescript
'use client';

import { useState } from 'react';
import { useSeeds } from '@/hooks/useSeeds';
import { SeedCard } from '@/components/seeds/seed-card';
import { SeedFiltersPanel } from '@/components/seeds/filters-panel';
import { SeedDetailsModal } from '@/components/seeds/details-modal';
import { updateSeed, deleteSeed } from '@/lib/pglite/seeds';

export default function MySeedsPage() {
  const [filters, setFilters] = useState({});
  const [selectedSeed, setSelectedSeed] = useState(null);
  const { seeds, isLoading, error, refetch } = useSeeds(filters);
  
  async function handleUpdateStatus(seed, status) {
    await updateSeed(seed.id, { status });
    refetch();
  }
  
  async function handleDelete(seed) {
    if (confirm(`Delete "${seed.name}"?`)) {
      await deleteSeed(seed.id);
      refetch();
    }
  }
  
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">My Seeds</h1>
      
      <div className="flex gap-6">
        <aside className="w-64">
          <SeedFiltersPanel
            filters={filters}
            onFiltersChange={setFilters}
          />
        </aside>
        
        <main className="flex-1">
          {isLoading && <div>Loading...</div>}
          {error && <div>Error: {error}</div>}
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {seeds.map(seed => (
              <SeedCard
                key={seed.id}
                seed={seed}
                onView={setSelectedSeed}
                onUpdateStatus={handleUpdateStatus}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </main>
      </div>
      
      {selectedSeed && (
        <SeedDetailsModal
          seed={selectedSeed}
          onClose={() => setSelectedSeed(null)}
        />
      )}
    </div>
  );
}
```

## Integration with Other Features

### With Librarian (Future)
Seeds can be automatically extracted from conversation history and suggested for promotion to the seed library.

### With Navigator (Future)
Seeds can inform navigation decisions and suggest relevant routes based on current context.

### With Manus (Future)
Seeds can be used as constraints and principles during code generation.

## Contributing

When adding new seed types or statuses:

1. Update `lib/seeds/types.ts` type definitions
2. Update `components/seeds/seed-card.tsx` color schemes and icons
3. Update `components/seeds/filters-panel.tsx` filter options
4. Update this README with new types/statuses
5. Write tests for new functionality

## Support

For issues or questions about the Seed Patch Management system:
- Check `JOURNAL.md` for architecture decisions
- Review `05_Logs/AUDIT_LOG.md` for sprint summaries
- Examine test files in `__tests__/seeds/` for examples
