# Spec and build

## Configuration
- **Artifacts Path**: {@artifacts_path} → `.zenflow/tasks/{task_id}`

---

## Agent Instructions

Ask the user questions when anything is unclear or needs their input. This includes:
- Ambiguous or incomplete requirements
- Technical decisions that affect architecture or user experience
- Trade-offs that require business context

Do not make assumptions on important decisions — get clarification first.

---

## Workflow Steps

### [x] Step: Technical Specification
<!-- chat-id: b9966423-34d9-491a-8edc-4c96081db798 -->

Assess the task's difficulty, as underestimating it leads to poor outcomes.
- easy: Straightforward implementation, trivial bug fix or feature
- medium: Moderate complexity, some edge cases or caveats to consider
- hard: Complex logic, many caveats, architectural considerations, or high-risk changes

Create a technical specification for the task that is appropriate for the complexity level:
- Review the existing codebase architecture and identify reusable components.
- Define the implementation approach based on established patterns in the project.
- Identify all source code files that will be created or modified.
- Define any necessary data model, API, or interface changes.
- Describe verification steps using the project's test and lint commands.

Save the output to `{@artifacts_path}/spec.md` with:
- Technical context (language, dependencies)
- Implementation approach
- Source code structure changes
- Data model / API / interface changes
- Verification approach

If the task is complex enough, create a detailed implementation plan based on `{@artifacts_path}/spec.md`:
- Break down the work into concrete tasks (incrementable, testable milestones)
- Each task should reference relevant contracts and include verification steps
- Replace the Implementation step below with the planned tasks

Rule of thumb for step size: each step should represent a coherent unit of work (e.g., implement a component, add an API endpoint, write tests for a module). Avoid steps that are too granular (single function).

Save to `{@artifacts_path}/plan.md`. If the feature is trivial and doesn't warrant this breakdown, keep the Implementation step below as is.

**Completed:** Created comprehensive technical specification in `spec.md`. Task assessed as **Medium** complexity. Breaking down into detailed implementation steps below.

---

### [x] Step: Refactor Mirror Mode Handler
<!-- chat-id: 79c5df34-96fc-480a-96aa-47242dd97152 -->

Update `handleMirrorMode` function in `lib/agents/dojo-handler.ts`:
1. Replace system prompt (lines 387-407) with new conversational Mirror prompt
2. Replace `createJSONCompletion` call with `llmClient.call()` (line 425)
3. Update response handling to use `content` directly instead of parsing JSON
4. Simplify packet update logic to add conversational response as perspective
5. Use conversational content directly as summary

**Verification:**
- TypeScript compiles without errors
- Function returns valid `DojoAgentResponse`

---

### [x] Step: Refactor Scout Mode Handler
<!-- chat-id: 3a7dddc6-f807-49df-b20d-b3525f967212 -->

Update `handleScoutMode` function in `lib/agents/dojo-handler.ts`:
1. Replace system prompt (lines 591-616) with new conversational Scout prompt
2. Replace `createJSONCompletion` call with `llmClient.call()` (line 634)
3. Update response handling to use `content` directly instead of parsing JSON
4. Simplify packet update logic to add conversational response as perspective
5. Use conversational content directly as summary

**Verification:**
- TypeScript compiles without errors
- Function returns valid `DojoAgentResponse`

---

### [x] Step: Refactor Gardener Mode Handler
<!-- chat-id: cb7385d7-60c2-4748-ab3d-65c7a08612b8 -->

Update `handleGardenerMode` function in `lib/agents/dojo-handler.ts`:
1. Replace system prompt (lines 784-804) with new conversational Gardener prompt
2. Replace `createJSONCompletion` call with `llmClient.call()` (line 822)
3. Update response handling to use `content` directly instead of parsing JSON
4. Simplify packet update logic to add conversational response as perspective
5. Use conversational content directly as summary

**Verification:**
- TypeScript compiles without errors
- Function returns valid `DojoAgentResponse`

---

### [x] Step: Refactor Implementation Mode Handler
<!-- chat-id: 092f5f20-0d9d-4c3b-8b99-46e6594c1729 -->

Update `handleImplementationMode` function in `lib/agents/dojo-handler.ts`:
1. Replace system prompt (lines 981-1005) with new conversational Builder prompt
2. Replace `createJSONCompletion` call with `llmClient.call()` (line 1023)
3. Update response handling to use `content` directly instead of parsing JSON
4. Simplify packet update logic to add conversational response as perspective
5. Use conversational content directly as summary

**Verification:**
- TypeScript compiles without errors
- Function returns valid `DojoAgentResponse`

---

### [x] Step: Build and Type Check
<!-- chat-id: c41ee173-9feb-4949-b419-6d0e6aedc0e2 -->

Run build verification to ensure all changes compile correctly:
1. Run `pnpm run type-check` to verify TypeScript compilation
2. Run `pnpm run lint` to check for linting issues
3. Run `pnpm run build` to verify production build succeeds
4. Fix any errors that arise

**Success Criteria:**
- All commands complete without errors
- No TypeScript compilation errors
- No linting errors
- Production build succeeds

---

### [x] Step: Manual Testing of All Four Modes
<!-- chat-id: 426ec63b-19f6-49b3-813e-410412f72aba -->

Test the conversational prompts with real user scenarios:

1. Start dev server: `pnpm dev`
2. Navigate to `http://localhost:3000/dojo/new`

**Test Cases:**

**Mirror Mode:**
- Input: "I want to build a SaaS product but I'm worried about the competition and I don't have much time."
- Verify: Warm, reflective response (3-4 paragraphs, emoji 🪞✨🌱, open questions)
- Check: No JSON artifacts, conversational tone

**Scout Mode:**
- Input: "I need to decide between learning React or Vue for my next project."
- Verify: Enthusiastic opening, 2-4 paths, clear tradeoffs, emoji 🗺️🧭⚡
- Check: Decision-prompting question at end

**Gardener Mode:**
- Input: "I have 5 ideas: mobile app, blog, YouTube channel, podcast, newsletter."
- Verify: Nurturing tone, 2-3 strong ideas highlighted, pruning suggestions, emoji 🌱✂️🌿
- Check: Gardening metaphors present

**Implementation Mode:**
- Input: "I want to launch a simple blog. Give me a plan."
- Verify: Action-oriented opening, 1-5 numbered steps, concrete actions, emoji 🛠️🚀✅
- Check: Motivating ending statement

**Success Criteria:**
- All 4 modes respond with conversational tone
- Appropriate emoji usage in each mode
- No markdown complexity (simple, flowing text)
- Responses are engaging and personality-driven
- No runtime errors or UI issues

---

### [x] Step: Final Report
<!-- chat-id: 6d25558f-49f4-4ac3-8d3f-1802c5c11895 -->

Write completion report to `{@artifacts_path}/report.md`:
- Summary of changes implemented
- Testing results for all 4 modes
- Any issues encountered and how they were resolved
- Screenshots or example responses (optional)
- Recommendations for future improvements

**Completed:** Comprehensive completion report created at `report.md` with detailed summary of all changes, testing results, issues encountered, and future recommendations.
