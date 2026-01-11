import { NextRequest, NextResponse } from "next/server";
import { getAuthSession, createDriveClient, isDevMode } from "@/lib/google/auth";
import { AuthError, NotFoundError, RateLimitError } from "@/lib/google/types";

const PROMPTS_FOLDER_ID = process.env.GOOGLE_DRIVE_PROMPTS_FOLDER_ID || "";

async function generateUniqueFileName(
  driveClient: any,
  folderId: string,
  baseName: string
): Promise<string> {
  try {
    const files = await driveClient.listFiles(folderId);
    const existingNames = files.map((f: any) => f.name);

    if (!existingNames.includes(baseName)) {
      return baseName;
    }

    const nameWithoutExt = baseName.replace(/\.md$/, "");
    let counter = 1;
    let uniqueName = `${nameWithoutExt}-copy.md`;

    while (existingNames.includes(uniqueName)) {
      counter++;
      uniqueName = `${nameWithoutExt}-copy-${counter}.md`;
    }

    return uniqueName;
  } catch (error) {
    console.error("[Fork API] Error checking for duplicate names:", error);
    return baseName;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sourceFileId } = body;

    if (!sourceFileId || typeof sourceFileId !== "string") {
      return NextResponse.json(
        { error: "Invalid request - 'sourceFileId' required" },
        { status: 400 }
      );
    }

    if (isDevMode()) {
      console.warn("[Fork API] Running in dev mode - returning mock fork response");

      const mockFileName = `forked-prompt-${Date.now()}.md`;
      const mockFileId = `mock_fork_${Date.now()}`;

      return NextResponse.json({
        success: true,
        newFileId: mockFileId,
        newFileName: mockFileName,
        message: `Prompt forked to your library: ${mockFileName}`,
      });
    }

    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized - no valid session" },
        { status: 401 }
      );
    }

    if (!PROMPTS_FOLDER_ID) {
      console.error("[Fork API] GOOGLE_DRIVE_PROMPTS_FOLDER_ID not configured");
      return NextResponse.json(
        { error: "Target folder not configured" },
        { status: 500 }
      );
    }

    const driveClient = await createDriveClient(session.accessToken);

    const sourceFile = await driveClient.getFileContent(sourceFileId);

    const uniqueFileName = await generateUniqueFileName(
      driveClient,
      PROMPTS_FOLDER_ID,
      sourceFile.metadata?.name || "forked-prompt.md"
    );

    const result = await driveClient.createFile({
      folderId: PROMPTS_FOLDER_ID,
      name: uniqueFileName,
      content: sourceFile.content,
    });

    return NextResponse.json({
      success: true,
      newFileId: result.fileId,
      newFileName: result.fileName,
      message: `Prompt forked to your library: ${result.fileName}`,
    });
  } catch (error) {
    console.error("[Fork API] Error forking prompt:", error);

    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: "Authentication failed" },
        { status: 401 }
      );
    }

    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { error: "Source file not found" },
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
      { error: "Failed to fork prompt" },
      { status: 500 }
    );
  }
}
