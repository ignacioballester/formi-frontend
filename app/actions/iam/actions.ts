'use server';

import { removeRoleAssignment as serverRemoveRoleAssignment, type RoleAssignment } from "@/lib/iam";

export async function deleteRoleAssignmentAction(assignment: RoleAssignment): Promise<{ success: boolean; error?: string }> {
  try {
    await serverRemoveRoleAssignment(assignment);
    return { success: true };
  } catch (error: any) {
    console.error("[ServerAction] Error removing role assignment:", error);
    return { success: false, error: error.message || "Failed to remove role assignment." };
  }
} 