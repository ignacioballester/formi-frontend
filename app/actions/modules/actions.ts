'use server';

import {
  getRepository as apiGetRepository,
  createModule as apiCreateModule,
  getModule as apiGetModule,
  updateModule as apiUpdateModule,
  deleteModule as apiDeleteModule,
  type GitReference,
  type CreateModuleInput,
  type UpdateModuleInput,
  type Module
} from "@/lib/api-core";
import { type GetTokenFn } from "@/lib/api-retry";

export async function getRepoReferencesAction(
  repositoryId: number,
  token: string
): Promise<{ success: boolean; data?: GitReference[]; error?: string }> {
  try {
    const getTokenFn: GetTokenFn = async () => token;
    // The getRepository function returns { repository: Repository; references: GitReference[] }
    const result = await apiGetRepository(repositoryId, getTokenFn);
    return { success: true, data: result.references };
  } catch (error: any) {
    console.error("[ServerAction] Error getting repository references:", error);
    return { success: false, error: error.message || "Failed to get repository references" };
  }
}

export async function createModuleAction(
  moduleData: CreateModuleInput,
  token: string
): Promise<{ success: boolean; data?: Module; error?: string }> {
  try {
    const getTokenFn: GetTokenFn = async () => token;
    const newModule = await apiCreateModule(moduleData, getTokenFn);
    return { success: true, data: newModule };
  } catch (error: any) {
    console.error("[ServerAction] Error creating module:", error);
    return { success: false, error: error.message || "Failed to create module" };
  }
}

export async function getModuleAction(
  moduleId: number,
  token: string
): Promise<{ success: boolean; data?: Module; error?: string }> {
  try {
    const getTokenFn: GetTokenFn = async () => token;
    const moduleData = await apiGetModule(moduleId, getTokenFn);
    return { success: true, data: moduleData };
  } catch (error: any) {
    console.error("[ServerAction] Error getting module:", error);
    return { success: false, error: error.message || "Failed to get module details" };
  }
}

export async function updateModuleAction(
  moduleId: number,
  updateData: UpdateModuleInput,
  token: string
): Promise<{ success: boolean; data?: Module; error?: string }> {
  try {
    const getTokenFn: GetTokenFn = async () => token;
    const updatedModule = await apiUpdateModule(moduleId, updateData, getTokenFn);
    return { success: true, data: updatedModule };
  } catch (error: any) {
    console.error("[ServerAction] Error updating module:", error);
    return { success: false, error: error.message || "Failed to update module" };
  }
}

export async function deleteModuleAction(
  moduleId: number,
  token: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const getTokenFn: GetTokenFn = async () => token;
    await apiDeleteModule(moduleId, getTokenFn);
    return { success: true };
  } catch (error: any) {
    console.error("[ServerAction] Error deleting module:", error);
    return { success: false, error: error.message || "Failed to delete module" };
  }
} 