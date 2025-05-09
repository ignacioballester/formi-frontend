// Removed import { getAuthToken } from './auth';

// Consolidate to a single IAM_API_BASE_URL
const IAM_API_BASE_URL = `${process.env.NEXT_PUBLIC_IAM_API_URL || "http://localhost:8081"}`; 

// --- Custom Error for Token Expiry from IAM ---
export class TokenExpiredIAMError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TokenExpiredIAMError";
  }
}

// --- Import retry utility and server token getter ---
import { executeWithRetryOnTokenExpiry, getServerToken, TokenRefreshFailedError, GetTokenFn } from "./api-retry";

// --- Interfaces from lib/iam-api.ts ---
export interface IAMUser {
    username: string;
    email?: string | null;
    id: string;
}

export interface IAMGroup {
    name: string;
    id?: string;
    sub_groups?: IAMGroup[];
    members?: IAMUser[];
}

export interface RoleAssignment {
    resource_name: string;
    principal_id: string;
    principal_type: "user" | "group";
    role_name: string;
}

export interface ErrorResponse {
    code?: string;
    message?: string;
    details?: any;
    error?: string; 
}

export interface IAMRole {
    name: string;
    resource_type: "enterprise" | "organization" | "project";
    display_name: string;
    permissions: string[];
}

