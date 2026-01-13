import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { 
  getSessionTokenUsage, 
  getUserMonthlyTokenUsage,
  getMonthlyTotalCost,
} from "@/lib/pglite/cost";
import { DEFAULT_BUDGET } from "@/lib/cost/constants";
import { getCurrentMonth } from "@/lib/cost/tracking";

const isDevMode = () => process.env.NEXT_PUBLIC_DEV_MODE === "true";

export async function GET(request: NextRequest) {
  try {
    let userId: string;

    if (isDevMode()) {
      console.warn("[Cost Budget API] Running in dev mode with mock authentication");
      userId = "dev@11-11.dev";
      
      // Return mock data in dev mode to avoid database issues
      return NextResponse.json({
        query_limit: DEFAULT_BUDGET.query_limit,
        session_limit: DEFAULT_BUDGET.session_limit,
        user_monthly_limit: DEFAULT_BUDGET.user_monthly_limit,
        query_usage: 0,
        session_usage: 0,
        user_monthly_usage: 0,
        warnings: [],
        total_cost_this_month: 0,
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
    
    const sessionId = request.nextUrl.searchParams.get("session_id");

    let sessionUsage = 0;
    if (sessionId) {
      sessionUsage = await getSessionTokenUsage(sessionId);
    }

    const currentMonth = getCurrentMonth();
    const userMonthlyUsage = await getUserMonthlyTokenUsage(userId, currentMonth);
    const totalCostThisMonth = await getMonthlyTotalCost(userId, currentMonth);

    const warnings: string[] = [];
    
    if (sessionId && sessionUsage > DEFAULT_BUDGET.session_limit * DEFAULT_BUDGET.warn_threshold) {
      warnings.push("session_approaching_limit");
    }
    
    if (userMonthlyUsage > DEFAULT_BUDGET.user_monthly_limit * DEFAULT_BUDGET.warn_threshold) {
      warnings.push("user_approaching_limit");
    }

    return NextResponse.json({
      query_limit: DEFAULT_BUDGET.query_limit,
      session_limit: DEFAULT_BUDGET.session_limit,
      user_monthly_limit: DEFAULT_BUDGET.user_monthly_limit,
      query_usage: 0,
      session_usage: sessionUsage,
      user_monthly_usage: userMonthlyUsage,
      warnings,
      total_cost_this_month: totalCostThisMonth,
    });
  } catch (error) {
    console.error("[Cost Budget API] Error:", error);

    return NextResponse.json(
      { error: "Failed to fetch budget status" },
      { status: 500 }
    );
  }
}
