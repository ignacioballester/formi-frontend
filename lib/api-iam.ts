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
// getServerToken will NOT be used by default in client-facing wrappers anymore.
// It can be used by Server Actions if they call these wrappers.
import { getServerToken, TokenRefreshFailedError, ApiTokenExpiredError } from "./api-retry";
import type { RawAxiosRequestConfig } from 'axios'; // Keep for potential direct axios calls if needed, though primary change is client instantiation

// --- Import generated IAM client parts ---
import {
    Configuration as IAMConfiguration,
    AuthorizationApi,
    GroupsApi,
    ResourcesApi,
    RoleAssignmentsApi,
    RolesApi,
    UsersApi,
    // DTOs / Types that are used in function signatures or exported
    AuthorizationCheckInput,
    AuthorizationCheckResult, // Though typically not returned by wrappers, good to have if needed
    CreateResourceInput,
    Group,
    Resource,
    Role,
    RoleAssignment,
    User,
    // Enums used in function signatures or exported
    CreateResourceInputResourceTypeEnum,
    RoleResourceTypeEnum,
    RoleAssignmentPrincipalTypeEnum,
    GetRoleAssignmentsOnPrincipalPrincipalTypeEnum,
    GetRolesByResourceTypeResourceTypeEnum,
    // Other DTOs if they become part of function signatures or are directly exported
    ResourceAttributes,
    PermissionMap,
    ModelError // For completeness, though wrappers usually throw or return specific data
} from "./generated-api/iam";

// --- Export types for use in UI components ---
export type {
    RoleAssignment,
    Role,
    User,
    Group,
    CreateResourceInputResourceTypeEnum,
    RoleResourceTypeEnum,
    RoleAssignmentPrincipalTypeEnum,
    GetRoleAssignmentsOnPrincipalPrincipalTypeEnum,
    GetRolesByResourceTypeResourceTypeEnum,
    AuthorizationCheckInput, // If forms build this directly
    CreateResourceInput,     // If forms build this directly
    ResourceAttributes,      // If forms build this or it's returned directly
    PermissionMap            // If forms build this or it's returned directly
};

// --- IAM API Client Configuration (WITHOUT default accessToken provider) ---
// This base configuration can be used by each function to then add the specific token.
// Alternatively, each function can construct its own full config.
// For clarity, each function will construct its own to ensure token is scoped per call.

// No global client instantiations here anymore, as they would lack dynamic token.
// const authorizationApiClient = new AuthorizationApi(iamConfig);
// const groupsApiClient = new GroupsApi(iamConfig);
// etc.

// --- Helper to create a configured API client ---
const createApiClient = <T extends { new(config: IAMConfiguration): InstanceType<T> }>(
    ApiClientClass: T,
    token: string
): InstanceType<T> => {
    const config = new IAMConfiguration({
        basePath: IAM_API_BASE_URL,
        accessToken: async () => token, // Use the passed token
    });
    return new ApiClientClass(config);
};


// --- Authorization API Functions ---
export async function isUserAuthorized(
  token: string,
  resourceName: string,
  scopes?: string[],
): Promise<boolean> {
  console.log(`[isUserAuthorized] Checking auth for resource: ${resourceName}, scopes: ${scopes?.join(', ') || 'none'}`);
  const authCheckInput: AuthorizationCheckInput = {
    resource_name: resourceName,
    scopes: scopes || [],
  };
  const client = createApiClient(AuthorizationApi, token);
  try {
    const response = await client.isUserAuthorized(authCheckInput);
    if (response.status === 200 && response.data && typeof response.data.authorized === 'boolean') {
        return response.data.authorized;
    } else {
        console.warn("[isUserAuthorized] IAM check response status not 200 or data malformed. Assuming not authorized.", response);
        return false;
    }
  } catch (error: any) {
    console.error(`[isUserAuthorized] Error during IAM authorization check: ${error.message || error}`);
    if (error.response) {
        console.error("[isUserAuthorized] Error response status:", error.response.status);
        console.error("[isUserAuthorized] Error response data:", error.response.data);
        if (error.response.status === 403) {
            return false;
        }
    }
    if (error instanceof TokenRefreshFailedError || error instanceof ApiTokenExpiredError || error instanceof TokenExpiredIAMError) {
        console.error(`[isUserAuthorized] Token related error during IAM check: ${error.message}`);
    }
    return false;
  }
}

