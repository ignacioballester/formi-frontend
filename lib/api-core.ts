// Read the NEXT_PUBLIC_ prefixed variable, REMOVE /api/v1 path
export const FORMI_API_BASE_URL = `${process.env.NEXT_PUBLIC_FORMI_API_URL || "http://localhost:8083"}`;
// RUNNER_API_BASE_URL moved to api-runner.ts

// --- Import token getter and error types ---
import {
    getServerToken,
    ApiTokenExpiredError, // Kept for potential use in error handling
    TokenRefreshFailedError,
    GetTokenFn // Type for token getter function (getServerToken conforms to this)
} from "./api-retry";

// --- Import generated API Clients and Configurations for Core API ---
import {
    Configuration as CoreConfiguration,
    OrganizationsApi,
    ProjectsApi,
    ModulesApi,
    DeploymentsApi,
    RepositoriesApi,
    Organization,
    CreateOrganizationInput,
    Project,
    CreateProjectInput,
    Module, CreateModuleInput, UpdateModuleInput,
    Deployment, DeployModuleInput, UpdateDeploymentInput, DeploymentsPost201Response, DeploymentsIdDelete200Response,    
    Repository, CreateRepositoryInput, UpdateRepositoryInput, RepositoryResponse,
    GitReference,
    Run as CoreRun // Renaming to avoid conflict if a global Run type is used elsewhere, or if Runner has a Run type
} from "./generated-api/core";

export type {
    Module, CreateModuleInput, UpdateModuleInput,
    Project, CreateProjectInput,
    Organization, CreateOrganizationInput,
    Deployment, DeployModuleInput, UpdateDeploymentInput, DeploymentsPost201Response, DeploymentsIdDelete200Response,    
    Repository, CreateRepositoryInput, UpdateRepositoryInput, RepositoryResponse,
    GitReference,
    Run as CoreRun
} from "./generated-api/core";

// --- Configure and Instantiate Core API Clients ---
const coreApiConfig = new CoreConfiguration({
    basePath: FORMI_API_BASE_URL,
    accessToken: async () => {
        const token = await getServerToken();
        if (!token) {
            console.error("[Core API Client Cfg] getServerToken returned null or undefined. Throwing TokenRefreshFailedError.");
            throw new TokenRefreshFailedError("Failed to obtain a token for Core API call.");
        }
        return token;
    }
});

const organizationsClient = new OrganizationsApi(coreApiConfig);
const projectsClient = new ProjectsApi(coreApiConfig);
const modulesClient = new ModulesApi(coreApiConfig);
const deploymentsClient = new DeploymentsApi(coreApiConfig);
const repositoriesClient = new RepositoriesApi(coreApiConfig);

// Runner client instantiation moved to api-runner.ts

// --- Organizations API Functions ---
export const getOrganizations = async (): Promise<Organization[]> => {
  try {
    const response = await organizationsClient.orgsGet();
    return response.data;
  } catch (error: any) {
    console.error("[getOrganizations] Error:", error.message || error);
    if (error.response) throw new Error(error.response.data?.error || `Failed to get organizations: ${error.response.status}`);
    throw error;
  }
};

export const getOrganization = async (id: number): Promise<Organization> => {
  try {
    const response = await organizationsClient.orgsIdGet(id);
    return response.data;
  } catch (error: any) {
    console.error(`[getOrganization id:${id}] Error:`, error.message || error);
    if (error.response) throw new Error(error.response.data?.error || `Failed to get organization ${id}: ${error.response.status}`);
    throw error;
  }
};

