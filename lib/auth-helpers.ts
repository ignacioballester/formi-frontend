/**
 * Retrieves the auth token from localStorage.
 * Returns an empty string if localStorage is unavailable or token is not found.
 */
export function getAuthToken(): string {
  if (typeof window !== "undefined") {
    return localStorage.getItem("auth_token") || "";
  }
  return "";
} 