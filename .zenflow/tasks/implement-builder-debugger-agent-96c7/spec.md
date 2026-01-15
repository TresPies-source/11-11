# Technical Specification: Builder & Debugger Agents

**Author:** AI Implementation Agent  
**Date:** January 15, 2026  
**Status:** Final  
**Based on:** Requirements v1.0 + User Clarifications

---

## 1. Technical Context

### 1.1 Technology Stack

- **Language:** TypeScript (strict mode)
- **Runtime:** Node.js 18+
- **Framework:** Next.js 14 (App Router)
- **LLM Provider:** DeepSeek (primary), OpenAI (fallback)
- **Database:** PGlite (local SQL)
- **Validation:** Zod v3
- **Testing:** Jest/Vitest

### 1.2 Key Dependencies

```typescript
// Core dependencies (already in codebase)
import { LLMClient } from '../llm/client';
import { startSpan, endSpan, logEvent, isTraceActive } from '../harness/trace';
import { AgentInvocationContext } from './types';
import { Perspective, Assumption, DojoPacket } from '../packet/schema';
import fs from 'fs/promises';
import path from 'path';
```

### 1.3 Project Structure

```
lib/
  agents/
    builder-handler.ts      [NEW]
    debugger-handler.ts     [NEW]
    types.ts                [UPDATE - Add BUILDER constant]
    registry.json           [UPDATE - Add builder entry]
    handoff.ts              [UPDATE - Add builder/debugger routing]
```

---

## 2. Implementation Approach

### 2.1 Architecture Pattern

Both agents follow the **established handler pattern** from `librarian-handler.ts`:

1. **Type Definitions** - Query, Response, Error interfaces
2. **Main Handler** - Core business logic function
3. **Helper Functions** - LLM calls, data transformation
4. **Invocation Entrypoint** - Standard interface for handoff system
5. **Harness Trace Integration** - Full observability
6. **Error Handling** - Custom error classes with codes

### 2.2 LLM Model Selection

**Builder Agent:**
- **Planning:** `deepseek-chat` (temperature: 0.2)
- **Generation:** `deepseek-chat` (temperature: 0.2)
- **Rationale:** Code generation requires precision and consistency

**Debugger Agent:**
- **Analysis:** `deepseek-reasoner` (temperature: 0.5)
- **Rationale:** Complex reasoning task benefits from thinking capabilities

### 2.3 Code Safety Principles

**Builder Agent:**
- ✅ Returns `CodeArtifact[]` objects (in-memory)
- ❌ Does NOT write files to disk
- ✅ Validates context file paths are within project directory
- ✅ Graceful degradation if context files missing

**Debugger Agent:**
- ✅ Read-only analysis (no data modification)
- ✅ Works with structured data (DojoPacket) or raw messages
- ✅ Fallback to conversation parsing if no packet exists

---

## 3. Builder Agent - Technical Design

### 3.1 File: `lib/agents/builder-handler.ts`

#### 3.1.1 Type Definitions

```typescript
import { AgentInvocationContext, AgentError } from './types';

/**
 * Represents a generated or modified code file.
 */
export interface CodeArtifact {
  path: string;                    // Relative path (e.g., 'components/ui/Card.tsx')
  content: string;                 // Full code content
  action: 'CREATE' | 'UPDATE';    // Type of modification
}

/**
 * Input query for Builder agent.
 */
export interface BuilderAgentQuery {
  request: string;                 // Natural language request
  context_file_paths?: string[];   // Optional context files to read
}

/**
 * Builder agent response with generated artifacts.
 */
export interface BuilderAgentResponse {
  artifacts: CodeArtifact[];
  summary: string;                 // Human-readable summary
}

/**
 * Internal plan structure from LLM.
 */
interface CodePlan {
  summary: string;
  files_to_modify: Array<{
    path: string;
    action: 'CREATE' | 'UPDATE';
    description: string;
  }>;
}

/**
 * Error class for Builder agent operations.
 */
export class BuilderAgentError extends AgentError {
  constructor(message: string, code?: string, details?: unknown) {
    super(message, code, 'builder', details);
    this.name = 'BuilderAgentError';
  }
}
```

