import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { 
  getContextStatus, 
  getRecentSnapshots, 
  getSessionSnapshots 
} from "@/lib/context/status";

const isDevMode = () => process.env.NEXT_PUBLIC_DEV_MODE === "true";

export async function GET(request: NextRequest) {
  try {
    let userId: string;

    if (isDevMode()) {
      console.warn("[Context Status API] Running in dev mode with mock authentication");
      userId = "dev@11-11.dev";
    } else {
      const session = await auth();
      if (!session || !session.user?.email) {
        return NextResponse.json(
          { error: "Unauthorized - no valid session" },
          { status: 401 }
        );
      }
      userId = session.user.email;
    }
    
    const sessionId = request.nextUrl.searchParams.get("session_id");
    const mode = request.nextUrl.searchParams.get("mode") || "current";
    const limit = parseInt(request.nextUrl.searchParams.get("limit") || "10", 10);

    if (mode === "recent") {
      const snapshots = await getRecentSnapshots(userId, limit);
      return NextResponse.json({ snapshots });
    }

    if (mode === "session" && sessionId) {
      const snapshots = await getSessionSnapshots(sessionId);
      return NextResponse.json({ snapshots });
    }

    if (!sessionId) {
      return NextResponse.json(
        { error: "session_id is required for current mode" },
        { status: 400 }
      );
    }

    const status = await getContextStatus(sessionId, userId);
    
    if (!status) {
      return NextResponse.json(
        { error: "No context found for this session" },
        { status: 404 }
      );
    }

    return NextResponse.json(status);
  } catch (error) {
    console.error("[Context Status API] Error:", error);

    return NextResponse.json(
      { error: "Failed to fetch context status" },
      { status: 500 }
    );
  }
}
