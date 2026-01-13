import { NextRequest, NextResponse } from "next/server";
import { getAuthSession, createDriveClient, isDevMode } from "@/lib/google/auth";
import { AuthError, NotFoundError, RateLimitError } from "@/lib/google/types";
import { validateFileName } from "@/lib/validation";

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { fileId, newName } = body;

    if (!fileId || typeof fileId !== "string") {
      return NextResponse.json(
        { error: "Invalid request - 'fileId' field required" },
        { status: 400 }
      );
    }

    if (!newName || typeof newName !== "string") {
      return NextResponse.json(
        { error: "Invalid request - 'newName' field required" },
        { status: 400 }
      );
    }

    const validation = validateFileName(newName);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    if (isDevMode()) {
      console.warn(
        `[Rename API] Running in dev mode - simulating rename: ${fileId} -> ${newName}`
      );

      return NextResponse.json({
        success: true,
        fileId,
        newName,
        modifiedTime: new Date().toISOString(),
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

    const result = await driveClient.renameFile({
      fileId,
      newName,
    });

    return NextResponse.json({
      success: result.success,
      fileId: result.fileId,
      newName: result.newName,
      modifiedTime: result.modifiedTime,
    });
  } catch (error) {
    console.error("[Rename API] Error renaming file:", error);

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
      { error: "Failed to rename file in Google Drive" },
      { status: 500 }
    );
  }
}
