// Read the NEXT_PUBLIC_ prefixed variable, REMOVE /api/v1 path
export const FORMI_API_BASE_URL = `${process.env.NEXT_PUBLIC_FORMI_API_URL || "http://localhost:8083"}`;

// --- Import retry utility, errors, and token getters ---
import {
    executeWithRetryOnTokenExpiry,
    getServerToken, // Default for server-side, client needs to provide its own
    ApiTokenExpiredError, // Error that fetchAPIInternal will throw for 498
    TokenRefreshFailedError, // To handle potential refresh failures
    GetTokenFn // Type for token getter function
} from "./api-retry";

// Base API URL
// const API_BASE_URL = "/api/v1"

// Helper function for API requests (internal, expects token)
export async function fetchAPIInternal<T>(token: string | undefined, endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${FORMI_API_BASE_URL}${endpoint}`
  console.log("[DEBUG] Making API call to URL:", url);

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const defaultOptions: RequestInit = { headers };

  const mergedOptions = { ...defaultOptions, ...options };
  mergedOptions.headers = { ...defaultOptions.headers, ...options.headers };

  let response: Response;
  try {
     response = await fetch(url, mergedOptions);
  } catch (networkError) {
    // Handle network errors (e.g., DNS resolution, offline)
    console.error("Network error:", networkError);
    throw new Error("Network error occurred. Please check your connection.");
  }

  // --- Specific check for 498 (Token Expired from this API) ---
  if (response.status === 498) { // Assuming Formi API also uses 498 for expired tokens
    let errorDetail = `Formi API returned 498 (Token Expired/Invalid) for endpoint: ${endpoint}.`;
    try {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            const errorJson = await response.json();
            errorDetail = errorJson.message || errorJson.error || `Formi API returned 498: ${JSON.stringify(errorJson)}`;
        } else {
            const errorText = await response.text();
            errorDetail = `Formi API returned 498. Response: ${errorText.substring(0, 200)}...`;
        }
    } catch (e) {
        console.warn("[Formi API Internal] Could not parse error response body for 498 status:", e);
    }
    console.warn(`[Formi API Internal] Throwing ApiTokenExpiredError to trigger retry: ${errorDetail}`);
    throw new ApiTokenExpiredError(errorDetail); // Use the specific error from api-retry.ts
  }
  // --- End of 498 check ---

  if (!response.ok) {
    // Check for specific auth errors first
    if (response.status === 401 || response.status === 403) {
        // Optionally, trigger logout/redirect logic here or throw a specific error type
        // For now, just throw a clear authentication error
        console.error("Authentication error:", response.status);
        // Attempt to get more detail if possible, but prioritize indicating auth failure
        let errorDetail = "Authentication failed.";
        try {
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
                const errorJson = await response.json();
                errorDetail = errorJson.error || errorJson.message || errorDetail;
            } else {
                errorDetail = `Authentication failed (Status: ${response.status}). Received non-JSON response.`;
            }
        } catch (e) { /* Ignore parsing error if response body isn't helpful */ }
        throw new Error(errorDetail); // Use a custom Error class maybe?
    }

    // Handle other non-ok responses
    let errorBodyText = await response.text(); // Read as text first
    let errorMessage = `API request failed with status ${response.status}.`;
    try {
      // Try parsing as JSON ONLY if content type suggests it
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
          const errorJson = JSON.parse(errorBodyText); // Parse the text we already read
          errorMessage = errorJson.error || errorJson.message || errorMessage;
      } else {
          // If not JSON, maybe include the start of the HTML/text for debugging?
          errorMessage = `${errorMessage} Response: ${errorBodyText.substring(0, 100)}...`;
      }
    } catch (parseError) {
      // If JSON parsing fails even when header suggests it, log the raw text
       errorMessage = `${errorMessage} Could not parse error response. Body: ${errorBodyText.substring(0, 100)}...`;
    }
    console.error("API Error:", errorMessage);
    throw new Error(errorMessage);
  }

  // Handle successful response (assuming JSON)
  try {
    // Handle 204 No Content specifically for DELETE requests or other methods if applicable
    if (response.status === 204) { 
        return {} as T; 
    }
    const responseText = await response.text();
    if (!responseText) { // Handle empty successful responses
        return {} as T;
    }
    return JSON.parse(responseText);
  } catch (parseError) {
     console.error("Failed to parse successful response as JSON:", parseError);
     // const responseText = await response.text(); // Already attempted above
     throw new Error("API returned success status but failed to provide valid JSON.");
  }
}

// --- Public-facing fetchAPI that uses the retry mechanism ---
// It can accept a custom getTokenFn for client-side usage, otherwise defaults to getServerToken.
async function fetchAPI<T>(endpoint: string, options: RequestInit = {}, customGetTokenFn?: GetTokenFn): Promise<T> {
    const getTokenFnToUse = customGetTokenFn || getServerToken;

    const apiCallFn = (token: string | undefined) => { // token can be undefined if getTokenFnToUse returns so initially
      // fetchAPIInternal handles undefined token by not setting Authorization header.
      // However, executeWithRetryOnTokenExpiry expects apiCallFn to take `string`, and throws if initial token is null.
      // So, the token passed here by executeWithRetryOnTokenExpiry will always be a string.
      return fetchAPIInternal<T>(token, endpoint, options);
    };

    return executeWithRetryOnTokenExpiry<T>(
        apiCallFn,
        getTokenFnToUse,     
        ApiTokenExpiredError  // The error that fetchAPIInternal throws on 498 for this API
        // No second ExpiredTokenErrorClass needed here unless Formi API uses multiple error types for expiry.
    );
}

// API endpoints
export interface Organization {
  id: number
  name: string
  description: string
}

export interface Project {
  id: number
  name: string
  organization_id: number
}

// --- Add GitReference interface (from bundled.yaml) ---
export interface GitReference {
  tag?: string;
  commit?: string;
  branch?: string;
}
// --- End GitReference interface ---

export interface Module {
  id: number
  name: string
  repository_id: number
  project_id?: number
  organization_id: number
  working_directory: string
  git_reference: GitReference
  terraform_properties: {
    module: any
    tfvars_json_schema: any
  }
  module_config: any
  status: {
    configuration_valid: boolean
    configuration_error?: string
    terraform_valid: boolean
  }
}

// --- Add CreateModuleInput interface (from bundled.yaml) ---
export interface CreateModuleInput {
  name: string;
  repository_id: number;
  working_directory: string;
  organization_id: number;
  project_id?: number; // Optional
  git_reference: GitReference;
}
// --- End CreateModuleInput interface ---

// --- Add UpdateModuleInput interface (from bundled.yaml, simplified) ---
export interface UpdateModuleInput {
  name?: string;
  module_config?: ModuleConfig; // Updated to use ModuleConfig
  // As per spec, git_reference and working_directory are not in UpdateModuleInput
}
// --- End UpdateModuleInput interface ---

// --- START: ModuleConfig and related interfaces (from bundled.yaml) ---
export interface VariableConfiguration {
  options?: any[]; // Replace 'any' with a more specific type if available
  only_options_available?: boolean;
}

export interface ReviewRequirement {
  when: string;
  by: string[];
}

export interface ModuleCredentialConfiguration {
  type: string;
  options?: SecretIdentifier[];
  project_credentials_allowed?: boolean;
}

export interface EnvironmentVariable {
  name: string;
  input: string;
}

export interface DeploymentVariable {
  name: string;
  default?: any; // Replace 'any' with a more specific type if available
  description?: string;
}

export interface ExternalModule {
  module_name: string;
  variable_name: string;
}

export interface ModuleConfig {
  config_file_path?: string;
  variables?: Record<string, VariableConfiguration>; // Based on additionalProperties
  review_required?: ReviewRequirement[];
  credentials?: ModuleCredentialConfiguration[];
  environment_variables?: EnvironmentVariable[];
  deployment_variables?: DeploymentVariable[];
  external_modules?: ExternalModule[];
}
// --- END: ModuleConfig and related interfaces ---

export interface Deployment {
  id: number
  version: number
  project_id: number
  module_id: number
  inputs: any
  status: "creating" | "active" | "inactive" | "updating" | "destroying" | "failed"
  status_details: {
    last_run_id: number
    error_message: string
  }
}

export interface Repository {
  id: number
  name: string
  url: string
  project_id?: number
  organization_id: number
  secret: any
  status: {
    connection_successful: boolean
  }
}

export interface CreateOrganizationInput {
  name: string;
  description: string;
}

// Based on #/components/schemas/SecretIdentifier from bundled.yaml
export interface SecretIdentifier {
  name: string;
  organization_id: number;
  project_id?: number; // Optional
  type: string;
}

export interface CreateProjectInput {
  name: string;
  organization_id: number;
}

// Input type for creating a repository, based on #/components/schemas/CreateRepositoryInput from bundled.yaml
export interface CreateRepositoryInput {
  name: string;
  url: string;
  organization_id: number;
  project_id?: number; // Optional
  secret: SecretIdentifier; // Changed from secret_name to secret object
}

// --- Add UpdateRepositoryInput interface ---
export interface UpdateRepositoryInput {
  name?: string;
  url?: string;
  secret?: SecretIdentifier; // Allow updating the secret
}
// --- End of UpdateRepositoryInput interface ---

// Organizations
export const getOrganizations = (customGetTokenFn?: GetTokenFn) => fetchAPI<Organization[]>("/orgs", {}, customGetTokenFn);
export const getOrganization = (id: number, customGetTokenFn?: GetTokenFn) => fetchAPI<Organization>(`/orgs/${id}`, {}, customGetTokenFn);

// --- ADDED: createOrganization function --- 
export const createOrganization = (data: CreateOrganizationInput, customGetTokenFn?: GetTokenFn) => 
  fetchAPI<Organization>("/orgs", {
    method: "POST",
    body: JSON.stringify(data),
  }, customGetTokenFn);

// Projects
export const getProjects = (organizationId: number, customGetTokenFn?: GetTokenFn) => fetchAPI<Project[]>(`/organizations/${organizationId}/projects`, {}, customGetTokenFn);
export const getProject = (id: number, customGetTokenFn?: GetTokenFn) => fetchAPI<Project>(`/projects/${id}`, {}, customGetTokenFn);

export const createProject = (data: CreateProjectInput, customGetTokenFn?: GetTokenFn) => 
  fetchAPI<Project>("/projects", {
    method: "POST",
    body: JSON.stringify(data),
  }, customGetTokenFn);

// Modules
export const getModules = (params?: { project_id?: number; organization_id?: number }, customGetTokenFn?: GetTokenFn) => {
  const queryParams = new URLSearchParams()
  if (params?.project_id) queryParams.append("project_id", params.project_id.toString())
  if (params?.organization_id) queryParams.append("organization_id", params.organization_id.toString())

  return fetchAPI<Module[]>(`/modules${queryParams.toString() ? `?${queryParams.toString()}` : ''}`, {}, customGetTokenFn);
}
export const getModule = (id: number, customGetTokenFn?: GetTokenFn) => fetchAPI<Module>(`/modules/${id}`, {}, customGetTokenFn)

// --- Add createModule function ---
export const createModule = (data: CreateModuleInput, customGetTokenFn?: GetTokenFn) =>
  fetchAPI<Module>("/modules", { // Assuming POST to /modules endpoint
    method: "POST",
    body: JSON.stringify(data),
  }, customGetTokenFn);
// --- End createModule function ---

// --- Add updateModule function ---
export const updateModule = (id: number, data: UpdateModuleInput, customGetTokenFn?: GetTokenFn) =>
  fetchAPI<Module>(`/modules/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  }, customGetTokenFn);
