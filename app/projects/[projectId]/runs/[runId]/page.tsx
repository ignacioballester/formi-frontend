"use client";

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { ArrowLeft, FileText, AlertTriangle, Info, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { RunLogsView } from '@/components/runs/RunLogsView'; // Corrected import name
import { useOrganization } from '@/contexts/organization-context';
import {
  getProject,
  getRunnerRunById, // Fetches details for a specific run
  getRunLogs,       // Fetches logs for a specific run
  type Project,
  type RunnerRun,
  type RunnerRunStatus
} from '@/lib/api-core';

// Helper to get badge variant from RunOverview (or duplicate here if preferred)
const getStatusVariant = (status?: RunnerRunStatus): "default" | "secondary" | "destructive" | "outline" => {
  if (!status) return "outline";
  switch (status) {
    case "completed": return "default";
    case "failed": return "destructive";
    case "running": return "secondary";
    case "pending": return "outline";
    case "claimed": return "secondary";
    default: return "outline";
  }
};

export default function RunDetailPage() {
  const params = useParams<{ projectId: string; runId: string }>();
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const { selectedProject: contextProject, setSelectedProject: setContextSelectedProject } = useOrganization();

  const projectId = params.projectId;
  const runId = params.runId;

  const [currentProject, setCurrentProject] = useState<Project | null>(contextProject);
  const [runDetails, setRunDetails] = useState<RunnerRun | null>(null);
  const [runLogs, setRunLogs] = useState<string | null>(null);
  
  const [isLoadingRun, setIsLoadingRun] = useState(true);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);
  const [runError, setRunError] = useState<string | null>(null);
  const [logsError, setLogsError] = useState<string | null>(null);

  const getClientToken = useCallback(async () => {
    if (!session?.accessToken) throw new Error("Access token not available");
    return session.accessToken;
  }, [session]);

  const fetchRunData = useCallback(async (id: string) => {
    setIsLoadingRun(true);
    setRunError(null);
    try {
      const token = await getClientToken();
      const numericRunId = Number(id);
      const details = await getRunnerRunById(numericRunId, async () => token);
      setRunDetails(details);
    } catch (err: any) {
      console.error("Error fetching run details:", err);
      setRunError(err.message);
      toast({ title: "Error Loading Run Details", description: err.message, variant: "destructive" });
    }
    setIsLoadingRun(false);
  }, [getClientToken]);

  const fetchLogsData = useCallback(async (id: string) => {
    setIsLoadingLogs(true);
    setLogsError(null);
    try {
      const token = await getClientToken();
      const numericRunId = Number(id);
      const logs = await getRunLogs(numericRunId, async () => token);
      setRunLogs(logs);
    } catch (err: any) {
      console.error("Error fetching run logs:", err);
      setLogsError(err.message);
      // Toast for logs error is handled by RunLogsView, or can be added here too
    }
    setIsLoadingLogs(false);
  }, [getClientToken]);

  // Fetch project details (can be simplified if project context is reliably populated)
  useEffect(() => {
    if (projectId && sessionStatus === 'authenticated' && (!contextProject || contextProject.id.toString() !== projectId)) {
      getClientToken().then(token => {
        getProject(Number(projectId), async () => token)
          .then(proj => {
            setCurrentProject(proj);
            setContextSelectedProject(proj); // Update context
          })
          .catch(err => {
            console.error("Error fetching project for run detail page:", err);
            toast({ title: "Error Loading Project Context", description: err.message, variant: "destructive" });
            // Potentially set an error state for project loading too
          });
      });
    } else if (contextProject && contextProject.id.toString() === projectId) {
      setCurrentProject(contextProject);
    }
  }, [projectId, sessionStatus, contextProject, setContextSelectedProject, getClientToken]);

  // Fetch run and logs data when runId changes or on session authentication
  useEffect(() => {
    if (sessionStatus === 'loading') return;
    if (sessionStatus === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (runId && sessionStatus === 'authenticated') {
      fetchRunData(runId);
      fetchLogsData(runId);
    }
  }, [runId, sessionStatus, router, fetchRunData, fetchLogsData]);

  const handleRefreshAll = () => {
    if (runId) {
        fetchRunData(runId);
        fetchLogsData(runId);
    }
  }

  if (sessionStatus === 'loading') {
    return (
        <div className="flex flex-col items-center w-full min-h-screen pt-6 bg-muted/40 p-4 md:p-0">
            <div className="w-full max-w-3xl space-y-6">
                <Skeleton className="h-10 w-3/4" />
                <Skeleton className="h-40 w-full" />
                <Skeleton className="h-64 w-full" />
            </div>
        </div>
    );
  }
  
  const projectDisplayName = currentProject?.name || `ID: ${projectId}`;

  return (
    <div className="min-h-screen bg-muted/40">
      <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
        <div className="flex items-center justify-between gap-4 mb-2">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" asChild>
                    <Link href={`/projects/${projectId}/runs`}>
                    <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Run Details</h1>
                    <p className="text-sm text-muted-foreground">
                    For Run ID: {runId} (Project: {projectDisplayName})
                    </p>
                </div>
            </div>
            <Button onClick={handleRefreshAll} variant="outline" size="icon" disabled={isLoadingRun || isLoadingLogs} aria-label="Refresh run details and logs">
                <RefreshCw className={`h-4 w-4 ${isLoadingRun || isLoadingLogs ? 'animate-spin' : ''}`} />
            </Button>
        </div>

        {isLoadingRun && !runDetails && (
          <Card>
            <CardHeader><CardTitle>Loading Run Information...</CardTitle></CardHeader>
            <CardContent><Skeleton className="h-48 w-full" /></CardContent>
          </Card>
        )}

        {runError && !isLoadingRun &&(
            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error Loading Run Details</AlertTitle>
                <AlertDescription>{runError} <Button variant="link" onClick={() => runId && fetchRunData(runId)} className="p-0 h-auto">Try again</Button></AlertDescription>
            </Alert>
        )}

        {runDetails && !isLoadingRun && (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center"><Info className="mr-2 h-5 w-5 text-primary" />Run Information</CardTitle>
                  <CardDescription>Details for execution run ID: {runDetails.id}</CardDescription>
                </div>
                <Badge variant={getStatusVariant(runDetails.status)} className="text-sm">{runDetails.status}</Badge>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 text-sm">
              <div><strong>Run ID:</strong> {runDetails.id}</div>
              <div><strong>Deployment ID:</strong> {runDetails.deployment_id}</div>
              <div><strong>Status:</strong> <Badge variant={getStatusVariant(runDetails.status)}>{runDetails.status}</Badge></div>
              <div><strong>Timestamp:</strong> {format(new Date(runDetails.timestamp), 'PPpp')}</div>
              <div className="md:col-span-1"><strong>Run By:</strong> {runDetails.properties.run_by}</div>
              <div className="md:col-span-1"><strong>Terraform Command:</strong> <code className="bg-muted px-1 rounded">{runDetails.properties.terraform_command}</code></div>
              {runDetails.status_details?.error_message && (
                <div className="md:col-span-2 text-destructive">
                  <strong>Error Message:</strong> {runDetails.status_details.error_message}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <RunLogsView logs={runLogs} isLoading={isLoadingLogs} error={logsError} />

      </div>
    </div>
  );
} 