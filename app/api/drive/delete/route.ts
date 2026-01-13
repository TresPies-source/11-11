import { NextRequest, NextResponse } from "next/server";
import { getAuthSession, createDriveClient, isDevMode } from "@/lib/google/auth";
import { AuthError, NotFoundError, RateLimitError } from "@/lib/google/types";

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get("fileId");

    if (!fileId || typeof fileId !== "string") {
      return NextResponse.json(
        { error: "Invalid request - 'fileId' query parameter required" },
        { status: 400 }
      );
    }

    if (isDevMode()) {
      console.warn(
        `[Delete API] Running in dev mode - simulating delete: ${fileId}`
      );

      return NextResponse.json({
        success: true,
        fileId,
      });
    }

    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized - no valid session" },
        { status: 401 }
      );
    }

    const driveClient = await createDriveClient(session.accessToken);

    const result = await driveClient.deleteFile(fileId);

    return NextResponse.json({
      success: result.success,
      fileId: result.fileId,
    });
  } catch (error) {
    console.error("[Delete API] Error deleting file:", error);

    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: "Authentication failed" },
        { status: 401 }
      );
    }

    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { error: "File not found" },
        { status: 404 }
      );
    }

    if (error instanceof RateLimitError) {
      return NextResponse.json(
        { error: "Google Drive API quota exceeded" },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: "Failed to delete file in Google Drive" },
      { status: 500 }
    );
  }
}
