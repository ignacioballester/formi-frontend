"use client";

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { ArrowLeft, PackageSearch, Rocket, Info } from 'lucide-react';
import {withTheme} from '@rjsf/core'; // Core RJSF Form
import validator from '@rjsf/validator-ajv8'; // Validator
import {Theme as shadcnTheme} from '@rjsf/shadcn';

import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useOrganization } from '@/contexts/organization-context';
import {
  getProject,
  getOrganization,
  getModules, // For listing available modules
  getModule,  // For fetching full details of selected module
  deployModule,
  type Project,
  type Organization,
  type Module,
  type DeployModuleInput,
  type SecretIdentifier,
  type DeploymentVariableInput,
  type ModuleConfig
} from '@/lib/api-core';

const RJSFForm = withTheme(shadcnTheme);

// Helper to attempt to parse initial form data from module_config.variables
const getInitialFormData = (schema: any, moduleConfigVariables?: { [key: string]: any }): { [key: string]: any } => {
  if (!moduleConfigVariables || !schema || !schema.properties) {
    return {};
  }
  const initialData: { [key: string]: any } = {};
  for (const key in schema.properties) {
    if (moduleConfigVariables.hasOwnProperty(key)) {
      const schemaProp = schema.properties[key];
      const value = moduleConfigVariables[key];

      if (schemaProp.type === 'integer' || schemaProp.type === 'number') {
        const numVal = parseFloat(value);
        if (!isNaN(numVal)) initialData[key] = numVal;
        // else: default to nothing if parsing fails?
      } else if (schemaProp.type === 'boolean') {
        initialData[key] = value === 'true' || value === true;
      } else if (schemaProp.type === 'string') {
        // Ensure we only assign actual strings or numbers (convertible to string)
        if (typeof value === 'string') {
          initialData[key] = value;
        } else if (typeof value === 'number') {
          initialData[key] = String(value);
        } else {
          // If value is object, null, undefined, etc., default to empty string for string fields
          initialData[key] = ""; 
        }
      } else {
         // For other types (array, object), assign directly for now.
         // This might need refinement if widgets expect specific defaults.
         initialData[key] = value;
      }
    }
  }
  return initialData;
};


