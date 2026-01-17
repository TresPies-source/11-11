# Technical Specification: Agent Prompt Redesign (Unified)

## Difficulty Assessment

**Complexity Level: Medium**

**Rationale:**
- Technical refactoring is straightforward (method swap), but has cascading effects
- Prompt redesign is significant - shifts from structured JSON to conversational text
- Response handling logic needs substantial updates to parse conversational responses
- Integration points with packet system need careful preservation
- Manual testing of 4 distinct modes required for validation

## Technical Context

**Language:** TypeScript  
**Framework:** Next.js 14  
**Key Dependencies:**
- `openai` (^4.77.0) - LLM API client
- `zod` (^3.23.8) - Schema validation (currently used, may need adjustment)

**File Architecture:**
- `lib/llm/client.ts` - LLM client with `call()` and `createJSONCompletion()` methods
- `lib/agents/dojo-handler.ts` - Main file containing all 4 mode handlers (1159 lines)
- `app/dojo/page.tsx` - Landing page for new dojo sessions
- `app/dojo/[sessionId]/page.tsx` - Session-specific dojo page

## Current State Analysis

### LLM Client Methods

**`createJSONCompletion<T>()`** (currently used):
- Returns: `{ data: T, usage: TokenUsage }`
- Forces JSON response format via `responseFormat: { type: 'json_object' }`
- Parses JSON and validates against provided type
- Used at 4 locations in dojo-handler.ts (lines 425, 634, 822, 1023)

**`call()`** (target method):
- Returns: `{ content: string, usage: TokenUsage, finishReason?: string, toolCalls?: any }`
- Direct string response, no automatic JSON parsing
- More flexible for conversational output

### Current Mode Handlers

**1. Mirror Mode** (`handleMirrorMode`, lines 360-556):
- Current prompt: Academic, JSON-focused
- Expected JSON schema: `MirrorModeResponseSchema` (lines 49-55)
  ```typescript
  { summary, pattern, assumptions[], tensions[], reframes[] }
  ```
- Current output: Markdown formatted with bullet lists

**2. Scout Mode** (`handleScoutMode`, lines 564-749):
- Current prompt: Academic, JSON-focused
- Expected JSON schema: `ScoutModeResponseSchema` (lines 62-70)
  ```typescript
  { summary, routes[{name, description, tradeoffs}], smallest_test }
  ```
- Current output: Markdown formatted routes with tradeoffs

**3. Gardener Mode** (`handleGardenerMode`, lines 757-942):
- Current prompt: Academic, JSON-focused
- Expected JSON schema: `GardenerModeResponseSchema` (lines 77-82)
  ```typescript
  { summary, strong_ideas[], ideas_to_grow[], ideas_to_compost[]? }
  ```
- Current output: Markdown formatted idea categories

**4. Implementation Mode** (`handleImplementationMode`, lines 950-1136):
- Current prompt: Academic, JSON-focused
- Expected JSON schema: `ImplementationModeResponseSchema` (lines 89-93)
  ```typescript
  { summary, plan[1-5 steps], first_step }
  ```
- Current output: Numbered markdown plan

### Packet Integration Points

All modes currently:
1. Read from `DojoPacket` (perspectives, assumptions, decisions, situation, stake)
2. Update `DojoPacket` with new perspectives/assumptions
3. Return `DojoAgentResponse` with `next_move`, `updated_packet`, and `summary`

**Critical Constraint:** The conversational response must still allow extraction of:
- Summary text for display
- Key insights to add to packet (perspectives, assumptions)
- Next move information

## Implementation Approach

### Phase 1: Technical Refactoring

**Objective:** Replace `createJSONCompletion` with `call` for all 4 modes

**Changes per mode handler:**

1. **Replace LLM call:**
   ```typescript
   // OLD:
   const { data, usage } = await llmClient.createJSONCompletion<MirrorModeResponse>(
     model,
     [{ role: 'user', content: prompt }],
     options
   );
   const validated = MirrorModeResponseSchema.parse(data);
   
   // NEW:
   const { content, usage } = await llmClient.call(
     model,
     [{ role: 'user', content: prompt }],
     options
   );
   // content is now a plain string with conversational response
   ```

2. **Update response processing:**
   - Remove Zod schema validation (no longer parsing JSON)
   - Parse conversational text to extract key information
   - The response should be used directly as the `summary` field
   - **Simplified approach:** Since the new prompts are conversational and don't require structured data extraction, we can use the LLM response directly as the summary and update packet minimally

3. **Preserve packet updates:**
   - Mirror: Still add a perspective with the reflection (simplified)
   - Scout: Still add perspectives for routes (simplified or omitted)
   - Gardener: Still add focus guidance perspective (simplified)
   - Implementation: Still add plan perspective (simplified)

**Impact on Zod Schemas:**
- Schema definitions (lines 49-93) can remain for reference but won't be used
- Alternatively, remove them to clean up code (recommended after testing)

### Phase 2: System Prompt Updates

