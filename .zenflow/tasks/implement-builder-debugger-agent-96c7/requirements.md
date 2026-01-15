# Product Requirements Document: Builder & Debugger Agents

## Executive Summary

Implement two specialist agents—**Builder** and **Debugger**—to complete the core agent team for the 11-11 Sustainable Intelligence OS. These agents will expand the system's capabilities beyond thinking partnership (Dojo) and information retrieval (Librarian) to include code artifact generation and reasoning validation.

## Background & Context

### Current State

The 11-11 system currently has three agents:
1. **Dojo Agent** - Core thinking partnership (Mirror/Scout/Gardener/Implementation modes)
2. **Librarian Agent** - Semantic search and retrieval across project memory
3. **Debugger Agent** - Listed in registry but NOT implemented (placeholder exists in `handoff.ts:264-267`)

### Project Architecture

**Agent Implementation Pattern:**
- Handler file in `/lib/agents/` with:
  - TypeScript interfaces for Query and Response types
  - Main handler function (e.g., `handleBuilderQuery`)
  - Invocation entry point (e.g., `invokeBuilderAgent`)
- Integration with **Harness Trace** for observability (nested span-based logging)
- Integration with **LLMClient** for API calls to DeepSeek/OpenAI
- Custom error classes extending `AgentError`
- Activity progress tracking via `logEvent` calls
- Entry in `registry.json` with routing criteria

**Key Technologies:**
- TypeScript with Zod schema validation
- OpenAI SDK for LLM calls (DeepSeek primary, OpenAI fallback)
- PGlite database for local storage
- Next.js 14 App Router
- AgentInvocationContext as standard invocation interface

## Product Goals

### Primary Objectives

1. **Complete the specialist agent roster** by implementing Builder and Debugger agents
2. **Enable code artifact generation** through a safe, two-step planning process
3. **Provide reasoning validation** to identify conflicts and logical fallacies
4. **Maintain architectural consistency** with existing agent patterns
5. **Ensure full observability** through Harness Trace integration

### Success Criteria

- [ ] Both agents implemented following established patterns
- [ ] All LLM calls wrapped in Harness Trace spans
- [ ] Both agents have functioning `invoke...` entry points
- [ ] `registry.json` updated with accurate routing criteria
- [ ] Application builds successfully (`npm run build`)
- [ ] Existing tests pass (`npm test`)
- [ ] Builder agent returns CodeArtifacts (does NOT write to disk)

## User Stories

### Builder Agent

**US-1: As a user, I want to generate code files from natural language so that I can quickly scaffold components and functions.**

**Acceptance Criteria:**
- User provides a natural language request
- System generates a plan identifying which files to create/modify
- System generates full code content for each file
- Results are returned as CodeArtifact objects (not written to disk)
- All operations are fully traced and visible

**US-2: As a developer, I want the Builder to use context files so that generated code follows existing patterns.**

**Acceptance Criteria:**
- Builder accepts optional `context_file_paths` array
- Context files are read and provided to LLM for planning and generation
- Generated code follows conventions from context files

### Debugger Agent

**US-3: As a user, I want to identify conflicts in my thinking so that I can resolve contradictions early.**

**Acceptance Criteria:**
- User's perspectives and assumptions are analyzed
- Conflicts and contradictions are identified and described
- Conflicting perspectives are clearly referenced
- Summary explains reasoning issues found

**US-4: As a user working in Dojo mode, I want seamless handoff to Debugger when conflicts arise.**

**Acceptance Criteria:**
- Debugger receives DojoPacket with perspectives and assumptions
- Analysis is context-aware of the Dojo session
- Results can be used to update the DojoPacket

## Functional Requirements

### Builder Agent (`builder-handler.ts`)

#### Data Models

```typescript
interface CodeArtifact {
  path: string;           // e.g., 'components/ui/NewButton.tsx'
  content: string;        // Full code content
  action: 'CREATE' | 'UPDATE';
}

interface BuilderAgentQuery {
  request: string;                  // Natural language request
  context_file_paths?: string[];    // Paths to reference files
}

interface BuilderAgentResponse {
  artifacts: CodeArtifact[];
  summary: string;        // Summary of changes
}
```

#### Core Functions

**1. `handleBuilderQuery(query: BuilderAgentQuery): Promise<BuilderAgentResponse>`**
- Orchestrates the Plan → Generate flow
- Reads context files if provided
- Calls planning LLM to determine what files to create/modify
- Calls generation LLM for each file to produce code
- Returns artifacts and summary

**2. `planCodeChanges(request: string, contextFiles: Array<{path: string, content: string}>): Promise<Plan>`**
- Makes LLM call to analyze request and determine files needed
- Returns JSON with `summary` and `files_to_modify` array
- Wrapped in Harness Trace span with event logging

