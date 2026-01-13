import { NextRequest, NextResponse } from "next/server";
import { getAuthSession, createDriveClient, isDevMode } from "@/lib/google/auth";
import { AuthError, NotFoundError, RateLimitError } from "@/lib/google/types";
import { validateFileName, checkDuplicateName } from "@/lib/validation";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, type, folderId } = body;

    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { error: "Invalid request - 'name' field required" },
        { status: 400 }
      );
    }

    if (!type || !["file", "folder"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid request - 'type' must be 'file' or 'folder'" },
        { status: 400 }
      );
    }

    if (!folderId || typeof folderId !== "string") {
      return NextResponse.json(
        { error: "Invalid request - 'folderId' field required" },
        { status: 400 }
      );
    }

    const validation = validateFileName(name);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    if (isDevMode()) {
      console.warn(
        `[Create API] Running in dev mode - simulating ${type} creation: ${name}`
      );

      const mockId = `mock_${type}_${Date.now()}`;
      const mockResponse = type === "file"
        ? {
            success: true,
            fileId: mockId,
            fileName: name.endsWith(".md") ? name : `${name}.md`,
            modifiedTime: new Date().toISOString(),
            type: "file",
          }
        : {
            success: true,
            folderId: mockId,
            folderName: name,
            modifiedTime: new Date().toISOString(),
            type: "folder",
          };

      return NextResponse.json(mockResponse);
    }

    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized - no valid session" },
        { status: 401 }
      );
    }

    const driveClient = await createDriveClient(session.accessToken);

    const existingFiles = await driveClient.listFiles(folderId);
    const existingNames = existingFiles.map((f) => f.name);

    if (checkDuplicateName(name, existingNames)) {
      return NextResponse.json(
        { error: `A ${type} with this name already exists` },
        { status: 409 }
      );
    }

    if (type === "file") {
      const fileName = name.endsWith(".md") ? name : `${name}.md`;
      const result = await driveClient.createFile({
        folderId,
        name: fileName,
        content: "",
      });

      return NextResponse.json({
        success: result.success,
        fileId: result.fileId,
        fileName: result.fileName,
        modifiedTime: result.modifiedTime,
        type: "file",
      });
    } else {
      const result = await driveClient.createFolder({
        parentId: folderId,
        name,
      });

      return NextResponse.json({
        success: result.success,
        folderId: result.folderId,
        folderName: result.folderName,
        modifiedTime: result.modifiedTime,
        type: "folder",
      });
    }
  } catch (error) {
    console.error("[Create API] Error creating file/folder:", error);

    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: "Authentication failed" },
        { status: 401 }
      );
    }

    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { error: "Parent folder not found" },
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
      { error: "Failed to create file/folder in Google Drive" },
      { status: 500 }
    );
  }
}