**Location:** Within each mode handler function, replace the `prompt` variable construction

**New prompts use:**
- Conversational, accessible tone
- Emoji for personality (🪞 ✨ 🌱 🗺️ 🧭 ⚡ ✂️ 🌿 🛠️ 🚀 ✅)
- Simple flowing text instead of complex markdown
- 2-4 short paragraphs instead of bullet lists
- Direct, warm language
- Open-ended questions to invite reflection

**Mirror Mode Prompt:**
```
You are Mirror, a calm spirit in a forest. Your purpose is to help the user see their own thoughts more clearly. You do this by reflecting back the patterns and tensions you notice in their words, using simple, flowing language.

Situation: ${packet.situation}
Stake: ${packet.stake || 'Not specified'}
Perspectives:
${perspectivesText || 'None yet'}

- Start with a warm acknowledgment (e.g., "I hear you...", "Thank you for sharing...").
- Write in 3-4 short, simple paragraphs.
- Gently point out the core pattern or tension you see.
- Ask 1-2 open-ended questions to invite deeper reflection.
- Use emoji (🪞 ✨ 🌱) to add warmth and a touch of magic.
- Do NOT use lists, bolding, or complex markdown. Just simple, flowing text.
- Your tone is curious, gentle, and slightly magical.
```

**Scout Mode Prompt:**
```
You are Scout, an adventurous guide. Your purpose is to help the user map out their options and understand the tradeoffs of each path. You are optimistic, clear, and encouraging.

Situation: ${packet.situation}
Stake: ${packet.stake || 'Not specified'}
Perspectives:
${perspectivesText || 'None yet'}

- Start with an enthusiastic opening (e.g., "Let's map out your options!", "An exciting journey ahead!").
- Present 2-4 clear, distinct paths the user could take.
- For each path, briefly describe the potential reward and the potential risk (the tradeoff).
- Use emoji (🗺️ 🧭 ⚡) to add a sense of adventure.
- End with an encouraging question that prompts a decision.
- Your tone is energetic, clear, and inspiring.
```

**Gardener Mode Prompt:**
```
You are Gardener, a wise and nurturing presence. Your purpose is to help the user tend to their garden of ideas—pruning what's no longer needed and giving space for the strongest ideas to grow.

Situation: ${packet.situation}
Stake: ${packet.stake || 'Not specified'}
Ideas/Perspectives:
${perspectivesText || 'None yet'}

- Start with a gentle, nurturing opening (e.g., "Let's tend to your garden of ideas...").
- Identify the 2-3 strongest, most promising ideas from the user's input.
- Gently suggest 1-2 ideas that might be less essential or could be set aside for now.
- Use gardening metaphors naturally (e.g., "This idea has strong roots," "Let's prune this one back a bit").
- Use emoji (🌱 ✂️ 🌿) to reinforce the gardening theme.
- Your tone is calm, wise, and supportive.
```

**Implementation Mode Prompt:**
```
You are Builder, a pragmatic and focused craftsperson. Your purpose is to turn the user's converged idea into a concrete, actionable plan. You are direct, clear, and motivating.

Situation: ${packet.situation}
Stake: ${packet.stake || 'Not specified'}
Perspectives considered:
${perspectivesText || 'None yet'}
Decisions made:
${decisionsText || 'None yet'}

- Start with a direct, action-oriented opening (e.g., "Alright, let's turn this into action!", "Time to build.").
- Provide a numbered list of 1-5 clear, actionable steps.
- Each step should be a concrete action the user can take RIGHT NOW.
- Keep the language simple and direct.
- End with a motivating statement to get them started.
- Use emoji (🛠️ 🚀 ✅) to create a sense of progress and accomplishment.
- Your tone is pragmatic, focused, and encouraging.
```

### Phase 3: Response Handling Updates

**Current:** Each handler builds a structured markdown summary from validated JSON fields

**New:** Use the conversational LLM response directly as the summary

**Simplified Packet Updates:**

1. **Mirror Mode:**
   - Add a single perspective with the full conversational response
   - Extract first assumption-like statement for `next_move.action` (or use default)
   - Set `next_move.smallest_test` to null or generic test

2. **Scout Mode:**
   - Add a single perspective with the full conversational response
   - Extract a route or action for `next_move.action` (or use default)
   - Set `next_move.smallest_test` to generic small test

3. **Gardener Mode:**
   - Add a single perspective with the focus guidance
   - Extract strongest idea for `next_move.action` (or use default)
   - Set `next_move.smallest_test` appropriately

4. **Implementation Mode:**
   - Add a single perspective with the action plan
   - Extract first step for `next_move.action` (or use default)
   - Set `next_move.smallest_test` to first step

**Fallback Strategy:**
Since we're moving from structured to conversational responses, we should provide sensible defaults for packet updates:
- Default `next_move.action`: "Continue reflecting on your situation"
- Default `summary`: Use the full conversational response
- Minimal packet updates: Just add the conversational response as a perspective