export const createOrganization = async (data: CreateOrganizationInput): Promise<Organization> => {
  try {
    const response = await organizationsClient.orgsPost(data);
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
export const getProjects = async (organizationId: number): Promise<Project[]> => {
    try {
        const response = await projectsClient.organizationsOrganizationIdProjectsGet(organizationId);
        return response.data;
    } catch (error: any) {
        console.error(`[getProjects for orgId:${organizationId}] Error:`, error.message || error);
        if (error.response) throw new Error(error.response.data?.error || `Failed to get projects: ${error.response.status}`);
        throw error;
    }
};
export const getProject = async (id: number): Promise<Project> => {
    try {
        const response = await projectsClient.projectsIdGet(id);
        return response.data;
    } catch (error: any) {
        console.error(`[getProject id:${id}] Error:`, error.message || error);
        if (error.response) throw new Error(error.response.data?.error || `Failed to get project ${id}: ${error.response.status}`);
        throw error;
    }
};
export const createProject = async (data: CreateProjectInput): Promise<Project> => {
    try {
        const response = await projectsClient.projectsPost(data);
        return response.data;
    } catch (error: any) {
        console.error(`[createProject] Error:`, error.message || error);
        if (error.response) throw new Error(error.response.data?.error || `Failed to create project: ${error.response.status}`);
        throw error;
    }
};

// --- Modules API Functions ---
export const getModules = async (params?: { projectId?: number; organizationId?: number }): Promise<Module[]> => {
    try {
        const response = await modulesClient.modulesGet(params?.projectId, params?.organizationId);
        return response.data;
    } catch (error: any) {
        console.error(`[getModules] Error:`, error.message || error);
        if (error.response) throw new Error(error.response.data?.error || `Failed to get modules: ${error.response.status}`);
        throw error;
    }
};
export const getModule = async (id: number): Promise<Module> => {
    try {
        const response = await modulesClient.modulesIdGet(id);
        return response.data;
    } catch (error: any) {
        console.error(`[getModule id:${id}] Error:`, error.message || error);
        if (error.response) throw new Error(error.response.data?.error || `Failed to get module ${id}: ${error.response.status}`);
        throw error;
    }
};
export const createModule = async (data: CreateModuleInput): Promise<Module> => {
    try {
        const response = await modulesClient.modulesPost(data);
        return response.data;
    } catch (error: any) {
        console.error(`[createModule] Error:`, error.message || error);
        if (error.response) throw new Error(error.response.data?.error || `Failed to create module: ${error.response.status}`);
        throw error;
    }
};
export const updateModule = async (id: number, data: UpdateModuleInput): Promise<Module> => {
    try {
        const response = await modulesClient.modulesIdPut(id, data);
        return response.data;
    } catch (error: any) {
        console.error(`[updateModule id:${id}] Error:`, error.message || error);
        if (error.response) throw new Error(error.response.data?.error || `Failed to update module ${id}: ${error.response.status}`);
        throw error;
    }
};
export const deleteModule = async (id: number): Promise<void> => {
    try {
        await modulesClient.modulesIdDelete(id);
    } catch (error: any) {
        console.error(`[deleteModule id:${id}] Error:`, error.message || error);
        if (error.response) throw new Error(error.response.data?.error || `Failed to delete module ${id}: ${error.response.status}`);
        throw error;
    }
};

// --- Deployments API Functions ---
export const getDeployments = async (projectId: number, deploymentId?: number): Promise<Deployment[]> => {
    try {
        const response = await deploymentsClient.deploymentsGet(projectId, deploymentId);
        return response.data;
    } catch (error: any) {
        console.error(`[getDeployments for projectId:${projectId}] Error:`, error.message || error);
        if (error.response) throw new Error(error.response.data?.error || `Failed to get deployments: ${error.response.status}`);
        throw error;
    }
};
export const deployModule = async (data: DeployModuleInput): Promise<DeploymentsPost201Response> => {
    try {
        const response = await deploymentsClient.deploymentsPost(data);
        return response.data; 
    } catch (error: any) {
        console.error(`[deployModule] Error:`, error.message || error);
        if (error.response) throw new Error(error.response.data?.error || `Failed to deploy module: ${error.response.status}`);
        throw error;
    }
};
export const updateDeployment = async (id: number, data: UpdateDeploymentInput): Promise<DeploymentsPost201Response> => {
    try {
        const response = await deploymentsClient.deploymentsIdPatch(id, data);
        return response.data;
    } catch (error: any) {
        console.error(`[updateDeployment id:${id}] Error:`, error.message || error);
        if (error.response) throw new Error(error.response.data?.error || `Failed to update deployment ${id}: ${error.response.status}`);
        throw error;
    }
};
export const deleteDeployment = async (id: number): Promise<DeploymentsIdDelete200Response> => {
    try {
        const response = await deploymentsClient.deploymentsIdDelete(id);
        return response.data;
    } catch (error: any) {
        console.error(`[deleteDeployment id:${id}] Error:`, error.message || error);
        if (error.response) throw new Error(error.response.data?.error || `Failed to delete deployment ${id}: ${error.response.status}`);
        throw error;
    }
};
export const getDeployment = async (id: number, version: number): Promise<Deployment> => {
    try {
        const response = await deploymentsClient.deploymentsIdGet(id, version);
        return response.data;
    } catch (error: any) {
        console.error(`[getDeployment id:${id} v:${version}] Error:`, error.message || error);
        if (error.response) throw new Error(error.response.data?.error || `Failed to get deployment ${id} v${version}: ${error.response.status}`);
        throw error;
    }
};

// --- Repositories API Functions ---
export const getRepositories = async (params?: { projectId?: number; organizationId?: number }): Promise<Repository[]> => {
    try {
        const response = await repositoriesClient.repositoriesGet(params?.projectId, params?.organizationId);
        return response.data;
    } catch (error: any) {
        console.error(`[getRepositories] Error:`, error.message || error);
        if (error.response) throw new Error(error.response.data?.error || `Failed to get repositories: ${error.response.status}`);
        throw error;
    }
};
export const getRepository = async (id: number): Promise<RepositoryResponse> => {
    try {
        const response = await repositoriesClient.repositoriesIdGet(id);
        return response.data;
    } catch (error: any) {
        console.error(`[getRepository id:${id}] Error:`, error.message || error);
        if (error.response) throw new Error(error.response.data?.error || `Failed to get repository ${id}: ${error.response.status}`);
        throw error;
    }
};
export const createRepository = async (data: CreateRepositoryInput): Promise<Repository> => {
    try {
        const response = await repositoriesClient.repositoriesPost(data);
        return response.data;
    } catch (error: any) {
        console.error(`[createRepository] Error:`, error.message || error);
        if (error.response) throw new Error(error.response.data?.error || `Failed to create repository: ${error.response.status}`);
        throw error;
    }
};
export const updateRepository = async (id: number, data: UpdateRepositoryInput): Promise<Repository> => {
    try {
        const response = await repositoriesClient.repositoriesIdPut(id, data);
        return response.data;
    } catch (error: any) {
        console.error(`[updateRepository id:${id}] Error:`, error.message || error);
        if (error.response) throw new Error(error.response.data?.error || `Failed to update repository ${id}: ${error.response.status}`);
        throw error;
    }
};
export const deleteRepository = async (id: number): Promise<void> => {
    try {
        await repositoriesClient.repositoriesIdDelete(id);
    } catch (error: any) {
        console.error(`[deleteRepository id:${id}] Error:`, error.message || error);
        if (error.response) throw new Error(error.response.data?.error || `Failed to delete repository ${id}: ${error.response.status}`);
        throw error;
    }
};

// Runner API functions moved to api-runner.ts
