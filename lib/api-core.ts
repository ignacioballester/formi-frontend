// Read the NEXT_PUBLIC_ prefixed variable, REMOVE /api/v1 path
export const FORMI_API_BASE_URL = `${process.env.NEXT_PUBLIC_FORMI_API_URL || "http://localhost:8083"}`;
// RUNNER_API_BASE_URL moved to api-runner.ts

// --- Import token getter and error types ---
// getServerToken will NOT be used by default in client-facing wrappers anymore.
import { getServerToken, ApiTokenExpiredError, TokenRefreshFailedError, GetTokenFn } from "./api-retry";

// --- Import generated API Clients and Configurations for Core API ---
import {
    Configuration as CoreConfiguration,
    OrganizationsApi,
    ProjectsApi,
    ModulesApi,
    DeploymentsApi,
    RepositoriesApi,
    // Types used in function signatures or exported
    Organization,
    CreateOrganizationInput,
    Project,
    CreateProjectInput,
    Module, CreateModuleInput, UpdateModuleInput, ModuleConfig,
    Deployment, DeployModuleInput, UpdateDeploymentInput, DeploymentsPost201Response, DeploymentsIdDelete200Response,
    Repository, CreateRepositoryInput, UpdateRepositoryInput, RepositoryResponse,
    GitReference,
    Run as CoreRun,
    SecretIdentifier,
    DeploymentVariableInput
} from "./generated-api/core";

// --- Export types for use in UI components ---
export type {
    Module, CreateModuleInput, UpdateModuleInput, ModuleConfig,
    Project, CreateProjectInput,
    Organization, CreateOrganizationInput,
    Deployment, DeployModuleInput, UpdateDeploymentInput, DeploymentsPost201Response, DeploymentsIdDelete200Response,
    Repository, CreateRepositoryInput, UpdateRepositoryInput, RepositoryResponse,
    GitReference,
    CoreRun,
    SecretIdentifier,
    DeploymentVariableInput
};

// No global coreApiConfig or client instantiations that use getServerToken by default

// --- Helper to create a configured API client for Core API ---
const createCoreApiClient = <T extends { new(config: CoreConfiguration): InstanceType<T> }>(
    ApiClientClass: T,
    token: string
): InstanceType<T> => {
    const config = new CoreConfiguration({
        basePath: FORMI_API_BASE_URL,
        accessToken: async () => token, // Use the passed token
    });
    return new ApiClientClass(config);
};

// --- Organizations API Functions ---
export const getOrganizations = async (token: string): Promise<Organization[]> => {
  const client = createCoreApiClient(OrganizationsApi, token);
  try {
    const response = await client.orgsGet();
    return response.data;
  } catch (error: any) {
    console.error("[getOrganizations] Error:", error.message || error);
    if (error.response) throw new Error(error.response.data?.error || `Failed to get organizations: ${error.response.status}`);
    throw error;
  }
};

export const getOrganization = async (token: string, id: number): Promise<Organization> => {
  const client = createCoreApiClient(OrganizationsApi, token);
  try {
    const response = await client.orgsIdGet(id);
    return response.data;
  } catch (error: any) {
    console.error(`[getOrganization id:${id}] Error:`, error.message || error);
    if (error.response) throw new Error(error.response.data?.error || `Failed to get organization ${id}: ${error.response.status}`);
    throw error;
  }
};

export const createOrganization = async (token: string, data: CreateOrganizationInput): Promise<Organization> => {
  const client = createCoreApiClient(OrganizationsApi, token);
  try {
    const response = await client.orgsPost(data);
    return response.data;
  } catch (error: any) {
    console.error("[createOrganization] Error:", error.message || error);
    if (error.response) {
        console.error("[createOrganization] Error response data:", error.response.data);
        throw new Error(error.response.data?.error || `Failed to create organization: ${error.response.status}`);
    }
    throw error;
  }
};

