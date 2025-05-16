// Removed import { getAuthToken } from './auth';

// Consolidate to a single IAM_API_BASE_URL
const IAM_API_BASE_URL = `${process.env.NEXT_PUBLIC_IAM_API_URL || "http://localhost:8081"}`; 

// --- Custom Error for Token Expiry from IAM (can be re-evaluated if generic ApiTokenExpiredError is preferred) ---
export class TokenExpiredIAMError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TokenExpiredIAMError";
  }
}

// --- Import token getter and error types ---
import { getServerToken, TokenRefreshFailedError, ApiTokenExpiredError } from "./api-retry"; // GetTokenFn is not directly used here anymore but kept for context if other fns need it

// --- Import generated IAM client parts ---
// We import all necessary classes and types from the generated client.
// Note: Specific API classes like UsersApi, GroupsApi, etc., would be imported here if we were re-implementing those functionalities.
import {
    Configuration as IAMConfiguration,
    AuthorizationApi,
    GroupsApi,
    ResourcesApi,
    RoleAssignmentsApi,
    RolesApi,
    UsersApi,
    // DTOs / Types
    AuthorizationCheckInput,
    AuthorizationCheckResult,
    CreateResourceInput,
    CreateResourceInputResourceTypeEnum,
    Group,
    ModelError, // Though typically not returned directly by successful wrapper calls
    PermissionMap,
    Resource,
    ResourceAttributes,
    Role,
    RoleResourceTypeEnum,
    RoleAssignment,
    RoleAssignmentPrincipalTypeEnum,
    User,
    GetRoleAssignmentsOnPrincipalPrincipalTypeEnum, // Enum for getRoleAssignmentsOnPrincipal
    GetRolesByResourceTypeResourceTypeEnum, // Enum for getRolesByResourceType
} from "./generated-api/iam";

// --- Export types for use in UI components ---
export type {
    RoleAssignment, // Used in settings page and actions
    Role,           // Used in settings page (as IAMRole)
    User,           // Used in settings page (as IAMUser) and users page
    Group,          // Used in settings page (as IAMGroup) and groups page
    // Export enums if they are needed directly by consuming code
    CreateResourceInputResourceTypeEnum,
    RoleResourceTypeEnum,
    RoleAssignmentPrincipalTypeEnum,
    GetRoleAssignmentsOnPrincipalPrincipalTypeEnum,
    GetRolesByResourceTypeResourceTypeEnum,
    // Export DTOs if forms need to construct them directly before passing to actions/api functions
    AuthorizationCheckInput, // Example, if a form built this directly
    CreateResourceInput,     // Example
    ResourceAttributes       // Example
};

// --- Configure and instantiate IAM API clients ---
const iamConfig = new IAMConfiguration({
    basePath: IAM_API_BASE_URL,
    accessToken: async () => {
        const token = await getServerToken();
        if (!token) {
            console.error("[IAM Client Cfg] getServerToken returned null or undefined. Throwing TokenRefreshFailedError.");
            throw new TokenRefreshFailedError("Failed to obtain a token for IAM API call (getServerToken returned null/undefined).");
        }
        return token;
    }
});

const authorizationApiClient = new AuthorizationApi(iamConfig);
const groupsApiClient = new GroupsApi(iamConfig);
const resourcesApiClient = new ResourcesApi(iamConfig);
const roleAssignmentsApiClient = new RoleAssignmentsApi(iamConfig);
const rolesApiClient = new RolesApi(iamConfig);
const usersApiClient = new UsersApi(iamConfig);

