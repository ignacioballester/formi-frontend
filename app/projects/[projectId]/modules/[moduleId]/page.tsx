"use client";

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { ArrowLeft, Package, GitBranch, Folder, Info, Save } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/use-toast';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EditModuleForm } from '@/components/modules/edit-module-form';
import { useOrganization } from '@/contexts/organization-context';
import {
  getProject,
  getOrganization,
  getModule,
  updateModule,
  getRepository,
  type Project,
  type Organization,
  type Module,
  type Repository,
  type ModuleConfig,
  type UpdateModuleInput,
} from '@/lib/api';

export default function EditProjectModulePage() {
  const params = useParams<{ projectId: string; moduleId: string }>();
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const { 
    selectedProject: contextProject, 
    setSelectedProject: setContextSelectedProject,
    selectedOrganization: contextOrg,
    setSelectedOrganization: setContextSelectedOrg 
  } = useOrganization();

  const projectId = params.projectId;
  const moduleId = params.moduleId;

  const [currentModule, setCurrentModule] = useState<Module | null>(null);
  const [currentProject, setCurrentProject] = useState<Project | null>(contextProject);
  const [parentOrg, setParentOrg] = useState<Organization | null>(contextOrg);
  const [moduleRepo, setModuleRepo] = useState<Repository | null>(null);
  const [isLoadingPage, setIsLoadingPage] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for the separate module_config editing (similar to org module detail page)
  const [editModuleConfig, setEditModuleConfig] = useState<Partial<ModuleConfig>>({});
  const [editConfigFilePath, setEditConfigFilePath] = useState<string | undefined>(undefined);
  const [isConfigPathDriven, setIsConfigPathDriven] = useState(false);
  const [isLoadingConfigFile, setIsLoadingConfigFile] = useState(false);
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  const getClientToken = useCallback(async () => {
    if (!session?.accessToken) {
      toast({ title: "Authentication Error", description: "Access token not available.", variant: "destructive" });
      throw new Error("Access token not available");
    }
    return session.accessToken;
  }, [session]);

  const fetchPageData = useCallback(async (token: string) => {
    // 1. Fetch Module
    const moduleResult = await getModule(Number(moduleId), async () => token);
    const fetchedModule = moduleResult;
    setCurrentModule(fetchedModule);
    setEditModuleConfig(fetchedModule.module_config || {});
    setEditConfigFilePath(fetchedModule.module_config?.config_file_path);
    setIsConfigPathDriven(!!fetchedModule.module_config?.config_file_path);

    // 2. Fetch Project (if not in context or different)
    let proj = contextProject;
    if (!proj || proj.id.toString() !== projectId) {
      proj = await getProject(Number(projectId), async () => token);
    }
    if (!proj) throw new Error("Project not found.");
    setCurrentProject(proj);
    setContextSelectedProject(proj);

    // 3. Fetch Parent Organization (if not in context or different)
    let org = contextOrg;
    if ((!org || org.id !== proj.organization_id) && proj.organization_id) {
      org = await getOrganization(proj.organization_id, async () => token);
    }
    if (!org && proj.organization_id) throw new Error("Parent organization not found.");
    setParentOrg(org);
    setContextSelectedOrg(org);
    
    // 4. Fetch Module's Repository Name
    if (fetchedModule.repository_id) {
        try {
            const repoResult = await getRepository(fetchedModule.repository_id, async () => token);
            setModuleRepo(repoResult.repository);
        } catch (repoErr) {
            console.warn("Could not fetch repository details for module:", repoErr);
            setModuleRepo(null);
        }
    }
  }, [moduleId, projectId, contextProject, setContextSelectedProject, contextOrg, setContextSelectedOrg]);

  useEffect(() => {
    if (sessionStatus === 'loading') return;
    if (sessionStatus === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (moduleId && projectId && sessionStatus === 'authenticated') {
      setIsLoadingPage(true);
      getClientToken().then(token => {
        fetchPageData(token)
          .catch(err => {
            console.error("Error loading page data:", err);
            setError(err.message || "An unexpected error occurred.");
            toast({ title: "Error Loading Page", description: err.message, variant: "destructive" });
          })
          .finally(() => setIsLoadingPage(false));
      }).catch(err => {
        setIsLoadingPage(false);
        toast({ title: "Token Error", description: "Failed to get client token.", variant: "destructive" });
      });
    } else {
      setIsLoadingPage(false);
      if (!moduleId || !projectId) setError("Module or Project ID missing from URL.");
    }
  }, [moduleId, projectId, sessionStatus, router, getClientToken, fetchPageData]);

  const handleCoreModuleUpdated = async () => {
    setIsLoadingPage(true);
    try {
      const token = await getClientToken();
      await fetchPageData(token); // Re-fetch all data
      toast({ title: "Module Refreshed", description: "Module details have been updated." });
    } catch (err: any) {
      toast({ title: "Refresh Error", description: `Failed to refresh module data: ${err.message}`, variant: "destructive" });
    } finally {
      setIsLoadingPage(false);
    }
  };
  
  // --- Config File Loading & Saving Logic (similar to organization module detail page) ---
  const handleLoadFromConfigFile = async () => {
    if (!editConfigFilePath || !currentModule) return;
    setIsLoadingConfigFile(true); setError(null);
    try {
      const token = await getClientToken();
      const updatePayload: UpdateModuleInput = { module_config: { config_file_path: editConfigFilePath } };
      const updatedModule = await updateModule(currentModule.id, updatePayload, async () => token);
      if (updatedModule) {
        await fetchPageData(token); // Re-fetch and set all module data
        toast({ title: "Configuration Loaded", description: "Module configuration loaded and saved." });
      } else {
        throw new Error("Failed to trigger config file load or no data returned.");
      }
    } catch (err: any) {
      setError(err.message); toast({ title: "Error Loading Configuration", description: err.message, variant: "destructive" });
    } finally { setIsLoadingConfigFile(false); }
  };

  const handleSaveModuleConfigChanges = async () => {
    if (!currentModule) return;
    const updateData: UpdateModuleInput = {};
    const currentConfig = currentModule.module_config || {};
    const newConfig = { ...editModuleConfig, config_file_path: editConfigFilePath };

    if (JSON.stringify(newConfig) !== JSON.stringify(currentConfig)) {
      updateData.module_config = newConfig;
    } else {
      toast({ title: "No Changes", description: "Module configuration has no changes to save." });
      return;
    }
    setIsSavingConfig(true); setError(null);
    try {
      const token = await getClientToken();
      const updatedModule = await updateModule(currentModule.id, updateData, async () => token);
      if (updatedModule) {
        await fetchPageData(token);
        toast({ title: "Configuration Saved", description: "Module configuration updated." });
      } else {
        throw new Error("Failed to save module configuration or no data returned.");
      }
    } catch (err: any) {
      setError(err.message); toast({ title: "Error Saving Configuration", description: err.message, variant: "destructive" });
    } finally { setIsSavingConfig(false); }
  };

  if (isLoadingPage || sessionStatus === 'loading') {
    return (
      <div className="space-y-4 p-8 pt-6">
        <Skeleton className="h-10 w-3/4 mb-6" />
        <Card><CardHeader><Skeleton className="h-6 w-1/3" /></CardHeader>
          <CardContent className="space-y-4"><Skeleton className="h-64 w-full" /></CardContent></Card>
        <Card><CardHeader><Skeleton className="h-6 w-1/3" /></CardHeader>
          <CardContent className="space-y-4"><Skeleton className="h-48 w-full" /></CardContent></Card>
      </div>
    );
  }

  if (error || !currentModule || !currentProject || !parentOrg) {
    return (
      <div className="flex flex-col items-center justify-center w-full min-h-[calc(100vh-100px)] p-4">
        <p className="text-lg text-destructive text-center mb-4">
          {error || "Module, Project, or Organization data could not be loaded."}
        </p>
        <Button onClick={() => router.push(projectId ? `/projects/${projectId}/modules` : '/projects')} variant="outline" className="mt-4">
          Back to Modules
        </Button>
      </div>
    );
  }
  
  const gitRefString = currentModule.git_reference.branch ? `Branch: ${currentModule.git_reference.branch}`
                     : currentModule.git_reference.tag ? `Tag: ${currentModule.git_reference.tag}`
                     : currentModule.git_reference.commit ? `Commit: ${currentModule.git_reference.commit.substring(0,7)}...`
                     : "N/A";

  return (
    <div className="space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="icon" asChild>
          <Link href={`/projects/${projectId}/modules`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center">
            <Package className="mr-3 h-7 w-7 text-muted-foreground" /> {currentModule.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            Module in Project: <Link href={`/projects/${projectId}`} className="hover:underline">{currentProject.name}</Link>
            (Org: <Link href={`/organizations/${parentOrg.id}`} className="hover:underline">{parentOrg.name}</Link>)
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Core Module Configuration</CardTitle>
          <CardDescription>
            Edit fundamental properties like name, source repository, Git reference, and working directory.
          </CardDescription>
        </CardHeader>
        <EditModuleForm 
          organizationId={parentOrg.id.toString()} 
          moduleToEdit={currentModule} 
          onModuleUpdated={handleCoreModuleUpdated} 
        />
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Module Source Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
                <Label>Repository</Label>
                <div className="flex items-center text-sm">
                    <GitBranch className="mr-1.5 h-4 w-4 text-muted-foreground" />
                    {moduleRepo ? moduleRepo.name : `ID: ${currentModule.repository_id}`}
                    {moduleRepo?.url && <Link href={moduleRepo.url} target="_blank" rel="noopener noreferrer" className="ml-2"><Info className='h-3 w-3'/></Link>}
                </div>
            </div>
            <div className="space-y-1">
                <Label>Selected Git Reference</Label>
                <p className="text-sm">{gitRefString}</p>
            </div>
            <div className="space-y-1">
                <Label>Working Directory</Label>
                <p className="text-sm"><Badge variant="outline">{currentModule.working_directory}</Badge></p>
            </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Advanced Module Settings (module.tfvars.json)</CardTitle>
          <CardDescription>
            Define input variables, review requirements, credentials, and environment variables. 
            Can be driven by a repository file path or manually configured.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="configFilePath">Config File Path (Optional)</Label>
            <div className="flex items-center gap-2">
              <Input 
                id="configFilePath" 
                placeholder="e.g., formi.module.json"
                value={editConfigFilePath || ""} 
                onChange={(e) => { setEditConfigFilePath(e.target.value); setIsConfigPathDriven(!!e.target.value); }}
              />
              <Button onClick={handleLoadFromConfigFile} disabled={!editConfigFilePath || isLoadingConfigFile} size="sm">
                {isLoadingConfigFile ? "Loading..." : "Load from Path"}
              </Button>
            </div>
             <p className="text-xs text-muted-foreground">
              If specified, settings are loaded from this file. Clears manual settings below.
            </p>
          </div>
          {isConfigPathDriven && editConfigFilePath && currentModule.module_config?.config_file_path === editConfigFilePath && (
             <Alert variant="default">
                <Info className="h-4 w-4" />
                <AlertTitle>Configuration Driven by File</AlertTitle>
                <AlertDescription>
                Settings loaded from <code className="font-mono text-sm bg-muted p-1 rounded">{editConfigFilePath}</code>.
                To edit manually, clear the path. Manual changes are overridden if file path is reloaded.
                </AlertDescription>
            </Alert>
          )}
          <div className={`space-y-4 ${isConfigPathDriven ? 'opacity-50 pointer-events-none' : ''}`}>
            <Label className="text-base">Manual Configuration</Label>
            <pre className="text-xs p-4 bg-muted rounded-md overflow-x-auto">
              {JSON.stringify(editModuleConfig, null, 2)}
            </pre>
            <p className="text-xs text-muted-foreground">Placeholder for detailed UI to edit module configuration fields.</p>
          </div>
        </CardContent>
        <CardFooter className="border-t pt-6">
            <Button onClick={handleSaveModuleConfigChanges} disabled={isSavingConfig || isLoadingConfigFile || isLoadingPage}>
                {isSavingConfig ? "Saving Settings..." : "Save Advanced Settings"}
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 