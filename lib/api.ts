// Read the NEXT_PUBLIC_ prefixed variable, REMOVE /api/v1 path
export const FORMI_API_BASE_URL = `${process.env.NEXT_PUBLIC_FORMI_API_URL || "http://localhost:8083"}`;

// Base API URL
// const API_BASE_URL = "/api/v1"

// Helper function for API requests
async function fetchAPI<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${FORMI_API_BASE_URL}${endpoint}`
  let token = getAuthToken(); // Get token

  const defaultOptions: RequestInit = {
    headers: {
      "Content-Type": "application/json",
      // Only add Authorization header if token exists
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  }

  const mergedOptions = { ...defaultOptions, ...options };
  // Ensure headers are merged correctly if options contain headers
  mergedOptions.headers = { ...defaultOptions.headers, ...options.headers };

  let response: Response;
  try {
     response = await fetch(url, mergedOptions);
  } catch (networkError) {
    // Handle network errors (e.g., DNS resolution, offline)
    console.error("Network error:", networkError);
    throw new Error("Network error occurred. Please check your connection.");
  }


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
    return await response.json();
  } catch (parseError) {
     console.error("Failed to parse successful response as JSON:", parseError);
     const responseText = await response.text(); // Try to get text if JSON fails
     console.error("Response text:", responseText.substring(0,200));
     throw new Error("API returned success status but failed to provide valid JSON.");
  }
}

// Get auth token from localStorage or wherever it's stored
import { getAuthToken } from "./auth-helpers";

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
export const getOrganizations = () => fetchAPI<Organization[]>("/orgs")
export const getOrganization = (id: number) => fetchAPI<Organization>(`/orgs/${id}`)

// --- ADDED: createOrganization function --- 
export const createOrganization = (data: CreateOrganizationInput) => 
  fetchAPI<Organization>("/orgs", { // Correct endpoint: /orgs
    method: "POST",
    body: JSON.stringify(data),
  });

// Projects
export const getProjects = (organizationId: number) => fetchAPI<Project[]>(`/organizations/${organizationId}/projects`)
export const getProject = (id: number) => fetchAPI<Project>(`/projects/${id}`)

// Modules
export const getModules = (params?: { project_id?: number; organization_id?: number }) => {
  const queryParams = new URLSearchParams()
  if (params?.project_id) queryParams.append("project_id", params.project_id.toString())
  if (params?.organization_id) queryParams.append("organization_id", params.organization_id.toString())

  return fetchAPI<Module[]>(`/modules?${queryParams.toString()}`)
}
export const getModule = (id: number) => fetchAPI<Module>(`/modules/${id}`)

// Deployments
export const getDeployments = (projectId: number, deploymentId?: number) => {
  const queryParams = new URLSearchParams()
  queryParams.append("project_id", projectId.toString())
  if (deploymentId) queryParams.append("id", deploymentId.toString())

  return fetchAPI<Deployment[]>(`/deployments?${queryParams.toString()}`)
}
export const getDeployment = (id: number, version: number) =>
  fetchAPI<Deployment>(`/deployments/${id}?version=${version}`)

// Repositories
export const getRepositories = (params?: { project_id?: number; organization_id?: number }) => {
  const queryParams = new URLSearchParams()
  if (params?.project_id) queryParams.append("project_id", params.project_id.toString())
  if (params?.organization_id) queryParams.append("organization_id", params.organization_id.toString())

  return fetchAPI<Repository[]>(`/repositories?${queryParams.toString()}`)
}
export const getRepository = (id: number) =>
  fetchAPI<{ repository: Repository; references: any[] }>(`/repositories/${id}`)
