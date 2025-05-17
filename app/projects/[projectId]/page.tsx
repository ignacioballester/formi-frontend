"use client";

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Home, Layers3, ArrowLeft, GitBranch, Package, FileOutput, ListChecks } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useOrganization } from '@/contexts/organization-context';
import { type Project, type Organization, getProject, getOrganization } from '@/lib/api-core'; // Assuming getProject exists
import { toast } from '@/components/ui/use-toast';

export default function ProjectOverviewPage() {
  const params = useParams<{ projectId: string }>();
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const {
    selectedOrganization,
    setSelectedOrganization,
    selectedProject,
    setSelectedProject,
  } = useOrganization();

  const projectId = params.projectId;

  const [project, setProjectLocal] = useState<Project | null>(selectedProject);
  const [organization, setOrganizationLocal] = useState<Organization | null>(selectedOrganization);
  const [loading, setLoading] = useState(true);

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
        return;
      }
      setLoading(true);
      try {
        const token = await getClientToken();

        let projToSet = selectedProject;
        if (!projToSet || projToSet.id.toString() !== projectId) {
          const projectData = await getProject(token, Number(projectId));
          projToSet = projectData;
          setSelectedProject(projToSet); // Update context
        }
        setProjectLocal(projToSet);

        if (projToSet) {
            let orgToSet = selectedOrganization;
            if ((!orgToSet || orgToSet.id !== projToSet.organization_id) && projToSet.organization_id) {
              orgToSet = await getOrganization(token, projToSet.organization_id);
              setSelectedOrganization(orgToSet); // Update context
            }
            setOrganizationLocal(orgToSet);
        }

      } catch (error: any) {
        console.error("Error fetching project overview data:", error);
        toast({ title: "Error Loading Data", description: error.message, variant: "destructive" });
        // Potentially redirect or show an error state
      } finally {
        setLoading(false);
      }
    }

    if (sessionStatus === "unauthenticated") router.push("/login");
    else fetchData();
  }, [projectId, sessionStatus, getClientToken, router, setSelectedOrganization, setSelectedProject, selectedOrganization, selectedProject]);

  if (loading || sessionStatus === 'loading') {
    return (
      <div className="p-8 space-y-4">
        <Skeleton className="h-8 w-1/4" />
        <Skeleton className="h-4 w-1/2" />
        <Card><CardHeader><Skeleton className="h-6 w-1/3" /></CardHeader><CardContent><Skeleton className="h-20 w-full" /></CardContent></Card>
      </div>
    );
  }

  if (!project || !organization) {
    return (
      <div className="p-8 text-center">
        <p>Project or Organization data could not be loaded.</p>
        <Button onClick={() => router.push('/projects')} className="mt-4">Back to Projects</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center gap-4">
          {/* This back button now goes to the global projects list */}
          <Button variant="outline" size="icon" asChild>
            <Link href={"/projects"}> 
                <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
            {project.name}
          </h2>
          <p className="text-sm text-muted-foreground">
            {/* Updated to show org name, link goes to organization overview if org is loaded */}
            Project Overview {organization ? <>in <Link href={`/organizations/${organization.id}`} className="hover:underline">{organization.name}</Link></> : ""}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Home className="mr-2 h-5 w-5" />
            Project Dashboard
          </CardTitle>
          <CardDescription>Key metrics and information about {project.name}.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Welcome to the project dashboard for {project.name}.</p>
          <p className="mt-4 text-muted-foreground">
            (Content for project overview, stats, quick links, etc., will go here.)
          </p>
          <ul className="mt-4 list-disc list-inside space-y-1">
            <li>Organization ID: {project.organization_id}</li>
            <li>Project ID: {project.id}</li>
          </ul>
        </CardContent>
      </Card>
      
      {/* Example quick links - updated hrefs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[ 
            {title: "Repositories", href: `/projects/${project.id}/repositories`, icon: GitBranch},
            {title: "Modules", href: `/projects/${project.id}/modules`, icon: Package},
            {title: "Deployments", href: `/projects/${project.id}/deployments`, icon: FileOutput},
            {title: "Runs", href: `/projects/${project.id}/runs`, icon: ListChecks},
        ].map(item => (
            <Card key={item.title} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                    <item.icon className="h-6 w-6 text-primary mb-1"/>
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                    <Button variant="outline" size="sm" asChild>
                        <Link href={item.href}>View {item.title}</Link>
                    </Button>
                </CardContent>
            </Card>
        ))}
      </div>

    </div>
  );
} 