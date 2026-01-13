import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getCostTrends } from "@/lib/pglite/cost";

const isDevMode = () => process.env.NEXT_PUBLIC_DEV_MODE === "true";

export async function GET(request: NextRequest) {
  try {
    let userId: string;

    if (isDevMode()) {
      console.warn("[Cost Trends API] Running in dev mode with mock authentication");
      userId = "dev@11-11.dev";
      
      // Return mock data in dev mode to avoid database issues
      return NextResponse.json({
        trends: [],
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
    const days = parseInt(searchParams.get("days") || "30", 10);

    const trends = await getCostTrends(userId, days);

    return NextResponse.json({
      trends,
      count: trends.length,
    });
  } catch (error) {
    console.error("[Cost Trends API] Error:", error);

    return NextResponse.json(
      { error: "Failed to fetch cost trends" },
      { status: 500 }
    );
  }
}