// --- Updated Authorization functions using generated client ---
export async function isUserAuthorized(
  resourceName: string,
  scopes?: string[],
): Promise<boolean> {
  console.log(`[isUserAuthorized] Checking auth for resource: ${resourceName}, scopes: ${scopes?.join(', ') || 'none'} using generated IAM client.`);
  
  // The AuthorizationCheckInput type is imported from the generated client
  const authCheckInput: AuthorizationCheckInput = {
    resource_name: resourceName,
    scopes: scopes || [], // Ensure scopes is an array, as expected by the generated type
  };

  try {
    // Call the generated client method. It returns an AxiosPromise.
    // Upon successful (2xx) resolution, the actual data is in `response.data`.
    const response = await authorizationApiClient.isUserAuthorized(authCheckInput);
    
    // The AuthorizationCheckResult (response.data) type has { authorized: boolean; }
    if (response.status === 200 && response.data && typeof response.data.authorized === 'boolean') {
        console.log("[isUserAuthorized] IAM check successful. Authorized:", response.data.authorized);
        return response.data.authorized;
    } else {
        // This path should ideally not be reached if the API and client behave as expected
        // (i.e., client throws for non-2xx or server sends malformed 2xx response).
        console.warn("[isUserAuthorized] IAM check response status not 200 or data malformed. Assuming not authorized.", response);
        return false;
    }
  } catch (error: any) {
    console.error(`[isUserAuthorized] Error during IAM authorization check: ${error.message || error}`);
    
    // Axios errors (which the generated client likely uses) often have a `response` property
    if (error.response) {
        console.error("[isUserAuthorized] Error response status:", error.response.status);
        console.error("[isUserAuthorized] Error response data:", error.response.data);
        // A 403 Forbidden status specifically means not authorized.
        if (error.response.status === 403) {
            console.log("[isUserAuthorized] Received 403 Forbidden, considered not authorized.");
            return false;
        }
    }
    
    // Handle specific errors like token refresh failure if it bubbles up from the accessToken provider function
    if (error instanceof TokenRefreshFailedError) {
        console.error(`[isUserAuthorized] Token refresh failed during IAM check: ${error.message}`);
    } else if (error instanceof ApiTokenExpiredError) {
        // This might be relevant if the token somehow expires between refresh and use, 
        // or if the generated client throws this type of error itself.
        console.error(`[isUserAuthorized] Token deemed expired during IAM check: ${error.message}`);
    } else if (error instanceof TokenExpiredIAMError) {
        // If we still want to use our custom IAM-specific expiry error.
        console.error(`[isUserAuthorized] Custom IAM Token Expired Error: ${error.message}`);
    }
    
    // For any other errors (network issues, unexpected server errors, etc.), default to not authorized.
    return false; 
  }
}

export async function checkEnterpriseUpdatePermission(): Promise<boolean> {
    const enterpriseResourceName = 'enterprise-1'; // Consider making this a configurable constant
    return isUserAuthorized(enterpriseResourceName, ['update_enterprise']);
}

// --- Groups API Functions ---
export const getIamGroups = async (): Promise<Group[]> => {
  try {
    const response = await groupsApiClient.getGroups();
    return response.data;
  } catch (error: any) {
    console.error("[getIamGroups] Error:", error.message || error);
    if (error.response) throw new Error(error.response.data?.message || `Failed to get groups: ${error.response.status}`);
    throw error;
  }
};

export const getIamGroupById = async (id: string): Promise<Group> => {
  try {
    const response = await groupsApiClient.getGroupById(id);
    return response.data;
  } catch (error: any) {
    console.error(`[getIamGroupById id:${id}] Error:`, error.message || error);
    if (error.response) throw new Error(error.response.data?.message || `Failed to get group ${id}: ${error.response.status}`);
    throw error;
  }
};

export const getIamGroupByName = async (name: string): Promise<Group> => {
  try {
    const response = await groupsApiClient.getGroupByName(name);
    return response.data;
  } catch (error: any) {
    console.error(`[getIamGroupByName name:${name}] Error:`, error.message || error);
    if (error.response) throw new Error(error.response.data?.message || `Failed to get group by name ${name}: ${error.response.status}`);
    throw error;
  }
};

// --- Resources API Functions ---
export const createIamResource = async (createResourceInput: CreateResourceInput): Promise<Resource> => {
  try {
    const response = await resourcesApiClient.createResource(createResourceInput);
    return response.data;
  } catch (error: any) {
    console.error(`[createIamResource input:${JSON.stringify(createResourceInput)}] Error:`, error.message || error);
    if (error.response) throw new Error(error.response.data?.message || `Failed to create resource: ${error.response.status}`);
    throw error;
  }
};

export const deleteIamResource = async (resourceName: string): Promise<void> => {
  try {
    await resourcesApiClient.deleteResource(resourceName);
  } catch (error: any) {
    console.error(`[deleteIamResource name:${resourceName}] Error:`, error.message || error);
    if (error.response) throw new Error(error.response.data?.message || `Failed to delete resource ${resourceName}: ${error.response.status}`);
    throw error;
  }
};

export const getIamResource = async (resourceName: string): Promise<Resource> => {
  try {
    const response = await resourcesApiClient.getResource(resourceName);
    return response.data;
  } catch (error: any) {
    console.error(`[getIamResource name:${resourceName}] Error:`, error.message || error);
    if (error.response) throw new Error(error.response.data?.message || `Failed to get resource ${resourceName}: ${error.response.status}`);
    throw error;
  }
};

export const updateIamResourceAttributes = async (resourceName: string, resourceAttributes: ResourceAttributes): Promise<void> => {
  try {
    await resourcesApiClient.updateResourceAttributes(resourceName, resourceAttributes);
  } catch (error: any) {
    console.error(`[updateIamResourceAttributes name:${resourceName}] Error:`, error.message || error);
    if (error.response) throw new Error(error.response.data?.message || `Failed to update resource attributes for ${resourceName}: ${error.response.status}`);
    throw error;
  }
};

