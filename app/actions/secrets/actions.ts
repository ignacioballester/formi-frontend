'use server';

import { type SecretResponse, type SecretCreate, type SecretUpdate } from "@/lib/api-core";

const SECRETS_API_BASE_URL = 'http://localhost:8082';

export async function listSecretsAction(
  token: string,
  organizationId?: number,
  projectId?: number,
  type?: string
): Promise<{ success: boolean; data?: SecretResponse[]; error?: string }> {
  try {
    const queryParams = new URLSearchParams();
    
    if (organizationId !== undefined && organizationId !== null) {
      queryParams.append('organization_id', organizationId.toString());
    }
    if (projectId !== undefined) {
      queryParams.append('project_id', projectId.toString());
    }
    if (type !== undefined) {
      queryParams.append('type', type);
    }

    const url = `${SECRETS_API_BASE_URL}/secrets${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    console.log('Fetching secrets from:', url); // Debug log

    const response = await fetch(url, {
      method: 'GET',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return { success: true, data: [] }; // Return empty array for 404
      }
      const errorData = await response.json().catch(() => ({ message: "Failed to list secrets" }));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error: any) {
    console.error("[ServerAction] Error listing secrets:", error);
    return { success: false, error: error.message || "Failed to list secrets" };
  }
}

export async function createSecretAction(
  secretData: SecretCreate,
  token: string
): Promise<{ success: boolean; data?: SecretResponse; error?: string }> {
  try {
    const url = `${SECRETS_API_BASE_URL}/secrets`;
    console.log('Creating secret at:', url); // Debug log
    console.log('Secret data:', JSON.stringify(secretData, null, 2)); // Debug log
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(secretData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: "Failed to create secret" }));
      console.error('Create secret error response:', {
        status: response.status,
        statusText: response.statusText,
        errorData
      });
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error: any) {
    console.error("[ServerAction] Error creating secret:", error);
    return { success: false, error: error.message || "Failed to create secret" };
  }
}

export async function deleteSecretAction(
  name: string,
  type: string,
  token: string,
  organizationId?: number,
  projectId?: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const queryParams = new URLSearchParams();
    
    if (organizationId !== undefined && organizationId !== null) {
      queryParams.append('organization_id', organizationId.toString());
    }
    if (projectId !== undefined && projectId !== null) {
      queryParams.append('project_id', projectId.toString());
    }
    queryParams.append('type', type);

    const url = `${SECRETS_API_BASE_URL}/secrets/${name}?${queryParams.toString()}`;
    console.log('Deleting secret:', url); // Debug log

    const response = await fetch(url, {
      method: 'DELETE',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      },
    });

    if (!response.ok && response.status !== 204) {
      const errorData = await response.json().catch(() => ({ message: `Failed to delete secret ${name}` }));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return { success: true };
  } catch (error: any) {
    console.error("[ServerAction] Error deleting secret:", error);
    return { success: false, error: error.message || "Failed to delete secret" };
  }
}

export async function getSecretAction(
  token: string,
  name: string,
  type: string,
  organizationId?: number,
  projectId?: number,
  includePrivate: boolean = true // Default to true to get data for editing
): Promise<{ success: boolean; data?: SecretResponse; error?: string }> {
  try {
    const queryParams = new URLSearchParams();
    queryParams.append('type', type);
    if (organizationId !== undefined && organizationId !== null) {
      queryParams.append('organization_id', organizationId.toString());
    }
    if (projectId !== undefined && projectId !== null) {
      queryParams.append('project_id', projectId.toString());
    }
    queryParams.append('include_private', includePrivate.toString());

    const url = `${SECRETS_API_BASE_URL}/secrets/${name}?${queryParams.toString()}`;
    console.log('Fetching secret details from:', url); 

    const response = await fetch(url, {
      method: 'GET',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: `Failed to get secret ${name}` }));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error: any) {
    console.error("[ServerAction] Error getting secret:", error);
    return { success: false, error: error.message || `Failed to get secret ${name}` };
  }
}

export async function updateSecretAction(
  token: string,
  name: string,
  updateData: import("@/lib/api-core").SecretUpdate
): Promise<{ success: boolean; data?: SecretResponse; error?: string }> {
  try {
    const url = `${SECRETS_API_BASE_URL}/secrets/${name}`;
    console.log('Updating secret at:', url, 'with data:', JSON.stringify(updateData, null, 2));

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: `Failed to update secret ${name}` }));
      console.error('Update secret error response:', {
        status: response.status,
        statusText: response.statusText,
        errorData
      });
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error: any) {
    console.error("[ServerAction] Error updating secret:", error);
    return { success: false, error: error.message || `Failed to update secret ${name}` };
  }
}

// New action to fetch secret type definitions
export async function getSecretTypesAction(token: string): Promise<{
  success: boolean;
  data?: import("@/lib/api-core").SecretTypeDefinition[];
  error?: string;
}> {
  try {
    const url = `${SECRETS_API_BASE_URL}/secrets/types`;
    console.log('Fetching secret types from:', url); // Debug log

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        // If types endpoint is not found, perhaps return empty or specific error
        console.warn("Secret types endpoint not found (404).");
        return { success: true, data: [] }; 
      }
      const errorData = await response.json().catch(() => ({ message: "Failed to fetch secret types" }));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error: any) {
    console.error("[ServerAction] Error fetching secret types:", error);
    return { success: false, error: error.message || "Failed to fetch secret types" };
  }
} 