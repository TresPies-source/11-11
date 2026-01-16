# 11-11 Architecture Patterns

## Database Architecture: Client-Side PGlite

### Overview

The 11-11 platform uses **PGlite** - a browser-based PostgreSQL implementation that runs entirely in the browser using IndexedDB. This is a critical architectural decision that affects how all database operations are implemented.

### Key Principle

**All database operations MUST happen client-side. API routes CANNOT access PGlite.**

### Why?

PGlite is a browser-only library that:
- Stores data in IndexedDB (browser storage)
- Uses WebAssembly to run PostgreSQL in the browser
- Cannot be bundled or executed in Node.js API routes

### Implementation Pattern

#### ✅ Correct: Direct Client-Side Database Access

```typescript
// components/your-component.tsx
import { createPrompt } from "@/lib/pglite/prompts";
import { insertSeed } from "@/lib/pglite/seeds";

const handleSave = async () => {
  const promptData = {
    user_id: 'dev@11-11.dev',
    title: 'My Prompt',
    content: 'Prompt content',
    status: 'draft',
    visibility: 'private',
  };
  
  // Direct database call - works because it runs in browser
  const newPrompt = await createPrompt(promptData);
  console.log('Created prompt:', newPrompt.id);
};
```

#### ❌ Incorrect: API Route Database Access

```typescript
// app/api/prompts/route.ts - DO NOT DO THIS
import { createPrompt } from "@/lib/pglite/prompts";

export async function POST(request: NextRequest) {
  const data = await request.json();
  
  // This will FAIL - PGlite can't run in Node.js API routes
  const prompt = await createPrompt(data);
  
  return NextResponse.json({ prompt });
}
```

### Database Client Initialization

The PGlite client (`lib/pglite/client.ts`) detects the environment:

```typescript
const isBrowser = typeof window !== 'undefined';
const db = isBrowser 
  ? new PGlite('idb://11-11-db')  // IndexedDB in browser
  : new PGlite('');                // Fails in Node.js
```

### Migration System

Migrations run **only in the browser** on first initialization:

1. User opens app in browser
2. PGlite checks if database exists in IndexedDB
3. If not, runs schema initialization
4. Runs all migrations sequentially
5. Seeds database with sample data

### When to Use API Routes

API routes in this app are primarily for:
- **Authentication** (server-side session validation)
- **External service integration** (Google Drive, GitHub)
- **Server-side computation** that doesn't require database access
- **Proxying external API calls**

### Examples of Correct Implementation

#### Saving a Seed (PlantSeedModal.tsx)

```typescript
import { insertSeed } from "@/lib/pglite/seeds";

const handleSubmit = async () => {
  const seedData = {
    name: formData.name,
    type: formData.type,
    content: formData.content,
    status: "new",
    user_id: userId,
  };
  
  await insertSeed(seedData);  // Direct call
};
```

#### Saving from Workbench (SaveArtifactModal.tsx)

```typescript
import { createPrompt } from "@/lib/pglite/prompts";
import { insertSeed } from "@/lib/pglite/seeds";
import { insertKnowledgeLink } from "@/lib/pglite/knowledge-links";

const handleSubmit = async () => {
  if (targetType === "prompt") {
    const prompt = await createPrompt(promptData);
    targetId = prompt.id;
  } else {
    const seed = await insertSeed(seedData);
    targetId = seed.id;
  }
  
  if (sourceFileId) {
    await insertKnowledgeLink({
      source_type: 'file',
      source_id: sourceFileId,
      target_type: targetType,
      target_id: targetId,
      relationship: 'extracted_from',
      user_id: userId,
    });
  }
};
```

### Dev Mode Authentication

Since there are no API routes for authentication, dev mode uses a hardcoded user:

```typescript
const userId = 'dev@11-11.dev';
```

In production with proper authentication, this would come from:
- NextAuth session (client-side)
- Supabase auth
- Or another client-side auth provider

#### Dojo Message Persistence (dojo.store.ts)

```typescript
import { insertSessionMessage, getSessionMessages } from "@/lib/pglite/session-messages";

const persistMessage = async (message: DojoMessage) => {
  const messageData = {
    session_id: sessionId,
    role: message.role,
    content: message.content,
    mode: message.mode,
    timestamp: new Date(message.timestamp).toISOString(),
    metadata: {},
  };
  
  await insertSessionMessage(messageData);  // Direct call
};
```

### Deprecated API Routes

The following API endpoints were originally created but **cannot work** with PGlite:
- `/api/hub/transfer` - Use direct database calls instead
- `/api/dojo/messages` - Removed (use client-side session-messages functions)

These routes have been removed or deprecated. Always use direct client-side database access.

### Benefits of This Architecture

1. **Zero backend infrastructure** - entire app runs in browser
2. **Instant operations** - no network latency
3. **Offline-first** - works without internet connection
4. **Data privacy** - all data stays in user's browser
5. **Simple deployment** - static site hosting only

### Trade-offs

1. **No server-side validation** - all validation is client-side
2. **No data sharing between users** (without sync mechanism)
3. **Limited to browser storage capacity**
4. **Can't run background jobs**

### Future Considerations

If backend database access is needed in the future:
1. Add a real PostgreSQL database (Supabase, Neon, etc.)
2. Create API routes that access the cloud database
3. Implement sync mechanism between client PGlite and cloud database
4. This is where the `/api/hub/transfer` pattern would be useful

### Key Takeaway

**When implementing new features:**
- ✅ Import database functions directly in components
- ✅ Call them from event handlers (onClick, onSubmit)
- ❌ Don't create API routes for database operations
- ✅ Follow patterns from existing components like `PlantSeedModal`, `SaveArtifactModal`

---

**Last Updated:** 2026-01-15  
**Related Files:**
- `lib/pglite/client.ts` - Database initialization
- `lib/pglite/prompts.ts` - Prompt operations
- `lib/pglite/seeds.ts` - Seed operations
- `lib/pglite/knowledge-links.ts` - Knowledge Hub operations
- `lib/pglite/session-messages.ts` - Dojo message persistence
- `lib/stores/dojo.store.ts` - Dojo state with message persistence
- `components/seeds/plant-seed-modal.tsx` - Example implementation
- `components/workbench/SaveArtifactModal.tsx` - Knowledge Hub example
