'use server';

import { deleteRepository as apiDeleteRepository, getRepository as apiGetRepository, updateRepository as apiUpdateRepository, type Repository, type UpdateRepositoryInput } from "@/lib/api";
import { type GetTokenFn } from "@/lib/api-retry"; // Assuming GetTokenFn might be needed or a plain token

// Helper to get the token; adapt if you have a centralized way like in secrets/actions.ts
// For now, we assume the token is passed directly to the action.

export async function deleteRepositoryAction(
  repositoryId: number,
  token: string // Expecting the token to be passed from the client component
): Promise<{ success: boolean; error?: string }> {
  try {
    // The lib/api.ts deleteRepository function is designed to be called with a GetTokenFn
    // or directly with a token if fetchAPI is adapted.
    // For simplicity with server actions, we'll create a GetTokenFn on the fly here.
    // However, the `deleteRepository` function in `lib/api.ts` now uses `fetchAPI`
    // which can take a `customGetTokenFn`. If the token is already available (as it is here),
    // we can construct a simple GetTokenFn.

    const getTokenFn: GetTokenFn = async () => token;

    await apiDeleteRepository(repositoryId, getTokenFn);
    return { success: true };
  } catch (error: any) {
    console.error("[ServerAction] Error deleting repository:", error);
    return { success: false, error: error.message || "Failed to delete repository" };
  }
}

// --- Add getRepositoryAction ---
export async function getRepositoryAction(
  repositoryId: number,
  token: string
): Promise<{ success: boolean; data?: { repository: Repository; references: any[] }; error?: string }> {
  try {
    const getTokenFn: GetTokenFn = async () => token;
    const result = await apiGetRepository(repositoryId, getTokenFn);
    return { success: true, data: result };
  } catch (error: any) {
    console.error("[ServerAction] Error getting repository:", error);
    return { success: false, error: error.message || "Failed to get repository details" };
  }
}
// --- End of getRepositoryAction ---

// --- Add updateRepositoryAction ---
export async function updateRepositoryAction(
  repositoryId: number,
  updateData: UpdateRepositoryInput,
  token: string
): Promise<{ success: boolean; data?: Repository; error?: string }> {
  try {
    const getTokenFn: GetTokenFn = async () => token;
    const updatedRepository = await apiUpdateRepository(repositoryId, updateData, getTokenFn);
    return { success: true, data: updatedRepository };
  } catch (error: any) {
    console.error("[ServerAction] Error updating repository:", error);
    return { success: false, error: error.message || "Failed to update repository" };
  }
}
// --- End of updateRepositoryAction --- 