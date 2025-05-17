'use server';

import { deleteRepository as apiDeleteRepository, getRepository as apiGetRepository, updateRepository as apiUpdateRepository, type Repository, type UpdateRepositoryInput } from "@/lib/api-core";
import { type GetTokenFn } from "@/lib/api-retry"; // Assuming GetTokenFn might be needed or a plain token

// Helper to get the token; adapt if you have a centralized way like in secrets/actions.ts
// For now, we assume the token is passed directly to the action.

export async function deleteRepositoryAction(
  repositoryId: number,
  token: string // Expecting the token to be passed from the client component
): Promise<{ success: boolean; error?: string }> {
  try {
    // The token is passed directly.
    await apiDeleteRepository(token, repositoryId);
    return { success: true };
  } catch (error: any) {
    console.error("[ServerAction] Error deleting repository:", error);
    return { success: false, error: error.message || "Failed to delete repository" };
  }
}

// --- Add updateRepositoryAction ---
export async function updateRepositoryAction(
  repositoryId: number,
  updateData: UpdateRepositoryInput,
  token: string
): Promise<{ success: boolean; data?: Repository; error?: string }> {
  try {
    // The token is passed directly.
    const updatedRepository = await apiUpdateRepository(token, repositoryId, updateData);
    return { success: true, data: updatedRepository };
  } catch (error: any) {
    console.error("[ServerAction] Error updating repository:", error);
    return { success: false, error: error.message || "Failed to update repository" };
  }
}
// --- End of updateRepositoryAction --- 