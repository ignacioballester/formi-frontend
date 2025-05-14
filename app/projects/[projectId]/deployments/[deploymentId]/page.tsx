"use client";

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { ArrowLeft, Box, Package, Settings, Info, Save } from 'lucide-react';
import {withTheme} from '@rjsf/core';
import validator from '@rjsf/validator-ajv8';
import {Theme as shadcnTheme} from '@rjsf/shadcn';

import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useOrganization } from '@/contexts/organization-context';
import {
  getProject,
  getOrganization,
  getModule,
  getDeployment,
  updateDeployment, // Added
  type Project,
  type Organization,
  type Module,
  type Deployment,
  type UpdateDeploymentInput
} from '@/lib/api';

const RJSFForm = withTheme(shadcnTheme);

export default function DeploymentDetailsPage() {
  const params = useParams<{ projectId: string; deploymentId: string }>();
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const {
    selectedProject: contextProject,
    setSelectedProject: setContextSelectedProject,
    selectedOrganization: contextOrg,
    setSelectedOrganization: setContextSelectedOrg
  } = useOrganization();

  const projectId = params.projectId;
  const deploymentId = params.deploymentId;

  const [currentDeployment, setCurrentDeployment] = useState<Deployment | null>(null);
  const [currentModule, setCurrentModule] = useState<Module | null>(null);
  const [currentProject, setCurrentProject] = useState<Project | null>(contextProject);
  const [parentOrg, setParentOrg] = useState<Organization | null>(contextOrg);
  
  const [rjsfSchema, setRjsfSchema] = useState<object | null>(null);
  const [formData, setFormData] = useState<any>({}); // For RJSF form state
  const [uiSchema] = useState<any>({}); // Keep uiSchema empty for default rendering

  const [isLoadingPage, setIsLoadingPage] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getClientToken = useCallback(async () => {
    if (!session?.accessToken) throw new Error("Access token not available");
    return session.accessToken;
  }, [session]);

  // Initial data fetch: deployment, module, project, org
  useEffect(() => {
    if (sessionStatus === 'loading' || !projectId || !deploymentId) return;
    if (sessionStatus === 'unauthenticated') { router.push('/login'); return; }

    if (sessionStatus === 'authenticated') {
      setIsLoadingPage(true);
      setError(null);
      getClientToken().then(async token => {
        try {
          // Fetch Deployment (requires ID and Version)
          // TODO: How to get the version? Assume latest for now or need to adjust API/UI
          // For now, let's hardcode version 1 - THIS NEEDS TO BE FIXED
          const deploymentData = await getDeployment(Number(deploymentId), 1, async () => token); 
          setCurrentDeployment(deploymentData);

          // Fetch Module using deploymentData.module_id
          const moduleData = await getModule(deploymentData.module_id, async () => token);
          setCurrentModule(moduleData);

          // Set RJSF schema and initial form data
          const schema = moduleData.terraform_properties?.tfvars_json_schema;
          if (schema && typeof schema === 'object') {
            setRjsfSchema(schema);
            // Use deployment inputs for initial form data
            setFormData(deploymentData.inputs?.tf_vars || {}); 
          } else {
            setRjsfSchema(null);
            setFormData({});
             toast({title: "Schema Missing", description: "Module schema is missing or invalid. Form disabled.", variant: "default"});
          }

          // Fetch Project if not in context or different
          let proj = contextProject;
          if (!proj || proj.id.toString() !== projectId) {
            proj = await getProject(Number(projectId), async () => token);
          }
          if (!proj) throw new Error("Project not found.");
          setCurrentProject(proj);
          setContextSelectedProject(proj);

          // Fetch Org if not in context or different
          let org = contextOrg;
          if ((!org || org.id !== proj.organization_id) && proj.organization_id) {
            org = await getOrganization(proj.organization_id, async () => token);
          }
          if (!org && proj.organization_id) throw new Error("Parent organization not found.");
          setParentOrg(org);
          setContextSelectedOrg(org);

        } catch (err: any) {
          setError(err.message);
          toast({ title: "Error Loading Page Data", description: err.message, variant: "destructive" });
        } finally {
          setIsLoadingPage(false);
        }
      }).catch(err => {
        setIsLoadingPage(false);
        setError(err.message);
        toast({ title: "Token Error", description: err.message, variant: "destructive" });
      });
    } else { setIsLoadingPage(false); }
  }, [projectId, deploymentId, sessionStatus, router, getClientToken, contextProject, setContextSelectedProject, contextOrg, setContextSelectedOrg]);


  const handleFormSubmit = async ({ formData: submittedFormData }: { formData: any }) => {
      if (!currentDeployment) {
          toast({ title: "Error", description: "Deployment data not loaded.", variant: "destructive" });
          return;
      }
      setIsSubmitting(true);
      setError(null);

      try {
          const token = await getClientToken();
          
          const updateInput: UpdateDeploymentInput = {
              inputs: {
                  tf_vars: submittedFormData,
              },
          };

          const updatedDeployment = await updateDeployment(currentDeployment.id, updateInput, async () => token);
          setCurrentDeployment(updatedDeployment); // Update local state
          setFormData(updatedDeployment.inputs?.tf_vars || {}); // Update form state
          toast({ title: "Deployment Updated", description: `Deployment ID: ${updatedDeployment.id} updated successfully.` });
          // Optionally re-trigger deployment run? Or just save? API handles this.
          
      } catch (err: any) {
          setError(err.message);
          toast({ title: "Update Failed", description: err.message, variant: "destructive" });
      } finally {
          setIsSubmitting(false);
      }
  };

  // Wrapper function to match RJSF's expected onSubmit signature
  const rjsfSubmitHandler = (
    { formData }: { formData?: any }, 
    event: React.FormEvent<any>
  ) => {
    if (formData !== undefined) {
      handleFormSubmit({ formData });
    }
  };

  if (isLoadingPage || sessionStatus === 'loading') {
    return (
      <div className="flex flex-col items-center w-full min-h-screen pt-6 bg-muted/40 p-4 md:p-8">
        <div className="w-full max-w-4xl space-y-6">
          <Skeleton className="h-10 w-1/4" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
     return (
      <div className="flex flex-col items-center justify-center w-full min-h-[calc(100vh-100px)] p-4">
         <Alert variant="destructive" className="max-w-2xl">
            <Info className="h-4 w-4" />
            <AlertTitle>Error Loading Deployment Details</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={() => router.push(`/projects/${projectId}/deployments`)} variant="outline" className="mt-4">
            Back to Deployments
        </Button>
      </div>
    );
  }

  if (!currentDeployment || !currentProject || !parentOrg || !currentModule) {
    return (
      <div className="flex flex-col items-center justify-center w-full min-h-[calc(100vh-100px)] p-4">
        <p className="text-lg text-muted-foreground">Essential data could not be loaded.</p>
        <Button onClick={() => router.push(`/projects/${projectId}/deployments`)} variant="outline" className="mt-4">
          Back to Deployments
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/40">
      <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href={`/projects/${projectId}/deployments`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
                <Box className="h-6 w-6"/> Deployment Details
            </h1>
            <p className="text-sm text-muted-foreground">
              ID: {currentDeployment.id} | Project: {currentProject.name} (Org: {parentOrg.name})
            </p>
          </div>
        </div>

        {/* Deployment Info Card */}
        <Card>
            <CardHeader>
                <CardTitle>Deployment Information</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 text-sm">
                <div className="flex justify-between"><span>Deployment ID:</span> <span>{currentDeployment.id}</span></div>
                <div className="flex justify-between"><span>Version:</span> <span>{currentDeployment.version}</span></div>
                <div className="flex justify-between"><span>Status:</span> <Badge variant={currentDeployment.status === 'failed' ? 'destructive' : 'secondary'}>{currentDeployment.status}</Badge></div>
                <div className="flex justify-between"><span>Module:</span> <Link href={`/projects/${projectId}/modules/${currentModule.id}`} className="text-primary hover:underline flex items-center gap-1"><Package size={14}/>{currentModule.name} (ID: {currentModule.id})</Link></div>
                {/* Add Created/Updated Timestamps if available in API */}
                 {currentDeployment.status_details?.last_run_id && (
                    <div className="flex justify-between"><span>Last Run ID:</span> <Link href={`/projects/${projectId}/runs/${currentDeployment.status_details.last_run_id}`} className="text-primary hover:underline">{currentDeployment.status_details.last_run_id}</Link></div>
                )}
                 {currentDeployment.status_details?.error_message && (
                    <div className="flex justify-between text-destructive"><span>Error:</span> <span>{currentDeployment.status_details.error_message}</span></div>
                )}
            </CardContent>
        </Card>


        {/* Configuration Form Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><Settings className="mr-2 h-5 w-5 text-primary"/>Configuration</CardTitle>
            <CardDescription>
              Update the inputs for this deployment ({currentModule.name}). Changes will be saved but may require a new run to take effect.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {rjsfSchema ? (
              <RJSFForm
                schema={rjsfSchema as any}
                validator={validator}
                formData={formData}
                onChange={({ formData: changedFormData }) => setFormData(changedFormData)}
                onSubmit={rjsfSubmitHandler}
                disabled={isSubmitting}
                uiSchema={uiSchema}
                // templates={{ BaseInputTemplate: CustomBaseInputTemplate }} // Example if needed
              >
                <div className="mt-6 flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                        <Save className="mr-2 h-4 w-4"/> {isSubmitting ? "Saving..." : "Save Changes"}
                    </Button>
                </div>
              </RJSFForm>
            ) : (
                 <p className="text-sm text-muted-foreground">No configurable inputs (schema) found for this module.</p>
                 // Potentially show the raw inputs if no schema?
                 // <pre className="text-xs bg-muted p-2 rounded mt-2">{JSON.stringify(currentDeployment.inputs, null, 2)}</pre>
            )}
          </CardContent>
        </Card>

         {/* TODO: Add sections for Runs, Secrets linked, etc. */}

      </div>
    </div>
  );
} 