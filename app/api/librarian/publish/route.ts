import { NextRequest, NextResponse } from "next/server";
import { publishPrompt } from "@/lib/pglite/prompts";
import { DEFAULT_USER_ID } from "@/lib/pglite/client";

const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { promptId, authorName, userId } = body;

    if (!promptId) {
      return NextResponse.json(
        { error: "Missing required field: promptId" },
        { status: 400 }
      );
    }

    if (!userId && !isDevMode) {
      return NextResponse.json(
        { error: "Missing required field: userId" },
        { status: 400 }
      );
    }

    const displayName = authorName || userId || "Anonymous";
    const userIdValue = userId || DEFAULT_USER_ID;

    const updatedPrompt = await publishPrompt(promptId, userIdValue, displayName);

    if (!updatedPrompt) {
      return NextResponse.json(
        { error: "Prompt not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      prompt: updatedPrompt,
    });
  } catch (error) {
    console.error("[Publish API] Error publishing prompt:", error);

    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: "Failed to publish prompt" },
      { status: 500 }
    );
  }
}