## Source Code Structure Changes

### Files to Modify

**1. `lib/agents/dojo-handler.ts`** (primary changes)

**Lines to modify:**

| Function | Lines | Changes |
|----------|-------|---------|
| `handleMirrorMode` | 425-432 | Replace `createJSONCompletion` with `call` |
| | 452 | Remove Zod validation |
| | 454-470 | Simplify packet update logic |
| | 497-509 | Replace structured summary with direct content |
| `handleScoutMode` | 634-641 | Replace `createJSONCompletion` with `call` |
| | 661 | Remove Zod validation |
| | 663-672 | Simplify packet update logic |
| | 698-706 | Replace structured summary with direct content |
| `handleGardenerMode` | 822-829 | Replace `createJSONCompletion` with `call` |
| | 849 | Remove Zod validation |
| | 851-860 | Simplify packet update logic |
| | 887-895 | Replace structured summary with direct content |
| `handleImplementationMode` | 1023-1030 | Replace `createJSONCompletion` with `call` |
| | 1050 | Remove Zod validation |
| | 1052-1061 | Simplify packet update logic |
| | 1087-1093 | Replace structured summary with direct content |

**System Prompts:**
- Mirror: Lines 387-407
- Scout: Lines 591-616  
- Gardener: Lines 784-804
- Implementation: Lines 981-1005

### Files NOT to Modify

- `lib/llm/client.ts` - No changes needed, method already exists
- `lib/packet/schema.ts` - Packet schema remains unchanged
- UI components - They consume the `summary` field, which will still be provided
- Zod schemas (lines 49-93) - Can remain for now, just unused

## Data Model / Interface Changes

**No changes to:**
- `DojoPacket` interface
- `DojoAgentResponse` interface
- `NextMove` interface

**Changed behavior:**
- `summary` field in `DojoAgentResponse` will contain conversational text instead of markdown bullets
- Packet perspectives will be simpler (just the full response vs. extracted fields)

## Verification Approach

### 1. Build Verification
```bash
pnpm run type-check
pnpm run lint
pnpm run build
```

### 2. Manual Testing

**Setup:**
```bash
pnpm dev
# Navigate to http://localhost:3000/dojo/new
```

**Test Cases:**

**Test 1: Mirror Mode**
- Input: "I want to build a SaaS product but I'm worried about the competition and I don't have much time."
- Expected: Warm, reflective response with 3-4 paragraphs, emoji, open-ended questions
- Verify: No JSON artifacts, conversational tone, appropriate emoji usage

**Test 2: Scout Mode**  
- Input: "I need to decide between learning React or Vue for my next project."
- Expected: Enthusiastic opening, 2-4 clear paths, tradeoffs for each, emoji
- Verify: Clear options presented, honest tradeoffs, decision-prompting question

**Test 3: Gardener Mode**
- Input: "I have 5 ideas: (1) mobile app, (2) blog, (3) YouTube channel, (4) podcast, (5) newsletter."
- Expected: Nurturing opening, identifies 2-3 strong ideas, suggests what to prune, gardening metaphors, emoji
- Verify: Clear prioritization, supportive tone, gardening language

**Test 4: Implementation Mode**
- Input: "I want to launch a simple blog. Give me a plan."
- Expected: Action-oriented opening, 1-5 numbered steps, concrete actions, motivating ending, emoji
- Verify: Clear steps, actionable items, pragmatic tone

### 3. Regression Testing

**Verify packet updates still work:**
- Check that perspectives are added to the packet
- Check that session mode is updated correctly
- Check that `next_move` is populated with reasonable defaults
- Check error handling still functions (test with invalid/empty inputs)

**UI Integration:**
- Verify the conversational responses display correctly in the UI
- Check that emoji render properly
- Ensure no layout breaking with longer conversational text

## Risk Assessment

**Low Risk:**
- Method signature change (well-defined interface)
- Prompt text updates (self-contained)

**Medium Risk:**
- Response parsing changes (need to ensure packet updates work)
- Backward compatibility with existing sessions (may have mixed formats)

**Mitigation:**
- Keep error handling robust (existing try-catch blocks remain)
- Provide sensible defaults for packet updates
- Test thoroughly before deployment

## Success Criteria

- ✅ All 4 mode handlers use `llmClient.call()` instead of `createJSONCompletion()`
- ✅ All 4 system prompts updated to conversational format
- ✅ TypeScript compilation succeeds with no errors
- ✅ Lint passes with no errors
- ✅ Build completes successfully
- ✅ Manual testing of all 4 modes shows conversational, engaging responses
- ✅ No JSON artifacts in responses
- ✅ Emoji render correctly
- ✅ Packet updates continue to work (perspectives added)
- ✅ Error handling remains functional

## Estimated Effort

- Phase 1 (Technical Refactoring): 1-2 hours
- Phase 2 (Prompt Updates): 30 minutes
- Phase 3 (Response Handling): 1-2 hours
- Verification: 1 hour
- **Total: 4-6 hours**
