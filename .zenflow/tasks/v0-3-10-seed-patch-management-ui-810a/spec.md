# Technical Specification: Seed Patch Management UI (v0.3.10)

**Feature ID:** v0.3.10  
**Complexity:** Medium  
**Estimated Duration:** 2 weeks (10-12 hours of implementation)  
**Dependencies:** None (fully independent)  
**Date Created:** January 13, 2026

---

## 1. Technical Context

### 1.1 Environment
- **Language:** TypeScript 5.7.2
- **Framework:** Next.js 14.2.24 (App Router)
- **Database:** PGlite 0.3.14 (PostgreSQL in browser via IndexedDB)
- **UI Library:** React 18.3.1 with Tailwind CSS 3.4.17
- **Animation:** Framer Motion 11.15.0
- **Icons:** Lucide React 0.469.0
- **State Management:** React hooks (useState, useEffect)
- **Testing:** Custom test framework with tsx 4.21.0

### 1.2 Project Architecture
```
11-11/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes
│   │   └── [feature]/route.ts   # RESTful endpoints
│   └── [feature]/page.tsx        # Feature pages
├── components/                   # React components
│   └── [feature]/               # Feature-specific components
├── lib/                          # Core utilities
│   ├── pglite/                  # Database client and schema
│   │   ├── client.ts
│   │   ├── schema.ts
│   │   └── migrations/
│   └── [feature]/               # Feature-specific logic
├── hooks/                        # Custom React hooks
└── __tests__/                    # Test files
```

### 1.3 Database Layer
- **Client:** PGlite singleton pattern (`lib/pglite/client.ts`)
- **Schema:** SQL definitions in `lib/pglite/schema.ts`
- **Migrations:** Versioned migrations in `lib/pglite/migrations/`
- **Storage:** Browser IndexedDB (`idb://11-11-db`)
- **Features:** Full PostgreSQL support (JSONB, indexes, triggers, constraints)

### 1.4 Existing Patterns

**API Route Pattern:**
```typescript
import { NextRequest, NextResponse } from "next/server";
import { getDB } from "@/lib/pglite/client";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const db = await getDB();
    // Query logic
    return NextResponse.json(data);
  } catch (error) {
    console.error('[API_NAME]', error);
    return NextResponse.json(
      { error: "Error message" },
      { status: 500 }
    );
  }
}
```

**Component Pattern:**
```typescript
"use client";
import { motion } from "framer-motion";
import { Icon } from "lucide-react";
import { cn } from "@/lib/utils";

export function Component({ prop }: ComponentProps) {
  // State and handlers
  return (
    <motion.div
      className="bg-white dark:bg-gray-900 rounded-lg border..."
      variants={variants}
      initial="hidden"
      animate="visible"
    >
      {/* Content */}
    </motion.div>
  );
}
```

**Hook Pattern:**
```typescript
'use client';
import { useState, useEffect } from 'react';

export function useFeature(options = {}) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const response = await fetch('/api/endpoint');
        const data = await response.json();
        setData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [/* dependencies */]);

  return { data, loading, error };
}
```

**Migration Pattern:**
```typescript
export const migration010 = `
-- Migration 010: Add Seeds Table
-- Date: 2026-01-13
-- Purpose: Implement Dojo Protocol Memory Garden pattern

CREATE TABLE IF NOT EXISTS seeds (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  -- ... columns
);

CREATE INDEX IF NOT EXISTS idx_seeds_status ON seeds(status);
`;

export async function applyMigration010(db: any): Promise<void> {
  try {
    console.log('[Migration 010] Adding Seeds table...');
    await db.exec(migration010);
    console.log('[Migration 010] Successfully added Seeds table');
  } catch (error) {
    console.error('[Migration 010] Error:', error);
    throw error;
  }
}
```