export default function NewProjectDeploymentPage() {
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
  
  const [availableModules, setAvailableModules] = useState<Module[]>([]);
  const [selectedModuleId, setSelectedModuleId] = useState<string>('');
  const [selectedModuleDetails, setSelectedModuleDetails] = useState<Module | null>(null);
  const [rjsfSchema, setRjsfSchema] = useState<object | null>(null);
  const [initialFormData, setInitialFormData] = useState<any>({});
  const [uiSchema, setUiSchema] = useState<any>({}); // For RJSF UI customizations

  const [isLoadingPage, setIsLoadingPage] = useState(true);
  const [isLoadingModuleDetails, setIsLoadingModuleDetails] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getClientToken = useCallback(async () => {
    if (!session?.accessToken) throw new Error("Access token not available");
    return session.accessToken;
  }, [session]);

  // Initial data fetch: project, org, and available modules
  useEffect(() => {
    if (sessionStatus === 'loading') return;
    if (sessionStatus === 'unauthenticated') { router.push('/login'); return; }

    if (projectId && sessionStatus === 'authenticated') {
      setIsLoadingPage(true);
      getClientToken().then(async token => {
        try {
          let proj = contextProject;
          if (!proj || proj.id.toString() !== projectId) {
            proj = await getProject(Number(projectId), async () => token);
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
          
          if (!proj.organization_id) throw new Error("Project is missing parent organization ID.");

          const [projectModules, orgModules] = await Promise.all([
            getModules({ project_id: proj.id }, async () => token),
            getModules({ organization_id: proj.organization_id }, async () => token)
          ]);
          const combined = new Map<number, Module>();
          orgModules.forEach(m => combined.set(m.id, m));
          projectModules.forEach(m => combined.set(m.id, m)); // Project modules take precedence
          setAvailableModules(Array.from(combined.values()));

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
  }, [projectId, sessionStatus, router, getClientToken, contextProject, setContextSelectedProject, contextOrg, setContextSelectedOrg]);

  // Fetch module details when selectedModuleId changes
  useEffect(() => {
    if (!selectedModuleId) {
      setSelectedModuleDetails(null);
      setRjsfSchema(null);
      setInitialFormData({}); // Clear initial data
      setUiSchema({});      // Clear uiSchema
      return;
    }
    setIsLoadingModuleDetails(true);
    setError(null);
    getClientToken().then(async token => {
      try {
        const modDetails = await getModule(Number(selectedModuleId), async () => token);
        setSelectedModuleDetails(modDetails);
        
        const schema = modDetails.terraform_properties?.tfvars_json_schema;
        if (schema && typeof schema === 'object') {
          setRjsfSchema(schema);
          const initialData = getInitialFormData(schema, modDetails.module_config?.variables);
          setInitialFormData(initialData);
          // --- REMOVE ui:help generation ---
          // The theme will render schema descriptions automatically.
          // If further UI customization is needed, uiSchema can be built differently.
          setUiSchema({}); // Reset uiSchema
          // --- END REMOVAL ---

        } else {
          setRjsfSchema(null);
          setInitialFormData({}); // Clear initial data
          setUiSchema({});      // Clear uiSchema
          setError("Selected module does not have a valid TFVars JSON schema.");
          toast({title: "Schema Error", description: "Module TFVars schema is missing or invalid.", variant: "default"});
        }
      } catch (err: any) {
        setError(err.message);
        toast({ title: "Error Loading Module Details", description: err.message, variant: "destructive" });
        setRjsfSchema(null);
        setInitialFormData({});
        setUiSchema({});
      } finally {
        setIsLoadingModuleDetails(false);
      }
    }).catch(err => {
      setIsLoadingModuleDetails(false);
      setError(err.message);
      toast({ title: "Token Error", description: err.message, variant: "destructive" });
    });
  }, [selectedModuleId, getClientToken]);

  const handleFormSubmit = async ({ formData }: { formData: any }) => {
    if (!currentProject || !selectedModuleDetails) {
      toast({ title: "Error", description: "Project or Module not selected.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    setError(null);

    try {
      const token = await getClientToken();
      const moduleConfig: ModuleConfig | undefined = selectedModuleDetails.module_config;

      // Prepare secrets input
      const secrets: SecretIdentifier[] = moduleConfig?.credentials?.map((credConfig: any) => {
        // This is a simplified placeholder.
        // In a real scenario, you'd need UI to select actual secrets based on credConfig.options
        // For now, if options exist, pick the first one, or a placeholder.
        if (credConfig.options && credConfig.options.length > 0) {
          return credConfig.options[0]; 
        }
        // Fallback if no options - this will likely fail if the secret is required by the backend
        return { name: `placeholder-secret-${credConfig.type}`, type: credConfig.type, organization_id: parentOrg!.id };
      }) || [];
      
      // Prepare deployment_variable_inputs
      const deploymentVariables: DeploymentVariableInput[] = moduleConfig?.deployment_variables?.map(depVar => ({
        name: depVar.name,
        input: depVar.default || "" // Use default or empty string. User might need to override.
      })) || [];


      const deployInput: DeployModuleInput = {
        module_id: selectedModuleDetails.id,
        project_id: currentProject.id,
        inputs: {
          tf_vars: formData,
          secrets: secrets,
          deployment_variable_inputs: deploymentVariables,
        },
      };

      const result = await deployModule(deployInput, async () => token);
      toast({ title: "Deployment Initiated", description: `Deployment ID: ${result.deployment.id}, Run ID: ${result.run.id}` });
      router.push(`/projects/${projectId}/deployments/${result.deployment.id}`); // Or to runs page
    } catch (err: any) {
      setError(err.message);
      toast({ title: "Deployment Failed", description: err.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Wrapper function to match RJSF's expected onSubmit signature
  const rjsfSubmitHandler = (
    { formData }: { formData?: any }, // Use a simple object type expecting formData
    event: React.FormEvent<any>
  ) => {
    // Optional: Check if formData exists if needed
    if (formData !== undefined) {
      handleFormSubmit({ formData });
    }
  };

  if (isLoadingPage || sessionStatus === 'loading') {
    return (
      <div className="flex flex-col items-center w-full min-h-screen pt-6 bg-muted/40 p-4 md:p-0">
        <div className="w-full max-w-2xl space-y-6">
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (error && !isLoadingModuleDetails && !rjsfSchema && !selectedModuleDetails) { // Show general page error if not specifically module loading error
     return (
      <div className="flex flex-col items-center justify-center w-full min-h-[calc(100vh-100px)] p-4">
        <p className="text-lg text-destructive text-center mb-4">{error}</p>
        <Button onClick={() => router.push(`/projects/${projectId}/deployments`)} variant="outline">Back to Deployments</Button>
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
      <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href={`/projects/${projectId}/deployments`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">New Deployment</h1>
            <p className="text-sm text-muted-foreground">
              For Project: {currentProject.name} (Org: {parentOrg.name})
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><PackageSearch className="mr-2 h-5 w-5"/>Select Module</CardTitle>
            <CardDescription>Choose a module to deploy to project '{currentProject.name}'.</CardDescription>
          </CardHeader>
          <CardContent>
            {availableModules.length > 0 ? (
              <Select value={selectedModuleId} onValueChange={setSelectedModuleId}>
                <SelectTrigger className="w-full md:w-[400px]">
                  <SelectValue placeholder="Select a module..." />
                </SelectTrigger>
                <SelectContent>
                  {availableModules.map(mod => (
                    <SelectItem key={mod.id} value={mod.id.toString()}>
                      {mod.name} (ID: {mod.id}) {mod.project_id ? `(Project: ${mod.project_id === currentProject.id ? currentProject.name : mod.project_id})` : '(Org-level)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-sm text-muted-foreground">No modules available for deployment.</p>
            )}
          </CardContent>
        </Card>

        {isLoadingModuleDetails && (
          <Card>
            <CardHeader><CardTitle>Loading Module Details...</CardTitle></CardHeader>
            <CardContent><Skeleton className="h-64 w-full" /></CardContent>
          </Card>
        )}

        {error && selectedModuleId && !isLoadingModuleDetails && ( // Show module specific error
             <Alert variant="destructive" className="mt-4">
                <Info className="h-4 w-4" />
                <AlertTitle>Error Loading Module</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        )}

        {selectedModuleDetails && rjsfSchema && !isLoadingModuleDetails && !error && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center"><Rocket className="mr-2 h-5 w-5 text-primary"/>Configure Deployment: {selectedModuleDetails.name}</CardTitle>
              <CardDescription>
                Provide inputs for the module based on its schema. 
                Working Directory: <code className="bg-muted px-1 rounded">{selectedModuleDetails.working_directory}</code>, 
                Git Ref: <code className="bg-muted px-1 rounded">{selectedModuleDetails.git_reference.branch || selectedModuleDetails.git_reference.tag || selectedModuleDetails.git_reference.commit?.substring(0,7)}</code>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RJSFForm
                schema={rjsfSchema as any}
                validator={validator}
                formData={initialFormData}
                onChange={({ formData }) => setInitialFormData(formData)}
                onSubmit={rjsfSubmitHandler}
                disabled={isSubmitting}
                uiSchema={uiSchema}
              >
                <div className="mt-6 flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting || isLoadingModuleDetails}>
                        {isSubmitting ? "Deploying..." : "Deploy Module"}
                    </Button>
                </div>
              </RJSFForm>
              
              {selectedModuleDetails.module_config?.credentials && selectedModuleDetails.module_config.credentials.length > 0 && (
                <Alert variant="default" className="mt-6">
                  <Info className="h-4 w-4" />
                  <AlertTitle>Secrets Configuration Note</AlertTitle>
                  <AlertDescription>
                    {/* Add type annotation for 'c' */}
                    This module requires secrets: {selectedModuleDetails.module_config.credentials.map((c: {type: string}) => c.type).join(', ')}. 
                    Currently, placeholders are used. Proper secret selection UI will be needed.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}
        {selectedModuleDetails && !rjsfSchema && !isLoadingModuleDetails && !error && (
            <Card>
                <CardHeader><CardTitle>No Input Schema</CardTitle></CardHeader>
                <CardContent>
                    <p>The selected module <code className="font-semibold">{selectedModuleDetails.name}</code> does not have a configurable input schema (tfvars_json_schema).</p>
                    <p className="mt-2 text-sm text-muted-foreground">You can still attempt to deploy it if it requires no inputs.</p>
                     <div className="mt-6 flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
                            Cancel
                        </Button>
                        <Button onClick={() => handleFormSubmit({formData: {}})} disabled={isSubmitting || isLoadingModuleDetails}>
                            {isSubmitting ? "Deploying..." : "Deploy Module (No Inputs)"}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        )}

      </div>
    </div>
  );
} 