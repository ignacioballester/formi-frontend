"use client";

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { ArrowLeft, ListChecks } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/use-toast';
import { RunsOverview } from '@/components/runs/runs-overview';
import { useOrganization } from '@/contexts/organization-context';
import {
  getProject,
  getOrganization,
  getRunnerRuns,
  getDeployments,
  type Project,
  type Organization,
  type RunnerRun,
  type Deployment,
} from '@/lib/api';

export default function ProjectRunsPage() {
  const params = useParams<{ projectId: string }>();
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const {
    selectedProject: contextProject,
    setSelectedProject: setContextSelectedProject,
    selectedOrganization: contextOrg,
    setSelectedOrganization: setContextSelectedOrg
  } = useOrganization();

  const projectId = params.projectId;

  const [currentProject, setCurrentProject] = useState<Project | null>(contextProject);
  const [parentOrg, setParentOrg] = useState<Organization | null>(contextOrg);
  const [projectRuns, setProjectRuns] = useState<RunnerRun[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getClientToken = useCallback(async () => {
    if (!session?.accessToken) throw new Error("Access token not available");
    return session.accessToken;
  }, [session]);

  const fetchData = useCallback(async () => {
    if (sessionStatus === 'loading' || !projectId || sessionStatus === 'unauthenticated') return;

    setIsLoading(true);
    setError(null);

    try {
      const token = await getClientToken();
      const numericProjectId = Number(projectId);

      let proj = contextProject;
      if (!proj || proj.id.toString() !== projectId) {
        proj = await getProject(numericProjectId, async () => token);
      }
      if (!proj) throw new Error("Project not found.");
      setCurrentProject(proj);
      setContextSelectedProject(proj);

      let org = contextOrg;
      if ((!org || org.id !== proj.organization_id) && proj.organization_id) {
        org = await getOrganization(proj.organization_id, async () => token);
      }
      if (!org && proj.organization_id) throw new Error("Parent organization not found.");
      setParentOrg(org);
      setContextSelectedOrg(org);

      const projectDeployments: Deployment[] = await getDeployments(numericProjectId, undefined, async () => token);
      const projectDeploymentIds = new Set(projectDeployments.map(d => d.id));

      if (projectDeploymentIds.size === 0) {
        setProjectRuns([]);
        toast({
          title: "No Deployments",
          description: "No deployments found for this project. Cannot fetch related runs.",
          variant: "default"
        });
        setIsLoading(false);
        return;
      }

      const allRuns: RunnerRun[] = await getRunnerRuns(async () => token);

      const filteredRuns = allRuns.filter(run => projectDeploymentIds.has(run.deployment_id));
      setProjectRuns(filteredRuns);

    } catch (err: any) {
      console.error("Error loading project runs page:", err);
      setError(err.message);
      toast({ title: "Error Loading Runs Data", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [projectId, sessionStatus, getClientToken, contextProject, setContextSelectedProject, contextOrg, setContextSelectedOrg]);

  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      router.push('/login');
      return;
    }
    fetchData();
  }, [sessionStatus, router, fetchData]);

  if (isLoading && (!currentProject || projectRuns.length === 0)) {
    return (
      <div className="flex flex-col items-center w-full min-h-screen pt-6 bg-muted/40 p-4 md:p-0">
        <div className="w-full max-w-4xl space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10" />
            <div className="w-full">
                <Skeleton className="h-8 w-1/2" />
                <Skeleton className="h-4 w-3/4 mt-2" />
            </div>
          </div>
          <Skeleton className="h-[300px] w-full" />
        </div>
      </div>
    );
  }

  if (error && !isLoading) {
     return (
      <div className="flex flex-col items-center justify-center w-full min-h-[calc(100vh-100px)] p-4">
        <p className="text-lg text-destructive text-center mb-4">{error}</p>
        <Button onClick={() => fetchData()} variant="outline" className="mr-2">
          Try Again
        </Button>
        <Button onClick={() => router.push(`/projects/${projectId}`)} variant="outline">
          Back to Project
        </Button>
      </div>
    );
  }

  if (!currentProject || !parentOrg) {
    return (
      <div className="flex flex-col items-center justify-center w-full min-h-[calc(100vh-100px)] p-4">
        <p className="text-lg text-muted-foreground">Project or Parent Organization data could not be loaded.</p>
        <Button onClick={() => router.push(projectId ? `/projects/${projectId}` : '/projects')} variant="outline" className="mt-4">
          Back to Project
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/40">
      <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="icon" asChild>
            <Link href={`/projects/${projectId}/deployments`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center">
              <ListChecks className="mr-3 h-7 w-7 text-primary"/> Project Runs
            </h1>
            <p className="text-sm text-muted-foreground">
              Viewing all runs associated with project: {currentProject.name} (Org: {parentOrg.name})
            </p>
          </div>
        </div>

        <RunsOverview 
          runs={projectRuns}
          isLoading={isLoading}
          error={null}
          pageTitle={`Runs for ${currentProject.name}`}
          pageDescription={`All execution runs linked to deployments within this project.`}
          projectId={projectId}
          onRefresh={fetchData}
        />

      </div>
    </div>
  );
} 