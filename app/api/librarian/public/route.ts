import { NextRequest, NextResponse } from "next/server";
import { getPublicPrompts } from "@/lib/pglite/prompts";
import { DEFAULT_USER_ID } from "@/lib/pglite/client";

const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const myPromptsOnly = searchParams.get("myPromptsOnly") === "true";
    const sortBy = (searchParams.get("sortBy") || "recent") as "recent" | "popular" | "score";
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : undefined;
    const offset = searchParams.get("offset") ? parseInt(searchParams.get("offset")!, 10) : undefined;
    const userId = searchParams.get("userId") || (isDevMode ? DEFAULT_USER_ID : undefined);

    if (!userId && myPromptsOnly) {
      return NextResponse.json(
        { error: "userId is required when myPromptsOnly is true" },
        { status: 400 }
      );
    }

    const prompts = await getPublicPrompts({
      myPromptsOnly,
      userId: myPromptsOnly ? userId : undefined,
      sortBy,
      limit,
      offset,
    });

    return NextResponse.json({
      success: true,
      prompts,
    });
  } catch (error) {
    console.error("[Public API] Error fetching public prompts:", error);

    return NextResponse.json(
      { error: "Failed to fetch public prompts" },
      { status: 500 }
    );
  }
}
