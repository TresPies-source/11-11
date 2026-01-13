import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { trackCost } from "@/lib/cost/tracking";
import { 
  getSessionTokenUsage, 
  getUserMonthlyTokenUsage,
} from "@/lib/pglite/cost";
import { getCurrentMonth } from "@/lib/cost/tracking";
import { z } from "zod";

const trackRequestSchema = z.object({
  user_id: z.string(),
  session_id: z.string(),
  query_id: z.string(),
  model: z.string(),
  prompt_tokens: z.number().int().nonnegative(),
  completion_tokens: z.number().int().nonnegative(),
  total_tokens: z.number().int().nonnegative(),
  cost_usd: z.number().nonnegative(),
  operation_type: z.enum(["routing", "agent_execution", "search", "other"]),
});

const isDevMode = () => process.env.NEXT_PUBLIC_DEV_MODE === "true";

export async function POST(request: NextRequest) {
  try {
    let userId: string;

    if (isDevMode()) {
      console.warn("[Cost Track API] Running in dev mode with mock authentication");
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

    const body = await request.json();
    
    const validationResult = trackRequestSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: "Invalid request body",
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const record = validationResult.data;

    if (!isDevMode() && record.user_id !== userId) {
      return NextResponse.json(
        { error: "Unauthorized - user_id does not match session" },
        { status: 403 }
      );
    }

    // In dev mode, log the cost but don't write to database (to avoid PGlite issues)
    if (isDevMode()) {
      console.log("[Cost Track API] Mock tracking:", {
        user: record.user_id,
        tokens: record.total_tokens,
        cost: record.cost_usd,
        operation: record.operation_type,
      });
      
      return NextResponse.json({
        success: true,
        session_total_tokens: record.total_tokens,
        user_monthly_total_tokens: record.total_tokens,
      });
    }

    await trackCost(record);

    const sessionTotalTokens = await getSessionTokenUsage(record.session_id);
    const currentMonth = getCurrentMonth();
    const userMonthlyTotalTokens = await getUserMonthlyTokenUsage(record.user_id, currentMonth);

    return NextResponse.json({
      success: true,
      session_total_tokens: sessionTotalTokens,
      user_monthly_total_tokens: userMonthlyTotalTokens,
    });
  } catch (error) {
    console.error("[Cost Track API] Error:", error);

    return NextResponse.json(
      { error: "Failed to track cost" },
      { status: 500 }
    );
  }
}
