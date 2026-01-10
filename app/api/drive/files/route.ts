import { NextRequest, NextResponse } from "next/server";
import { getAuthSession, createDriveClient, isDevMode } from "@/lib/google/auth";
import { AuthError } from "@/lib/google/types";
import { DriveFile } from "@/lib/types";

const FOLDER_MAPPING = {
  prompts: process.env.GOOGLE_DRIVE_PROMPTS_FOLDER_ID || "mock_prompts_folder_id",
  prds: process.env.GOOGLE_DRIVE_PRDS_FOLDER_ID || "mock_prds_folder_id",
};

const MOCK_FILES: DriveFile[] = [
  {
    id: "mock_file_1",
    name: "task_plan.md",
    mimeType: "text/markdown",
    modifiedTime: new Date().toISOString(),
    path: "03_Prompts/task_plan.md",
    webViewLink: "https://drive.google.com/file/mock_file_1",
  },
  {
    id: "mock_file_2",
    name: "agent_prompts.md",
    mimeType: "text/markdown",
    modifiedTime: new Date(Date.now() - 86400000).toISOString(),
    path: "03_Prompts/agent_prompts.md",
    webViewLink: "https://drive.google.com/file/mock_file_2",
  },
  {
    id: "mock_file_3",
    name: "feature_spec.md",
    mimeType: "text/markdown",
    modifiedTime: new Date(Date.now() - 172800000).toISOString(),
    path: "01_PRDs/feature_spec.md",
    webViewLink: "https://drive.google.com/file/mock_file_3",
  },
  {
    id: "mock_file_4",
    name: "requirements.md",
    mimeType: "text/markdown",
    modifiedTime: new Date(Date.now() - 259200000).toISOString(),
    path: "01_PRDs/requirements.md",
    webViewLink: "https://drive.google.com/file/mock_file_4",
  },
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const folder = searchParams.get("folder") as "prompts" | "prds" | null;

    if (isDevMode()) {
      console.warn("[Drive API] Running in dev mode - returning mock files");
      
      let filteredFiles = MOCK_FILES;
      if (folder === "prompts") {
        filteredFiles = MOCK_FILES.filter((f) => f.path.startsWith("03_Prompts"));
      } else if (folder === "prds") {
        filteredFiles = MOCK_FILES.filter((f) => f.path.startsWith("01_PRDs"));
      }

      return NextResponse.json({ files: filteredFiles });
    }

    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized - no valid session" },
        { status: 401 }
      );
    }

    const driveClient = await createDriveClient(session.accessToken);

    let allFiles: DriveFile[] = [];

    const foldersToQuery = folder
      ? [{ name: folder, id: FOLDER_MAPPING[folder] }]
      : [
          { name: "prompts", id: FOLDER_MAPPING.prompts },
          { name: "prds", id: FOLDER_MAPPING.prds },
        ];

    for (const folderInfo of foldersToQuery) {
      if (!folderInfo.id) {
        console.warn(`[Drive API] Missing folder ID for ${folderInfo.name}`);
        continue;
      }

      const metadata = await driveClient.listFiles(folderInfo.id);
      
      const files: DriveFile[] = metadata.map((file) => ({
        id: file.id,
        name: file.name,
        mimeType: file.mimeType,
        modifiedTime: file.modifiedTime,
        path: `${folderInfo.name === "prompts" ? "03_Prompts" : "01_PRDs"}/${file.name}`,
        webViewLink: file.webViewLink,
      }));

      allFiles = allFiles.concat(files);
    }

    allFiles.sort(
      (a, b) =>
        new Date(b.modifiedTime).getTime() - new Date(a.modifiedTime).getTime()
    );

    return NextResponse.json({ files: allFiles });
  } catch (error) {
    console.error("[Drive API] Error fetching files:", error);

    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: "Authentication failed" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Failed to fetch files from Google Drive" },
      { status: 500 }
    );
  }
}
