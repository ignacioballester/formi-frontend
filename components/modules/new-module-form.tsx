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
import { getRepositories, type Repository, type GitReference, type CreateModuleInput } from "@/lib/api";
import { getRepoReferencesAction, createModuleAction } from "@/app/actions/modules/actions"; // Ensure this path is correct

interface NewModuleFormProps {
  organizationId: string;
  projectId?: string; // For project-specific modules
  onModuleCreated?: (moduleId: number) => void; // Optional: Callback after creation
}

export function NewModuleForm({ organizationId, projectId, onModuleCreated }: NewModuleFormProps) {
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
      moduleName: "",
      repositoryId: "",
      selectedGitReference: "",
      workingDirectory: "./",
    },
  });

  const getClientToken = useCallback(async () => {
    if (!session?.accessToken) {
      toast({ title: "Authentication Error", description: "Access token not available.", variant: "destructive" });
      throw new Error("Access token not available");
    }
    return session.accessToken;
  }, [session]);

  // Fetch repositories when organizationId is available and session is authenticated
  useEffect(() => {
    if (organizationId && sessionStatus === "authenticated") {
      setIsLoadingRepositories(true);
      getClientToken().then(token => {
        getRepositories({ organization_id: Number(organizationId) }, async () => token)
          .then(repos => setRepositories(repos))
          .catch(err => {
            console.error("Failed to load repositories:", err);
            toast({ title: "Error Loading Repositories", description: err.message, variant: "destructive" });
          })
          .finally(() => setIsLoadingRepositories(false));
      }).catch(err => {
        setIsLoadingRepositories(false);
        toast({ title: "Token Error", description: "Failed to get client token for repositories.", variant: "destructive" });
      });
    }
  }, [organizationId, sessionStatus, getClientToken]);

  const selectedRepositoryId = form.watch("repositoryId");

  // Fetch Git references when a repository is selected
  useEffect(() => {
    if (selectedRepositoryId && sessionStatus === "authenticated") {
      setIsLoadingGitReferences(true);
      setGitReferences([]); // Clear previous references
      form.setValue("selectedGitReference", ""); // Reset selection in form
      getClientToken().then(token => {
        getRepoReferencesAction(Number(selectedRepositoryId), token)
          .then(result => {
            if (result.success && result.data) {
              setGitReferences(result.data);
            } else {
              toast({ title: "Error Fetching References", description: result.error, variant: "destructive" });
            }
          })
          .catch(err => {
            toast({ title: "Error Loading References", description: err.message, variant: "destructive" });
          })
          .finally(() => setIsLoadingGitReferences(false));
      }).catch(err => {
        setIsLoadingGitReferences(false);
        toast({ title: "Token Error", description: "Failed to get client token for references.", variant: "destructive" });
      });
    }
  }, [selectedRepositoryId, sessionStatus, getClientToken, form]);

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

      const moduleInput: CreateModuleInput = {
        name: data.moduleName,
        repository_id: Number(data.repositoryId),
        working_directory: data.workingDirectory,
        organization_id: Number(organizationId),
        git_reference: gitRef,
      };

      if (projectId) {
        moduleInput.project_id = Number(projectId);
      }

      const result = await createModuleAction(moduleInput, token);
      if (result.success && result.data) {
        toast({ title: "Module Created", description: `Module "${result.data.name}" created successfully.` });
        if (onModuleCreated) {
          onModuleCreated(result.data.id);
        } else {
          // Default navigation if no callback is provided
          if (projectId) {
            router.push(`/projects/${projectId}/modules`);
          } else {
            router.push(`/organizations/${organizationId}/modules`);
          }
          router.refresh(); // Ensure the list updates
        }
      } else {
        throw new Error(result.error || "An unexpected error occurred during module creation.");
      }
    } catch (error: any) {
      console.error("Module creation error:", error);
      toast({ title: "Module Creation Failed", description: error.message, variant: "destructive" });
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
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSubmitting || isLoadingRepositories || isLoadingGitReferences}>
              {isSubmitting ? "Creating Module..." : "Create Module"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
} 