// --- RoleAssignments API Functions ---
export const createIamRoleAssignment = async (roleAssignment: RoleAssignment): Promise<void> => {
  try {
    await roleAssignmentsApiClient.createRoleAssignment(roleAssignment);
  } catch (error: any) {
    console.error(`[createIamRoleAssignment assignment:${JSON.stringify(roleAssignment)}] Error:`, error.message || error);
    if (error.response) throw new Error(error.response.data?.message || `Failed to create role assignment: ${error.response.status}`);
    throw error;
  }
};

export const getIamRoleAssignmentsOnPrincipal = async (principalType: GetRoleAssignmentsOnPrincipalPrincipalTypeEnum, principalId: string): Promise<RoleAssignment[]> => {
  try {
    const response = await roleAssignmentsApiClient.getRoleAssignmentsOnPrincipal(principalType, principalId);
    return response.data;
  } catch (error: any) {
    console.error(`[getIamRoleAssignmentsOnPrincipal type:${principalType}, id:${principalId}] Error:`, error.message || error);
    if (error.response) throw new Error(error.response.data?.message || `Failed to get role assignments for principal ${principalId}: ${error.response.status}`);
    throw error;
  }
};

export const getIamRoleAssignmentsOnResource = async (resourceName: string): Promise<RoleAssignment[]> => {
  try {
    const response = await roleAssignmentsApiClient.getRoleAssignmentsOnResource(resourceName);
    return response.data;
  } catch (error: any) {
    console.error(`[getIamRoleAssignmentsOnResource name:${resourceName}] Error:`, error.message || error);
    if (error.response) throw new Error(error.response.data?.message || `Failed to get role assignments for resource ${resourceName}: ${error.response.status}`);
    throw error;
  }
};

export const removeIamRoleAssignment = async (roleAssignment: RoleAssignment): Promise<void> => {
  try {
    await roleAssignmentsApiClient.removeRoleAssignment(roleAssignment);
  } catch (error: any) {
    console.error(`[removeIamRoleAssignment assignment:${JSON.stringify(roleAssignment)}] Error:`, error.message || error);
    if (error.response) throw new Error(error.response.data?.message || `Failed to remove role assignment: ${error.response.status}`);
    throw error;
  }
};

// --- Roles API Functions ---
export const getIamRoleByName = async (name: string): Promise<Role> => {
  try {
    const response = await rolesApiClient.getRoleByName(name);
    return response.data;
  } catch (error: any) {
    console.error(`[getIamRoleByName name:${name}] Error:`, error.message || error);
    if (error.response) throw new Error(error.response.data?.message || `Failed to get role by name ${name}: ${error.response.status}`);
    throw error;
  }
};

export const getIamRolesByResourceType = async (resourceType: GetRolesByResourceTypeResourceTypeEnum): Promise<Role[]> => {
  try {
    const response = await rolesApiClient.getRolesByResourceType(resourceType);
    return response.data;
  } catch (error: any) {
    console.error(`[getIamRolesByResourceType type:${resourceType}] Error:`, error.message || error);
    if (error.response) throw new Error(error.response.data?.message || `Failed to get roles for resource type ${resourceType}: ${error.response.status}`);
    throw error;
  }
};

// --- Users API Functions ---
export const getIamUsers = async (): Promise<User[]> => {
  try {
    const response = await usersApiClient.getUsers();
    return response.data;
  } catch (error: any) {
    console.error("[getIamUsers] Error:", error.message || error);
    if (error.response) throw new Error(error.response.data?.message || `Failed to get users: ${error.response.status}`);
    throw error;
  }
};

export const getIamUserById = async (id: string): Promise<User> => {
  try {
    const response = await usersApiClient.getUserById(id);
    return response.data;
  } catch (error: any) {
    console.error(`[getIamUserById id:${id}] Error:`, error.message || error);
    if (error.response) throw new Error(error.response.data?.message || `Failed to get user ${id}: ${error.response.status}`);
    throw error;
  }
};

export const getIamUserByUsername = async (username: string): Promise<User> => {
  try {
    const response = await usersApiClient.getUserByUsername(username);
    return response.data;
  } catch (error: any) {
    console.error(`[getIamUserByUsername username:${username}] Error:`, error.message || error);
    if (error.response) throw new Error(error.response.data?.message || `Failed to get user by username ${username}: ${error.response.status}`);
    throw error;
  }
};

// Obsolete interfaces and functions have been removed.
// API functionalities like getUsers, getGroups, etc., would be re-implemented 
// by exporting new functions that call methods on instantiated generated API clients 
// (e.g., usersApiClient.getUsers(), groupsApiClient.getGroups()). 