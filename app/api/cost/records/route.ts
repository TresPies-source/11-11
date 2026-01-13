import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getCostRecords } from "@/lib/pglite/cost";

const isDevMode = () => process.env.NEXT_PUBLIC_DEV_MODE === "true";

export async function GET(request: NextRequest) {
  try {
    let userId: string;

    if (isDevMode()) {
      console.warn("[Cost Records API] Running in dev mode with mock authentication");
      userId = "dev@11-11.dev";
      
      // Return mock data in dev mode to avoid database issues
      return NextResponse.json({
        records: [],
        count: 0,
      });
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
    
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    const records = await getCostRecords(userId, limit, offset);

    return NextResponse.json({
      records,
      count: records.length,
    });
  } catch (error) {
    console.error("[Cost Records API] Error:", error);

    return NextResponse.json(
      { error: "Failed to fetch cost records" },
      { status: 500 }
    );
  }
}
