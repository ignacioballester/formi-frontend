"use client"

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { ArrowLeft, ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/use-toast";
import { useOrganization } from "@/contexts/organization-context";
import { type Project, type Repository, type Organization, getProject, getOrganization, getRepository } from "@/lib/api-core";
import { EditRepositoryForm } from "@/components/repositories/edit-repository-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function EditRepositoryPageProject() {
  const params = useParams<{ projectId: string; repoId: string }>();
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const {
    selectedOrganization: contextOrg,
    setSelectedOrganization: setContextSelectedOrg,
    selectedProject: contextProject,
    setSelectedProject: setContextSelectedProject,
  } = useOrganization();

  const projectId = params.projectId;
  const repositoryId = params.repoId;

  const [project, setProject] = useState<Project | null>(contextProject);
  const [repository, setRepository] = useState<Repository | null>(null);
  const [parentOrganization, setParentOrganization] = useState<Organization | null>(contextOrg);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getClientToken = useCallback(async () => {
    if (!session?.accessToken) {
      toast({ title: "Authentication Error", description: "Access token not available.", variant: "destructive" });
      throw new Error("Access token not available");
    }
    return session.accessToken;
  }, [session]);

  useEffect(() => {
    async function fetchData() {
      if (!projectId || !repositoryId || sessionStatus !== "authenticated") {
        if (sessionStatus === "loading") return;
        setLoading(false);
        setError(sessionStatus !== "authenticated" ? "User not authenticated." : "Project or Repository ID missing.");
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const token = await getClientToken();
        
        // Fetch Repository directly using the API function
        const repoResult = await getRepository(token, Number(repositoryId));
        if (!repoResult || !repoResult.repository) throw new Error("Failed to load repository details.");
        setRepository(repoResult.repository);
        const fetchedRepoOrgId = repoResult.repository.organization_id;

        // Fetch Project
        let currentProject = contextProject;
        if (!currentProject || currentProject.id.toString() !== projectId) {
          currentProject = await getProject(token, Number(projectId));
          setContextSelectedProject(currentProject); // Update context
        }
        if (!currentProject) throw new Error("Failed to load project details.");
        setProject(currentProject);

        // Verify repository belongs to the project's parent organization (or the one it claims)
        if (currentProject.organization_id !== fetchedRepoOrgId) {
            // This scenario might indicate a data consistency issue or direct access to a repo not related to project's org
            // For now, we prioritize the repository's own organization_id for fetching its parent org.
            console.warn(`Project's organization_id (${currentProject.organization_id}) differs from repository's claimed organization_id (${fetchedRepoOrgId}). Proceeding with repository's organization_id.`);
        }

        // Fetch Parent Organization (using repo's org_id as source of truth for the repo itself)
        let currentParentOrg = contextOrg;
        if (!currentParentOrg || currentParentOrg.id !== fetchedRepoOrgId) {
          currentParentOrg = await getOrganization(token, fetchedRepoOrgId);
          // We set this as parentOrganization for display, but might not update context if it conflicts with project's context org
          // If the project context org is already set and matches project.organization_id, we might prefer that one for overall project context.
          // However, EditRepositoryForm needs the org the repo *actually* belongs to.
           setContextSelectedOrg(currentParentOrg); // Update context to repo's actual parent for consistency in this view
        }
        if (!currentParentOrg) throw new Error("Failed to load parent organization for the repository.");
        setParentOrganization(currentParentOrg);

      } catch (err: any) {
        console.error("Error fetching data:", err);
        setError(err.message || "An unexpected error occurred.");
        toast({ title: "Error Loading Page Data", description: err.message, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    }
    if (sessionStatus === "unauthenticated") router.push("/login");
    else fetchData();
  }, [projectId, repositoryId, sessionStatus, getClientToken, router, contextOrg, contextProject, setContextSelectedOrg, setContextSelectedProject]);

  const handleUpdateSuccess = (updatedRepository: Repository) => {
    setRepository(updatedRepository);
    toast({ title: "Success", description: "Repository updated successfully." });
  };

  if (loading || sessionStatus === "loading") {
    return (
      <div className="space-y-6 p-4 md:p-8 pt-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div> <Skeleton className="h-8 w-48" /> <Skeleton className="h-4 w-64 mt-1" /> </div>
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (error || !project || !repository || !parentOrganization) {
    return (
      <div className="flex flex-col items-center justify-center w-full min-h-[calc(100vh-100px)] p-4">
        <p className="text-lg text-destructive text-center mb-4">
          {error || "Project, Repository, or Parent Organization data could not be loaded."}
        </p>
        <Button onClick={() => router.push(`/projects/${projectId}/repositories`)} variant="outline">Back to Project Repositories</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="icon" asChild>
          <Link href={`/projects/${projectId}/repositories`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{repository.name}</h1>
          <p className="text-sm text-muted-foreground">
            Editing repository for Project: <Link href={`/projects/${project.id}`} className="hover:underline">{project.name}</Link><br/>
            (Parent Organization: <Link href={`/organizations/${parentOrganization.id}`} className="hover:underline">{parentOrganization.name}</Link>)
          </p>
        </div>
      </div>

      <EditRepositoryForm 
        organizationId={parentOrganization.id.toString()} 
        repository={repository} 
        getClientToken={getClientToken} 
        onSuccess={handleUpdateSuccess} 
      />
      
      <Card className="mt-6">
        <CardHeader><CardTitle>Additional Information</CardTitle></CardHeader>
        <CardContent className="text-sm space-y-2">
            <p><strong>Repository ID:</strong> {repository.id}</p>
            <p><strong>URL:</strong> <a href={repository.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{repository.url} <ExternalLink className="inline-block h-3 w-3 ml-1"/></a></p>
            <p><strong>Belongs to Organization ID:</strong> {repository.organization_id}</p>
        </CardContent>
      </Card>
    </div>
  );
} 