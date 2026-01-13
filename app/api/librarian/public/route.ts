import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getPublicPrompts } from "@/lib/pglite/prompts";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized - no valid session" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const myPromptsOnly = searchParams.get("myPromptsOnly") === "true";
    const sortBy = (searchParams.get("sortBy") || "recent") as "recent" | "popular" | "score";
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : undefined;
    const offset = searchParams.get("offset") ? parseInt(searchParams.get("offset")!, 10) : undefined;

    const userId = session.user.email;

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
