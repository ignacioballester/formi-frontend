import { getAppServerSession } from "./auth-server";
import { TokenExpiredIAMError } from "./iam"; // Used as one of the trigger errors

/**
 * Custom error for when a generic API (e.g., Formi API) signals token expiry,
 * typically via a 498 status code.
 */
export class ApiTokenExpiredError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApiTokenExpiredError";
  }
}

/**
 * Custom error for when the token refresh mechanism (e.g., re-fetching the session)
 * fails to yield a new token or the process itself encounters an error.
 */
export class TokenRefreshFailedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TokenRefreshFailedError";
  }
}

/**
 * A function type that describes how to get the current access token.
 * It's expected that calling this function again after a token expiry error
 * will trigger any underlying refresh mechanisms (like NextAuth's JWT callback).
 */
export type GetTokenFn = () => Promise<string | null | undefined>;

/**
 * Executes an API call with a mechanism to refresh the token and retry once
 * if a specific token expired error is encountered.
 *
 * @param apiCallFn A function that takes an access token and performs the API call.
 *                  It should throw an instance of `ExpiredTokenErrorClass1` or `ExpiredTokenErrorClass2`
 *                  if the token is rejected as expired by the target API.
 * @param getTokenFn A function that retrieves the current access token.
 *                   Calling it again is expected to trigger NextAuth's refresh logic if the token was stale.
 * @param ExpiredTokenErrorClass1 The primary error class constructor (e.g., `TokenExpiredIAMError` or `ApiTokenExpiredError`)
 *                                that indicates a token expired condition and should trigger a retry.
 * @param ExpiredTokenErrorClass2 An optional secondary error class constructor for token expiry.
 * @returns The result of the API call (type T).
 * @throws {TokenRefreshFailedError} if the token refresh attempt fails or doesn't yield a new token.
 * @throws The error from the second API call attempt if it also fails (could be another token expired error or a different error).
 * @throws Any other error from the first API call attempt if it's not one of the specified token expired errors.
 * @throws An Error if no initial token can be obtained.
 */
export async function executeWithRetryOnTokenExpiry<T>(
  apiCallFn: (token: string) => Promise<T>,
  getTokenFn: GetTokenFn,
  ExpiredTokenErrorClass1: { new(message: string): Error },
  ExpiredTokenErrorClass2?: { new(message: string): Error }
): Promise<T> {
  const initialToken = await getTokenFn();

  if (!initialToken) {
    console.error("[executeWithRetryOnTokenExpiry] No initial token obtained via getTokenFn.");
    throw new Error("Authentication token not available for API call (initial fetch).");
  }

  try {
    return await apiCallFn(initialToken);
  } catch (error: any) {
    const isExpiredError1 = error instanceof ExpiredTokenErrorClass1;
    const isExpiredError2 = ExpiredTokenErrorClass2 && error instanceof ExpiredTokenErrorClass2;

    if (isExpiredError1 || isExpiredError2) {
      console.warn(`[executeWithRetryOnTokenExpiry] Token expired error caught (Name: "${error.name}", Message: "${error.message}"). Initial token (first 40 chars): ${initialToken?.substring(0,40)}. Attempting token refresh and retry.`);

      const newToken = await getTokenFn(); // Attempt to get a (potentially) refreshed token
      console.log(`[executeWithRetryOnTokenExpiry] New token after refresh attempt (first 40 chars): ${newToken?.substring(0,40)}`);

      if (!newToken) {
        console.error("[executeWithRetryOnTokenExpiry] Failed to obtain a token after refresh attempt (getTokenFn returned null/undefined).");
        throw new TokenRefreshFailedError("Failed to obtain a token after refresh attempt.");
      }

      if (newToken === initialToken) {
        console.warn("[executeWithRetryOnTokenExpiry] Token did not change after refresh attempt. The refresh mechanism might have failed, the token was still valid and re-fetched, or the downstream service has strict/fast expiry. Retrying call.");
      } else {
        console.log("[executeWithRetryOnTokenExpiry] Obtained a new token. Retrying API call.");
      }

      try {
        return await apiCallFn(newToken); // Retry with the new (or same, if refresh failed to change it) token
      } catch (retryError: any) {
        console.error(`[executeWithRetryOnTokenExpiry] API call failed on retry. Error Name: "${retryError.name}", Message: "${retryError.message || retryError}"`);
        throw retryError; // Propagate error from the second attempt
      }
    } else {
      // Not one ofthe specified token expired errors
      console.error(`[executeWithRetryOnTokenExpiry] Non-token-expiry error during API call. Error Name: "${error.name}", Message: "${error.message || error}"`);
      throw error; // Re-throw other errors
    }
  }
}

/**
 * Server-side specific implementation of GetTokenFn.
 * Retrieves the access token from the server session.
 */
export const getServerToken: GetTokenFn = async () => {
  const session = await getAppServerSession();
  return session?.accessToken;
};

// Note: A getClientToken function would typically use `getSession` from "next-auth/react"
// and would need to be defined and used in a client-side context.
// Example (for illustration, not directly usable in this .ts file if it's server-only):
/*
import { getSession } from "next-auth/react";
export const getClientToken: GetTokenFn = async () => {
  if (typeof window === "undefined") return null; // Ensure client-side
  const session = await getSession();
  return session?.accessToken;
};
*/ 