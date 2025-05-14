"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useSession } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { toast } from "@/components/ui/use-toast";
import { ModuleFormFields, moduleSchema, type ModuleFormValues } from "@/components/forms/module-form-fields";
import {
  getRepositories,
  type Repository,
  type GitReference,
  type Module, // Existing module type
  type UpdateModuleInput, // For the update action
  type CreateModuleInput, // <-- ADD THIS IMPORT
} from "@/lib/api";
import { getRepoReferencesAction, updateModuleAction } from "@/app/actions/modules/actions"; // Ensure updateModuleAction exists

interface EditModuleFormProps {
  organizationId: string;
  moduleToEdit: Module;
  onModuleUpdated?: (moduleId: number) => void;
}

// Helper to create the string value for selectedGitReference from a GitReference object
const formatGitReferenceForSelect = (gitRef: GitReference): string => {
  if (gitRef.branch) return `branch:${gitRef.branch}`;
  if (gitRef.tag) return `tag:${gitRef.tag}`;
  if (gitRef.commit) return `commit:${gitRef.commit}`;
  return "";
};

export function EditModuleForm({ organizationId, moduleToEdit, onModuleUpdated }: EditModuleFormProps) {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [isLoadingRepositories, setIsLoadingRepositories] = useState(false);
  const [gitReferences, setGitReferences] = useState<GitReference[]>([]);
  const [isLoadingGitReferences, setIsLoadingGitReferences] = useState(false);

  const form = useForm<ModuleFormValues>({
    resolver: zodResolver(moduleSchema),
    defaultValues: {
      moduleName: moduleToEdit.name || "",
      repositoryId: moduleToEdit.repository_id.toString() || "",
      selectedGitReference: formatGitReferenceForSelect(moduleToEdit.git_reference) || "",
      workingDirectory: moduleToEdit.working_directory || "./",
    },
  });

  const getClientToken = useCallback(async () => {
    if (!session?.accessToken) {
      toast({ title: "Authentication Error", description: "Access token not available.", variant: "destructive" });
      throw new Error("Access token not available");
    }
    return session.accessToken;
  }, [session]);

  // Fetch repositories
  useEffect(() => {
    if (organizationId && sessionStatus === "authenticated") {
      setIsLoadingRepositories(true);
      getClientToken().then(token => {
        getRepositories({ organization_id: Number(organizationId) }, async () => token)
          .then(repos => setRepositories(repos))
          .catch(err => toast({ title: "Error Loading Repositories", description: err.message, variant: "destructive" }))
          .finally(() => setIsLoadingRepositories(false));
      }).catch(() => setIsLoadingRepositories(false));
    }
  }, [organizationId, sessionStatus, getClientToken]);

  const selectedRepositoryId = form.watch("repositoryId");

  // Fetch Git references when repositoryId changes or on initial load if moduleToEdit.repository_id is set
  useEffect(() => {
    const repoIdToFetch = selectedRepositoryId ? Number(selectedRepositoryId) : moduleToEdit.repository_id;
    if (repoIdToFetch && sessionStatus === "authenticated") {
      setIsLoadingGitReferences(true);
      // Do not clear gitReferences if selectedRepositoryId hasn't changed from initial, to allow default selection
      if (selectedRepositoryId && Number(selectedRepositoryId) !== moduleToEdit.repository_id) {
         setGitReferences([]);
         form.setValue("selectedGitReference", "");
      }
      getClientToken().then(token => {
        getRepoReferencesAction(repoIdToFetch, token)
          .then(result => {
            if (result.success && result.data) {
              setGitReferences(result.data);
              // If the selectedGitReference from defaultValues is still valid for the new/current list, keep it.
              // Otherwise, user will have to re-select. This happens if the initially loaded repo's references are fetched.
              const currentSelectedRef = formatGitReferenceForSelect(moduleToEdit.git_reference);
              if(Number(selectedRepositoryId) === moduleToEdit.repository_id && !result.data.some(ref => formatGitReferenceForSelect(ref) === currentSelectedRef)){
                // initial ref is not in the list, might have been deleted from repo
                // form.setValue("selectedGitReference", ""); // or let user see it's invalid and re-select
              }
            } else {
              toast({ title: "Error Fetching References", description: result.error, variant: "destructive" });
            }
          })
          .catch(err => toast({ title: "Error Loading References", description: err.message, variant: "destructive" }))
          .finally(() => setIsLoadingGitReferences(false));
      }).catch(() => setIsLoadingGitReferences(false));
    }
  }, [selectedRepositoryId, moduleToEdit.repository_id, sessionStatus, getClientToken, form, moduleToEdit.git_reference]);

  const onSubmit = async (data: ModuleFormValues) => {
    setIsSubmitting(true);
    try {
      const token = await getClientToken();
      const [type, value] = data.selectedGitReference.split(":");
      const gitRef: GitReference = {};
      if (type === 'branch') gitRef.branch = value;
      else if (type === 'tag') gitRef.tag = value;
      else if (type === 'commit') gitRef.commit = value;
      else {
        toast({ title: "Invalid Git Reference", description: "Selected Git reference is invalid.", variant: "destructive" });
        setIsSubmitting(false);
        return;
      }

      // For update, we might only send changed fields. 
      // However, module API for update might expect all core fields or be a PATCH.
      // Assuming PUT for now which replaces, or a specific UpdateModuleInput structure.
      // The current `UpdateModuleInput` in lib/api.ts is very minimal (name, module_config).
      // This will likely need adjustment based on API capabilities for module updates.
      // For now, creating a structure similar to CreateModuleInput but for update.
      // This might need to become a true UpdateModuleInput based on API spec.
      
      const moduleUpdatePayload: Partial<CreateModuleInput> & { id: number } = {
        id: moduleToEdit.id,
        name: data.moduleName,
        repository_id: Number(data.repositoryId),
        working_directory: data.workingDirectory,
        git_reference: gitRef,
        // organization_id and project_id are usually not updatable or are part of the route/context
        // If they are part of UpdateModuleInput, they should be added.
        organization_id: moduleToEdit.organization_id, // Assuming org doesn't change
      };
      if (moduleToEdit.project_id) {
        moduleUpdatePayload.project_id = moduleToEdit.project_id; // Assuming project scope doesn't change
      }

      // IMPORTANT: The `updateModuleAction` needs to accept this payload.
      // The current `UpdateModuleInput` from `lib/api.ts` is: { name?: string; module_config?: ModuleConfig; }
      // This means `updateModuleAction` or `UpdateModuleInput` in `lib/api.ts` needs to be updated
      // to support changing repo, git_ref, working_dir.
      // Forcing a cast for now, but this highlights a mismatch.
      const result = await updateModuleAction(moduleToEdit.id, moduleUpdatePayload as UpdateModuleInput, token);

      if (result.success && result.data) {
        toast({ title: "Module Updated", description: `Module "${result.data.name}" updated successfully.` });
        if (onModuleUpdated) {
          onModuleUpdated(result.data.id);
        } else {
          if (moduleToEdit.project_id) {
            router.push(`/projects/${moduleToEdit.project_id}/modules`);
          } else {
            router.push(`/organizations/${organizationId}/modules`);
          }
          router.refresh();
        }
      } else {
        throw new Error(result.error || "An unexpected error occurred during module update.");
      }
    } catch (error: any) {
      console.error("Module update error:", error);
      toast({ title: "Module Update Failed", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardContent className="pt-6 space-y-6">
            <ModuleFormFields 
              control={form.control}
              repositories={repositories}
              isLoadingRepositories={isLoadingRepositories}
              gitReferences={gitReferences}
              isLoadingGitReferences={isLoadingGitReferences}
              isEditing={true}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSubmitting || isLoadingRepositories || isLoadingGitReferences}>
              {isSubmitting ? "Saving Changes..." : "Save Changes"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
} 