#### 3.1.2 Main Handler Function

```typescript
/**
 * Handles Builder agent query with Plan → Generate flow.
 * 
 * @param query - Builder query with request and optional context
 * @returns Response with generated code artifacts
 * @throws BuilderAgentError if request is empty or generation fails
 */
export async function handleBuilderQuery(
  query: BuilderAgentQuery
): Promise<BuilderAgentResponse> {
  const startTime = Date.now();

  try {
    // Validate request
    if (!query.request || query.request.trim().length === 0) {
      throw new BuilderAgentError('Request is empty', 'EMPTY_REQUEST');
    }

    // Log activity start
    if (isTraceActive()) {
      logEvent('AGENT_ACTIVITY_START', {
        agent_id: 'builder',
        message: 'Planning code generation...',
        progress: 0,
      }, {}, {
        parent_type: 'agent_operation',
        metadata: { request: query.request },
      });
    }

    // Step 1: Read context files (with validation)
    const contextFiles = await readContextFiles(query.context_file_paths || []);

    if (isTraceActive()) {
      logEvent('AGENT_ACTIVITY_PROGRESS', {
        agent_id: 'builder',
        message: 'Creating generation plan...',
        progress: 20,
      }, {}, { parent_type: 'agent_operation' });
    }

    // Step 2: Plan code changes (LLM Call #1)
    const plan = await planCodeChanges(query.request, contextFiles);

    if (isTraceActive()) {
      logEvent('AGENT_ACTIVITY_PROGRESS', {
        agent_id: 'builder',
        message: `Generating ${plan.files_to_modify.length} file(s)...`,
        progress: 40,
      }, {}, { parent_type: 'agent_operation' });
    }

    // Step 3: Generate code artifacts (LLM Calls #2...N)
    const artifacts = await generateCodeArtifacts(query.request, contextFiles, plan);

    const duration = Date.now() - startTime;

    // Log completion
    if (isTraceActive()) {
      logEvent('AGENT_ACTIVITY_COMPLETE', {
        agent_id: 'builder',
        message: `Generated ${artifacts.length} artifact(s)`,
        progress: 100,
      }, {}, {
        parent_type: 'agent_operation',
        metadata: {
          artifact_count: artifacts.length,
          duration_ms: duration,
        },
      });
    }

    return {
      artifacts,
      summary: plan.summary,
    };
  } catch (error) {
    // Log error
    if (isTraceActive()) {
      logEvent('AGENT_ACTIVITY_COMPLETE', {
        agent_id: 'builder',
        message: 'Code generation failed',
        status: 'error',
      }, {}, {
        parent_type: 'agent_operation',
        metadata: {
          error: error instanceof Error ? error.message : String(error),
        },
      });
    }

    if (error instanceof BuilderAgentError) {
      throw error;
    }

    throw new BuilderAgentError(
      `Code generation failed: ${error instanceof Error ? error.message : String(error)}`,
      'GENERATION_FAILED',
      error
    );
  }
}
```

#### 3.1.3 Helper Functions

**Read Context Files:**

```typescript
/**
 * Reads and validates context files.
 * Ensures files are within project directory and exist.
 * 
 * @param filePaths - Array of file paths to read
 * @returns Array of {path, content} objects
 */
async function readContextFiles(
  filePaths: string[]
): Promise<Array<{ path: string; content: string }>> {
  const projectRoot = process.cwd();
  const results: Array<{ path: string; content: string }> = [];

  for (const filePath of filePaths) {
    try {
      // Resolve to absolute path
      const absolutePath = path.isAbsolute(filePath)
        ? filePath
        : path.resolve(projectRoot, filePath);

      // Security check: Ensure file is within project directory
      if (!absolutePath.startsWith(projectRoot)) {
        console.warn(`[Builder] Context file outside project: ${filePath}`);
        if (isTraceActive()) {
          logEvent('ERROR', {
            tool: 'file_read',
            file_path: filePath,
          }, { error: true }, {
            error_message: 'File outside project directory',
          });
        }
        continue;
      }

      // Read file content
      const content = await fs.readFile(absolutePath, 'utf-8');
      results.push({ path: filePath, content });

    } catch (error) {
      console.warn(`[Builder] Could not read context file ${filePath}:`, error);
      if (isTraceActive()) {
        logEvent('ERROR', {
          tool: 'file_read',
          file_path: filePath,
        }, { error: true }, {
          error_message: error instanceof Error ? error.message : String(error),
        });
      }
      // Graceful degradation: continue without this file
    }
  }

  return results;
}
```