export async function checkEnterpriseUpdatePermission(token: string): Promise<boolean> {
    const enterpriseResourceName = 'enterprise-1';
    return isUserAuthorized(token, enterpriseResourceName, ['update_enterprise']);
}

// --- Groups API Functions ---
export const getIamGroups = async (token: string): Promise<Group[]> => {
  const client = createApiClient(GroupsApi, token);
  try {
    const response = await client.getGroups();
    return response.data;
  } catch (error: any) {
    console.error("[getIamGroups] Error:", error.message || error);
    if (error.response) throw new Error(error.response.data?.message || `Failed to get groups: ${error.response.status}`);
    throw error;
  }
};

export const getIamGroupById = async (token: string, id: string): Promise<Group> => {
  const client = createApiClient(GroupsApi, token);
  try {
    const response = await client.getGroupById(id);
    return response.data;
  } catch (error: any) {
    console.error(`[getIamGroupById id:${id}] Error:`, error.message || error);
    if (error.response) throw new Error(error.response.data?.message || `Failed to get group ${id}: ${error.response.status}`);
    throw error;
  }
};

export const getIamGroupByName = async (token: string, name: string): Promise<Group> => {
  const client = createApiClient(GroupsApi, token);
  try {
    const response = await client.getGroupByName(name);
    return response.data;
  } catch (error: any) {
    console.error(`[getIamGroupByName name:${name}] Error:`, error.message || error);
    if (error.response) throw new Error(error.response.data?.message || `Failed to get group by name ${name}: ${error.response.status}`);
    throw error;
  }
};

// --- Resources API Functions ---
export const createIamResource = async (token: string, createResourceInput: CreateResourceInput): Promise<Resource> => {
  const client = createApiClient(ResourcesApi, token);
  try {
    const response = await client.createResource(createResourceInput);
    return response.data;
  } catch (error: any) {
    console.error(`[createIamResource input:${JSON.stringify(createResourceInput)}] Error:`, error.message || error);
    if (error.response) throw new Error(error.response.data?.message || `Failed to create resource: ${error.response.status}`);
    throw error;
  }
};

export const deleteIamResource = async (token: string, resourceName: string): Promise<void> => {
  const client = createApiClient(ResourcesApi, token);
  try {
    await client.deleteResource(resourceName);
  } catch (error: any) {
    console.error(`[deleteIamResource name:${resourceName}] Error:`, error.message || error);
    if (error.response) throw new Error(error.response.data?.message || `Failed to delete resource ${resourceName}: ${error.response.status}`);
    throw error;
  }
};

export const getIamResource = async (token: string, resourceName: string): Promise<Resource> => {
  const client = createApiClient(ResourcesApi, token);
  try {
    const response = await client.getResource(resourceName);
    return response.data;
  } catch (error: any) {
    console.error(`[getIamResource name:${resourceName}] Error:`, error.message || error);
    if (error.response) throw new Error(error.response.data?.message || `Failed to get resource ${resourceName}: ${error.response.status}`);
    throw error;
  }
};

export const updateIamResourceAttributes = async (token: string, resourceName: string, resourceAttributes: ResourceAttributes): Promise<void> => {
  const client = createApiClient(ResourcesApi, token);
  try {
    await client.updateResourceAttributes(resourceName, resourceAttributes);
  } catch (error: any) {
    console.error(`[updateIamResourceAttributes name:${resourceName}] Error:`, error.message || error);
    if (error.response) throw new Error(error.response.data?.message || `Failed to update resource attributes for ${resourceName}: ${error.response.status}`);
    throw error;
  }
};

// --- RoleAssignments API Functions ---
export const createIamRoleAssignment = async (token: string, roleAssignment: RoleAssignment): Promise<void> => {
  const client = createApiClient(RoleAssignmentsApi, token);
  try {
    await client.createRoleAssignment(roleAssignment);
  } catch (error: any) {
    console.error(`[createIamRoleAssignment assignment:${JSON.stringify(roleAssignment)}] Error:`, error.message || error);
    if (error.response) throw new Error(error.response.data?.message || `Failed to create role assignment: ${error.response.status}`);
    throw error;
  }
};

