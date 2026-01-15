import { NextRequest, NextResponse } from "next/server";
import { getAuthSession, createDriveClient, isDevMode } from "@/lib/google/auth";
import { AuthError, NotFoundError } from "@/lib/google/types";

const MOCK_CONTENT: Record<string, string> = {
  journal: `# Journal

## 2026-01-13

### Multi-File Tabs Implementation
- Implemented tab bar with horizontal scrolling
- Added keyboard shortcuts for tab navigation
- Integrated localStorage persistence for tab state
- Maximum 10 tabs enforced

### Technical Decisions
- Using single Monaco instance with key-based remounting
- Tab state managed in RepositoryProvider context
- Responsive design: dropdown on mobile, tabs on desktop

## 2026-01-12

### Phase 1 Kickoff
- Started multi-file tabs feature development
- Created technical specification and implementation plan
- Set up component structure for TabBar, Tab, and TabDropdown
`,
  audit_log: `# Audit Log

## System Events

### 2026-01-13 01:00:00 UTC
- **Event**: Multi-file tabs feature deployed
- **Status**: Success
- **User**: dev@11-11.dev
- **Changes**: 
  - Added TabBar component
  - Updated RepositoryProvider for multi-tab state
  - Integrated keyboard shortcuts

### 2026-01-12 18:00:00 UTC
- **Event**: Manual testing completed
- **Status**: Success
- **Tests**: 15/15 passed
- **Blockers**: None
`,
  task_plan: `# Task Plan - Multi-File Tabs

## Phase 1: Foundation & Growth Sprint v0.2.1

### Completed Tasks
- [x] Technical specification
- [x] Component architecture design
- [x] TabBar implementation
- [x] Tab state management
- [x] Keyboard shortcuts
- [x] localStorage persistence

### In Progress
- [ ] Regression testing
- [ ] Manual testing
- [ ] Documentation updates

### Upcoming
- [ ] Performance optimization
- [ ] Accessibility audit
- [ ] Cross-browser testing
`,
  vision: `# 11-11 Vision

## Mission
Build a sustainable intelligence operating system that empowers developers with AI-augmented workflows.

## Core Values
1. **Sustainability** - Long-term thinking over quick wins
2. **Intelligence** - AI as a collaborative partner
3. **Openness** - Transparent, community-driven development

## Features
- Multi-agent collaborative workbench
- Real-time context synchronization
- Google Drive integration
- Markdown-first editing experience

## Roadmap
- Phase 1: Multi-file tabs ✅
- Phase 2: Real-time collaboration
- Phase 3: Advanced agent coordination
`,
  sprint1_prd: `# Sprint 1: Initialization & Foundation

## Product Requirements Document

### Overview
Establish the foundation for the 11-11 Sustainable Intelligence OS with core editing capabilities.

### Features
1. **File Tree Navigation**
   - Display hierarchical file structure
   - Support Google Drive, GitHub, and local sources
   - Visual indicators for modified files

2. **Markdown Editor**
   - Monaco-based editing
   - Syntax highlighting
   - Auto-save functionality

3. **Multi-File Tabs** (Phase 1)
   - Open multiple files simultaneously
   - Tab-based navigation
   - Keyboard shortcuts
   - State persistence

### Success Criteria
- Users can edit multiple files without losing context
- Auto-save prevents data loss
- Performance: < 100ms tab switching
`,
  ui_shell_spec: `# UI Shell Specification

## Architecture

### Component Hierarchy
\`\`\`
App
├── Header (banner, navigation, user menu)
├── Sidebar (file tree, view switcher)
└── Main Content
    ├── EditorView (tabs + Monaco)
    └── MultiAgentView (session management)
\`\`\`

### Layout
- Fixed header (64px height)
- Collapsible sidebar (280px width)
- Fluid main content area
- Responsive breakpoints: 768px, 1024px, 1440px

### Color Palette
- Primary: #4F46E5 (indigo)
- Secondary: #10B981 (green)
- Background: #FFFFFF (white)
- Text: #1F2937 (gray-900)
- Border: #E5E7EB (gray-200)

### Animations
- Tab transitions: 150ms cubic-bezier
- Sidebar collapse: 300ms ease-in-out
- Toast notifications: 200ms fade-in
`,
  auth_spec: `# Authentication Specification

## OAuth 2.0 Flow

### Google Sign-In
1. User clicks "Sign in with Google"
2. Redirect to Google OAuth consent screen
3. User grants permissions (Drive, email)
4. Callback with authorization code
5. Exchange code for access token
6. Store session in secure cookie

### Session Management
- Session duration: 7 days
- Refresh token rotation enabled
- Auto-refresh 5 minutes before expiry

### Permissions
- **Google Drive**: Read/write access to 11-11 folder
- **Email**: Read user profile (name, avatar)

### Security
- HTTPS only
- CSRF protection via state parameter
- Secure cookie with HttpOnly flag
- Token encryption at rest
`,
  code_review: `---
title: Code Review Assistant
description: Expert code reviewer focusing on best practices and potential issues
tags: [code-review, quality, best-practices]
public: true
---

# Code Review Assistant

You are an experienced code reviewer. Analyze code for quality, security, and maintainability.

## Review Checklist

### Code Quality
- **Readability**: Clear variable names, proper formatting
- **Modularity**: Single responsibility principle
- **DRY**: No repeated code blocks
- **Complexity**: Avoid deeply nested logic

### Performance
- **Optimization**: Efficient algorithms, avoid premature optimization
- **Memory**: No leaks, proper cleanup
- **Rendering**: Minimize re-renders in React

### Security
- **Input validation**: Sanitize user input
- **Authentication**: Proper session handling
- **Secrets**: No hardcoded credentials
- **XSS/CSRF**: Protection mechanisms in place

### Testing
- **Coverage**: Critical paths tested
- **Edge cases**: Boundary conditions handled
- **Mocking**: External dependencies isolated

### Documentation
- **Comments**: Explain "why", not "what"
- **README**: Clear setup instructions
- **API docs**: Type definitions and examples
`,
  architect: `---
title: System Architect
description: Expert system architect for designing scalable, maintainable software
tags: [architecture, design, planning]
public: true
---

# System Architect

You are an expert system architect. Design scalable, maintainable, and performant software systems.

## Design Principles

1. **Separation of Concerns**
   - UI layer (React components)
   - Business logic (hooks, services)
   - Data layer (API, database)

2. **Single Source of Truth**
   - Centralized state management
   - Avoid prop drilling
   - Context for cross-cutting concerns

3. **Composition over Inheritance**
   - Reusable components
   - Higher-order components
   - Custom hooks

4. **Performance by Default**
   - Code splitting
   - Lazy loading
   - Memoization where needed

## Architecture Patterns

### Frontend
- **State**: Zustand or Context API
- **Routing**: Next.js App Router
- **Styling**: Tailwind CSS
- **Forms**: React Hook Form
- **Data fetching**: SWR or React Query

### Backend
- **API**: Next.js API routes
- **Database**: PGlite (local), PostgreSQL (prod)
- **Auth**: NextAuth.js
- **File storage**: Google Drive API

### Deployment
- **Hosting**: Vercel
- **CI/CD**: GitHub Actions
- **Monitoring**: Vercel Analytics
`,
  manus: `# Manus - The Builder

## Role
Manus is the hands-on builder agent responsible for implementing features, writing code, and executing technical tasks.

## Capabilities
- Full-stack development (React, TypeScript, Node.js)
- Database operations (SQL, PGlite)
- API integration (Google Drive, GitHub)
- Testing and debugging
- Performance optimization

## Workflow
1. **Receive task** from Supervisor
2. **Plan implementation** (break down into steps)
3. **Execute code changes** (components, hooks, APIs)
4. **Test changes** (manual + automated)
5. **Report completion** with summary

## Best Practices
- Follow existing code conventions
- Write TypeScript-safe code
- Implement error handling
- Add appropriate logging
- Document complex logic

## Tools
- File editing (Read, Write, Edit)
- Command execution (Bash)
- Code search (Grep, Glob)
- Browser testing (Playwright)
`,
  supervisor: `# Supervisor - The Coordinator

## Role
Supervisor is the orchestration agent responsible for coordinating tasks across multiple agents and ensuring project progress.

## Capabilities
- Task breakdown and delegation
- Progress tracking and reporting
- Conflict resolution
- Quality assurance
- Timeline management

## Workflow
1. **Receive requirements** from user or Librarian
2. **Create task plan** (phases, steps, assignments)
3. **Delegate tasks** to Manus, Librarian, or other agents
4. **Monitor progress** (track completions, blockers)
5. **Report status** to user

## Decision Framework
- **Prioritization**: P0 (critical) > P1 (high) > P2 (medium) > P3 (low)
- **Risk assessment**: Technical, timeline, scope
- **Resource allocation**: Agent availability, skillset match
- **Quality gates**: Testing, review, documentation

## Communication
- Clear task descriptions
- Expected outcomes defined
- Acceptance criteria specified
- Blockers surfaced early
`,
  librarian: `# Librarian - The Knowledge Keeper

## Role
Librarian is the documentation and knowledge management agent responsible for maintaining project documentation, tracking decisions, and ensuring information accessibility.

## Capabilities
- Documentation creation and updates
- Knowledge organization
- Search and retrieval
- Context summarization
- Historical analysis

## Responsibilities

### Documentation
- Maintain JOURNAL.md (architectural decisions)
- Update AUDIT_LOG.md (system events)
- Document BUGS.md (known issues)
- Create README files (when requested)

### Knowledge Management
- Index important decisions
- Track feature evolution
- Maintain glossary of terms
- Create learning resources

### Context Provision
- Summarize project history
- Provide relevant background
- Surface related documentation
- Answer "why" questions

## Workflow
1. **Monitor activity** (code changes, decisions)
2. **Extract key information** (decisions, rationale)
3. **Update documentation** (JOURNAL, logs)
4. **Respond to queries** (search, summarize)
5. **Maintain quality** (accuracy, completeness)

## Best Practices
- Clear, concise writing
- Consistent formatting (Markdown)
- Timestamp all entries
- Link related content
- Archive outdated info
`,
};