**Plan Code Changes:**

```typescript
/**
 * Calls LLM to plan code generation.
 * Determines which files to create/modify based on request.
 * 
 * @param request - User's natural language request
 * @param contextFiles - Context files for reference
 * @returns Code plan with summary and files to modify
 * @throws BuilderAgentError if planning fails
 */
async function planCodeChanges(
  request: string,
  contextFiles: Array<{ path: string; content: string }>
): Promise<CodePlan> {
  const llmClient = new LLMClient();

  const spanId = startSpan('TOOL_INVOCATION', {
    tool: 'llm',
    operation: 'code_planning',
    model: 'deepseek-chat',
  });

  try {
    const contextText = contextFiles.length > 0
      ? `\n\nContext Files:\n${contextFiles.map(f => `--- ${f.path} ---\n${f.content}`).join('\n\n')}`
      : '';

    const systemPrompt = `You are a code planning assistant. Given a user request, determine which files need to be created or updated.

Return a JSON object with this exact structure:
{
  "summary": "Brief description of what will be generated",
  "files_to_modify": [
    {
      "path": "relative/path/to/file.tsx",
      "action": "CREATE" or "UPDATE",
      "description": "What this file will contain"
    }
  ]
}

Rules:
- Use relative paths from project root
- Only include files that need to be generated
- Be specific about file purposes
- Follow existing project structure conventions if context files are provided`;

    const userPrompt = `Request: ${request}${contextText}`;

    const response = await llmClient.call('deepseek-chat', [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ], {
      temperature: 0.2,
      responseFormat: { type: 'json_object' },
    });

    const plan = JSON.parse(response.content) as CodePlan;

    endSpan(spanId, {
      success: true,
      file_count: plan.files_to_modify.length,
    }, {
      duration_ms: 0, // Calculated by trace
      token_count: response.usage.total_tokens,
      cost_usd: 0, // Calculated by LLMClient
    });

    return plan;
  } catch (error) {
    endSpan(spanId, {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }, {});

    throw new BuilderAgentError(
      `Planning failed: ${error instanceof Error ? error.message : String(error)}`,
      'PLANNING_FAILED',
      error
    );
  }
}
```

**Generate Code Artifacts:**

```typescript
/**
 * Generates code for each file in the plan.
 * Makes one LLM call per file for detailed code generation.
 * 
 * @param request - Original user request
 * @param contextFiles - Context files for reference
 * @param plan - Code plan from planning step
 * @returns Array of CodeArtifact objects
 */
async function generateCodeArtifacts(
  request: string,
  contextFiles: Array<{ path: string; content: string }>,
  plan: CodePlan
): Promise<CodeArtifact[]> {
  const llmClient = new LLMClient();
  const artifacts: CodeArtifact[] = [];

  for (const [index, fileSpec] of plan.files_to_modify.entries()) {
    const spanId = startSpan('TOOL_INVOCATION', {
      tool: 'llm',
      operation: 'code_generation',
      model: 'deepseek-chat',
      file_path: fileSpec.path,
    });

    try {
      const contextText = contextFiles.length > 0
        ? `\n\nContext Files (for reference):\n${contextFiles.map(f => `--- ${f.path} ---\n${f.content}`).join('\n\n')}`
        : '';

      const systemPrompt = `You are an expert code generator. Generate high-quality, production-ready code based on the user's request.

Rules:
- Generate ONLY the code content (no markdown, no explanations)
- Follow TypeScript best practices
- Include proper imports
- Add JSDoc comments for functions
- Match the coding style from context files if provided
- Ensure code is complete and ready to use`;

      const userPrompt = `Generate code for: ${fileSpec.path}

