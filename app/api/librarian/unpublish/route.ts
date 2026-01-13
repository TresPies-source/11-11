import { NextRequest, NextResponse } from "next/server";
import { unpublishPrompt } from "@/lib/pglite/prompts";
import { DEFAULT_USER_ID } from "@/lib/pglite/client";

const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { promptId, userId } = body;

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

    const userIdValue = userId || DEFAULT_USER_ID;

    const updatedPrompt = await unpublishPrompt(promptId, userIdValue);

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
    console.error("[Unpublish API] Error unpublishing prompt:", error);

    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: "Failed to unpublish prompt" },
      { status: 500 }
    );
  }
}
