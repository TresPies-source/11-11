import NextAuth, { Session, User } from "next-auth";
import { JWT } from "next-auth/jwt";
import GoogleProvider from "next-auth/providers/google";

const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === "true";

if (isDevMode) {
  console.warn(
    "[NextAuth] Running in dev mode - authentication may use mock tokens"
  );
}

async function refreshAccessToken(refreshToken: string): Promise<{
  access_token: string;
  expiry_date: number;
}> {
  const url = "https://oauth2.googleapis.com/token";
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID || "",
    client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  if (!response.ok) {
    throw new Error("Failed to refresh access token");
  }

  const data = await response.json();

  return {
    access_token: data.access_token,
    expiry_date: Date.now() + data.expires_in * 1000,
  };
}

export const { auth, handlers, signIn, signOut } = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      authorization: {
        params: {
          scope: [
            "openid",
            "https://www.googleapis.com/auth/userinfo.email",
            "https://www.googleapis.com/auth/userinfo.profile",
            "https://www.googleapis.com/auth/drive.file",
            "https://www.googleapis.com/auth/drive.readonly",
          ].join(" "),
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, account, user }): Promise<JWT> {
      if (account && user) {
        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          expiryDate: account.expires_at ? account.expires_at * 1000 : undefined,
          user,
        };
      }

      if (token.expiryDate && typeof token.expiryDate === "number") {
        const tokenExpired = Date.now() >= token.expiryDate;
        if (tokenExpired && token.refreshToken) {
          try {
            const refreshedTokens = await refreshAccessToken(
              token.refreshToken as string
            );
            return {
              ...token,
              accessToken: refreshedTokens.access_token,
              expiryDate: refreshedTokens.expiry_date,
            };
          } catch (error) {
            console.error("[NextAuth] Failed to refresh access token:", error);
            return {
              ...token,
              error: "RefreshAccessTokenError",
            };
          }
        }
      }

      return token;
    },
    async session({ session, token }): Promise<Session> {
      return {
        ...session,
        accessToken: token.accessToken as string,
        refreshToken: token.refreshToken as string,
        expiryDate: token.expiryDate as number,
        error: token.error as string | undefined,
      };
    },
  },
  pages: {
    signIn: "/",
    error: "/",
  },
  secret: process.env.NEXTAUTH_SECRET,
});

console.log("[Auth] Migration to v5 successful");