// --- End updateModule function ---

// --- Add deleteModule function ---
export const deleteModule = (id: number, customGetTokenFn?: GetTokenFn) =>
  fetchAPI<void>(`/modules/${id}`, { // Expecting 204 No Content
    method: "DELETE",
  }, customGetTokenFn);
// --- End deleteModule function ---

// --- Add DeploymentInputs and DeployModuleInput interfaces ---
// Based on #/components/schemas/DeploymentVariableInput
export interface DeploymentVariableInput {
  name: string;
  input: string; // Value of the variable
}

// Based on #/components/schemas/DeploymentInputs
export interface DeploymentInputs {
  tf_vars: { [key: string]: any }; // Terraform variables as a JSON object
  secrets?: SecretIdentifier[]; // Array of secret identifiers, assuming SecretIdentifier is defined elsewhere
  deployment_variable_inputs?: DeploymentVariableInput[];
}

// Based on #/components/schemas/DeployModuleInput
export interface DeployModuleInput {
  module_id: number;
  project_id: number;
  inputs: DeploymentInputs;
}

// Response type for deployModule, based on API spec
export interface DeployModuleResponse {
  deployment: Deployment;
  run: Run; // Assuming Run interface is defined or will be defined
}

// Define Run interface if not already present (based on API spec)
export interface Run {
    id: number;
    status: string;
    error_message: string;
}
// --- End DeploymentInputs and DeployModuleInput interfaces ---

