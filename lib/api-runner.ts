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

// --- Configure and Instantiate Runner API Clients ---
const runnerApiConfig = new RunnerConfiguration({
    basePath: RUNNER_API_BASE_URL,
    accessToken: async () => {
        const token = await getServerToken();
        if (!token) {
            console.error("[Runner API Client Cfg] getServerToken returned null or undefined. Throwing TokenRefreshFailedError.");
            throw new TokenRefreshFailedError("Failed to obtain a token for Runner API call.");
        }
        return token;
    }
});

const runServiceClient = new RunServiceApi(runnerApiConfig);
const tfStateServiceClient = new TfStateServiceApi(runnerApiConfig);

// --- Runner API: RunService Functions ---
// Note: getRuns does not take projectId directly. Filtering would need to be client-side or API needs enhancement.
export const getRunnerRuns = async (): Promise<Run[]> => {
    try {
        const response = await runServiceClient.getRuns();
        return response.data || []; // Ensure an array is returned
    } catch (error: any) {
        console.error(`[getRunnerRuns] Error:`, error.message || error);
        if (error.response) throw new Error(error.response.data?.error || `Failed to get runs: ${error.response.status}`);
        throw error;
    }
};

export const getRunnerRunById = async (id: number): Promise<Run> => {
    try {
        const response = await runServiceClient.getRunById(id);
        // The generated client directly returns Run or throws, so direct access to response.data is fine.
        // No need for explicit !response.data.run check as with previous assumed structure.
        return response.data;
    } catch (error: any) {
        console.error(`[getRunnerRunById id:${id}] Error:`, error.message || error);
        if (error.response) throw new Error(error.response.data?.error || `Failed to get run ${id}: ${error.response.status}`);
        throw error;
    }
};

// Changed RunCreate to DispatchRunRequest as per generated API
export const createRunnerRun = async (runRequest: DispatchRunRequest): Promise<Run> => {
    try {
        // The dispatchRun method expects DispatchRunRequest directly as its payload.
        const response = await runServiceClient.dispatchRun(runRequest);
        // Similar to getRunById, successful response.data is the Run object.
        return response.data;
    } catch (error: any) {
        console.error(`[createRunnerRun for deploymentId:${runRequest.deploymentId}] Error:`, error.message || error);
        if (error.response) throw new Error(error.response.data?.error || `Failed to create run: ${error.response.status}`);
        throw error;
    }
};

// getRunLogs returns a string, not RunLog[]
export const getRunLogs = async (runId: number): Promise<string> => {
    try {
        const response = await runServiceClient.getRunLogs(runId);
        return response.data || ""; // Ensure a string is returned
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
export const getTfState = async (deploymentId: number): Promise<TerraformState> => {
    try {
        const response = await tfStateServiceClient.getTfStateByDeploymentId(deploymentId);
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
export const updateTfState = async (deploymentId: number, stateDataString: string): Promise<void> => {
    try {
        // storeTfState expects the state data as a raw string in the body
        await tfStateServiceClient.storeTfState(deploymentId, stateDataString);
        // storeTfState returns void, so no data to return from response.data
    } catch (error: any) {
        console.error(`[updateTfState for deploymentId:${deploymentId}] Error:`, error.message || error);
        if (error.response) throw new Error(error.response.data?.error || `Failed to update Terraform state: ${error.response.status}`);
        throw error;
    }
};
