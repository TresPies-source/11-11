import { NextRequest, NextResponse } from "next/server";
import { getAuthSession, createDriveClient, isDevMode } from "@/lib/google/auth";
import { AuthError, NotFoundError } from "@/lib/google/types";

const MOCK_CONTENT: Record<string, string> = {
  mock_file_1: `# Task Plan

## Current Sprint
- Implement Markdown Editor
- Set up Google Drive Integration
- Create Context Bus

## Next Steps
- Test Drive API endpoints
- Verify sync functionality
`,
  mock_file_2: `# Agent Prompts

## Architect Agent
Role: System design and architecture decisions

## Builder Agent
Role: Code implementation and refactoring

## QA Agent
Role: Testing and quality assurance
`,
  mock_file_3: `# Feature Specification

## Overview
This feature introduces a collaborative workbench for multi-agent development.

## Requirements
- Real-time synchronization
- Context sharing between agents
- File editing capabilities
`,
  mock_file_4: `# Requirements Document

## Functional Requirements
1. User must be able to edit files
2. Changes must sync to Google Drive
3. Multiple agents must receive context updates

## Non-Functional Requirements
- Auto-save within 500ms
- 60fps animations
- < 100ms event propagation
`,
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
      return NextResponse.json({
        fileId,
        content,
        modifiedTime: new Date().toISOString(),
        metadata: {
          id: fileId,
          name: `${fileId.replace("mock_file_", "file_")}.md`,
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
