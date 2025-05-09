import type { NextAuthOptions, User, Account } from "next-auth"
import type { JWT } from "next-auth/jwt"
import KeycloakProvider from "next-auth/providers/keycloak"

// This JWT is what gets stored in the session cookie.
// We want to make it as small as possible.
interface AppJWT extends JWT {
  sub?: string; // User ID
  name?: string | null;
  email?: string | null;
  picture?: string | null;
  accessToken?: string;
  accessTokenExpires?: number;
  refreshToken?: string; // Needed for refresh
  error?: string;
  // id_token is not part of the JWT stored in the cookie for size reasons
}

// Helper function to request a token refresh
async function refreshAccessToken(token: AppJWT): Promise<AppJWT> {
  console.log("[Refresh Token] Attempting refresh. Current AppJWT:", {
     accessToken: !!token.accessToken,
     accessTokenExpires: token.accessTokenExpires ? new Date(token.accessTokenExpires) : "N/A",
     refreshToken: !!token.refreshToken,
     error: token.error,
  });
  try {
    if (!token.refreshToken) {
        console.error("[Refresh Token] No refresh token available. Cannot refresh.");
        return { ...token, error: "MissingRefreshTokenError" };
    }
    const params = new URLSearchParams({
        client_id: process.env.KEYCLOAK_CLIENT_ID!,
        client_secret: process.env.KEYCLOAK_CLIENT_SECRET!,
        grant_type: "refresh_token",
        refresh_token: token.refreshToken,
    });
    console.log("[Refresh Token] Sending refresh request to Keycloak with params:", params.toString());

    const response = await fetch(`${process.env.KEYCLOAK_ISSUER_URL}/protocol/openid-connect/token`, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      method: "POST",
      body: params,
    });

    const refreshedTokens = await response.json();
    console.log("[Refresh Token] Raw response from Keycloak:", refreshedTokens);

    if (!response.ok) {
      console.error("[Refresh Token] Keycloak refresh request failed:", { status: response.status, body: refreshedTokens });
      return {
        ...token,
        error: "RefreshAccessTokenError",
      };
    }

    const newExpiresIn = Number(refreshedTokens.expires_in); // Keycloak returns expires_in in seconds
    const newAccessTokenExpires = Date.now() + newExpiresIn * 1000;

    console.log(`[Refresh Token] Tokens refreshed successfully. New 'expires_in': ${newExpiresIn}s, new 'accessTokenExpires': ${new Date(newAccessTokenExpires)}`);
    return {
      // Explicitly list properties from AppJWT that should be preserved or updated
      sub: token.sub, 
      name: token.name,
      email: token.email,
      picture: token.picture,
      accessToken: refreshedTokens.access_token,
      accessTokenExpires: newAccessTokenExpires,
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken, 
      error: undefined, // Clear previous error
      // Do not spread ...token to avoid carrying over any unexpected properties
    };
  } catch (error: any) {
    console.error("[Refresh Token] Catch block error during token refresh:", error);
    // Preserve existing fields from token but update error status
    return { 
      ...token, 
      error: "RefreshCatchError", 
      errorMessage: error.message 
    }; 
  }
}

// Helper to extract user info from account/profile if needed
// This function seems unused, can be removed if not needed elsewhere
// function getUserFromAccount(account: Account | null, token: JWT): User {
//     return {
//         id: token.sub ?? account?.providerAccountId, 
//         name: token.name, 
//         email: token.email, 
//         image: token.picture, 
//     }
// }