// Deployments
export const getDeployments = (projectId: number, deploymentId?: number, customGetTokenFn?: GetTokenFn) => {
  const queryParams = new URLSearchParams()
  // Add a check for valid projectId
  if (typeof projectId === 'number' && !isNaN(projectId)) {
    queryParams.append("project_id", projectId.toString())
  } else {
    // This case should ideally be caught before calling getDeployments,
    // but as a safeguard, we can log an error or throw.
    // For now, if projectId is invalid, the API call will likely fail as the backend requires it.
    // The backend error "project_id is required" would then be the indicator.
    // Alternatively, throw an error here:
    // throw new Error("Invalid projectId provided to getDeployments");
    console.error("Invalid or missing projectId in getDeployments call. API request will likely fail.");
  }

  if (deploymentId && typeof deploymentId === 'number' && !isNaN(deploymentId)) { 
    queryParams.append("id", deploymentId.toString())
  }

  const queryString = queryParams.toString();
  return fetchAPI<Deployment[]>(`/deployments${queryString ? `?${queryString}` : ''}`, {}, customGetTokenFn);
}

// --- START: Add UpdateDeploymentInput ---
// Define what can be updated. For now, let's assume only tf_vars.
// The API might support updating secrets or deployment_variables too.
export interface UpdateDeploymentInput {
  inputs: {
    tf_vars: { [key: string]: any };
    // Potentially add secrets and deployment_variable_inputs if API supports updating them
  };
}
// --- END: Add UpdateDeploymentInput ---

