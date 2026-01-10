import { auth } from "@/lib/auth";
import { DriveClient } from "./drive";
import { GoogleTokens, DriveClientConfig, AuthError } from "./types";

export interface AuthSession {
  accessToken: string;
  refreshToken?: string;
  expiryDate?: number;
}

export const MOCK_ACCESS_TOKEN = "mock_access_token_dev_mode";

export function isDevMode(): boolean {
  return process.env.NEXT_PUBLIC_DEV_MODE === "true";
}

export function getMockAuth(): AuthSession {
  return {
    accessToken: MOCK_ACCESS_TOKEN,
    expiryDate: Date.now() + 3600 * 1000,
  };
}

export async function getAuthSession(): Promise<AuthSession | null> {
  if (isDevMode()) {
    console.warn("[Auth] Running in dev mode with mock authentication");
    return getMockAuth();
  }

  try {
    const session = await auth();
    
    if (!session || !session.user) {
      return null;
    }

    const accessToken = (session as any).accessToken;
    const refreshToken = (session as any).refreshToken;
    const expiryDate = (session as any).expiryDate;

    if (!accessToken) {
      console.error("[Auth] Session exists but no access token found");
      return null;
    }

    return {
      accessToken,
      refreshToken,
      expiryDate,
    };
  } catch (error) {
    console.error("[Auth] Failed to get session:", error);
    return null;
  }
}

export function isTokenExpired(expiryDate?: number): boolean {
  if (!expiryDate) {
    return false;
  }
  return Date.now() >= expiryDate;
}

export function isValidToken(accessToken?: string, expiryDate?: number): boolean {
  if (!accessToken) {
    return false;
  }

  if (accessToken === MOCK_ACCESS_TOKEN) {
    return true;
  }

  if (isTokenExpired(expiryDate)) {
    return false;
  }

  return true;
}

export async function createDriveClient(
  accessToken?: string
): Promise<DriveClient> {
  let token = accessToken;

  if (!token) {
    const session = await getAuthSession();
    if (!session) {
      throw new AuthError("No valid authentication session");
    }
    token = session.accessToken;
  }

  if (!isValidToken(token)) {
    throw new AuthError("Access token is invalid or expired");
  }

  const config: DriveClientConfig = {
    accessToken: token,
  };

  return new DriveClient(config);
}

export function validateGoogleTokens(tokens: GoogleTokens): boolean {
  if (!tokens.access_token) {
    return false;
  }

  if (tokens.expiry_date && isTokenExpired(tokens.expiry_date)) {
    return false;
  }

  return true;
}

export function shouldRefreshToken(expiryDate?: number): boolean {
  if (!expiryDate) {
    return false;
  }

  const bufferTime = 5 * 60 * 1000;
  return Date.now() >= expiryDate - bufferTime;
}

export async function requireAuth(): Promise<AuthSession> {
  const session = await getAuthSession();
  if (!session) {
    throw new AuthError("Authentication required");
  }
  return session;
}
