import { drive_v3 } from "googleapis";

export interface GoogleAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export interface GoogleTokens {
  access_token: string;
  refresh_token?: string;
  expiry_date?: number;
  token_type: string;
  scope: string;
}

export interface GoogleUserInfo {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
}

export interface DriveListFilesResponse {
  files: drive_v3.Schema$File[];
  nextPageToken?: string;
}

export interface DriveFileMetadata {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
  createdTime?: string;
  size?: string;
  webViewLink?: string;
  parents?: string[];
}

export interface DriveFileContentResponse {
  fileId: string;
  content: string;
  modifiedTime: string;
  metadata?: DriveFileMetadata;
}

export interface DriveUpdateResponse {
  success: boolean;
  modifiedTime: string;
  fileId: string;
}

export class DriveError extends Error {
  constructor(
    message: string,
    public code?: number,
    public details?: unknown
  ) {
    super(message);
    this.name = "DriveError";
  }
}

export class AuthError extends DriveError {
  constructor(message = "Authentication failed") {
    super(message, 401);
    this.name = "AuthError";
  }
}

export class NotFoundError extends DriveError {
  constructor(message = "Resource not found") {
    super(message, 404);
    this.name = "NotFoundError";
  }
}

export class RateLimitError extends DriveError {
  constructor(message = "Rate limit exceeded") {
    super(message, 429);
    this.name = "RateLimitError";
  }
}

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
}

export interface DriveClientConfig {
  accessToken: string;
  retryConfig?: Partial<RetryConfig>;
}

export interface FolderMapping {
  prompts: string;
  prds: string;
}