// TODO: Review if fetching by version is always needed, or if fetching by ID gets the latest.
// The current implementation requires a version.
export const getDeployment = (id: number, version: number, customGetTokenFn?: GetTokenFn) =>
  fetchAPI<Deployment>(`/deployments/${id}?version=${version}`, {}, customGetTokenFn)

// --- START: Add updateDeployment function ---
export const updateDeployment = (id: number, data: UpdateDeploymentInput, customGetTokenFn?: GetTokenFn) =>
  fetchAPI<Deployment>(`/deployments/${id}`, { // Assuming PUT to /deployments/{id}
    method: 'PUT',
    body: JSON.stringify(data),
  }, customGetTokenFn);
// --- END: Add updateDeployment function ---

// --- Add deployModule function ---
export const deployModule = (data: DeployModuleInput, customGetTokenFn?: GetTokenFn) =>
  fetchAPI<DeployModuleResponse>("/deployments", {
    method: "POST",
    body: JSON.stringify(data),
  }, customGetTokenFn);
// --- End deployModule function ---

// Repositories
export const getRepositories = (params?: { project_id?: number; organization_id?: number }, customGetTokenFn?: GetTokenFn) => {
  const queryParams = new URLSearchParams()
  if (params?.project_id) queryParams.append("project_id", params.project_id.toString())
  if (params?.organization_id) queryParams.append("organization_id", params.organization_id.toString())

  return fetchAPI<Repository[]>(`/repositories${queryParams.toString() ? `?${queryParams.toString()}` : ''}`, {}, customGetTokenFn)
}
export const getRepository = (id: number, customGetTokenFn?: GetTokenFn) =>
  fetchAPI<{ repository: Repository; references: GitReference[] }>(`/repositories/${id}`, {}, customGetTokenFn); // Updated 'any[]' to 'GitReference[]'

// Repositories - Add createRepository function
export const createRepository = (data: CreateRepositoryInput, customGetTokenFn?: GetTokenFn) =>
  fetchAPI<Repository>(`/repositories`, { // Using /repositories as the endpoint, organization_id is in the body
    method: "POST",
    body: JSON.stringify(data),
  }, customGetTokenFn);

// Add deleteRepository function
export const deleteRepository = (id: number, customGetTokenFn?: GetTokenFn) =>
  fetchAPI<void>(`/repositories/${id}`, { // Expecting a 204 No Content on successful deletion
    method: "DELETE",
  }, customGetTokenFn);