// --- API Helper for IAM (from lib/iam-api.ts, now expects token from retry wrapper) ---
async function fetchIAMAPIInternal<T>(token: string, endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${IAM_API_BASE_URL}${endpoint}`;

    // Token is now guaranteed to be a string by the executeWithRetryOnTokenExpiry wrapper
    // or the initial check within it.

    const defaultOptions: RequestInit = {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
    };
    const mergedOptions = { ...defaultOptions, ...options };
    mergedOptions.headers = { ...defaultOptions.headers, ...options.headers };

    let response: Response;
    try {
        response = await fetch(url, mergedOptions);
    } catch (networkError) {
        console.error("[IAM API] Network error:", networkError);
        // Changed to throw a standard Error
        throw new Error("Network error occurred contacting IAM API.");
    }

    // --- Specific check for 498 (Token Expired/Invalid from IAM) ---
    if (response.status === 498) {
        let errorDetail = `IAM API returned 498 (Token Expired/Invalid) for endpoint: ${endpoint}.`;
        try {
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
                const errorJson: ErrorResponse = await response.json(); // Assuming ErrorResponse can capture 498 details
                errorDetail = errorJson.message || errorJson.error || `IAM API returned 498: ${JSON.stringify(errorJson)}`;
            } else {
                const errorText = await response.text();
                errorDetail = `IAM API returned 498. Response: ${errorText.substring(0, 200)}...`; // Increased substring length
            }
        } catch (e) { 
            console.warn("[IAM API Internal] Could not parse error response body for 498 status:", e);
        }
        console.warn(`[IAM API Internal] Throwing TokenExpiredIAMError to trigger retry: ${errorDetail}`);
        throw new TokenExpiredIAMError(errorDetail);
    }
    // --- End of 498 check ---

    if (!response.ok) {
        let errorDetail: string | object = `IAM API request failed with status ${response.status} for endpoint ${endpoint}.`;
        try {
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
                const errorJson: ErrorResponse = await response.json();
                errorDetail = errorJson.error || errorJson.message || errorDetail;
            } else {
                const errorText = await response.text();
                errorDetail = `${errorDetail} Response: ${errorText.substring(0, 100)}...`;
            }
        } catch (e) { 
             try {
                 const errorText = await response.text();
                 errorDetail = `${errorDetail} Could not parse error response. Body: ${errorText.substring(0,100)}...`;
             } catch (textErr) { /* Ignore */ }
        }
        console.error("[IAM API] Error:", errorDetail);
        throw new Error(typeof errorDetail === 'string' ? errorDetail : JSON.stringify(errorDetail));
    }
 
    let responseText = ""; // Declare here to be available in catch
    try {
        responseText = await response.text(); // Get text first

        if (response.status === 204 && options.method?.toUpperCase() === 'DELETE') {
            return {} as T; 
        }
        
        if (!responseText) { // Handle empty successful responses (e.g. 201 with no content)
            return {} as T; 
        }
        return JSON.parse(responseText) as T; // Parse text to JSON
    } catch (parseError) {
        console.error("[IAM API] Failed to parse successful response as JSON:", parseError);
        console.error("Response text that failed to parse:", responseText.substring(0, 200));
        throw new Error("IAM API returned success status but failed to provide valid JSON.");
    }
}

// --- Public-facing fetchIAMAPI that uses the retry mechanism ---
async function fetchIAMAPI<T>(
    endpoint: string, 
    options: RequestInit = {}, 
    tokenOrProvider?: string | GetTokenFn
): Promise<T> {
    if (typeof tokenOrProvider === 'string') {
        // If a direct token string is provided, call internal fetch directly.
        // No retry-on-expiry logic here as we don't have a mechanism to refresh a static token.
        // If the static token is expired, fetchIAMAPIInternal will throw TokenExpiredIAMError.
        try {
            return await fetchIAMAPIInternal<T>(tokenOrProvider, endpoint, options);
        } catch (error) {
            // Log or handle as needed, then rethrow.
            // console.error(`[fetchIAMAPI with static token] Error: ${error}`);
            throw error;
        }
    } else {
        // If a token provider function is provided, or defaulting to getServerToken
        const tokenProviderToUse = tokenOrProvider || getServerToken;
        const apiCallFn = (token: string) => fetchIAMAPIInternal<T>(token, endpoint, options);
    
        return executeWithRetryOnTokenExpiry<T>(
            apiCallFn,
            tokenProviderToUse,
            TokenExpiredIAMError // Only one ExpiredTokenErrorClass for IAM
            // No second ExpiredTokenErrorClass needed here
        );
    }
}

// --- Existing Authorization functions from lib/iam.ts ---
interface AuthorizationCheckInput {
  resource_name: string;
  scopes?: string[];
}
interface AuthorizationCheckResult {
  authorized: boolean;
}
export async function isUserAuthorized(
  resourceName: string,
  scopes?: string[],
  accessToken?: string
): Promise<boolean> {
  // Token is now passed optionally
  // if (!token) { // This check is now nuanced
  //   console.error('[isUserAuthorized] No auth token provided for IAM check. Token is undefined or null.');
  //   return false;
  // }
  
  const body: AuthorizationCheckInput = {
    resource_name: resourceName,
    ...(scopes && { scopes }),
  };

  try {
    // console.log(`[isUserAuthorized] Calling fetchIAMAPI for /authorization/check with body:`, JSON.stringify(body));
    // Pass the accessToken to fetchIAMAPI if available
    const result = await fetchIAMAPI<AuthorizationCheckResult>(
        '/authorization/check', 
        {
            method: 'POST',
            body: JSON.stringify(body),
        },
        accessToken // Pass the accessToken here
    );
    // console.log("[isUserAuthorized] IAM check successful. Authorized:", result.authorized);
    return result.authorized;
  } catch (error: any) {
    // Check for TokenRefreshFailedError specifically, if we want to handle it before general error.
    if (error instanceof TokenRefreshFailedError) {
        console.error(`[isUserAuthorized] Token refresh failed during IAM check: ${error.message}`);
        return false;
    }
    // TokenExpiredIAMError (if it still leaks after retry, meaning retry also failed with it) 
    // or any other error from executeWithRetryOnTokenExpiry/fetchIAMAPIInternal.
    console.error(`[isUserAuthorized] Error during IAM authorization check: ${error.name} - ${error.message || error}`);
    return false; 
  }
}

export async function checkEnterpriseUpdatePermission(
): Promise<boolean> {
    const enterpriseResourceName = 'enterprise-1';
    // No accessToken argument needed here, it will use getServerToken by default
    return isUserAuthorized(enterpriseResourceName, ['update_enterprise']); // Call without token
}

// --- Merged IAM API Functions (now use the new fetchIAMAPI signature) ---
// These functions are generally server-side if not passed a token/provider.
// If they need to be client-callable with a client token, their signatures would also need updating.
// For now, assuming they remain server-oriented or are called from places that can provide a GetTokenFn.

// Users
export const getUsers = (tokenOrProvider?: string | GetTokenFn) => fetchIAMAPI<IAMUser[]>("/users", {}, tokenOrProvider);
export const getUserById = (id: string, tokenOrProvider?: string | GetTokenFn) => fetchIAMAPI<IAMUser>(`/users/${id}`, {}, tokenOrProvider);
export const getUserByUsername = (username: string, tokenOrProvider?: string | GetTokenFn) => fetchIAMAPI<IAMUser>(`/users/username/${username}`, {}, tokenOrProvider);

// Groups
export const getGroups = (tokenOrProvider?: string | GetTokenFn) => fetchIAMAPI<IAMGroup[]>("/groups", {}, tokenOrProvider);
export const getGroupById = (id: string, tokenOrProvider?: string | GetTokenFn) => fetchIAMAPI<IAMGroup>(`/groups/${id}`, {}, tokenOrProvider);
export const getGroupByName = (name: string, tokenOrProvider?: string | GetTokenFn) => fetchIAMAPI<IAMGroup>(`/groups/name/${name}`, {}, tokenOrProvider);

// Role Assignments
export const createRoleAssignment = (assignment: RoleAssignment, tokenOrProvider?: string | GetTokenFn) => 
    fetchIAMAPI<void>("/role-assignments", {
        method: "POST",
        body: JSON.stringify(assignment),
    }, tokenOrProvider);

export const removeRoleAssignment = (assignment: RoleAssignment, tokenOrProvider?: string | GetTokenFn) => 
    fetchIAMAPI<void>("/role-assignments", {
        method: "DELETE",
        body: JSON.stringify(assignment),
    }, tokenOrProvider);

export const getRoleAssignmentsOnResource = (resourceName: string, tokenOrProvider?: string | GetTokenFn) => 
    fetchIAMAPI<RoleAssignment[]>(`/role-assignments/resources/${encodeURIComponent(resourceName)}`, {}, tokenOrProvider);

export const getRoleAssignmentsOnPrincipal = (principalType: "user" | "group", principalId: string, tokenOrProvider?: string | GetTokenFn) => 
    fetchIAMAPI<RoleAssignment[]>(`/role-assignments/principals/${principalType}/${encodeURIComponent(principalId)}`, {}, tokenOrProvider);

// Roles 
export const getRolesByResourceType = (resourceType: "enterprise" | "organization" | "project", tokenOrProvider?: string | GetTokenFn) =>
    fetchIAMAPI<IAMRole[]>(`/roles?resource_type=${resourceType}`, {}, tokenOrProvider);

// Note: The `checkAuthorization` function from `lib/iam-api.ts` was a duplicate of `isUserAuthorized`
// and has been omitted. `isUserAuthorized` is the function to use for permission checks. 