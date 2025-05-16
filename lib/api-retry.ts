import { getAppServerSession } from "./auth-server";

/**
 * Custom error for when a generic API (e.g., Formi API) signals token expiry,
 * typically via a 498 status code. This might be less relevant if proactive
 * refresh prevents most 498s, but can be used if a token becomes invalid despite refresh attempts.
 */
export class ApiTokenExpiredError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApiTokenExpiredError";
  }
}

/**
 * Custom error for when the token refresh mechanism (e.g., NextAuth's JWT callback 
 * or direct refresh attempts) fails to yield a new token or the process itself 
 * encounters an error. This can be thrown by `getServerToken` if `session.error` is present.
 */
export class TokenRefreshFailedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TokenRefreshFailedError";
  }
}

/**
 * A function type that describes how to get the current access token.
 * It's expected that calling this function will leverage NextAuth's session 
 * management, which should include token refresh logic within its JWT callback.
 */
export type GetTokenFn = () => Promise<string | null | undefined>;


/**
 * Server-side specific implementation of GetTokenFn.
 * Retrieves the access token from the server session. It relies on NextAuth's 
 * JWT callback (configured in `authOptions`) to have already refreshed the 
 * token if it was stale when `getAppServerSession` was invoked.
 *
 * @returns The access token, or null/undefined if no session or token is available.
 * @throws {TokenRefreshFailedError} if the session contains an error (e.g., refresh failed in JWT callback).
 */
export const getServerToken: GetTokenFn = async () => {
  const session = await getAppServerSession();
  
  if (session?.error) {
    console.error(`[getServerToken] Session indicates an error (potentially from JWT callback refresh failure): ${session.error}`);
    throw new TokenRefreshFailedError(`Failed to get a valid server token due to session error: ${session.error}`);
  }

  if (!session?.accessToken) {
    console.warn("[getServerToken] No access token found in session. This could be due to no active session, or the session object not having an accessToken property.");
    // Depending on strictness, you could throw an error here or allow returning null/undefined.
    // For use with generated API clients that expect a token, throwing might be safer if a token is always required.
    // However, GetTokenFn allows `null | undefined` to be returned.
  }
  
  return session?.accessToken;
};

// The executeWithRetryOnTokenExpiry function is removed as per the new strategy.

// Note: A getClientToken function would typically use `getSession` from "next-auth/react"
// and would need to be defined and used in a client-side context.
// Example (for illustration, not directly usable in this .ts file if it's server-only):
/*
import { getSession } from "next-auth/react";
export const getClientToken: GetTokenFn = async () => {
  if (typeof window === "undefined") return null; // Ensure client-side
  const session = await getSession();
  // Similarly, rely on NextAuth client-side to handle refresh if session is stale.
  if (session?.error) {
     console.error(`[getClientToken] Session contains an error: ${session.error}`);
     throw new TokenRefreshFailedError(`Failed to get client token due to session error: ${session.error}`);
  }
  return session?.accessToken;
};
*/ 