**3. `generateCodeArtifacts(request: string, contextFiles: ..., plan: Plan): Promise<CodeArtifact[]>`**
- Iterates through planned files
- Makes LLM call for each file to generate full code content
- Returns array of CodeArtifact objects
- Each generation wrapped in Harness Trace span

**4. `invokeBuilderAgent(context: AgentInvocationContext): Promise<BuilderAgentResponse>`**
- Standard entry point called by handoff system
- Extracts request from `context.user_intent`
- Calls `handleBuilderQuery`
- Returns response

#### Error Handling

```typescript
class BuilderAgentError extends AgentError {
  constructor(message: string, code?: string, details?: unknown)
}
```

Error codes:
- `EMPTY_REQUEST`: Request is empty or invalid
- `CONTEXT_FILE_NOT_FOUND`: Context file path doesn't exist
- `PLANNING_FAILED`: LLM planning call failed
- `GENERATION_FAILED`: LLM code generation failed

### Debugger Agent (`debugger-handler.ts`)

#### Data Models

```typescript
interface Conflict {
  description: string;
  conflicting_perspectives: string[];  // Perspective texts in conflict
}

interface DebuggerAgentQuery {
  perspectives: Perspective[];    // From DojoPacket schema
  assumptions: Assumption[];      // From DojoPacket schema
}

interface DebuggerAgentResponse {
  conflicts: Conflict[];
  summary: string;               // High-level summary
}
```

#### Core Functions

**1. `handleDebuggerQuery(query: DebuggerAgentQuery): Promise<DebuggerAgentResponse>`**
- Main entry point for Debugger operations
- Calls LLM to analyze perspectives and assumptions
- Returns identified conflicts and summary

**2. `analyzeReasoning(perspectives: Perspective[], assumptions: Assumption[]): Promise<Analysis>`**
- Makes LLM call to identify contradictions and logical errors
- Analyzes assumptions for unstated biases
- Returns JSON with `summary` and `conflicts` array
- Wrapped in Harness Trace span

**3. `invokeDebuggerAgent(context: AgentInvocationContext): Promise<DebuggerAgentResponse>`**
- Standard entry point called by handoff system
- Extracts perspectives/assumptions from context (likely from DojoPacket)
- Calls `handleDebuggerQuery`
- Returns response

#### Error Handling

```typescript
class DebuggerAgentError extends AgentError {
  constructor(message: string, code?: string, details?: unknown)
}
```

Error codes:
- `EMPTY_INPUT`: No perspectives or assumptions provided
- `ANALYSIS_FAILED`: LLM reasoning analysis failed

### Registry Updates (`registry.json`)

**Builder Agent Entry:**
```json
{
  "id": "builder",
  "name": "Builder Agent",
  "icon": "🛠️",
  "tagline": "Code generation and execution",
  "description": "Generates and modifies code based on user requests. Use for creating new components, writing functions, or modifying existing files.",
  "when_to_use": [
    "User wants to create a new file, component, or function",
    "User asks to 'build', 'create', 'generate code for', 'write a function for', or 'implement' a feature",
    "User needs to scaffold a new component or module"
  ],
  "when_not_to_use": [
    "User wants to explore ideas (Handoff to Dojo)",
    "User is searching for documentation (Handoff to Librarian)",
    "User has a bug or conflict in their reasoning (Handoff to Debugger)"
  ],
  "default": false
}
```

**Debugger Agent Entry (Already Exists - Verify Accuracy):**
```json
{
  "id": "debugger",
  "name": "Debugger Agent",
  "icon": "🔍",
  "tagline": "Conflict resolution and reasoning validation",
  "description": "Conflict resolution and reasoning validation. Use when the user has conflicting perspectives, logical errors, or needs assumption analysis.",
  "when_to_use": [
    "User has conflicting perspectives or contradictions",
    "User's reasoning has logical errors",
    "User needs assumption analysis or validation",
    "User asks 'what's wrong with my thinking?'",
    "User explicitly mentions conflicts, contradictions, or errors"
  ],
  "when_not_to_use": [
    "User wants general thinking partnership (Handoff to Dojo)",
    "User wants to search for information (Handoff to Librarian)",
    "User wants to generate artifacts or new ideas (Handoff to Builder)",
    "User wants to explore perspectives without conflicts"
  ],
  "default": false
}
```

### Integration Points

**1. Handoff System (`handoff.ts`)**
- Update `invokeAgent` function to route Builder and Debugger
- Remove placeholder comment for Debugger
- Add import statements for both handlers

**2. Agent Types (`types.ts`)**
- Add `BUILDER` to `AGENT_IDS` constant
- Verify `DEBUGGER` already exists