Purpose: ${fileSpec.description}

Original Request: ${request}${contextText}`;

      const response = await llmClient.call('deepseek-chat', [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ], {
        temperature: 0.2,
      });

      artifacts.push({
        path: fileSpec.path,
        content: response.content,
        action: fileSpec.action,
      });

      endSpan(spanId, {
        success: true,
        file_path: fileSpec.path,
        content_length: response.content.length,
      }, {
        token_count: response.usage.total_tokens,
      });

      // Log progress
      if (isTraceActive()) {
        const progress = 40 + Math.round(((index + 1) / plan.files_to_modify.length) * 60);
        logEvent('AGENT_ACTIVITY_PROGRESS', {
          agent_id: 'builder',
          message: `Generated ${index + 1}/${plan.files_to_modify.length} files`,
          progress,
        }, {}, { parent_type: 'agent_operation' });
      }

    } catch (error) {
      endSpan(spanId, {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }, {});

      throw new BuilderAgentError(
        `Failed to generate ${fileSpec.path}: ${error instanceof Error ? error.message : String(error)}`,
        'GENERATION_FAILED',
        error
      );
    }
  }

  return artifacts;
}
```

#### 3.1.4 Invocation Entrypoint

```typescript
/**
 * Invocation entrypoint for handoff system.
 * Extracts request from AgentInvocationContext and calls Builder.
 * 
 * @param context - Agent invocation context from handoff
 * @returns Builder response with artifacts
 */
export async function invokeBuilderAgent(
  context: AgentInvocationContext
): Promise<BuilderAgentResponse> {
  const query: BuilderAgentQuery = {
    request: context.user_intent,
    // Context files could be extracted from conversation history if needed
    // For now, we rely on explicit user-provided paths
  };

  const response = await handleBuilderQuery(query);

  console.log(
    `[Builder] Generated ${response.artifacts.length} artifact(s) for: ${context.user_intent}`
  );

  return response;
}
```

---

## 4. Debugger Agent - Technical Design

### 4.1 File: `lib/agents/debugger-handler.ts`

#### 4.1.1 Type Definitions

```typescript
import { AgentInvocationContext, AgentError, ChatMessage } from './types';
import { Perspective, Assumption, DojoPacket } from '../packet/schema';

/**
 * Represents a logical conflict in user's reasoning.
 */
export interface Conflict {
  description: string;
  conflicting_perspectives: string[];  // The actual perspective texts
}

/**
 * Input query for Debugger agent.
 */
export interface DebuggerAgentQuery {
  perspectives: Perspective[];
  assumptions: Assumption[];
}

/**
 * Debugger agent response with identified conflicts.
 */
export interface DebuggerAgentResponse {
  conflicts: Conflict[];
  summary: string;
}

/**
 * Internal analysis structure from LLM.
 */
interface ReasoningAnalysis {
  summary: string;
  conflicts: Conflict[];
}

/**
 * Error class for Debugger agent operations.
 */
export class DebuggerAgentError extends AgentError {
  constructor(message: string, code?: string, details?: unknown) {
    super(message, code, 'debugger', details);
    this.name = 'DebuggerAgentError';
  }
}
```

#### 4.1.2 Main Handler Function