export const authOptions: NextAuthOptions = {
  providers: [
    KeycloakProvider({
      clientId: process.env.KEYCLOAK_CLIENT_ID!,
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET!,
      issuer: process.env.KEYCLOAK_ISSUER_URL,
      // Attempt to pass options to openid-client
      client: {
        // Standard openid-client options can be placed here.
        // The `debug` property for openid-client itself is not a standard option
        // for the constructor, but some libraries allow passing arbitrary options.
        // This is an attempt to see if it has any effect or if NextAuth passes it through.
        // More commonly, openid-client debugging is enabled via NODE_DEBUG=openid-client env var.
        // However, let's try passing a custom logger or introspection settings if that seems more plausible.
        // For now, just an arbitrary property to see if it appears anywhere or if we can hook in.
        // token_endpoint_auth_method: 'client_secret_post', // Example: ensure specific auth method
        // Alternatively, one might try to hook custom request/response logging if the library supports it.
      },
      // Ensure profile callback correctly maps Keycloak profile to NextAuth user object
      profile(profile) {
        // Profile is called on initial sign-in. Info here is merged into the `user` object in JWT callback.
        console.log("[Keycloak Profile Callback] Profile received:", profile);
        return {
          id: profile.sub!, 
          name: profile.name ?? profile.preferred_username,
          email: profile.email,
          image: profile.picture,
          // Other claims from profile can be added here to be available in `user` obj of jwt callback
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, user, trigger }): Promise<JWT> { // Ensure return is always JWT (AppJWT conforms to JWT)
      let internalToken = token as AppJWT;

      if (account && user && (trigger === "signIn" || trigger === "signUp")) {
        console.log("[JWT Callback] Initial sign in/up. Trigger:", trigger);
        console.log("[JWT Callback] Raw 'account' object from Keycloak:", JSON.stringify(account, null, 2));
        console.log("[JWT Callback] Raw 'user' object (from profile callback):", JSON.stringify(user, null, 2));
        
        console.log("[JWT Callback] Received Account from Keycloak:", {
            access_token: !!account.access_token,
            expires_at: account.expires_at, // Absolute time in seconds
            expires_in: account.expires_in, // Relative time in seconds
            refresh_token: !!account.refresh_token,
            provider: account.provider,
            type: account.type,
            scope: account.scope,
            id_token: !!account.id_token, // Log presence of id_token
        });
        console.log("[JWT Callback] Received User object:", user);

        // account.expires_at is absolute time in seconds. Convert to ms.
        // If expires_at is present, use it. Otherwise, use expires_in.
        // expires_in is relative (seconds from now).
        let expiresAtMs: number;
        if (typeof account.expires_at === 'number') {
            expiresAtMs = account.expires_at * 1000;
            console.log(`[JWT Callback] Using 'expires_at' from account: ${account.expires_at}s -> ${new Date(expiresAtMs)}`);
        } else if (typeof account.expires_in === 'number') {
            expiresAtMs = Date.now() + account.expires_in * 1000;
            console.log(`[JWT Callback] Using 'expires_in' from account: ${account.expires_in}s. Calculated expiry: ${new Date(expiresAtMs)}`);
        } else {
            // Fallback if neither is present, though Keycloak should provide one.
            // Using a shorter default (e.g., 5 minutes) if your tokens are short-lived (60s) might be problematic
            // as it would assume a longer life than actual if Keycloak doesn't send expiry.
            // Let's assume Keycloak will provide at least expires_in.
            // If Keycloak tokens are truly 60s, and expires_in is missing, this is an issue with Keycloak response.
            expiresAtMs = Date.now() + 300 * 1000; // Defaulting to 5 mins for now if totally missing
            console.warn(`[JWT Callback] Neither 'expires_at' nor 'expires_in' found on account. Defaulting to 5 mins: ${new Date(expiresAtMs)}`);
        }
        
        internalToken = {
          sub: user.id,
          name: user.name,
          email: user.email,
          picture: user.image,
          accessToken: account.access_token,
          accessTokenExpires: expiresAtMs,
          refreshToken: account.refresh_token,
          error: undefined,
        };
        console.log("[JWT Callback] Constructed initial AppJWT. AccessToken Present:", !!internalToken.accessToken, "RefreshToken Present:", !!internalToken.refreshToken, "Expires:", internalToken.accessTokenExpires ? new Date(internalToken.accessTokenExpires) : "N/A");
        return internalToken as JWT; // Ensure this is cast to JWT for NextAuth type system
      }

      // On subsequent calls, token is the AppJWT from the cookie
      console.log("[JWT Callback] Subsequent call. Current AppJWT state before validity check:", {
        accessToken: !!internalToken.accessToken,
        accessTokenExpires: internalToken.accessTokenExpires ? new Date(internalToken.accessTokenExpires) : "N/A",
        refreshToken: !!internalToken.refreshToken,
        error: internalToken.error,
      });

      if (typeof internalToken.accessTokenExpires !== 'number' || internalToken.accessTokenExpires === 0) {
        console.error("[JWT Callback] Invalid or missing accessTokenExpires before refresh check. Token:", internalToken);
        internalToken.error = "InvalidExpiryError";
        // Do not return null, return token with error. Session callback will handle it.
        return internalToken as JWT; 
      }

      const now = Date.now();
      const bufferSeconds = 15; // Refresh when 15 seconds are left
      const shouldRefresh = now >= (internalToken.accessTokenExpires - bufferSeconds * 1000);

      console.log(`[JWT Callback] Checking token validity. Now: ${new Date(now)}, Expires: ${new Date(internalToken.accessTokenExpires)}, Buffer: ${bufferSeconds}s, ShouldRefresh: ${shouldRefresh}, CurrentError: ${internalToken.error}`);

      if (!shouldRefresh && !internalToken.error) { // Also ensure no pre-existing error
          console.log("[JWT Callback] Token still valid and no error. Returning current token.");
          return internalToken as JWT;
      }
      
      if (internalToken.error) {
        console.log(`[JWT Callback] Token has pre-existing error: '${internalToken.error}'. Attempting refresh if refresh token exists.`);
      } else if (shouldRefresh) {
        console.log("[JWT Callback] Token needs refresh. Calling refreshAccessToken...");
      }
      
      // Only attempt refresh if there's a refresh token
      if (!internalToken.refreshToken) {
        console.error("[JWT Callback] No refresh token available. Cannot refresh. Returning token with error 'MissingRefreshTokenError'.");
        internalToken.error = "MissingRefreshTokenError";
        return internalToken as JWT;
      }

      internalToken = await refreshAccessToken(internalToken); // This might set internalToken.error
      
      if (internalToken.error) {
        console.error("[JWT Callback] refreshAccessToken resulted in an error:", internalToken.error, internalToken.errorMessage ? `Details: ${internalToken.errorMessage}` : '');
      } else {
        console.log("[JWT Callback] Token refreshed successfully. New Expiry:", internalToken.accessTokenExpires ? new Date(internalToken.accessTokenExpires) : "N/A");
      }
      return internalToken as JWT;
    },
    async session({ session, token }) { // token here is AppJWT from jwt callback
      const appToken = token as AppJWT;
      console.log("[Session Callback] Processing token for session. AppJWT state:", {
        sub: appToken.sub,
        accessToken: !!appToken.accessToken,
        error: appToken.error,
        errorMessage: (appToken as any).errorMessage // If we added it
      });

      if (appToken.error || !appToken.accessToken) {
        console.warn("[Session Callback] Error on token or no accessToken. Client session will be invalid or error state.", { error: appToken.error, hasAccessToken: !!appToken.accessToken });
        delete session.user;
        delete session.accessToken;
        session.error = appToken.error || "MissingAccessTokenError";
      } else {
        session.user = {
            id: appToken.sub,
            name: appToken.name,
            email: appToken.email,
            image: appToken.picture,
        };
        session.accessToken = appToken.accessToken;
        delete session.error; // Clear any previous session error if token is now valid
        console.log("[Session Callback] Session updated successfully with new accessToken.");
      }
      return session;
    },
  },
  pages: {
    error: "/login", // Redirect to login on error, e.g. RefreshAccessTokenError
  },
  session: {
    strategy: "jwt",
  },
  debug: true,
  events: {
    async signIn(message) { 
      console.log("[NextAuth Event] signIn - message:", JSON.stringify(message, null, 2));
      if (message.account) {
        console.log("[NextAuth Event] signIn - account:", JSON.stringify(message.account, null, 2));
      }
      if (message.profile) {
        console.log("[NextAuth Event] signIn - profile (from OIDC provider, pre-mapping):", JSON.stringify(message.profile, null, 2));
      }
      if (message.user) {
        console.log("[NextAuth Event] signIn - user (after profile mapping):", JSON.stringify(message.user, null, 2));
      }
      if (message.isNewUser) {
        console.log("[NextAuth Event] signIn - isNewUser:", message.isNewUser);
      }
    },
    async signOut(message) {
      console.log("[NextAuth Event] signOut:", JSON.stringify(message, null, 2));
    },
    async createUser(message) {
      console.log("[NextAuth Event] createUser:", JSON.stringify(message, null, 2));
    },
    async updateUser(message) {
      console.log("[NextAuth Event] updateUser:", JSON.stringify(message, null, 2));
    },
    async linkAccount(message) {
      console.log("[NextAuth Event] linkAccount:", JSON.stringify(message, null, 2));
    },
    async session(message) {
      // This event logs on every session access, can be very verbose
      // console.log("[NextAuth Event] session:", JSON.stringify(message, null, 2));
    },
  }
}

// Removed redundant type declarations. These should be in `types/next-auth.d.ts`
// declare module "next-auth" { ... }
// declare module "next-auth/jwt" { ... }
