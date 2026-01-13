import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { estimateTokens } from "@/lib/cost/estimation";
import { z } from "zod";

const estimateRequestSchema = z.object({
  system_prompt: z.string(),
  user_messages: z.array(
    z.object({
      role: z.enum(["user", "assistant", "system"]),
      content: z.string(),
    })
  ),
  max_completion_tokens: z.number().optional().default(2000),
  model: z.string().optional().default("gpt-4o"),
});

const isDevMode = () => process.env.NEXT_PUBLIC_DEV_MODE === "true";

export async function POST(request: NextRequest) {
  try {
    if (!isDevMode()) {
      const session = await auth();
      if (!session || !session.user?.email) {
        return NextResponse.json(
          { error: "Unauthorized - no valid session" },
          { status: 401 }
        );
      }
    } else {
      console.warn("[Cost Estimate API] Running in dev mode with mock authentication");
    }

    const body = await request.json();
    
    const validationResult = estimateRequestSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: "Invalid request body",
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { system_prompt, user_messages, max_completion_tokens, model } = validationResult.data;

    const estimate = await estimateTokens(
      system_prompt,
      user_messages,
      max_completion_tokens,
      model
    );

    return NextResponse.json(estimate);
  } catch (error) {
    console.error("[Cost Estimate API] Error:", error);

    if (error instanceof Error && error.message.includes("Model")) {
      return NextResponse.json(
        { error: "Unsupported model" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to estimate token usage" },
      { status: 500 }
    );
  }
}