```typescript
/**
 * Handles Debugger agent query to analyze perspectives and assumptions.
 * 
 * @param query - Debugger query with perspectives and assumptions
 * @returns Response with identified conflicts and summary
 * @throws DebuggerAgentError if input is empty or analysis fails
 */
export async function handleDebuggerQuery(
  query: DebuggerAgentQuery
): Promise<DebuggerAgentResponse> {
  const startTime = Date.now();

  try {
    // Validate input
    if (query.perspectives.length === 0 && query.assumptions.length === 0) {
      throw new DebuggerAgentError(
        'No perspectives or assumptions to analyze',
        'EMPTY_INPUT'
      );
    }

    // Log activity start
    if (isTraceActive()) {
      logEvent('AGENT_ACTIVITY_START', {
        agent_id: 'debugger',
        message: 'Analyzing reasoning for conflicts...',
        progress: 0,
      }, {}, {
        parent_type: 'agent_operation',
        metadata: {
          perspective_count: query.perspectives.length,
          assumption_count: query.assumptions.length,
        },
      });
    }

    if (isTraceActive()) {
      logEvent('AGENT_ACTIVITY_PROGRESS', {
        agent_id: 'debugger',
        message: 'Running conflict detection...',
        progress: 50,
      }, {}, { parent_type: 'agent_operation' });
    }

    // Perform reasoning analysis (LLM Call)
    const analysis = await analyzeReasoning(query.perspectives, query.assumptions);

    const duration = Date.now() - startTime;

    // Log completion
    if (isTraceActive()) {
      logEvent('AGENT_ACTIVITY_COMPLETE', {
        agent_id: 'debugger',
        message: `Found ${analysis.conflicts.length} conflict(s)`,
        progress: 100,
      }, {}, {
        parent_type: 'agent_operation',
        metadata: {
          conflict_count: analysis.conflicts.length,
          duration_ms: duration,
        },
      });
    }

    return {
      conflicts: analysis.conflicts,
      summary: analysis.summary,
    };
  } catch (error) {
    // Log error
    if (isTraceActive()) {
      logEvent('AGENT_ACTIVITY_COMPLETE', {
        agent_id: 'debugger',
        message: 'Reasoning analysis failed',
        status: 'error',
      }, {}, {
        parent_type: 'agent_operation',
        metadata: {
          error: error instanceof Error ? error.message : String(error),
        },
      });
    }

    if (error instanceof DebuggerAgentError) {
      throw error;
    }

    throw new DebuggerAgentError(
      `Analysis failed: ${error instanceof Error ? error.message : String(error)}`,
      'ANALYSIS_FAILED',
      error
    );
  }
}
```

#### 4.1.3 Helper Functions

**Analyze Reasoning:**

```typescript
/**
 * Calls LLM to analyze perspectives and assumptions for conflicts.
 * Uses deepseek-reasoner for complex logical analysis.
 * 
 * @param perspectives - User's perspectives from Dojo session
 * @param assumptions - User's assumptions from Dojo session
 * @returns Analysis with conflicts and summary
 * @throws DebuggerAgentError if analysis fails
 */
async function analyzeReasoning(
  perspectives: Perspective[],
  assumptions: Assumption[]
): Promise<ReasoningAnalysis> {
  const llmClient = new LLMClient();

  const spanId = startSpan('TOOL_INVOCATION', {
    tool: 'llm',
    operation: 'reasoning_analysis',
    model: 'deepseek-reasoner',
  });

  try {
    const perspectivesText = perspectives.length > 0
      ? perspectives.map((p, i) => `${i + 1}. [${p.source}] ${p.text}`).join('\n')
      : 'No perspectives provided.';

    const assumptionsText = assumptions.length > 0
      ? assumptions.map((a, i) => `${i + 1}. ${a.text} (challenged: ${a.challenged})`).join('\n')
      : 'No assumptions provided.';

    const systemPrompt = `You are a logical reasoning validator. Analyze the user's perspectives and assumptions to identify:
1. Contradictions between perspectives
2. Logical fallacies or errors
3. Unstated biases in assumptions
4. Conflicting goals or priorities

Return a JSON object with this exact structure:
{
  "summary": "High-level summary of reasoning issues found",
  "conflicts": [
    {
      "description": "Detailed description of the conflict",
      "conflicting_perspectives": ["exact text of perspective 1", "exact text of perspective 2"]
    }
  ]
}

If no conflicts are found, return an empty conflicts array with a summary stating the reasoning appears sound.`;

    const userPrompt = `Analyze these perspectives and assumptions:

**Perspectives:**
${perspectivesText}