export const getIamRoleAssignmentsOnPrincipal = async (token: string, principalType: GetRoleAssignmentsOnPrincipalPrincipalTypeEnum, principalId: string): Promise<RoleAssignment[]> => {
  const client = createApiClient(RoleAssignmentsApi, token);
  try {
    const response = await client.getRoleAssignmentsOnPrincipal(principalType, principalId);
    return response.data;
  } catch (error: any) {
    console.error(`[getIamRoleAssignmentsOnPrincipal type:${principalType}, id:${principalId}] Error:`, error.message || error);
    if (error.response) throw new Error(error.response.data?.message || `Failed to get role assignments for principal ${principalId}: ${error.response.status}`);
    throw error;
  }
};

export const getIamRoleAssignmentsOnResource = async (token: string, resourceName: string): Promise<RoleAssignment[]> => {
  const client = createApiClient(RoleAssignmentsApi, token);
  try {
    const response = await client.getRoleAssignmentsOnResource(resourceName);
    return response.data;
  } catch (error: any) {
    console.error(`[getIamRoleAssignmentsOnResource name:${resourceName}] Error:`, error.message || error);
    if (error.response) throw new Error(error.response.data?.message || `Failed to get role assignments for resource ${resourceName}: ${error.response.status}`);
    throw error;
  }
};

export const removeIamRoleAssignment = async (token: string, roleAssignment: RoleAssignment): Promise<void> => {
  const client = createApiClient(RoleAssignmentsApi, token);
  try {
    await client.removeRoleAssignment(roleAssignment);
  } catch (error: any) {
    console.error(`[removeIamRoleAssignment assignment:${JSON.stringify(roleAssignment)}] Error:`, error.message || error);
    if (error.response) throw new Error(error.response.data?.message || `Failed to remove role assignment: ${error.response.status}`);
    throw error;
  }
};

// --- Roles API Functions ---
export const getIamRoleByName = async (token: string, name: string): Promise<Role> => {
  const client = createApiClient(RolesApi, token);
  try {
    const response = await client.getRoleByName(name);
    return response.data;
  } catch (error: any) {
    console.error(`[getIamRoleByName name:${name}] Error:`, error.message || error);
    if (error.response) throw new Error(error.response.data?.message || `Failed to get role by name ${name}: ${error.response.status}`);
    throw error;
  }
};

export const getIamRolesByResourceType = async (token: string, resourceType: GetRolesByResourceTypeResourceTypeEnum): Promise<Role[]> => {
  const client = createApiClient(RolesApi, token);
  try {
    const response = await client.getRolesByResourceType(resourceType);
    return response.data;
  } catch (error: any) {
    console.error(`[getIamRolesByResourceType type:${resourceType}] Error:`, error.message || error);
    if (error.response) throw new Error(error.response.data?.message || `Failed to get roles for resource type ${resourceType}: ${error.response.status}`);
    throw error;
  }
};

// --- Users API Functions ---
export const getIamUsers = async (token: string): Promise<User[]> => {
  const client = createApiClient(UsersApi, token);
  try {
    const response = await client.getUsers();
    return response.data;
  } catch (error: any) {
    console.error("[getIamUsers] Error:", error.message || error);
    if (error.response) throw new Error(error.response.data?.message || `Failed to get users: ${error.response.status}`);
    throw error;
  }
};

export const getIamUserById = async (token: string, id: string): Promise<User> => {
  const client = createApiClient(UsersApi, token);
  try {
    const response = await client.getUserById(id);
    return response.data;
  } catch (error: any) {
    console.error(`[getIamUserById id:${id}] Error:`, error.message || error);
    if (error.response) throw new Error(error.response.data?.message || `Failed to get user ${id}: ${error.response.status}`);
    throw error;
  }
};

export const getIamUserByUsername = async (token: string, username: string): Promise<User> => {
  const client = createApiClient(UsersApi, token);
  try {
    const response = await client.getUserByUsername(username);
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