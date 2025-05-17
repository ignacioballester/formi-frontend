"use client"

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { ArrowLeft, GitFork } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/use-toast";
import { useOrganization } from "@/contexts/organization-context";
import { type Project, type Organization, getProject, getOrganization } from "@/lib/api-core";
import { NewRepositoryForm } from "@/components/repositories/new-repository-form";

export default function NewRepositoryPageProject() {
  const params = useParams<{ projectId: string }>();
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const {
    selectedOrganization: contextOrg,
    setSelectedOrganization: setContextSelectedOrg,
    selectedProject: contextProject,
    setSelectedProject: setContextSelectedProject,
  } = useOrganization();

  const projectId = params.projectId;

  const [project, setProject] = useState<Project | null>(contextProject);
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
      if (!projectId || sessionStatus !== "authenticated") {
        if (sessionStatus === "loading") return;
        setLoading(false);
        setError(sessionStatus !== "authenticated" ? "User not authenticated." : "Project ID missing.");
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const token = await getClientToken();
        let currentProject = contextProject;
        if (!currentProject || currentProject.id.toString() !== projectId) {
          currentProject = await getProject(token, Number(projectId));
          setContextSelectedProject(currentProject); // Update context
        }
        if (!currentProject) throw new Error("Failed to load project details.");
        setProject(currentProject);

        let currentParentOrg = contextOrg;
        if (!currentParentOrg || currentParentOrg.id !== currentProject.organization_id) {
          currentParentOrg = await getOrganization(token, currentProject.organization_id);
          setContextSelectedOrg(currentParentOrg); // Update context
        }
        if (!currentParentOrg) throw new Error("Failed to load parent organization for the project.");
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
  }, [projectId, sessionStatus, getClientToken, router, contextOrg, contextProject, setContextSelectedOrg, setContextSelectedProject]);

  const handleSuccess = (newRepoId: number) => {
    // Navigate to the new repository's detail page within the project context
    router.push(`/projects/${projectId}/repositories/${newRepoId}`);
  };

  if (loading || sessionStatus === "loading") {
    return (
      <div className="flex flex-col items-center w-full min-h-screen p-4 md:p-8 pt-6 space-y-4">
        <Skeleton className="h-10 w-1/2 self-start" />
        <Skeleton className="h-96 w-full max-w-2xl" />
      </div>
    );
  }

  if (error || !project || !parentOrganization) {
    return (
      <div className="flex flex-col items-center justify-center w-full min-h-[calc(100vh-100px)] p-4">
        <p className="text-lg text-destructive text-center mb-4">
          {error || "Project or Parent Organization data could not be loaded."}
        </p>
        <Button onClick={() => router.push(`/projects/${projectId}`)} variant="outline">Back to Project</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center w-full min-h-full pt-6">
      <div className="w-full max-w-2xl space-y-4">
        <div className="flex items-center gap-2 self-start">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/projects/${projectId}/repositories`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center">
            <GitFork className="mr-2 h-6 w-6" /> 
            New Repository for Project: {project.name}
          </h1>
        </div>
        <p className="text-sm text-muted-foreground pl-12">
            Repositories are created within the parent organization: <Link href={`/organizations/${parentOrganization.id}`} className="hover:underline font-semibold">{parentOrganization.name}</Link>.
        </p>
        <NewRepositoryForm 
            organization={parentOrganization} 
            getClientToken={getClientToken} 
            onSuccess={handleSuccess} 
        />
      </div>
    </div>
  );
} 