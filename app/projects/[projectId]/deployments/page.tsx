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
    type Deployment,
    getProject,
    getDeployments,
    getModules, // To fetch modules for displaying names
    getOrganization as apiGetOrganization,
} from '@/lib/api-core';
// Assuming you might add actions for redeploy, update, destroy later
// import { redeployDeploymentAction, destroyDeploymentAction } from '@/app/actions/deployments/actions'; 
import { DeploymentsOverview } from "@/components/deployments/deployments-overview";

export default function ProjectDeploymentsPage() {
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
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [modulesInOrgAndProject, setModulesInOrgAndProject] = useState<Module[]>([]); // For module names
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
        }
        if (!projData) throw new Error ("Project not found.");
        setCurrentProject(projData);
        setContextSelectedProject(projData);

        let orgData = contextOrg;
        if ((!orgData || orgData.id !== projData.organization_id) && projData.organization_id) {
            orgData = await apiGetOrganization(projData.organization_id, async () => token);
        }
        if (!orgData && projData.organization_id) throw new Error ("Parent organization not found for project.");
        setParentOrg(orgData);
        setContextSelectedOrg(orgData);
        
        if (!projData.organization_id) throw new Error ("Project is missing parent organization ID.");

        // Fetch deployments for the current project
        const fetchedDeployments = await getDeployments(numericProjectId, undefined, async () => token);
        setDeployments(fetchedDeployments);

        // Fetch modules for the project AND organization to display names
        const projectModules = await getModules({ project_id: numericProjectId }, async () => token);
        const orgModules = await getModules({ organization_id: projData.organization_id }, async () => token);
        
        const combinedModulesMap = new Map<number, Module>();
        orgModules.forEach(mod => combinedModulesMap.set(mod.id, mod));
        projectModules.forEach(mod => combinedModulesMap.set(mod.id, mod)); // Project modules can override org ones if IDs clash (though unlikely for different module entities)
        setModulesInOrgAndProject(Array.from(combinedModulesMap.values()));

      } catch (err: any) {
        console.error("Error fetching project deployments data:", err);
        setError(err.message || "An unexpected error occurred.");
        toast({ title: "Error Loading Deployments", description: err.message, variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    }
    if (sessionStatus === "unauthenticated") router.push("/login");
    else fetchData();
  }, [projectId, sessionStatus, getClientToken, router, contextProject, setContextSelectedProject, contextOrg, setContextSelectedOrg]);

  // Placeholder for action handlers - implement these with actual API calls and server actions
  const handleDestroyDeployment = async (deploymentId: number) => {
    toast({ title: "Action Required", description: `Destroy action for deployment ${deploymentId} needs implementation.`, variant: "default"});
    // Example: 
    // try {
    //   const token = await getClientToken();
    //   const result = await destroyDeploymentAction(deploymentId, token);
    //   if (result.success) {
    //     toast({ title: "Deployment Destroyed", description: `Deployment ${deploymentId} is being destroyed.` });
    //     setDeployments(prev => prev.filter(d => d.id !== deploymentId)); // Or refetch
    //     return true;
    //   } else {
    //     throw new Error(result.error || "Failed to destroy deployment.");
    //   }
    // } catch (err: any) {
    //   toast({ title: "Destroy Error", description: err.message, variant: "destructive" });
    //   return false;
    // }
    return false;
  };

  if (isLoading || sessionStatus === "loading") {
    return (
      <div className="space-y-6 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-10" />
            <div><Skeleton className="h-8 w-64" /></div>
          </div>
          <Skeleton className="h-10 w-36" /> 
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
                Deployments for Project: {currentProject.name}
            </h1>
            <p className="text-sm text-muted-foreground">
                Part of <Link href={`/organizations/${parentOrg.id}`} className="hover:underline">{parentOrg.name}</Link>
            </p>
        </div>
      </div>
      <DeploymentsOverview 
        deployments={deployments}
        projectId={currentProject.id.toString()}
        modules={modulesInOrgAndProject}
        isLoading={isLoading}
        pageTitle={`Project Deployments: ${currentProject.name}`}
        pageDescription={`Manage deployments for project ${currentProject.name}.`}
        onDestroy={handleDestroyDeployment} // Pass the handler
        // onRedeploy and onUpdate can be added similarly if/when implemented
      />
    </div>
  );
} 