// --- Projects API Functions ---
export const getProjects = async (token: string, organizationId: number): Promise<Project[]> => {
    const client = createCoreApiClient(ProjectsApi, token);
    try {
        const response = await client.organizationsOrganizationIdProjectsGet(organizationId);
        return response.data;
    } catch (error: any) {
        console.error(`[getProjects for orgId:${organizationId}] Error:`, error.message || error);
        if (error.response) throw new Error(error.response.data?.error || `Failed to get projects: ${error.response.status}`);
        throw error;
    }
};
export const getProject = async (token: string, id: number): Promise<Project> => {
    const client = createCoreApiClient(ProjectsApi, token);
    try {
        const response = await client.projectsIdGet(id);
        return response.data;
    } catch (error: any) {
        console.error(`[getProject id:${id}] Error:`, error.message || error);
        if (error.response) throw new Error(error.response.data?.error || `Failed to get project ${id}: ${error.response.status}`);
        throw error;
    }
};
export const createProject = async (token: string, data: CreateProjectInput): Promise<Project> => {
    const client = createCoreApiClient(ProjectsApi, token);
    try {
        const response = await client.projectsPost(data);
        return response.data;
    } catch (error: any) {
        console.error(`[createProject] Error:`, error.message || error);
        if (error.response) throw new Error(error.response.data?.error || `Failed to create project: ${error.response.status}`);
        throw error;
    }
};

// --- Modules API Functions ---
export const getModules = async (token: string, params?: { projectId?: number; organizationId?: number }): Promise<Module[]> => {
    const client = createCoreApiClient(ModulesApi, token);
    try {
        const response = await client.modulesGet(params?.projectId, params?.organizationId);
        return response.data;
    } catch (error: any) {
        console.error(`[getModules] Error:`, error.message || error);
        if (error.response) throw new Error(error.response.data?.error || `Failed to get modules: ${error.response.status}`);
        throw error;
    }
};
export const getModule = async (token: string, id: number): Promise<Module> => {
    const client = createCoreApiClient(ModulesApi, token);
    try {
        const response = await client.modulesIdGet(id);
        return response.data;
    } catch (error: any) {
        console.error(`[getModule id:${id}] Error:`, error.message || error);
        if (error.response) throw new Error(error.response.data?.error || `Failed to get module ${id}: ${error.response.status}`);
        throw error;
    }
};
export const createModule = async (token: string, data: CreateModuleInput): Promise<Module> => {
    const client = createCoreApiClient(ModulesApi, token);
    try {
        const response = await client.modulesPost(data);
        return response.data;
    } catch (error: any) {
        console.error(`[createModule] Error:`, error.message || error);
        if (error.response) throw new Error(error.response.data?.error || `Failed to create module: ${error.response.status}`);
        throw error;
    }
};
export const updateModule = async (token: string, id: number, data: UpdateModuleInput): Promise<Module> => {
    const client = createCoreApiClient(ModulesApi, token);
    try {
        const response = await client.modulesIdPut(id, data);
        return response.data;
    } catch (error: any) {
        console.error(`[updateModule id:${id}] Error:`, error.message || error);
        if (error.response) throw new Error(error.response.data?.error || `Failed to update module ${id}: ${error.response.status}`);
        throw error;
    }
};
export const deleteModule = async (token: string, id: number): Promise<void> => {
    const client = createCoreApiClient(ModulesApi, token);
    try {
        await client.modulesIdDelete(id);
    } catch (error: any) {
        console.error(`[deleteModule id:${id}] Error:`, error.message || error);
        if (error.response) throw new Error(error.response.data?.error || `Failed to delete module ${id}: ${error.response.status}`);
        throw error;
    }
};

