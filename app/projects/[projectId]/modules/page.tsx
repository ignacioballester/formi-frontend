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
import { 
    type Project, 
    type Module, 
    type Organization,
    getProject, 
    getModules, 
    getOrganization as apiGetOrganization, // Alias to avoid conflict if a local getOrganization is defined
    getProjects, // To fetch all projects in parent org
} from '@/lib/api-core';
import { deleteModuleAction } from '@/app/actions/modules/actions';
import { ModulesOverview } from "@/components/modules/modules-overview";

export default function ProjectModulesPage() {
  const params = useParams<{ projectId: string }>();
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const { 
    selectedProject: contextProject, 
    setSelectedProject: setContextSelectedProject, 
    selectedOrganization: contextOrg,
    setSelectedOrganization: setContextSelectedOrg,
} = useOrganization();

  const projectId = params.projectId;

  const [currentProject, setCurrentProject] = useState<Project | null>(contextProject);
  const [parentOrg, setParentOrg] = useState<Organization | null>(contextOrg);
  const [modules, setModules] = useState<Module[]>([]);
  const [projectsInParentOrg, setProjectsInParentOrg] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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
        setIsLoading(false);
        setError(sessionStatus !== "authenticated" ? "User not authenticated." : "Project ID missing.");
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const token = await getClientToken();
        const numericProjectId = Number(projectId);

        let projData = contextProject;
        if (!projData || projData.id.toString() !== projectId) {
            projData = await getProject(numericProjectId, async () => token);
            setCurrentProject(projData);
            setContextSelectedProject(projData);
        }
        if (!projData) throw new Error ("Project not found.");
        setCurrentProject(projData); // Ensure currentProject state is set

        let orgData = contextOrg;
        if ((!orgData || orgData.id !== projData.organization_id) && projData.organization_id) {
            orgData = await apiGetOrganization(projData.organization_id, async () => token);
            setParentOrg(orgData);
            setContextSelectedOrg(orgData);
        }
        if (!orgData && projData.organization_id) throw new Error ("Parent organization not found for project.");
        setParentOrg(orgData); // Ensure parentOrg state is set
        
        if (!projData.organization_id) throw new Error ("Project is missing parent organization ID.");

        // Fetch modules for the current project
        const projectModules = await getModules({ project_id: numericProjectId }, async () => token);

        // Fetch modules for the parent organization
        const orgModules = await getModules({ organization_id: projData.organization_id }, async () => token);

        // Combine and de-duplicate modules
        const combinedModulesMap = new Map<number, Module>();
        orgModules.forEach(mod => combinedModulesMap.set(mod.id, mod));
        projectModules.forEach(mod => combinedModulesMap.set(mod.id, mod)); // Project modules override
        setModules(Array.from(combinedModulesMap.values()));

        // Fetch all projects in the parent organization (for scope display)
        const allParentOrgProjects = await getProjects(projData.organization_id, async () => token);
        setProjectsInParentOrg(allParentOrgProjects);

      } catch (err: any) {
        console.error("Error fetching project modules data:", err);
        setError(err.message || "An unexpected error occurred.");
        toast({ title: "Error Loading Modules", description: err.message, variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    }
    if (sessionStatus === "unauthenticated") router.push("/login");
    else fetchData();
  }, [projectId, sessionStatus, getClientToken, router, contextProject, setContextSelectedProject, contextOrg, setContextSelectedOrg]);

  const handleDeleteModule = async (moduleId: number) => {
    const moduleToDelete = modules.find(m => m.id === moduleId);
    if (!moduleToDelete) return false;
    try {
      const token = await getClientToken();
      const result = await deleteModuleAction(moduleId, token);
      if (result.success) {
        toast({ title: "Module Deleted", description: `Module "${moduleToDelete.name}" deleted.` });
        setModules(prevModules => prevModules.filter(m => m.id !== moduleId));
        return true;
      } else {
        throw new Error(result.error || "Failed to delete module.");
      }
    } catch (err: any) {
      setError(err.message); toast({ title: "Delete Error", description: err.message, variant: "destructive" });
      return false;
    }
  };
  
  if (isLoading || sessionStatus === "loading") {
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
        <Button onClick={() => router.back()} variant="outline">Go Back</Button>
      </div>
    );
  }

  if (!currentProject || !parentOrg) {
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
          <Link href={`/projects/${currentProject.id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                Modules for Project: {currentProject.name}
            </h1>
            <p className="text-sm text-muted-foreground">
                Part of <Link href={`/organizations/${parentOrg.id}`} className="hover:underline">{parentOrg.name}</Link>
            </p>
        </div>
      </div>
      <ModulesOverview 
        modules={modules}
        organizationId={parentOrg.id.toString()} 
        projectId={currentProject.id.toString()}
        projectsInOrg={projectsInParentOrg}
        isLoading={isLoading}
        onDeleteModule={handleDeleteModule}
        pageTitle={`Modules for ${currentProject.name}`}
        pageDescription={`Manage modules associated with project ${currentProject.name} or its parent organization.`}
      />
    </div>
  );
} 