**Test Pattern:**
```typescript
import { getDB } from '../../lib/pglite/client';

let testCount = 0;
let passedTests = 0;

function assert(condition: boolean, testName: string): void {
  testCount++;
  if (condition) {
    passedTests++;
    console.log(`✓ ${testName}`);
  } else {
    console.error(`✗ ${testName}`);
    process.exit(1);
  }
}

async function runTests() {
  // Test implementation
  console.log(`\n${passedTests}/${testCount} tests passed`);
}

runTests();
```

---

## 2. Implementation Approach

### 2.1 Data Model (Database Layer)

**Migration:** `lib/pglite/migrations/010_add_seeds.ts`

Create a new `seeds` table following the Dojo Protocol Memory Garden pattern:

```sql
CREATE TABLE IF NOT EXISTS seeds (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,                    -- 3-7 words, human-readable
  type TEXT NOT NULL,                    -- principle, pattern, question, route, artifact, constraint
  status TEXT NOT NULL DEFAULT 'new',    -- new, growing, mature, compost
  content TEXT NOT NULL,                 -- Full seed content
  why_matters TEXT,                      -- Why this seed matters (1 line)
  revisit_when TEXT,                     -- Trigger condition for revisiting
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id TEXT,                          -- Optional user association
  session_id TEXT,                       -- Session where seed was created
  replanted BOOLEAN DEFAULT false,       -- Has been replanted
  replant_count INTEGER DEFAULT 0,       -- Number of times replanted
  
  CONSTRAINT seeds_type_check CHECK (type IN ('principle', 'pattern', 'question', 'route', 'artifact', 'constraint')),
  CONSTRAINT seeds_status_check CHECK (status IN ('new', 'growing', 'mature', 'compost'))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_seeds_status ON seeds(status);
CREATE INDEX IF NOT EXISTS idx_seeds_type ON seeds(type);
CREATE INDEX IF NOT EXISTS idx_seeds_user_id ON seeds(user_id);
CREATE INDEX IF NOT EXISTS idx_seeds_created_at ON seeds(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_seeds_updated_at ON seeds(updated_at DESC);

-- Trigger for automatic updated_at
CREATE TRIGGER update_seeds_updated_at
  BEFORE UPDATE ON seeds
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

**Integration:** Update `lib/pglite/client.ts` to apply migration on initialization.

### 2.2 Type Definitions

**File:** `lib/seeds/types.ts`

```typescript
export type SeedType = 'principle' | 'pattern' | 'question' | 'route' | 'artifact' | 'constraint';
export type SeedStatus = 'new' | 'growing' | 'mature' | 'compost';

export interface Seed {
  id: string;
  name: string;
  type: SeedType;
  status: SeedStatus;
  content: string;
  why_matters?: string;
  revisit_when?: string;
  created_at: Date;
  updated_at: Date;
  user_id?: string;
  session_id?: string;
  replanted: boolean;
  replant_count: number;
}