**Assumptions:**
${assumptionsText}`;

    const response = await llmClient.call('deepseek-reasoner', [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ], {
      temperature: 0.5,
      responseFormat: { type: 'json_object' },
    });

    const analysis = JSON.parse(response.content) as ReasoningAnalysis;

    endSpan(spanId, {
      success: true,
      conflict_count: analysis.conflicts.length,
    }, {
      token_count: response.usage.total_tokens,
    });

    return analysis;
  } catch (error) {
    endSpan(spanId, {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }, {});

    throw new DebuggerAgentError(
      `Reasoning analysis failed: ${error instanceof Error ? error.message : String(error)}`,
      'ANALYSIS_FAILED',
      error
    );
  }
}
```

**Extract from DojoPacket:**

```typescript
/**
 * Attempts to extract DojoPacket from conversation history.
 * Looks for packet in assistant messages or user-uploaded data.
 * 
 * @param conversationHistory - Recent chat messages
 * @returns DojoPacket or null if not found
 */
function extractDojoPacket(conversationHistory: ChatMessage[]): DojoPacket | null {
  // Search in reverse (most recent first)
  for (const message of conversationHistory.reverse()) {
    try {
      // Try to find JSON in message content
      const jsonMatch = message.content.match(/\{[\s\S]*"version"\s*:\s*"1\.0"[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        // Validate with Zod
        const packet = DojoPacket.parse(parsed);
        return packet;
      }
    } catch {
      // Not a valid DojoPacket, continue
    }
  }
  return null;
}
```

**Parse from Conversation:**

```typescript
/**
 * Fallback: Parse perspectives from raw conversation messages.
 * Extracts user statements as potential perspectives.
 * 
 * @param conversationHistory - Recent chat messages
 * @param limit - Maximum messages to analyze
 * @returns Extracted perspectives
 */
function parsePerspecti vesFromConversation(
  conversationHistory: ChatMessage[],
  limit: number = 5
): Perspective[] {
  const perspectives: Perspective[] = [];
  const recentMessages = conversationHistory.slice(-limit);

  for (const message of recentMessages) {
    if (message.role === 'user' && message.content.length > 10) {
      // Split on sentence boundaries
      const sentences = message.content
        .split(/[.!?]+/)
        .map(s => s.trim())
        .filter(s => s.length > 20); // Filter short fragments

      for (const sentence of sentences) {
        perspectives.push({
          text: sentence,
          source: 'user',
          timestamp: message.timestamp || new Date().toISOString(),
        });
      }
    }
  }

  return perspectives;
}
```

#### 4.1.4 Invocation Entrypoint

```typescript
/**
 * Invocation entrypoint for handoff system.
 * Tries to extract DojoPacket first, falls back to parsing conversation.
 * 
 * @param context - Agent invocation context from handoff
 * @returns Debugger response with conflicts
 */
export async function invokeDebuggerAgent(
  context: AgentInvocationContext
): Promise<DebuggerAgentResponse> {
  let perspectives: Perspective[] = [];
  let assumptions: Assumption[] = [];

  // Strategy 1: Try to extract DojoPacket from conversation
  const packet = extractDojoPacket(context.conversation_history);
  if (packet) {
    perspectives = packet.perspectives;
    assumptions = packet.assumptions;
    console.log('[Debugger] Using perspectives/assumptions from DojoPacket');
  } else {
    // Strategy 2: Parse from conversation messages
    perspectives = parsePerspectivesFromConversation(context.conversation_history);
    assumptions = []; // Can't easily extract assumptions from raw text
    console.log('[Debugger] Parsed perspectives from conversation history');
  }

  const query: DebuggerAgentQuery = {
    perspectives,
    assumptions,
  };

  const response = await handleDebuggerQuery(query);

  console.log(
    `[Debugger] Analysis complete: ${response.conflicts.length} conflict(s) found`
  );

  return response;
}
```

---

## 5. Source Code Structure Changes

### 5.1 New Files

1. **`lib/agents/builder-handler.ts`** (~400 lines)
   - Exports: `CodeArtifact`, `BuilderAgentQuery`, `BuilderAgentResponse`, `BuilderAgentError`
   - Exports: `handleBuilderQuery()`, `invokeBuilderAgent()`

2. **`lib/agents/debugger-handler.ts`** (~350 lines)
   - Exports: `Conflict`, `DebuggerAgentQuery`, `DebuggerAgentResponse`, `DebuggerAgentError`
   - Exports: `handleDebuggerQuery()`, `invokeDebuggerAgent()`

