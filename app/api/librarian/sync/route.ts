import { NextRequest, NextResponse } from "next/server";
import { createDriveClient, isDevMode } from "@/lib/google/auth";
import { syncPromptFromDrive } from "@/lib/pglite/prompts";
import { AuthError } from "@/lib/google/types";
import { auth } from "@/lib/auth";

const PROMPTS_FOLDER_ID = process.env.GOOGLE_DRIVE_PROMPTS_FOLDER_ID || "mock_prompts_folder_id";

export async function POST(request: NextRequest) {
  try {
    if (isDevMode()) {
      console.warn("[Sync API] Running in dev mode - simulating sync");
      
      return NextResponse.json({
        success: true,
        syncedCount: 3,
        errors: [],
      });
    }

    const session = await auth();
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized - no valid session" },
        { status: 401 }
      );
    }

    const accessToken = (session as any).accessToken;
    if (!accessToken) {
      return NextResponse.json(
        { error: "Unauthorized - no access token" },
        { status: 401 }
      );
    }

    const driveClient = await createDriveClient(accessToken);

    const fileMetadata = await driveClient.listFiles(PROMPTS_FOLDER_ID);
    
    const errors: string[] = [];
    let syncedCount = 0;

    for (const file of fileMetadata) {
      try {
        const fileContent = await driveClient.getFileContent(file.id);
        
        await syncPromptFromDrive(
          {
            id: file.id,
            name: file.name,
            mimeType: file.mimeType,
            modifiedTime: file.modifiedTime,
            path: `03_Prompts/${file.name}`,
            webViewLink: file.webViewLink || '',
          },
          session.user.email,
          fileContent.content
        );
        
        syncedCount++;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Failed to sync ${file.name}: ${errorMessage}`);
        console.error(`[Sync API] Error syncing file ${file.name}:`, error);
      }
    }

    return NextResponse.json({
      success: errors.length === 0,
      syncedCount,
      errors,
    });
  } catch (error) {
    console.error("[Sync API] Error during sync:", error);

    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: "Authentication failed" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Failed to sync prompts from Google Drive" },
      { status: 500 }
    );
  }
}