export interface SeedFilters {
  status?: SeedStatus[];
  type?: SeedType[];
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface CreateSeedRequest {
  name: string;
  type: SeedType;
  content: string;
  status?: SeedStatus;
  why_matters?: string;
  revisit_when?: string;
  user_id?: string;
  session_id?: string;
}

export interface UpdateSeedRequest {
  name?: string;
  type?: SeedType;
  status?: SeedStatus;
  content?: string;
  why_matters?: string;
  revisit_when?: string;
}
```

### 2.3 API Routes

#### 2.3.1 List/Create Seeds
**File:** `app/api/seeds/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/lib/pglite/client';

// GET /api/seeds - List all seeds with filters
export async function GET(req: NextRequest) {
  try {
    const db = await getDB();
    const { searchParams } = new URL(req.url);
    
    // Parse filters from query params
    const status = searchParams.get('status')?.split(',');
    const type = searchParams.get('type')?.split(',');
    const search = searchParams.get('search');
    
    // Build dynamic WHERE clause
    let whereConditions = [];
    let params = [];
    
    if (status?.length) {
      whereConditions.push(`status = ANY($${params.length + 1})`);
      params.push(status);
    }
    if (type?.length) {
      whereConditions.push(`type = ANY($${params.length + 1})`);
      params.push(type);
    }
    if (search) {
      whereConditions.push(`(name ILIKE $${params.length + 1} OR content ILIKE $${params.length + 2})`);
      params.push(`%${search}%`, `%${search}%`);
    }
    
    const whereClause = whereConditions.length > 0 
      ? 'WHERE ' + whereConditions.join(' AND ')
      : '';
    
    const result = await db.query(
      `SELECT * FROM seeds ${whereClause} ORDER BY updated_at DESC`,
      params
    );
    
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('[SEEDS_GET]', error);
    return NextResponse.json(
      { error: 'Failed to fetch seeds' },
      { status: 500 }
    );
  }
}

// POST /api/seeds - Create new seed
export async function POST(req: NextRequest) {
  try {
    const db = await getDB();
    const body = await req.json();
    
    const id = `seed_${Date.now()}`;
    const result = await db.query(
      `INSERT INTO seeds (
        id, name, type, status, content, 
        why_matters, revisit_when, user_id, session_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        id,
        body.name,
        body.type,
        body.status || 'new',
        body.content,
        body.why_matters || null,
        body.revisit_when || null,
        body.user_id || null,
        body.session_id || null,
      ]
    );
    
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('[SEEDS_POST]', error);
    return NextResponse.json(
      { error: 'Failed to create seed' },
      { status: 500 }
    );
  }
}
```

#### 2.3.2 Get/Update/Delete Seed
**File:** `app/api/seeds/[id]/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/lib/pglite/client';

// GET /api/seeds/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = await getDB();
    const result = await db.query(
      'SELECT * FROM seeds WHERE id = $1',
      [params.id]
    );
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Seed not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('[SEED_GET]', error);
    return NextResponse.json(
      { error: 'Failed to fetch seed' },
      { status: 500 }
    );
  }
}

// PATCH /api/seeds/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = await getDB();
    const body = await req.json();
    
    const fields = [];
    const values = [];
    let paramIndex = 1;
    
    // Dynamic field updates
    if (body.name !== undefined) {
      fields.push(`name = $${paramIndex++}`);
      values.push(body.name);
    }
    if (body.type !== undefined) {
      fields.push(`type = $${paramIndex++}`);
      values.push(body.type);
    }
    if (body.status !== undefined) {
      fields.push(`status = $${paramIndex++}`);
      values.push(body.status);
    }
    if (body.content !== undefined) {
      fields.push(`content = $${paramIndex++}`);
      values.push(body.content);
    }
    if (body.why_matters !== undefined) {
      fields.push(`why_matters = $${paramIndex++}`);
      values.push(body.why_matters);
    }
    if (body.revisit_when !== undefined) {
      fields.push(`revisit_when = $${paramIndex++}`);
      values.push(body.revisit_when);
    }
    
    fields.push(`updated_at = NOW()`);
    values.push(params.id);
    
    const result = await db.query(
      `UPDATE seeds SET ${fields.join(', ')} 
       WHERE id = $${paramIndex}
       RETURNING *`,
      values
    );
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Seed not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('[SEED_PATCH]', error);
    return NextResponse.json(
      { error: 'Failed to update seed' },
      { status: 500 }
    );
  }
}

// DELETE /api/seeds/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = await getDB();
    await db.query('DELETE FROM seeds WHERE id = $1', [params.id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[SEED_DELETE]', error);
    return NextResponse.json(
      { error: 'Failed to delete seed' },
      { status: 500 }
    );
  }
}
```

#### 2.3.3 Export Memory Patch
**File:** `app/api/seeds/export/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/lib/pglite/client';

// POST /api/seeds/export - Export Memory Patch for selected seeds
export async function POST(req: NextRequest) {
  try {
    const db = await getDB();
    const { seedIds } = await req.json();
    
    if (!seedIds || seedIds.length === 0) {
      return NextResponse.json(
        { error: 'No seeds selected' },
        { status: 400 }
      );
    }
    
    const placeholders = seedIds.map((_, i) => `$${i + 1}`).join(',');
    const result = await db.query(
      `SELECT * FROM seeds WHERE id IN (${placeholders}) ORDER BY created_at`,
      seedIds
    );
    
    const seeds = result.rows;
    const memoryPatch = generateMemoryPatch(seeds);
    
    return new NextResponse(memoryPatch, {
      headers: {
        'Content-Type': 'text/markdown',
        'Content-Disposition': 'attachment; filename="memory-patch.md"',
      },
    });
  } catch (error) {
    console.error('[EXPORT_MEMORY_PATCH]', error);
    return NextResponse.json(
      { error: 'Export failed' },
      { status: 500 }
    );
  }
}

function generateMemoryPatch(seeds: any[]): string {
  return `# Memory Patch: Replanted Seeds

_Generated on ${new Date().toLocaleString()}_

${seeds.map(seed => `
## Seed: ${seed.name}

**Type:** ${seed.type}  
**Status:** ${seed.status}

**Why it matters:** ${seed.why_matters || 'N/A'}  
**Revisit when:** ${seed.revisit_when || 'N/A'}

**Content:**
${seed.content}

---
`).join('\n')}

**Total Seeds:** ${seeds.length}
`;
}
```

### 2.4 Custom Hooks

**File:** `hooks/useSeeds.ts`

```typescript
'use client';

import { useState, useEffect } from 'react';
import type { Seed, SeedFilters } from '@/lib/seeds/types';

interface UseSeedsReturn {
  seeds: Seed[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useSeeds(filters: SeedFilters = {}): UseSeedsReturn {
  const [seeds, setSeeds] = useState<Seed[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  const refetch = () => setRefetchTrigger(prev => prev + 1);

  useEffect(() => {
    async function fetchSeeds() {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams();
        if (filters.status) params.set('status', filters.status.join(','));
        if (filters.type) params.set('type', filters.type.join(','));
        if (filters.search) params.set('search', filters.search);

        const response = await fetch(`/api/seeds?${params}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch seeds');
        }

        const data = await response.json();
        setSeeds(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Error fetching seeds:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchSeeds();
  }, [filters.status, filters.type, filters.search, refetchTrigger]);

  return { seeds, loading, error, refetch };
}
```

### 2.5 UI Components

#### 2.5.1 Seed Card Component
**File:** `components/seeds/seed-card.tsx`

Card component displaying seed information with actions:
- Visual display with type badge and status icon
- Quick actions: Keep, Grow, Compost
- View details button
- Delete button

**Key Features:**
- Framer Motion animations
- Lucide icons (Leaf, ArrowUp, X, Eye, Trash2)
- Tailwind CSS with dark mode support
- Accessible buttons with ARIA labels

#### 2.5.2 Filters Panel Component
**File:** `components/seeds/filters-panel.tsx`

Filter panel for seed library:
- Filter by type (6 seed types)
- Filter by status (4 statuses)
- Clear all filters button

**Key Features:**
- Badge-based filter UI
- Multi-select capability
- Active state highlighting

#### 2.5.3 Seed Details Modal
**File:** `components/seeds/details-modal.tsx`

Full-screen modal for seed details:
- Complete seed information display
- Memory Patch export button
- Close button

**Key Features:**
- Fixed header and footer
- Scrollable content area
- Copy to clipboard functionality
- Accessible modal (ESC to close, focus trap)

#### 2.5.4 Seeds Page
**File:** `app/seeds/page.tsx`

Main page component:
- Grid/list view of seeds
- Search bar
- Filters panel (sidebar)
- Loading and empty states
- Seed details modal integration

**Layout:**
```
┌─────────────────────────────────────────┐
│ Seed Library                 [Search]   │
├──────────────┬──────────────────────────┤
│  Filters     │  Seed Grid               │
│              │  ┌────┬────┬────┐        │
│  Type:       │  │    │    │    │        │
│  □ principle │  └────┴────┴────┘        │
│  □ pattern   │  ┌────┬────┬────┐        │
│  □ question  │  │    │    │    │        │
│  ...         │  └────┴────┴────┘        │
│              │                          │
│  Status:     │                          │
│  □ new       │                          │
│  □ growing   │                          │
│  ...         │                          │
└──────────────┴──────────────────────────┘
```

### 2.6 Styling Guidelines

**Colors:**
- Type badges:
  - `principle`: blue (`bg-blue-50 text-blue-700`)
  - `pattern`: green (`bg-green-50 text-green-700`)
  - `question`: yellow (`bg-yellow-50 text-yellow-700`)
  - `route`: purple (`bg-purple-50 text-purple-700`)
  - `artifact`: orange (`bg-orange-50 text-orange-700`)
  - `constraint`: red (`bg-red-50 text-red-700`)

**Animations:**
- Card hover: scale(1.02) with shadow
- Button active: scale(0.95)
- Tag/badge hover: scale(1.05)
- Modal: fade in/out

**Accessibility:**
- All interactive elements have ARIA labels
- Focus indicators on all focusable elements
- Keyboard navigation (Tab, Enter, ESC)
- Screen reader support

---

## 3. Source Code Structure Changes

### 3.1 New Files

```
lib/
  seeds/
    types.ts                    # Type definitions for seeds
    README.md                   # Feature documentation

