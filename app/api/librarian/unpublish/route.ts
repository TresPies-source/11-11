import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { unpublishPrompt } from "@/lib/pglite/prompts";

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

    const updatedPrompt = await unpublishPrompt(promptId, userId);

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
