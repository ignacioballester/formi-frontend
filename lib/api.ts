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

export interface Module {
  id: number
  name: string
  repository_id: number
  project_id?: number
  organization_id: number
  working_directory: string
  git_reference: {
    tag?: string
    commit?: string
    branch?: string
  }
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

// Modules
export const getModules = (params?: { project_id?: number; organization_id?: number }, customGetTokenFn?: GetTokenFn) => {
  const queryParams = new URLSearchParams()
  if (params?.project_id) queryParams.append("project_id", params.project_id.toString())
  if (params?.organization_id) queryParams.append("organization_id", params.organization_id.toString())

  return fetchAPI<Module[]>("/modules", {}, customGetTokenFn)
}
export const getModule = (id: number, customGetTokenFn?: GetTokenFn) => fetchAPI<Module>(`/modules/${id}`, {}, customGetTokenFn)

// Deployments
export const getDeployments = (projectId: number, deploymentId?: number, customGetTokenFn?: GetTokenFn) => {
  const queryParams = new URLSearchParams()
  queryParams.append("project_id", projectId.toString())
  if (deploymentId) queryParams.append("id", deploymentId.toString())

  return fetchAPI<Deployment[]>("/deployments", {}, customGetTokenFn)
}
export const getDeployment = (id: number, version: number, customGetTokenFn?: GetTokenFn) =>
  fetchAPI<Deployment>(`/deployments/${id}?version=${version}`, {}, customGetTokenFn)

// Repositories
export const getRepositories = (params?: { project_id?: number; organization_id?: number }, customGetTokenFn?: GetTokenFn) => {
  const queryParams = new URLSearchParams()
  if (params?.project_id) queryParams.append("project_id", params.project_id.toString())
  if (params?.organization_id) queryParams.append("organization_id", params.organization_id.toString())

  return fetchAPI<Repository[]>("/repositories", {}, customGetTokenFn)
}
export const getRepository = (id: number, customGetTokenFn?: GetTokenFn) =>
  fetchAPI<{ repository: Repository; references: any[] }>(`/repositories/${id}`, {}, customGetTokenFn)