  pglite/
    migrations/
      010_add_seeds.ts          # Database migration

app/
  api/
    seeds/
      route.ts                  # GET (list), POST (create)
      [id]/
        route.ts                # GET, PATCH, DELETE single seed
      export/
        route.ts                # POST (export Memory Patch)
  
  seeds/
    page.tsx                    # Main seeds library page

components/
  seeds/
    seed-card.tsx               # Seed card component
    filters-panel.tsx           # Filters panel component
    details-modal.tsx           # Seed details modal

hooks/
  useSeeds.ts                   # Hook for fetching seeds

__tests__/
  seeds/
    api.test.ts                 # API route tests
    components.test.ts          # Component tests
    integration.test.ts         # Integration tests
```

### 3.2 Modified Files

```
lib/pglite/client.ts           # Add migration010 import and apply
lib/pglite/schema.ts           # Add seeds table to schema (optional, for reference)
package.json                   # Add test:seeds script
```

---

## 4. Data Model Changes

### 4.1 Database Schema

**New Table: `seeds`**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | TEXT | PRIMARY KEY | Unique identifier (seed_timestamp) |
| `name` | TEXT | NOT NULL | 3-7 word human-readable name |
| `type` | TEXT | NOT NULL, CHECK | Seed type (6 options) |
| `status` | TEXT | NOT NULL, DEFAULT 'new', CHECK | Seed status (4 options) |
| `content` | TEXT | NOT NULL | Full seed content |
| `why_matters` | TEXT | NULL | Why this seed matters (1 line) |
| `revisit_when` | TEXT | NULL | Trigger condition for revisiting |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Update timestamp |
| `user_id` | TEXT | NULL | Optional user association |
| `session_id` | TEXT | NULL | Session where seed was created |
| `replanted` | BOOLEAN | DEFAULT false | Has been replanted |
| `replant_count` | INTEGER | DEFAULT 0 | Number of times replanted |

**Indexes:**
- `idx_seeds_status` on `status`
- `idx_seeds_type` on `type`
- `idx_seeds_user_id` on `user_id`
- `idx_seeds_created_at` on `created_at DESC`
- `idx_seeds_updated_at` on `updated_at DESC`

**Triggers:**
- `update_seeds_updated_at` - Auto-update `updated_at` on row update

### 4.2 API Interfaces

See section 2.2 for TypeScript type definitions.

### 4.3 Migration Strategy

1. Create migration file `010_add_seeds.ts`
2. Import in `lib/pglite/client.ts`
3. Apply migration on database initialization
4. Migration is idempotent (CREATE IF NOT EXISTS)

---

## 5. Verification Approach

### 5.1 Unit Tests

**File:** `__tests__/seeds/api.test.ts`

Test all API routes:
- GET /api/seeds (with/without filters)
- POST /api/seeds (create seed)
- GET /api/seeds/[id] (fetch single seed)
- PATCH /api/seeds/[id] (update seed)
- DELETE /api/seeds/[id] (delete seed)
- POST /api/seeds/export (export Memory Patch)

**File:** `__tests__/seeds/components.test.ts`

Test components in isolation:
- SeedCard renders correctly
- FiltersPanel toggles filters
- DetailsModal displays seed details

### 5.2 Integration Tests

**File:** `__tests__/seeds/integration.test.ts`

End-to-end workflows:
1. Create new seed via API
2. Fetch seed from database
3. Update seed status
4. Export Memory Patch
5. Delete seed

### 5.3 Manual Testing Checklist

- [ ] Navigate to /seeds page
- [ ] Verify seed library displays (grid view)
- [ ] Test search functionality
- [ ] Test filters (type and status)
- [ ] Click "Keep" button to update status
- [ ] Click "Grow" button to update status
- [ ] Click "Compost" button to update status
- [ ] Click "View" to open details modal
- [ ] Export Memory Patch from modal
- [ ] Delete seed with confirmation
- [ ] Test responsive design (mobile, tablet, desktop)
- [ ] Test dark mode
- [ ] Test keyboard navigation
- [ ] Test accessibility (screen reader)

### 5.4 Lint and Type Check

**Commands:**
```bash
npm run lint           # ESLint check
npm run type-check     # TypeScript type checking
```

All lint and type errors must be resolved before marking feature complete.

### 5.5 Performance Targets

- **Page load:** <2 seconds (50 seeds)
- **Search response:** <300ms
- **Filter response:** <200ms
- **Animations:** 60fps
- **Memory Patch export:** <1 second

### 5.6 Test Scripts

**Add to `package.json`:**
```json
{
  "scripts": {
    "test:seeds-api": "tsx __tests__/seeds/api.test.ts",
    "test:seeds-components": "tsx __tests__/seeds/components.test.ts",
    "test:seeds-integration": "tsx __tests__/seeds/integration.test.ts",
    "test:seeds": "npm run test:seeds-api && npm run test:seeds-components && npm run test:seeds-integration"
  }
}
```

---

## 6. Implementation Plan Breakdown

### Phase 1: Database & API (Days 1-3)
1. Create migration file with seeds table
2. Update client.ts to apply migration
3. Create type definitions
4. Implement API routes (GET, POST, PATCH, DELETE)
5. Test API routes with unit tests

### Phase 2: Components (Days 4-6)
1. Create SeedCard component
2. Create FiltersPanel component
3. Create DetailsModal component
4. Test components in isolation

### Phase 3: Page & Integration (Days 7-9)
1. Create Seeds page
2. Create useSeeds hook
3. Integrate components with page
4. Test full workflow
5. Export Memory Patch functionality

### Phase 4: Testing & Polish (Days 10-12)
1. Write integration tests
2. Manual testing (all scenarios)
3. Fix bugs and edge cases
4. Accessibility audit
5. Performance optimization
6. Documentation (README, JOURNAL.md, AUDIT_LOG.md)
7. Final lint and type check

---

## 7. Deferred Features (Out of Scope for v0.3.10)

- Drag-and-drop sorting (deferred to v0.4.0)
- Bulk actions (select multiple seeds, apply action)
- Semantic search via Librarian
- Seed relationships (link related seeds)
- Seed versioning (track changes over time)
- Seed sharing (share seeds with collaborators)
- Auto-tagging with AI

---

## 8. Known Limitations & Constraints

1. **No authentication:** Seeds are stored locally, no multi-user support yet
2. **No real-time sync:** Changes are not synced across devices
3. **Browser storage:** Limited by IndexedDB capacity (~50MB typical)
4. **No undo/redo:** Deleted seeds cannot be recovered
5. **Basic search:** Text-based search only (no semantic search)

---

## 9. Success Criteria

### Must Have (P0)
- [x] Seeds table created in database
- [x] All CRUD API routes working
- [x] Seeds page displays seed library
- [x] Filters work correctly (type, status)
- [x] Search works correctly
- [x] Status updates work (Keep, Grow, Compost)
- [x] Details modal displays full seed
- [x] Memory Patch export works
- [x] All tests pass
- [x] Zero lint/type errors
- [x] Zero regressions

### Should Have (P1)
- [x] Beautiful, polished UI
- [x] Smooth animations (60fps)
- [x] Responsive design (mobile, tablet, desktop)
- [x] Dark mode support
- [x] Accessible (WCAG 2.1 AA)

### Nice to Have (P2)
- [ ] Keyboard shortcuts (deferred)
- [ ] Bulk actions (deferred)
- [ ] Semantic search (deferred)

---

## 10. Documentation Requirements

### 10.1 Code Documentation
- Type definitions with TSDoc comments
- API route documentation (endpoint, params, response)
- Component prop documentation

### 10.2 Feature Documentation
**File:** `lib/seeds/README.md`
- Overview of seed types and statuses
- API usage examples
- Component usage examples
- Testing instructions

### 10.3 Build Log
**File:** `JOURNAL.md`
- Append entry documenting:
  - Database schema design decisions
  - Component architecture
  - Challenges encountered
  - Performance metrics

### 10.4 Audit Log
**File:** `05_Logs/AUDIT_LOG.md`
- Sprint completion summary
- Test results
- Known limitations
- Next steps

---

## 11. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Database migration fails | Low | High | Test migration in isolation first |
| API route errors | Medium | High | Comprehensive unit tests |
| Component rendering issues | Medium | Medium | Test components in isolation |
| Performance issues | Low | Medium | Performance testing with 50+ seeds |
| Accessibility issues | Medium | Medium | Accessibility audit before completion |

---

## 12. Dependencies & Integration Points

### 12.1 Existing Code Dependencies
- `lib/pglite/client.ts` - Database client
- `lib/utils.ts` - Utility functions (cn for class names)
- `components/ui/` - UI components (if they exist)
- `hooks/useToast.ts` - Toast notifications (if used)

### 12.2 External Dependencies
- No new external dependencies required
- Uses existing packages (Next.js, React, Tailwind, Framer Motion, Lucide)

### 12.3 Integration Points
- Database: PGlite client and migrations
- Navigation: Next.js App Router
- Styling: Tailwind CSS configuration
- Icons: Lucide React

---

## 13. Quality Checklist

Before marking this feature complete:

- [ ] All acceptance criteria met
- [ ] Database migration tested
- [ ] All API routes tested (unit tests)
- [ ] All components tested
- [ ] Integration tests pass
- [ ] Manual testing complete
- [ ] No lint errors (`npm run lint`)
- [ ] No type errors (`npm run type-check`)
- [ ] Performance targets met
- [ ] Accessibility audit complete
- [ ] Documentation complete (README, JOURNAL, AUDIT_LOG)
- [ ] Zero regressions
- [ ] Visual validation (screenshots)
- [ ] Dark mode tested
- [ ] Responsive design tested

---

**Specification Status:** ✅ Complete  
**Ready for Implementation:** Yes  
**Estimated Implementation Time:** 10-12 hours
