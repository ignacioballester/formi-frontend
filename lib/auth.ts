import type { NextAuthOptions, Session, User, Account } from "next-auth"
import type { JWT } from "next-auth/jwt"
import KeycloakProvider from "next-auth/providers/keycloak"

// Helper function to request a token refresh
async function refreshAccessToken(token: JWT): Promise<JWT> {
  console.log("[Refresh Token] Attempting refresh. Current token:", {
     accessTokenExists: !!token.accessToken,
     refreshTokenExists: !!token.refreshToken,
     expiresAt: token.accessTokenExpires ? new Date(token.accessTokenExpires) : null,
     error: token.error,
  });
  try {
    // Check if refresh token exists before attempting
    if (!token.refreshToken) {
        console.error("[Refresh Token] No refresh token available.");
        throw new Error("Missing refresh token");
    }

    const params = new URLSearchParams({
        client_id: process.env.KEYCLOAK_CLIENT_ID!,
        client_secret: process.env.KEYCLOAK_CLIENT_SECRET!,
        grant_type: "refresh_token",
        refresh_token: token.refreshToken!,
    });
    console.log("[Refresh Token] Sending request to Keycloak token endpoint with params (secret masked):", {
        client_id: params.get("client_id"),
        grant_type: params.get("grant_type"),
        refresh_token_exists: !!params.get("refresh_token"),
    });

    const response = await fetch(`${process.env.KEYCLOAK_ISSUER_URL}/protocol/openid-connect/token`, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      method: "POST",
      body: params,
    });

    const refreshedTokens = await response.json();

    if (!response.ok) {
      console.error("[Refresh Token] Keycloak response not OK:", { status: response.status, body: refreshedTokens });
      throw refreshedTokens;
    }

    console.log("[Refresh Token] Tokens refreshed successfully.");
    return {
      ...token,
      accessTokenExpires: Date.now() + refreshedTokens.expires_in * 1000,
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
      error: undefined,
    };
  } catch (error: any) {
    console.error("[Refresh Token] Catch block error:", error);
    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  }
}

// Helper to extract user info from account/profile if needed
function getUserFromAccount(account: Account | null, token: JWT): User {
    // You might need to adjust this based on where the user info is
    // reliably available (e.g., decoded id_token in token or profile)
    return {
        id: token.sub ?? account?.providerAccountId, // Use sub from JWT if available
        name: token.name, // Use name from JWT
        email: token.email, // Use email from JWT
        image: token.picture, // Use picture from JWT
    }
}

export const authOptions: NextAuthOptions = {
  providers: [
    KeycloakProvider({
      clientId: process.env.KEYCLOAK_CLIENT_ID!,
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET!,
      issuer: process.env.KEYCLOAK_ISSUER_URL,
    }),
  ],
  callbacks: {
    async jwt({ token, account, user }) {
      // Initial sign in
      if (account && user) {
        console.log("Initial sign in, setting essential tokens");
        return {
          accessTokenExpires: Date.now() + (Number(account.expires_in ?? 300)) * 1000,
          refreshToken: account.refresh_token,
          ...token,
          error: undefined,
        };
      }

      const now = Date.now();
      const bufferSeconds = 60;
      const shouldRefresh = token.accessTokenExpires && now >= (token.accessTokenExpires - bufferSeconds * 1000);

      console.log(`[JWT Callback] Checking token validity. Now: ${new Date(now)}, Expires: ${token.accessTokenExpires ? new Date(token.accessTokenExpires) : 'N/A'}, ShouldRefresh: ${shouldRefresh}`);

      if (!shouldRefresh) {
          console.log("[JWT Callback] Token still valid.");
          return token;
      }

      // Access token has expired, try to update it
      console.log("[JWT Callback] Token expired or needs refresh, calling refreshAccessToken...");
      return refreshAccessToken(token);
    },
    async session({ session, token }) {
      // Send properties to the client.
      session.user = {
          id: token.sub,
          name: token.name,
          email: token.email,
          image: token.picture,
      };
      session.error = token.error;

      console.log("Session callback, token error:", token.error);
      console.log("Session callback, session:", session);
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login", // Redirect to login on error
  },
  session: {
    strategy: "jwt",
  },
  debug: process.env.NODE_ENV === "development",
}

// Extend the built-in session types
declare module "next-auth" {
  interface Session {
    error?: string;
    user?: User;
  }
  interface User {
      // Define structure based on your Keycloak profile/token if needed
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessTokenExpires?: number;
    refreshToken?: string;
    error?: string;
    name?: string | null;
    email?: string | null;
    picture?: string | null;
    sub?: string;
  }
}
