import { getAuthToken } from "./auth-helpers"; // Assuming getAuthToken can be shared or moved

// --- Configuration ---
const IAM_API_BASE_URL = `${process.env.NEXT_PUBLIC_IAM_API_URL || "http://localhost:8081"}`;

// --- Interfaces (Based on IAM OpenAPI Spec) ---
export interface IAMUser {
    username: string;
    email?: string | null;
    // Add other fields from spec if needed
}

export interface IAMGroup {
    name: string;
    id?: string;
    sub_groups?: IAMGroup[];
    members?: IAMUser[];
    // Add other fields from spec if needed
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
    error?: string; // Adding generic error field seen in other spec
}

// --- API Helper for IAM --- 
// Reusing error handling logic similar to fetchAPI from lib/api.ts
async function fetchIAMAPI<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${IAM_API_BASE_URL}${endpoint}`;
    let token = getAuthToken();

    const defaultOptions: RequestInit = {
        headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
        },
    };

    const mergedOptions = { ...defaultOptions, ...options };
    mergedOptions.headers = { ...defaultOptions.headers, ...options.headers };

    let response: Response;
    try {
        response = await fetch(url, mergedOptions);
    } catch (networkError) {
        console.error("[IAM API] Network error:", networkError);
        throw new Error("Network error occurred contacting IAM API.");
    }

    if (!response.ok) {
        let errorDetail: string | object = `IAM API request failed with status ${response.status}.`;
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
                 const errorText = await response.text(); // Attempt to read as text if json fails
                 errorDetail = `${errorDetail} Could not parse error response. Body: ${errorText.substring(0,100)}...`;
             } catch (textErr) { /* Ignore if text also fails */ }
        }
        console.error("[IAM API] Error:", errorDetail);
        throw new Error(typeof errorDetail === 'string' ? errorDetail : JSON.stringify(errorDetail));
    }

    // Handle successful response 
    try {
        // Handle 204 No Content specifically for DELETE requests
        if (response.status === 204 && options.method?.toUpperCase() === 'DELETE') {
            return {} as T; // Or return null, undefined, or a specific success indicator
        }
        return await response.json();
    } catch (parseError) {
        console.error("[IAM API] Failed to parse successful response as JSON:", parseError);
        const responseText = await response.text();
        console.error("Response text:", responseText.substring(0, 200));
        throw new Error("IAM API returned success status but failed to provide valid JSON.");
    }
}

// --- IAM API Functions ---

// Users
export const getUsers = () => fetchIAMAPI<IAMUser[]>("/users");

export const getUserById = (id: string) => fetchIAMAPI<IAMUser>(`/users/${id}`);

export const getUserByUsername = (username: string) => fetchIAMAPI<IAMUser>(`/users/username/${username}`);

// Groups
export const getGroups = () => fetchIAMAPI<IAMGroup[]>("/groups");

export const getGroupById = (id: string) => fetchIAMAPI<IAMGroup>(`/groups/${id}`);

export const getGroupByName = (name: string) => fetchIAMAPI<IAMGroup>(`/groups/name/${name}`);

// Role Assignments
export const createRoleAssignment = (assignment: RoleAssignment) => 
    fetchIAMAPI<void>("/role-assignments", { // Expect 201, no body needed?
        method: "POST",
        body: JSON.stringify(assignment),
    });

export const removeRoleAssignment = (assignment: RoleAssignment) => 
    fetchIAMAPI<void>("/role-assignments", { // Expect 204
        method: "DELETE",
        body: JSON.stringify(assignment),
    });

export const getRoleAssignmentsOnResource = (resourceName: string) => 
    fetchIAMAPI<RoleAssignment[]>(`/role-assignments/resources/${encodeURIComponent(resourceName)}`);

export const getRoleAssignmentsOnPrincipal = (principalType: "user" | "group", principalId: string) => 
    fetchIAMAPI<RoleAssignment[]>(`/role-assignments/principals/${principalType}/${encodeURIComponent(principalId)}`);

// Authorization Check
export interface AuthorizationCheckInput {
    resource_name: string;
    scopes?: string[];
}

export interface AuthorizationCheckResult {
    authorized: boolean;
}

export const checkAuthorization = (input: AuthorizationCheckInput) => 
    fetchIAMAPI<AuthorizationCheckResult>("/authorization/check", {
        method: "POST",
        body: JSON.stringify(input),
    });

// Roles (Example - might not be needed by frontend directly often)
export interface IAMRole {
    name: string;
    resource_type: "enterprise" | "organization" | "project";
    display_name: string;
    permissions: string[];
}

export const getRolesByResourceType = (resourceType: "enterprise" | "organization" | "project") =>
    fetchIAMAPI<IAMRole[]>(`/roles?resource_type=${resourceType}`);