const FILE_NAME_MAP: Record<string, string> = {
  journal: "JOURNAL.md",
  audit_log: "AUDIT_LOG.md",
  task_plan: "task_plan.md",
  vision: "vision.md",
  sprint1_prd: "sprint1_initialization.md",
  ui_shell_spec: "ui_shell.md",
  auth_spec: "auth.md",
  code_review: "code_review_template.md",
  architect: "system_architect.md",
  manus: "manus.md",
  supervisor: "supervisor.md",
  librarian: "librarian.md",
};

export async function GET(
  request: NextRequest,
  { params }: { params: { fileId: string } }
) {
  try {
    const { fileId } = params;

    if (isDevMode()) {
      console.warn(
        `[Drive API] Running in dev mode - returning mock content for fileId: ${fileId}`
      );

      const content = MOCK_CONTENT[fileId] || "# Untitled\n\nNo content available.";
      const fileName = FILE_NAME_MAP[fileId] || `${fileId}.md`;
      
      return NextResponse.json({
        fileId,
        content,
        modifiedTime: new Date().toISOString(),
        metadata: {
          id: fileId,
          name: fileName,
          mimeType: "text/markdown",
          modifiedTime: new Date().toISOString(),
        },
      });
    }

    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized - no valid session" },
        { status: 401 }
      );
    }

    const driveClient = await createDriveClient(session.accessToken);
    const result = await driveClient.getFileContent(fileId);

    return NextResponse.json(result);
  } catch (error) {
    console.error("[Drive API] Error fetching file content:", error);

    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: "Authentication failed" },
        { status: 401 }
      );
    }

    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { error: "File not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Failed to fetch file content from Google Drive" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { fileId: string } }
) {
  try {
    const { fileId } = params;
    const body = await request.json();
    const { content } = body;

    if (!content || typeof content !== "string") {
      return NextResponse.json(
        { error: "Invalid request body - 'content' field required" },
        { status: 400 }
      );
    }

    if (isDevMode()) {
      console.warn(
        `[Drive API] Running in dev mode - simulating content update for fileId: ${fileId}`
      );

      MOCK_CONTENT[fileId] = content;

      return NextResponse.json({
        success: true,
        fileId,
        modifiedTime: new Date().toISOString(),
      });
    }

    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized - no valid session" },
        { status: 401 }
      );
    }

    const driveClient = await createDriveClient(session.accessToken);
    const result = await driveClient.updateFileContent(fileId, content);

    return NextResponse.json(result);
  } catch (error) {
    console.error("[Drive API] Error updating file content:", error);

    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: "Authentication failed" },
        { status: 401 }
      );
    }

    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { error: "File not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update file content in Google Drive" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { fileId: string } }
) {
  try {
    const { fileId } = params;
    const body = await request.json();
    const { content } = body;

    if (!content || typeof content !== "string") {
      return NextResponse.json(
        { error: "Invalid request body - 'content' field required" },
        { status: 400 }
      );
    }

    if (isDevMode()) {
      console.warn(
        `[Drive API] Running in dev mode - simulating content update for fileId: ${fileId}`
      );

      MOCK_CONTENT[fileId] = content;

      return NextResponse.json({
        success: true,
        fileId,
        modifiedTime: new Date().toISOString(),
      });
    }

    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized - no valid session" },
        { status: 401 }
      );
    }

    const driveClient = await createDriveClient(session.accessToken);
    const result = await driveClient.updateFileContent(fileId, content);

    return NextResponse.json(result);
  } catch (error) {
    console.error("[Drive API] Error updating file content:", error);

    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: "Authentication failed" },
        { status: 401 }
      );
    }

    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { error: "File not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update file content in Google Drive" },
      { status: 500 }
    );
  }
}
