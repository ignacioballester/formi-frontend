"use client";

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { ArrowLeft, PackagePlus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/use-toast';
import { NewModuleForm } from '@/components/modules/new-module-form';
import { useOrganization } from '@/contexts/organization-context';
import { getProject, getOrganization, type Project, type Organization } from '@/lib/api';

export default function NewProjectModulePage() {
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
  const [isLoadingPage, setIsLoadingPage] = useState(true);

  const getClientToken = useCallback(async () => {
    if (!session?.accessToken) {
      toast({ title: "Authentication Error", description: "Access token not available.", variant: "destructive" });
      throw new Error("Access token not available");
    }
    return session.accessToken;
  }, [session]);

  useEffect(() => {
    if (sessionStatus === 'loading') return;
    if (sessionStatus === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (projectId && sessionStatus === 'authenticated') {
      setIsLoadingPage(true);
      getClientToken().then(async token => {
        try {
          let proj = contextProject;
          if (!proj || proj.id.toString() !== projectId) {
            proj = await getProject(Number(projectId), async () => token);
            setCurrentProject(proj);
            setContextSelectedProject(proj);
          }
          if (!proj) throw new Error("Project not found.");
          setCurrentProject(proj); // Ensure state is updated

          let org = contextOrg;
          if ((!org || org.id !== proj.organization_id) && proj.organization_id) {
            org = await getOrganization(proj.organization_id, async () => token);
            setParentOrg(org);
            setContextSelectedOrg(org);
          }
          if (!org && proj.organization_id) throw new Error ("Parent organization not found.");
          setParentOrg(org); // Ensure state is updated

        } catch (err: any) {
          console.error("Error loading project/org details:", err);
          toast({ title: "Error Loading Page Data", description: err.message, variant: "destructive" });
          // Consider redirecting to a safe page, e.g., project list or org list
          router.push(contextOrg ? `/organizations/${contextOrg.id}` : '/organizations');
        } finally {
          setIsLoadingPage(false);
        }
      }).catch(err => {
        setIsLoadingPage(false);
        toast({ title: "Token Error", description: "Failed to get client token.", variant: "destructive" });
      });
    } else {
      setIsLoadingPage(false); // Not enough info or not auth'd
    }
  }, [projectId, sessionStatus, router, getClientToken, contextProject, setContextSelectedProject, contextOrg, setContextSelectedOrg]);

  const handleModuleCreated = () => {
    router.push(`/projects/${projectId}/modules`);
    router.refresh();
  };

  if (isLoadingPage || sessionStatus === 'loading') {
    return (
      <div className="flex flex-col items-center w-full min-h-screen pt-6 bg-muted/40 p-4 md:p-0">
        <div className="w-full max-w-2xl space-y-6">
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-96 w-full" />
        </div>
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
    <div className="flex flex-col items-center w-full min-h-screen pt-6 bg-muted/40">
      <div className="w-full max-w-2xl space-y-6 p-4 md:p-0">
        <div className="flex items-center gap-2 self-start">
          <Button variant="outline" size="icon" asChild>
            <Link href={`/projects/${projectId}/modules`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight">Create Module for Project: {currentProject.name}</h2>
            <p className="text-sm text-muted-foreground">In Organization: {parentOrg.name}</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PackagePlus className="h-6 w-6" /> New Project Module
            </CardTitle>
            <CardDescription>
              Configure a new module specifically for this project, or choose an existing organizational repository.
            </CardDescription>
          </CardHeader>
          <NewModuleForm 
            organizationId={parentOrg.id.toString()} 
            projectId={projectId} 
            onModuleCreated={handleModuleCreated} 
          />
        </Card>
      </div>
    </div>
  );
} 