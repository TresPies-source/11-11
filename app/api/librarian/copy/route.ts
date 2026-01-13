import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { copyPrompt } from "@/lib/pglite/prompts";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized - no valid session" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { promptId } = body;

    if (!promptId) {
      return NextResponse.json(
        { error: "Missing required field: promptId" },
        { status: 400 }
      );
    }

    const userId = session.user.email;

    const copiedPrompt = await copyPrompt(promptId, userId);

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