### 5.2 Modified Files

1. **`lib/agents/types.ts`** - Add `BUILDER` constant:
```typescript
export const AGENT_IDS = {
  DOJO: 'dojo',
  LIBRARIAN: 'librarian',
  DEBUGGER: 'debugger',
  BUILDER: 'builder', // NEW
} as const;
```

2. **`lib/agents/handoff.ts`** - Add routing for Builder and Debugger:
```typescript
import { invokeBuilderAgent } from './builder-handler';
import { invokeDebuggerAgent } from './debugger-handler';

// In invokeAgent function:
case 'builder':
  return await invokeBuilderAgent(context);
case 'debugger':
  return await invokeDebuggerAgent(context);
```

3. **`lib/agents/registry.json`** - Add Builder entry (Debugger already exists)

---

## 6. Data Model / API / Interface Changes

### 6.1 New Exported Types

**From `builder-handler.ts`:**
- `CodeArtifact` - Generated code file
- `BuilderAgentQuery` - Input to Builder
- `BuilderAgentResponse` - Output from Builder

**From `debugger-handler.ts`:**
- `Conflict` - Identified reasoning conflict
- `DebuggerAgentQuery` - Input to Debugger
- `DebuggerAgentResponse` - Output from Debugger

### 6.2 Updated Constants

**`AGENT_IDS` in types.ts:**
- Add `BUILDER: 'builder'`

---

## 7. Delivery Phases

### Phase 1: Builder Agent Implementation (60-90 minutes)

**Tasks:**
1. Create `builder-handler.ts` with all type definitions
2. Implement `readContextFiles()` with security validation
3. Implement `planCodeChanges()` with Harness Trace spans
4. Implement `generateCodeArtifacts()` with progress logging
5. Implement `handleBuilderQuery()` main orchestrator
6. Implement `invokeBuilderAgent()` entrypoint
7. Add `BUILDER` to `AGENT_IDS` in `types.ts`
8. Add Builder case to `handoff.ts`
9. Add Builder entry to `registry.json`

**Verification:**
- TypeScript compiles without errors
- All functions have JSDoc comments
- Error handling in place for all failure modes

### Phase 2: Debugger Agent Implementation (60-90 minutes)

**Tasks:**
1. Create `debugger-handler.ts` with all type definitions
2. Implement `analyzeReasoning()` with `deepseek-reasoner`
3. Implement `extractDojoPacket()` helper
4. Implement `parsePerspectivesFromConversation()` fallback
5. Implement `handleDebuggerQuery()` main handler
6. Implement `invokeDebuggerAgent()` with dual-strategy extraction
7. Add Debugger case to `handoff.ts` (remove placeholder)

**Verification:**
- TypeScript compiles without errors
- DojoPacket extraction logic tested
- Conversation parsing fallback works

### Phase 3: Integration Testing (30-45 minutes)

**Tasks:**
1. Run `npm run build` - verify successful compilation
2. Run `npm test` - verify existing tests still pass
3. Manual test: Builder with sample code request
4. Manual test: Debugger with conflicting perspectives
5. Verify Harness Trace logs are being generated
6. Verify LLM calls are using correct models

**Verification:**
- Zero build errors
- All tests passing
- Trace logs show proper span nesting
- Agents return expected response formats

---

## 8. Verification Approach

### 8.1 Automated Checks

**Build:**
```bash
npm run build
```
Expected: No TypeScript errors

**Tests:**
```bash
npm test
```
Expected: All existing tests pass

**Linting:**
```bash
npm run lint
```
Expected: No linting errors

### 8.2 Manual Testing

**Builder Agent Test:**
```typescript
const query: BuilderAgentQuery = {
  request: 'Create a simple React button component with TypeScript',
};
const response = await handleBuilderQuery(query);
console.log(response.artifacts); // Should contain CodeArtifact for Button.tsx
```

