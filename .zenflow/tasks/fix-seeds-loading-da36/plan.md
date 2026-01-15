# Quick change

## Configuration
- **Artifacts Path**: {@artifacts_path} → `.zenflow/tasks/{task_id}`

---

## Agent Instructions

This is a quick change workflow for small or straightforward tasks where all requirements are clear from the task description.

### Your Approach

1. Proceed directly with implementation
2. Make reasonable assumptions when details are unclear
3. Do not ask clarifying questions unless absolutely blocked
4. Focus on getting the task done efficiently

This workflow also works for experiments when the feature is bigger but you don't care about implementation details.

If blocked or uncertain on a critical decision, ask the user for direction.

---

## Workflow Steps

### [x] Step: Implementation
<!-- chat-id: ed1222c2-d773-4db1-8d20-923eddf617b4 -->

Implement the task directly based on the task description.

1. Make reasonable assumptions for any unclear details
2. Implement the required changes in the codebase
3. Add and run relevant tests and linters if applicable
4. Perform basic manual verification if applicable

Save a brief summary of what was done to `{@artifacts_path}/report.md` if significant changes were made.

### [x] Step: revert changes and fix main issue
<!-- chat-id: 09181b15-68c9-454f-aed3-982a53ebba3f -->
<!-- agent: ZEN_CLI -->

clicking on the filter buttons "makes the whole screen flash" in a distracting way, so does entering text in the search bar. find and remove the animation that does this.

### [x] Step: related problem
<!-- chat-id: 9e4aa1bb-7465-415a-8d89-3f0198feb166 -->
<!-- agent: ZEN_CLI -->

clicking through the filter buttons causes the filter panel to resize and the seedsview to reload, however, these happen in an abrupt way. any way to make it look nicer?
