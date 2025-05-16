"use client";

import * as z from "zod";
import { Control } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { type Repository, type GitReference } from "@/lib/api-core"; // Assuming GitReference is exported

// Zod schema for module form validation
export const moduleSchema = z.object({
  moduleName: z.string().min(3, "Module name must be at least 3 characters.").max(100, "Module name must be 100 characters or less."),
  repositoryId: z.string().min(1, "Please select a repository."),
  selectedGitReference: z.string().min(1, "Please select a Git reference."),
  workingDirectory: z.string().min(1, "Working directory is required.").max(255, "Working directory path is too long.")
    .regex(/^(\.\/|\/|([a-zA-Z0-9_\-\. ]+\/)*[a-zA-Z0-9_\-\. ]*)$/, "Invalid path format. Use relative paths like './' or './path/' or absolute paths like '/path/'."),
});

export type ModuleFormValues = z.infer<typeof moduleSchema>;

interface ModuleFormFieldsProps {
  control: Control<ModuleFormValues>;
  repositories: Repository[];
  isLoadingRepositories: boolean;
  gitReferences: GitReference[]; // These are raw GitReference objects from API
  isLoadingGitReferences: boolean;
  isEditing?: boolean;
}

export function ModuleFormFields({
  control,
  repositories,
  isLoadingRepositories,
  gitReferences,
  isLoadingGitReferences,
  isEditing = false,
}: ModuleFormFieldsProps) {
  
  // Helper to create display value for GitReference select
  const getGitReferenceDisplayValue = (ref: GitReference): string => {
    if (ref.branch) return `Branch: ${ref.branch}`;
    if (ref.tag) return `Tag: ${ref.tag}`;
    if (ref.commit) return `Commit: ${ref.commit.substring(0, 7)}...`;
    return "Unknown reference";
  };

  // Helper to create the value string for GitReference select (e.g., "branch:main")
  const getGitReferenceOptionValue = (ref: GitReference): string => {
    if (ref.branch) return `branch:${ref.branch}`;
    if (ref.tag) return `tag:${ref.tag}`;
    if (ref.commit) return `commit:${ref.commit}`;
    return "";
  };

  return (
    <>
      <FormField
        control={control}
        name="moduleName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Module Name</FormLabel>
            <FormControl><Input placeholder="e.g., my-terraform-module" {...field} /></FormControl>
            <FormDescription>A unique and descriptive name for your module.</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="repositoryId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Source Repository</FormLabel>
            <Select 
              onValueChange={field.onChange} 
              defaultValue={field.value} // Ensure field.value is string
              disabled={isLoadingRepositories || repositories.length === 0}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder={isLoadingRepositories ? "Loading repositories..." : (repositories.length === 0 ? "No repositories found" : "Select a repository")} />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {repositories.map(repo => <SelectItem key={repo.id} value={repo.id.toString()}>{repo.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <FormDescription>The repository where your module code resides.</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="selectedGitReference"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Git Reference</FormLabel>
            <Select 
              onValueChange={field.onChange} 
              defaultValue={field.value} // Ensure field.value is string (e.g. "branch:main")
              disabled={isLoadingGitReferences || gitReferences.length === 0}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder={isLoadingGitReferences ? "Loading references..." : (gitReferences.length === 0 ? "Select repository first or no references found" : "Select a branch, tag, or commit")} />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {gitReferences.map((ref, idx) => {
                  const optionValue = getGitReferenceOptionValue(ref);
                  const displayValue = getGitReferenceDisplayValue(ref);
                  return <SelectItem key={`${optionValue}-${idx}`} value={optionValue}>{displayValue}</SelectItem>;
                })}
              </SelectContent>
            </Select>
            <FormDescription>The specific branch, tag, or commit hash for the module.</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="workingDirectory"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Working Directory</FormLabel>
            <FormControl><Input placeholder="e.g., ./terraform or /" {...field} /></FormControl>
            <FormDescription>Path within the repository to the module code (e.g., './', 'modules/my-module').</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
} 