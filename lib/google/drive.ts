import { google, drive_v3 } from "googleapis";
import {
  DriveClientConfig,
  DriveFileMetadata,
  DriveFileContentResponse,
  DriveUpdateResponse,
  DriveCreateFileParams,
  DriveCreateFileResponse,
  DriveListFilesResponse,
  RetryConfig,
  AuthError,
  NotFoundError,
  RateLimitError,
  DriveError,
} from "./types";

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 4000,
};

export class DriveClient {
  private drive: drive_v3.Drive;
  private retryConfig: RetryConfig;

  constructor(config: DriveClientConfig) {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: config.accessToken });

    this.drive = google.drive({ version: "v3", auth });
    this.retryConfig = {
      ...DEFAULT_RETRY_CONFIG,
      ...config.retryConfig,
    };
  }

  async listFiles(folderId: string): Promise<DriveFileMetadata[]> {
    return this.withRetry(async () => {
      try {
        const response = await this.drive.files.list({
          q: `'${folderId}' in parents and trashed = false`,
          fields:
            "files(id, name, mimeType, modifiedTime, createdTime, size, webViewLink, parents)",
          orderBy: "modifiedTime desc",
        });

        const files = response.data.files || [];
        return files.map((file) => this.mapToFileMetadata(file));
      } catch (error) {
        this.handleError(error);
      }
    });
  }

  async getFileContent(fileId: string): Promise<DriveFileContentResponse> {
    return this.withRetry(async () => {
      try {
        const [metadata, content] = await Promise.all([
          this.drive.files.get({
            fileId,
            fields: "id, name, mimeType, modifiedTime, createdTime, size, webViewLink, parents",
          }),
          this.drive.files.get(
            { fileId, alt: "media" },
            { responseType: "text" }
          ),
        ]);

        return {
          fileId,
          content: content.data as string,
          modifiedTime: metadata.data.modifiedTime || new Date().toISOString(),
          metadata: this.mapToFileMetadata(metadata.data),
        };
      } catch (error) {
        this.handleError(error);
      }
    });
  }

  async updateFileContent(
    fileId: string,
    content: string
  ): Promise<DriveUpdateResponse> {
    return this.withRetry(async () => {
      try {
        const response = await this.drive.files.update({
          fileId,
          media: {
            mimeType: "text/markdown",
            body: content,
          },
          fields: "id, modifiedTime",
        });

        return {
          success: true,
          fileId,
          modifiedTime: response.data.modifiedTime || new Date().toISOString(),
        };
      } catch (error) {
        this.handleError(error);
      }
    });
  }

  async createFile(params: DriveCreateFileParams): Promise<DriveCreateFileResponse> {
    return this.withRetry(async () => {
      try {
        const response = await this.drive.files.create({
          requestBody: {
            name: params.name,
            parents: [params.folderId],
            mimeType: "text/markdown",
          },
          media: {
            mimeType: "text/markdown",
            body: params.content,
          },
          fields: "id, name, modifiedTime",
        });

        return {
          success: true,
          fileId: response.data.id || "",
          fileName: response.data.name || params.name,
          modifiedTime: response.data.modifiedTime || new Date().toISOString(),
        };
      } catch (error) {
        this.handleError(error);
      }
    });
  }

  private async withRetry<T>(
    operation: () => Promise<T>,
    attempt: number = 0
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (attempt >= this.retryConfig.maxRetries) {
        throw error;
      }

      if (
        error instanceof AuthError ||
        error instanceof NotFoundError
      ) {
        throw error;
      }

      const delay = Math.min(
        this.retryConfig.baseDelay * Math.pow(2, attempt),
        this.retryConfig.maxDelay
      );

      await this.sleep(delay);
      return this.withRetry(operation, attempt + 1);
    }
  }

  private handleError(error: any): never {
    const statusCode = error?.response?.status || error?.code;
    const errorMessage = error?.response?.data?.error?.message || error?.message || "Unknown error";

    if (statusCode === 401) {
      throw new AuthError(errorMessage);
    }
    if (statusCode === 404) {
      throw new NotFoundError(errorMessage);
    }
    if (statusCode === 429) {
      throw new RateLimitError(errorMessage);
    }

    throw new DriveError(errorMessage, statusCode, error?.response?.data);
  }

  private mapToFileMetadata(file: drive_v3.Schema$File): DriveFileMetadata {
    return {
      id: file.id || "",
      name: file.name || "",
      mimeType: file.mimeType || "",
      modifiedTime: file.modifiedTime || "",
      createdTime: file.createdTime ?? undefined,
      size: file.size ?? undefined,
      webViewLink: file.webViewLink ?? undefined,
      parents: file.parents ?? undefined,
    };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
