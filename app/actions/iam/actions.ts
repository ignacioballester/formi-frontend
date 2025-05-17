'use server';

import {
    removeIamRoleAssignment,
    createIamRoleAssignment,
    type RoleAssignment
} from "@/lib/api-iam";
import { getServerToken } from "@/lib/api-retry";

export async function deleteRoleAssignmentAction(assignment: RoleAssignment): Promise<{ success: boolean; error?: string }> {
  try {
    const token = await getServerToken();
    if (!token) {
        return { success: false, error: "Authentication token not available for server action." };
    }
    await removeIamRoleAssignment(token, assignment);
    console.log("[ServerAction] Role assignment removed successfully for:", assignment.principal_id, assignment.role_name, assignment.resource_name);
    return { success: true };
  } catch (error: any) {
    console.error("[ServerAction] Error removing role assignment:", error.message, "Details:", error.response?.data);
    return { success: false, error: error.message || "Failed to remove role assignment." };
  }
}

export async function createRoleAssignmentAction(assignmentData: RoleAssignment): Promise<{ success: boolean; data?: RoleAssignment; error?: string }> {
    try {
        const token = await getServerToken();
        if (!token) {
            return { success: false, error: "Authentication token not available for server action." };
        }
        await createIamRoleAssignment(token, assignmentData);
        console.log("[ServerAction] Role assignment created successfully for:", assignmentData.principal_id, assignmentData.role_name, assignmentData.resource_name);
        return { success: true, data: assignmentData };
    } catch (error: any) {
        console.error("[ServerAction] Error creating role assignment:", error.message, "Details:", error.response?.data);
        return { success: false, error: error.message || "Failed to create role assignment." };
    }
} 