**Debugger Agent Test:**
```typescript
const query: DebuggerAgentQuery = {
  perspectives: [
    { text: 'We need to ship features weekly', source: 'user', timestamp: '2026-01-15T12:00:00Z' },
    { text: 'Quality is more important than speed', source: 'user', timestamp: '2026-01-15T12:01:00Z' },
  ],
  assumptions: [],
};
const response = await handleDebuggerQuery(query);
console.log(response.conflicts); // Should identify the contradiction
```

### 8.3 Trace Validation

**Check Harness Trace logs:**
1. Look for `AGENT_ACTIVITY_START` with `agent_id: 'builder'`
2. Look for `TOOL_INVOCATION` with `model: 'deepseek-chat'`
3. Verify span nesting is correct (endSpan called for each startSpan)
4. Verify error events are logged on failures

---

## 9. Risk Assessment

### 9.1 Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| LLM JSON parsing fails | Medium | High | Retry logic, fallback to string parsing |
| Context file read errors | Medium | Low | Graceful degradation, continue without file |
| DojoPacket extraction fails | High | Medium | Fallback to conversation parsing |
| Code generation quality | Medium | Medium | Use temperature 0.2, provide clear prompts |
| Harness Trace span mismatches | Low | Low | Careful endSpan calls, error handling |

### 9.2 Mitigation Strategies

**For LLM failures:**
- Use `responseFormat: { type: 'json_object' }` for structured output
- Wrap all JSON.parse() in try-catch
- Log all LLM errors to Harness Trace

**For file system errors:**
- Validate paths before reading
- Use try-catch for each file read
- Continue execution even if some files fail

**For integration failures:**
- Test each agent independently first
- Verify handoff routing before full integration
- Use console.log for debugging during development

---

## 10. Success Criteria

### 10.1 Implementation Complete

- ✅ `builder-handler.ts` created with all functions
- ✅ `debugger-handler.ts` created with all functions
- ✅ Both agents added to `handoff.ts` routing
- ✅ `registry.json` updated with Builder entry
- ✅ `types.ts` updated with `BUILDER` constant

### 10.2 Quality Gates

- ✅ `npm run build` succeeds (zero errors)
- ✅ `npm test` passes (all existing tests)
- ✅ All LLM calls wrapped in Harness Trace spans
- ✅ Error handling for all failure modes
- ✅ JSDoc comments for all public functions
- ✅ Security validation (file paths, DojoPacket parsing)

### 10.3 Functional Verification

- ✅ Builder returns CodeArtifact[] (not writes to disk)
- ✅ Debugger identifies conflicts in sample data
- ✅ Both agents log activity progress (0% → 100%)
- ✅ Conversation → Debugger fallback works
- ✅ Builder context file validation works

---

## 11. Appendix

### 11.1 Example LLM Prompts

**Builder Planning Prompt:**
```
You are a code planning assistant. Given a user request, determine which files need to be created or updated.

Return a JSON object with this exact structure:
{
  "summary": "Brief description of what will be generated",
  "files_to_modify": [
    {
      "path": "relative/path/to/file.tsx",
      "action": "CREATE" or "UPDATE",
      "description": "What this file will contain"
    }
  ]
}
```

**Debugger Analysis Prompt:**
```
You are a logical reasoning validator. Analyze the user's perspectives and assumptions to identify:
1. Contradictions between perspectives
2. Logical fallacies or errors
3. Unstated biases in assumptions
4. Conflicting goals or priorities

Return a JSON object with this exact structure:
{
  "summary": "High-level summary of reasoning issues found",
  "conflicts": [
    {
      "description": "Detailed description of the conflict",
      "conflicting_perspectives": ["exact text of perspective 1", "exact text of perspective 2"]
    }
  ]
}
```

### 11.2 References

**Codebase:**
- `/lib/agents/librarian-handler.ts` - Handler pattern reference
- `/lib/agents/types.ts` - Agent type definitions
- `/lib/harness/trace.ts` - Trace API
- `/lib/llm/client.ts` - LLM client API
- `/lib/packet/schema.ts` - DojoPacket structure

**Documentation:**
- Harness Trace pattern (Dataiku)
- DeepSeek API documentation
- Zod schema validation

---

**End of Technical Specification**
