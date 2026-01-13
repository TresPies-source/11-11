import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { publishPrompt } from "@/lib/pglite/prompts";

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
    const { promptId, authorName } = body;

    if (!promptId) {
      return NextResponse.json(
        { error: "Missing required field: promptId" },
        { status: 400 }
      );
    }

    const displayName = authorName || session.user.name || session.user.email;
    const userId = session.user.email;

    const updatedPrompt = await publishPrompt(promptId, userId, displayName);

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
