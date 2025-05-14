"use client";

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/use-toast';
import { useOrganization } from '@/contexts/organization-context';
import { type Project, type Repository, getProject, getRepositories, getOrganization, type Organization, getProjects } from '@/lib/api'; 
import { RepositoriesOverview } from "@/components/repositories/repositories-overview";

export default function ProjectRepositoriesPage() {
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
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [projectsInParentOrg, setProjectsInParentOrg] = useState<Project[]>([])
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
    // Clear previous data when projectId changes to prevent flicker of old data
    setRepositories([]); // Clear combined list
    setProjectsInParentOrg([]);
    // setCurrentProject(null); // Consider if needed for loading state

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
        const numericProjectId = Number(projectId);

        // Fetch current project details
        const projData = await getProject(numericProjectId, async () => token);
        setProject(projData);
        setContextSelectedProject(projData); // Update context

        if (!projData || !projData.organization_id) {
          setError("Project data or parent organization ID is missing.");
          setLoading(false);
          return;
        }

        // Fetch repositories for the current project
        const projectRepos = await getRepositories({ project_id: numericProjectId }, async () => token);

        // Fetch repositories for the parent organization
        const orgRepos = await getRepositories({ organization_id: projData.organization_id }, async () => token);

        // Combine and de-duplicate repositories
        const combinedReposMap = new Map<number, Repository>();
        orgRepos.forEach(repo => combinedReposMap.set(repo.id, repo)); // Add org repos first
        projectRepos.forEach(repo => combinedReposMap.set(repo.id, repo)); // Project repos override org repos if IDs conflict (project scope is more specific)
        
        setRepositories(Array.from(combinedReposMap.values()));

        // Fetch all projects in the parent organization (for scope display in RepositoriesOverview)
        const parentOrgProjects = await getProjects(projData.organization_id, async () => token);
        setProjectsInParentOrg(parentOrgProjects);

      } catch (err: any) {
        console.error("Error fetching project repositories data:", err);
        setError(err.message || "An unexpected error occurred while fetching repository data.");
        toast({ title: "Error Loading Page Data", description: err.message, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    }
    if (sessionStatus === "unauthenticated") router.push("/login");
    else fetchData();
  }, [projectId, sessionStatus, getClientToken, router, setContextSelectedProject]); // Removed contextProject from deps as we fetch and set it

  if (loading || sessionStatus === "loading") {
    return (
      <div className="space-y-6 p-4 md:p-8 pt-6">
         <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <Skeleton className="h-10 w-10" />
                <div><Skeleton className="h-8 w-64" /></div>
            </div>
            <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-[300px] w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center w-full min-h-[calc(100vh-100px)] p-4">
        <p className="text-lg text-destructive text-center mb-4">{error}</p>
        <Button onClick={() => router.push(`/projects/${projectId}`)} variant="outline">Back to Project</Button>
      </div>
    );
  }

  if (!project || !parentOrganization) {
    return (
      <div className="flex flex-col items-center justify-center w-full min-h-[calc(100vh-100px)] p-4">
        <p className="text-lg text-muted-foreground">Project or Parent Organization data not found.</p>
        <Button onClick={() => router.push(`/projects`)} variant="outline">Back to All Projects</Button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href={`/projects/${project.id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                Repositories for Project: {project.name}
            </h1>
            <p className="text-sm text-muted-foreground">
                Part of <Link href={`/organizations/${parentOrganization.id}`} className="hover:underline">{parentOrganization.name}</Link>
            </p>
        </div>
      </div>
      <RepositoriesOverview 
        repositories={repositories} 
        organizationId={parentOrganization.id.toString()} 
        projectId={project.id.toString()} // Pass projectId for correct new/edit links
        projectsInOrg={projectsInParentOrg} // Pass all projects from parent org
        isLoading={loading} // Pass loading state from this page
        pageTitle={`Repositories for ${project.name}`}
        pageDescription={`Manage repositories associated with or used by project ${project.name}.`}
      />
    </div>
  );
} 