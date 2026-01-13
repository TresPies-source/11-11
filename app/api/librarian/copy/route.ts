import { NextRequest, NextResponse } from "next/server";
import { copyPrompt } from "@/lib/pglite/prompts";
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

    const copiedPrompt = await copyPrompt(promptId, userIdValue);

    if (!copiedPrompt) {
      return NextResponse.json(
        { error: "Source prompt not found or not public" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      prompt: copiedPrompt,
    });
  } catch (error) {
    console.error("[Copy API] Error copying prompt:", error);

    return NextResponse.json(
      { error: "Failed to copy prompt" },
      { status: 500 }
    );
  }
}
