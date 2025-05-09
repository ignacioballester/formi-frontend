import { getServerSession } from "next-auth/next"
import type { Session } from "next-auth"
import { authOptions } from "./auth"
import { isUserAuthorized } from "./iam"
import { TokenRefreshFailedError } from "./api-retry"

/**
 * Gets the current session on the server.
 * @returns The session object or null if not authenticated.
 */
export const getAppServerSession = async (): Promise<Session | null> => {
  return await getServerSession(authOptions)
}

/**
 * Checks a permission for the current user on the server side.
 * 
 * @param resourceName The name of the resource.
 * @param scopes An array of scopes/permissions to check for.
 * @returns True if authorized, false otherwise.
 */
export const checkServerSidePermission = async (
  resourceName: string,
  scopes: string[]
): Promise<boolean> => {
  try {
    console.log("[checkServerSidePermission] Attempting authorization. Retry logic is now within isUserAuthorized.")
    return await isUserAuthorized(resourceName, scopes)
  } catch (error: any) {
    if (error instanceof TokenRefreshFailedError) {
      console.error(`[checkServerSidePermission] Token refresh ultimately failed during permission check: ${error.message}`)
    } else {
      console.error(`[checkServerSidePermission] Unhandled error during permission check: ${error.name} - ${error.message || error}`)
    }
    return false
  }
}

// Example usage in a Server Component or Route Handler:
// import { checkServerSidePermission } from '@/lib/auth-server'
// async function MyServerComponent() {
//   const canUpdateSettings = await checkServerSidePermission('enterprise-1', ['update_enterprise'])
//   if (!canUpdateSettings) { return <p>Not Authorized</p> }
//   return <SettingsPage />
// }