// --- Add updateRepository function ---
export const updateRepository = (id: number, data: UpdateRepositoryInput, customGetTokenFn?: GetTokenFn) =>
  fetchAPI<Repository>(`/repositories/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  }, customGetTokenFn);
// --- End of updateRepository function ---

// Secret Management API Types and Functions
// These types are kept as they are used by app/actions/secrets/actions.ts

export interface SecretData { 
  [key: string]: any; 
}

// Based on #/components/schemas/SecretCreate from secret_management/api/rest/openapi.yaml
export interface SecretCreate {
  name: string;
  display_name?: string;
  type: string;
  description?: string;
  organization_id: number;
  project_id?: number; 
  data: SecretData;
}

// Based on #/components/schemas/SecretUpdate from secret_management/api/rest/openapi.yaml
export interface SecretUpdate {
  display_name?: string;
  description?: string;
  type: string; // Type is required as per openapi.yaml for PUT body
  data?: SecretData; 
}

// Based on #/components/schemas/SecretResponse from secret_management/api/rest/openapi.yaml
export interface SecretResponse {
  name: string;
  display_name?: string;
  type: string;
  description?: string;
  organization_id: number;
  project_id: number; // REQUIRED by spec in some contexts, actions handle optionality
  data?: SecretData; // Included if include_private=true (for getSecret)
}

// New types for dynamic secret type definitions
export interface DataAttribute {
  Name: string;
  Type: "string" | "number" | "boolean"; // Add other types if necessary
  Private: boolean;
  Required: boolean;
  DisplayName?: string; // Optional: For a more user-friendly label
  Description?: string; // Optional: For a hint or tooltip
}

export interface SecretTypeDefinition {
  Name: string;
  DisplayName: string;
  Description: string;
  DataAttributes: DataAttribute[];
}

// Functions listSecrets, createSecret, getSecret, updateSecret, deleteSecret 
// are removed as they are now handled by server actions in app/actions/secrets/actions.ts

// Runner API Types (based on openapi.yaml)
export type RunnerRunStatus = "pending" | "claimed" | "running" | "completed" | "failed";

export interface RunnerStatusDetails {
  error_message?: string | null;
  waiting_for_current_run?: number | null;
  approval_needed_from?: string[] | null;
}

export interface RunnerRunProperties {
  run_by: string;
  deployment_version: number;
  terraform_command: string;
}

export interface RunnerRun {
  id: number;
  deployment_id: number;
  status: RunnerRunStatus;
  status_details?: RunnerStatusDetails | null;
  properties: RunnerRunProperties;
  timestamp: string; // Should be parsed as ISO 8601 date string
}

const RUNNER_API_BASE_URL = `${process.env.NEXT_PUBLIC_RUNNER_API_URL || "http://localhost:8084/api/v1"}`;

export async function getRunnerRuns(
  getClientToken: () => Promise<string> // Token might not be strictly needed if runner API is not auth-protected
): Promise<RunnerRun[]> {
  // const token = await getClientToken(); // Uncomment if runner API requires auth
  try {
    const response = await fetch(`${RUNNER_API_BASE_URL}/runs`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // 'Authorization': `Bearer ${token}`, // Uncomment if runner API requires auth
      },
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Runner API Error fetching runs:", response.status, errorBody);
      throw new Error(`Failed to fetch runs: ${response.status} ${errorBody || response.statusText}`);
    }
    const runs = await response.json();
    return runs as RunnerRun[];
  } catch (error) {
    console.error("Error in getRunnerRuns:", error);
    throw error; // Re-throw to be caught by the caller
  }
}

export async function getRunnerRunById(
  runId: number,
  getClientToken: () => Promise<string> // Token might not be strictly needed
): Promise<RunnerRun> {
  // const token = await getClientToken(); // Uncomment if auth is needed
  try {
    const response = await fetch(`${RUNNER_API_BASE_URL}/runs/${runId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // 'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Runner API Error fetching run ${runId}:`, response.status, errorBody);
      throw new Error(`Failed to fetch run ${runId}: ${response.status} ${errorBody || response.statusText}`);
    }
    const run = await response.json();
    return run as RunnerRun;
  } catch (error) {
    console.error(`Error in getRunnerRunById for run ${runId}:`, error);
    throw error;
  }
}

export async function getRunLogs(
  runId: number,
  getClientToken: () => Promise<string> // Token might not be strictly needed
): Promise<string> {
  // const token = await getClientToken(); // Uncomment if auth is needed
  try {
    const response = await fetch(`${RUNNER_API_BASE_URL}/runs/${runId}/logs`, {
      method: 'GET',
      headers: {
        // 'Authorization': `Bearer ${token}`,
        // For plain text, Content-Type on request might not be needed, but Accept could be useful
        'Accept': 'text/plain',
      },
    });
    if (!response.ok) {
      // Try to parse error as JSON if possible, otherwise use text
      let errorDetail = `Failed to fetch logs for run ${runId}: ${response.status} ${response.statusText}`;
      try {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            const errorJson = await response.json();
            errorDetail = errorJson.message || errorJson.error || `Runner API Error: ${JSON.stringify(errorJson)}`;
        } else {
            const errorText = await response.text();
            errorDetail = `Runner API Error: ${errorText.substring(0,500)}`;
        }
      } catch(e){ /* ignore failed parsing of error body */ }
      console.error(`Runner API Error fetching logs for run ${runId}:`, response.status, errorDetail);
      throw new Error(errorDetail);
    }
    const logs = await response.text();
    return logs;
  } catch (error) {
    console.error(`Error in getRunLogs for run ${runId}:`, error);
    throw error;
  }
}
