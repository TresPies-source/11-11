# DojoPacket Export System

## Overview

The DojoPacket system implements the **Dojo Protocol v1.0** standard for portable, shareable session outputs. It provides a comprehensive solution for exporting, importing, and sharing Dojo session data across tools and collaborators.

## Features

- **Standardized Schema**: DojoPacket v1.0 with full Zod validation
- **Multiple Export Formats**: JSON (machine-readable), Markdown (human-readable), PDF (professional)
- **Import/Resume**: Import packets to create new sessions or resume existing work
- **Graceful Fallbacks**: Handles missing trace data, empty arrays, and null fields
- **Type-Safe**: Full TypeScript support with Zod schema validation

## DojoPacket Schema

A DojoPacket contains complete session data:

```typescript
interface DojoPacket {
  version: '1.0';
  session: {
    id: string;
    title: string;
    mode: 'Mirror' | 'Scout' | 'Gardener' | 'Implementation';
    duration: number;
    created_at: string;
    updated_at: string;
    agent_path: string[];
  };
  situation: string;
  stake: string | null;
  perspectives: Array<{ text: string; source: 'user' | 'agent'; timestamp: string; }>;
  assumptions: Array<{ text: string; challenged: boolean; timestamp: string; }>;
  decisions: Array<{ text: string; rationale: string; timestamp: string; }>;
  next_move: { action: string; why: string; smallest_test: string | null; };
  artifacts: Array<{ type: 'file' | 'link' | 'code' | 'image'; name: string; content: string | null; url: string | null; }>;
  trace_summary: { total_events: number; agent_transitions: number; cost_total: number; tokens_total: number; };
  metadata: { exported_at: string; exported_by: string | null; format: 'json' | 'markdown' | 'pdf'; };
}
```

## Usage

### Building a DojoPacket

```typescript
import { buildDojoPacket } from '@/lib/packet/builder';

const packet = await buildDojoPacket('session-id');
console.log(packet.version); // '1.0'
```

### Exporting Formats

#### JSON (Machine-Readable)

```typescript
import { formatAsJSON } from '@/lib/packet/formatters';

const json = formatAsJSON(packet);
// Pretty-printed JSON string
```

#### Markdown (Human-Readable)

```typescript
import { formatAsMarkdown } from '@/lib/packet/formatters';

const markdown = formatAsMarkdown(packet);
// Formatted Markdown with sections, headers, and status markers
```

#### PDF (Professional)

```typescript
import { formatAsPDF } from '@/lib/packet/formatters';

const pdfBuffer = await formatAsPDF(packet);
// PDF Buffer (requires manus-md-to-pdf utility)
```

### Using the Export API

**Export a session:**

```bash
POST /api/packet/export
Content-Type: application/json

{
  "sessionId": "abc-123",
  "format": "json" | "markdown" | "pdf"
}
```

**Response:**
- Status: `200 OK`
- Content-Type: `application/json` | `text/markdown` | `application/pdf`
- Content-Disposition: `attachment; filename="dojopacket-{sessionId}.{ext}"`

### Using the Import API

**Import a packet:**

```bash
POST /api/packet/import
Content-Type: application/json

{
  "version": "1.0",
  "session": { ... },
  ...
}
```

**Response:**
```json
{
  "success": true,
  "sessionId": "new-session-id"
}
```

### UI Component

```typescript
import { ExportButton } from '@/components/packet/export-button';

<ExportButton sessionId="abc-123" />
```

Provides a dropdown menu with:
- Export as JSON
- Export as Markdown
- Export as PDF
- Copy to Clipboard (Markdown)

## API Routes

### Export Endpoint

**File:** `/app/api/packet/export/route.ts`

**Accepts:**
- `sessionId` (string, required)
- `format` (enum: 'json' | 'markdown' | 'pdf', required)

**Returns:**
- `200 OK`: File download with appropriate Content-Type
- `400 Bad Request`: Invalid sessionId or format
- `404 Not Found`: Session not found
- `500 Internal Server Error`: Export failed

### Import Endpoint

**File:** `/app/api/packet/import/route.ts`

**Accepts:**
- DojoPacket v1.0 JSON object

**Returns:**
- `201 Created`: `{ success: true, sessionId: string }`
- `400 Bad Request`: Invalid packet schema
- `500 Internal Server Error`: Import failed

## Testing

Run all packet tests:

```bash
npm run test:packet
```

Individual test suites:

```bash
npm run test:packet-schema        # Zod schema validation
npm run test:packet-builder       # Packet building logic
npm run test:packet-formatters    # JSON, Markdown, PDF formatters
npm run test:packet-export-api    # Export API endpoint
npm run test:packet-import-api    # Import API endpoint
```

## Architecture

### Builder (`builder.ts`)

- Fetches session data from PGlite database
- Fetches perspectives, assumptions, decisions
- Fetches trace summary from Harness Trace (with graceful fallback)
- Converts Date objects to ISO 8601 strings
- Builds complete DojoPacket v1.0 object

### Formatters (`formatters.ts`)

- **JSON**: Pretty-printed JSON with 2-space indentation
- **Markdown**: Human-readable format with sections, headers, and emoji status markers
- **PDF**: Uses `manus-md-to-pdf` utility to convert Markdown to PDF

### Schema (`schema.ts`)

- Zod schema for DojoPacket v1.0
- Type-safe validation
- Supports all valid modes, formats, and artifact types

## Error Handling

All functions handle errors gracefully:

- **Missing session**: Throws `Error: Session {id} not found`
- **Missing trace data**: Returns zeros (graceful fallback)
- **Invalid schema**: Throws Zod validation error
- **PDF generation failure**: Throws error (requires `manus-md-to-pdf`)

## Known Limitations

- **PDF generation** requires `manus-md-to-pdf` utility (not included)
- **Large sessions** may have slow export times (>1000 events)
- **Binary artifacts** are not supported (only text, links, code)

## Future Enhancements

Planned for v0.4.0+:

- Share links (requires cloud storage)
- Packet versioning (v1.0 → v2.0 migration)
- Packet encryption (for sensitive sessions)
- Batch export (export multiple sessions at once)
- Custom templates (user-defined export formats)

## Contributing

When modifying the packet system:

1. Update `schema.ts` first if changing the DojoPacket structure
2. Update `builder.ts` to match new schema
3. Update formatters if needed
4. Add tests for new functionality
5. Run `npm run test:packet` to verify
6. Update this README

## License

Part of the 11-11 Dojo Protocol implementation.