// --- Deployments API Functions ---
export const getDeployments = async (token: string, projectId: number, deploymentId?: number): Promise<Deployment[]> => {
    const client = createCoreApiClient(DeploymentsApi, token);
    try {
        const response = await client.deploymentsGet(projectId, deploymentId);
        return response.data;
    } catch (error: any) {
        console.error(`[getDeployments for projectId:${projectId}] Error:`, error.message || error);
        if (error.response) throw new Error(error.response.data?.error || `Failed to get deployments: ${error.response.status}`);
        throw error;
    }
};
export const deployModule = async (token: string, data: DeployModuleInput): Promise<DeploymentsPost201Response> => {
    const client = createCoreApiClient(DeploymentsApi, token);
    try {
        const response = await client.deploymentsPost(data);
        return response.data;
    } catch (error: any) {
        console.error(`[deployModule] Error:`, error.message || error);
        if (error.response) throw new Error(error.response.data?.error || `Failed to deploy module: ${error.response.status}`);
        throw error;
    }
};
export const updateDeployment = async (token: string, id: number, data: UpdateDeploymentInput): Promise<DeploymentsPost201Response> => {
    const client = createCoreApiClient(DeploymentsApi, token);
    try {
        const response = await client.deploymentsIdPatch(id, data);
        return response.data;
    } catch (error: any) {
        console.error(`[updateDeployment id:${id}] Error:`, error.message || error);
        if (error.response) throw new Error(error.response.data?.error || `Failed to update deployment ${id}: ${error.response.status}`);
        throw error;
    }
};
export const deleteDeployment = async (token: string, id: number): Promise<DeploymentsIdDelete200Response> => {
    const client = createCoreApiClient(DeploymentsApi, token);
    try {
        const response = await client.deploymentsIdDelete(id);
        return response.data;
    } catch (error: any) {
        console.error(`[deleteDeployment id:${id}] Error:`, error.message || error);
        if (error.response) throw new Error(error.response.data?.error || `Failed to delete deployment ${id}: ${error.response.status}`);
        throw error;
    }
};
export const getDeployment = async (token: string, id: number, version: number): Promise<Deployment> => {
    const client = createCoreApiClient(DeploymentsApi, token);
    try {
        const response = await client.deploymentsIdGet(id, version);
        return response.data;
    } catch (error: any) {
        console.error(`[getDeployment id:${id} v:${version}] Error:`, error.message || error);
        if (error.response) throw new Error(error.response.data?.error || `Failed to get deployment ${id} v${version}: ${error.response.status}`);
        throw error;
    }
};

// --- Repositories API Functions ---
export const getRepositories = async (token: string, params?: { projectId?: number; organizationId?: number }): Promise<Repository[]> => {
    const client = createCoreApiClient(RepositoriesApi, token);
    try {
        const response = await client.repositoriesGet(params?.projectId, params?.organizationId);
        return response.data;
    } catch (error: any) {
        console.error(`[getRepositories] Error:`, error.message || error);
        if (error.response) throw new Error(error.response.data?.error || `Failed to get repositories: ${error.response.status}`);
        throw error;
    }
};
export const getRepository = async (token: string, id: number): Promise<RepositoryResponse> => {
    const client = createCoreApiClient(RepositoriesApi, token);
    try {
        const response = await client.repositoriesIdGet(id);
        return response.data;
    } catch (error: any) {
        console.error(`[getRepository id:${id}] Error:`, error.message || error);
        if (error.response) throw new Error(error.response.data?.error || `Failed to get repository ${id}: ${error.response.status}`);
        throw error;
    }
};
export const createRepository = async (token: string, data: CreateRepositoryInput): Promise<Repository> => {
    const client = createCoreApiClient(RepositoriesApi, token);
    try {
        const response = await client.repositoriesPost(data);
        return response.data;
    } catch (error: any) {
        console.error(`[createRepository] Error:`, error.message || error);
        if (error.response) throw new Error(error.response.data?.error || `Failed to create repository: ${error.response.status}`);
        throw error;
    }
};
export const updateRepository = async (token: string, id: number, data: UpdateRepositoryInput): Promise<Repository> => {
    const client = createCoreApiClient(RepositoriesApi, token);
    try {
        const response = await client.repositoriesIdPut(id, data);
        return response.data;
    } catch (error: any) {
        console.error(`[updateRepository id:${id}] Error:`, error.message || error);
        if (error.response) throw new Error(error.response.data?.error || `Failed to update repository ${id}: ${error.response.status}`);
        throw error;
    }
};
export const deleteRepository = async (token: string, id: number): Promise<void> => {
    const client = createCoreApiClient(RepositoriesApi, token);
    try {
        await client.repositoriesIdDelete(id);
    } catch (error: any) {
        console.error(`[deleteRepository id:${id}] Error:`, error.message || error);
        if (error.response) throw new Error(error.response.data?.error || `Failed to delete repository ${id}: ${error.response.status}`);
        throw error;
    }
};

// Runner API functions moved to api-runner.ts