**3. Harness Trace Integration**
- Use `startSpan`, `endSpan`, `logEvent` for all major operations
- Log activity progress with `AGENT_ACTIVITY_START`, `AGENT_ACTIVITY_PROGRESS`, `AGENT_ACTIVITY_COMPLETE`
- Include metadata for debugging and analytics

**4. LLM Client Integration**
- Use `LLMClient.call()` for all LLM operations
- Pass appropriate model configuration
- Handle errors and retries

## Non-Functional Requirements

### Performance
- LLM calls should complete within 30 seconds (default timeout)
- Planning phase should be faster than generation phase
- Multiple file generations should be sequential (to maintain context)

### Reliability
- All LLM calls must have error handling
- Failed operations should provide clear error messages
- System should gracefully handle missing context files

### Observability
- Every LLM call wrapped in Harness Trace span
- Activity progress logged at 0%, 20%, 50%, 80%, 100%
- All errors logged with context

### Security
- Builder does NOT write files to disk
- Context file reads should validate paths
- No execution of generated code

### Code Quality
- Follow TypeScript strict mode
- Use Zod for runtime validation
- Match existing code style and patterns
- Include JSDoc comments for public functions

## Assumptions & Open Questions

### Assumptions

1. Builder agent is intended for code generation (not prompt generation)
2. Context files will be provided as absolute paths
3. Debugger will primarily work with DojoPacket data
4. Both agents will use DeepSeek as primary LLM (with OpenAI fallback)

### Open Questions for Clarification

**Q1: Builder Agent Scope**
- Is the Builder agent intended to generate application code (React components, TypeScript files)?
- Or should it generate prompt-related artifacts (seed patches, DojoPackets)?
- The task description mentions "components/ui/NewButton.tsx" which suggests general code generation.

**Q2: Context File Safety**
- Should we validate that context_file_paths are within the project directory?
- What should happen if a context file doesn't exist or can't be read?

**Q3: Debugger Input Source**
- How should the Debugger extract perspectives/assumptions from AgentInvocationContext?
- Should it assume a DojoPacket exists in the conversation history?
- Or should it parse perspectives from raw user messages?

**Q4: Multi-Step Planning**
- Should the Builder support iterative refinement (user reviews plan before generation)?
- Or is it always a single-pass operation?

**Q5: Model Selection**
- Should Builder use `deepseek-chat` or `deepseek-reasoner`?
- Should Debugger use `deepseek-reasoner` for complex logic analysis?

## Out of Scope

- Writing generated code to disk (Builder returns artifacts only)
- Real-time code execution or testing
- Integration with external IDEs or editors
- Automated conflict resolution (Debugger identifies, doesn't fix)
- Multi-user collaboration features
- Version control integration

## Success Metrics

### Implementation Metrics
- Both agent handlers created with all required functions
- 100% Harness Trace coverage for LLM calls
- Zero TypeScript compilation errors
- All existing tests passing

### Quality Metrics
- Error handling for all failure modes
- Comprehensive JSDoc documentation
- Consistent with existing agent patterns
- Registry entries accurately describe when to use each agent

## Dependencies

### Technical Dependencies
- Existing LLMClient implementation
- Harness Trace system
- DojoPacket schema (for Debugger)
- AgentInvocationContext interface
- Registry system

### External Dependencies
- DeepSeek API (primary provider)
- OpenAI API (fallback provider)

## Timeline & Phases

### Phase 1: Scaffolding (Immediate)
- Create handler files with type definitions
- Add registry entries
- Update handoff routing

### Phase 2: Implementation (Immediate)
- Implement Builder planning and generation
- Implement Debugger analysis
- Add Harness Trace integration

### Phase 3: Testing (Immediate)
- Manual testing of both agents
- Verify `npm run build` succeeds
- Verify existing tests still pass

### Phase 4: Polish (Future)
- Add unit tests for both agents
- Performance optimization
- Enhanced error messages

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| LLM generates invalid code | High | Validate response structure; use Zod schemas |
| Context files are large | Medium | Add size limits; truncate if needed |
| Debugger misidentifies conflicts | Medium | Use structured prompts; request examples in output |
| Planning and generation are slow | Medium | Use streaming for progress updates; set reasonable timeouts |
| Builder generates unsafe code | Low | Don't execute code; clearly document that artifacts are for review |

## Conclusion

This PRD defines the implementation of Builder and Debugger agents following established architectural patterns in the 11-11 codebase. Both agents will integrate seamlessly with existing systems (Harness Trace, LLM Client, handoff routing) and provide essential new capabilities: code artifact generation and reasoning validation.

The implementation prioritizes safety (no disk writes), observability (full tracing), and consistency (matching existing patterns) while leaving room for future enhancements.
