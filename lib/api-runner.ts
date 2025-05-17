export const RUNNER_API_BASE_URL = `${process.env.NEXT_PUBLIC_RUNNER_API_URL || "http://localhost:8084"}`;

// --- Import token getter and error types ---
import {
    getServerToken,
    ApiTokenExpiredError,
    TokenRefreshFailedError,
    GetTokenFn
} from "./api-retry";

// --- Import generated API Clients and Configurations for Runner API ---
import {
    Configuration as RunnerConfiguration,
    RunServiceApi,
    TfStateServiceApi,
    Run,
    DispatchRunRequest,
    // RunLog, // getRunLogs returns string, not a specific RunLog type
    TerraformState
} from "./generated-api/runner";

// --- Export types for use in UI components ---
export type {
    Run,
    DispatchRunRequest,
    TerraformState
};

// No global runnerApiConfig or client instantiations that use getServerToken by default

// --- Helper to create a configured API client for Runner API ---
const createRunnerApiClient = <T extends { new(config: RunnerConfiguration): InstanceType<T> }>(
    ApiClientClass: T,
    token: string
): InstanceType<T> => {
    const config = new RunnerConfiguration({
        basePath: RUNNER_API_BASE_URL,
        accessToken: async () => token, // Use the passed token
    });
    return new ApiClientClass(config);
};

// --- Runner API: RunService Functions ---
export const getRunnerRuns = async (token: string /* projectId: number - API does not take projectId directly */): Promise<Run[]> => {
    const client = createRunnerApiClient(RunServiceApi, token);
    try {
        const response = await client.getRuns(); // getRuns does not take projectId
        return response.data || []; // Assuming response.data is directly Run[]
    } catch (error: any) {
        console.error(`[getRunnerRuns] Error:`, error.message || error);
        if (error.response) throw new Error(error.response.data?.error || `Failed to get runs: ${error.response.status}`);
        throw error;
    }
};

export const getRunnerRunById = async (token: string, id: number): Promise<Run> => {
    const client = createRunnerApiClient(RunServiceApi, token);
    try {
        const response = await client.getRunById(id);
        return response.data; // Assuming response.data is directly Run
    } catch (error: any) {
        console.error(`[getRunnerRunById id:${id}] Error:`, error.message || error);
        if (error.response) throw new Error(error.response.data?.error || `Failed to get run ${id}: ${error.response.status}`);
        throw error;
    }
};

export const createRunnerRun = async (token: string, runRequest: DispatchRunRequest): Promise<Run> => {
    const client = createRunnerApiClient(RunServiceApi, token);
    try {
        const response = await client.dispatchRun(runRequest);
        return response.data; // Assuming response.data is directly Run
    } catch (error: any) {
        console.error(`[createRunnerRun for deploymentId:${runRequest.deploymentId}] Error:`, error.message || error);
        if (error.response) throw new Error(error.response.data?.error || `Failed to create run: ${error.response.status}`);
        throw error;
    }
};

export const getRunLogs = async (token: string, runId: number): Promise<string> => {
    const client = createRunnerApiClient(RunServiceApi, token);
    try {
        const response = await client.getRunLogs(runId);
        return response.data || "";
    } catch (error: any) {
        console.error(`[getRunLogs for runId:${runId}] Error:`, error.message || error);
        if (error.response) throw new Error(error.response.data?.error || `Failed to get run logs: ${error.response.status}`);
        throw error;
    }
};

// --- Runner API: TfStateService Functions ---

/**
 * Retrieves the Terraform state for a given deployment.
 * @param deploymentId The ID of the deployment.
 * @returns A promise that resolves to the Terraform state representation.
 */
export const getTfState = async (token: string, deploymentId: number): Promise<TerraformState> => {
    const client = createRunnerApiClient(TfStateServiceApi, token);
    try {
        const response = await client.getTfStateByDeploymentId(deploymentId);
        return response.data;
    } catch (error: any) {
        console.error(`[getTfState for deploymentId:${deploymentId}] Error:`, error.message || error);
        if (error.response) {
            if (error.response.status === 404) {
                console.warn(`[getTfState] State not found for deploymentId:${deploymentId}`);
            }
            throw new Error(error.response.data?.error || `Failed to get Terraform state: ${error.response.status}`);
        }
        throw error;
    }
};

/**
 * Updates (or creates if not existing) the Terraform state for a given deployment.
 * @param deploymentId The ID of the deployment.
 * @param stateDataString The Terraform state data as a string.
 * @returns A promise that resolves when the state is successfully updated (response body is void for storeTfState).
 */
export const updateTfState = async (token: string, deploymentId: number, stateDataString: string): Promise<void> => {
    const client = createRunnerApiClient(TfStateServiceApi, token);
    try {
        await client.storeTfState(deploymentId, stateDataString);
    } catch (error: any) {
        console.error(`[updateTfState for deploymentId:${deploymentId}] Error:`, error.message || error);
        if (error.response) throw new Error(error.response.data?.error || `Failed to update Terraform state: ${error.response.status}`);
        throw error;
    }
};
