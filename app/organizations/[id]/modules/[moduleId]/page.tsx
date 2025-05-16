"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { ArrowLeft, Package, GitBranch, Folder, Info, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  type Module,
  type Repository,
  getRepository,
  type ModuleConfig,
  UpdateModuleInput,
} from "@/lib/api-core";
import { getModuleAction, updateModuleAction } from "@/app/actions/modules/actions";
import { useOrganization } from "@/contexts/organization-context";
import { EditModuleForm } from "@/components/modules/edit-module-form";

export default function ModuleDetailPage() {
  const params = useParams<{ id: string; moduleId: string }>();
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const { selectedOrganization, setSelectedOrganization } = useOrganization();

  const organizationId = params.id;
  const moduleId = params.moduleId;

  const [module, setModule] = useState<Module | null>(null);
  const [repository, setRepository] = useState<Repository | null>(null);
  const [isLoadingPage, setIsLoadingPage] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
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

  const fetchAndSetModuleData = useCallback(async (token: string) => {
    const result = await getModuleAction(Number(moduleId), token);
    if (result.success && result.data) {
      setModule(result.data);
      setEditModuleConfig(result.data.module_config || {});
      setEditConfigFilePath(result.data.module_config?.config_file_path);
      setIsConfigPathDriven(!!result.data.module_config?.config_file_path);
      if (result.data.repository_id) {
        try {
            const repoResult = await getRepository(result.data.repository_id, async () => token);
            setRepository(repoResult.repository);
        } catch (repoErr) {
            console.warn("Could not fetch repository details for module:", repoErr);
            setRepository(null);
        }
      }
      if ((!selectedOrganization || selectedOrganization.id.toString() !== organizationId) && result.data.organization_id.toString() === organizationId) {
      }

    } else {
      throw new Error(result.error || "Failed to load module details.");
    }
  }, [moduleId, organizationId, selectedOrganization, setSelectedOrganization]);

  useEffect(() => {
    async function loadPageData() {
      if (!moduleId || sessionStatus !== "authenticated") {
        if (sessionStatus === "loading") return;
        setIsLoadingPage(false);
        setError("Module ID missing or user not authenticated.");
        return;
      }
      setIsLoadingPage(true);
      setError(null);
      try {
        const token = await getClientToken();
        await fetchAndSetModuleData(token);
      } catch (err: any) {
        console.error("Error fetching module details:", err);
        setError(err.message || "An unexpected error occurred.");
        toast({ title: "Error Loading Module", description: err.message, variant: "destructive" });
      } finally {
        setIsLoadingPage(false);
      }
    }
    if (sessionStatus === "unauthenticated") router.push("/login");
    else loadPageData();
  }, [moduleId, sessionStatus, getClientToken, router, fetchAndSetModuleData]);

  const handleModuleFormUpdated = async () => {
    setIsLoadingPage(true);
    try {
      const token = await getClientToken();
      await fetchAndSetModuleData(token);
      toast({ title: "Module Refreshed", description: "Module details have been updated." });
    } catch (err:any) {
      toast({ title: "Refresh Error", description: `Failed to refresh module data: ${err.message}`, variant: "destructive" });
    } finally {
      setIsLoadingPage(false);
    }
  };
  
  const handleLoadFromConfigFile = async () => {
    if (!editConfigFilePath) {
      toast({ title: "Error", description: "Please enter a configuration file path.", variant: "destructive" });
      return;
    }
    if (!module) return;
    setIsLoadingConfigFile(true); setError(null);
    try {
      const token = await getClientToken();
      const updatePayload: UpdateModuleInput = { module_config: { config_file_path: editConfigFilePath } };
      const result = await updateModuleAction(module.id, updatePayload, token);
      if (result.success && result.data) {
        await fetchAndSetModuleData(token);
        toast({ title: "Configuration Loaded", description: "Module configuration has been loaded from the file and saved." });
      } else { throw new Error(result.error || "Failed to trigger config file load."); }
    } catch (err: any) {
      setError(err.message); toast({ title: "Error Loading Configuration", description: err.message, variant: "destructive" });
    } finally { setIsLoadingConfigFile(false); }
  };

  const handleSaveModuleConfigChanges = async () => {
    if (!module) return;
    const updateData: UpdateModuleInput = {};
    const currentConfig = module.module_config || {};
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
      const result = await updateModuleAction(module.id, updateData, token);
      if (result.success && result.data) {
        await fetchAndSetModuleData(token);
        toast({ title: "Configuration Saved", description: "Module configuration has been updated." });
      } else { throw new Error(result.error || "Failed to save module configuration."); }
    } catch (err: any) {
      setError(err.message); toast({ title: "Error Saving Configuration", description: err.message, variant: "destructive" });
    } finally { setIsSavingConfig(false); }
  };


  if (isLoadingPage) {
    return (
      <div className="space-y-4 p-8 pt-6">
        <Skeleton className="h-8 w-1/4 mb-2" /> 
        <Skeleton className="h-4 w-1/2 mb-6" /> 
        <Card><CardHeader><Skeleton className="h-6 w-1/3" /></CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-64 w-full" />
          </CardContent></Card>
        <Card><CardHeader><Skeleton className="h-6 w-1/3" /></CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-48 w-full" />
          </CardContent></Card>
      </div>
    );
  }

  if (error && !module) {
    return (
      <div className="space-y-4 p-8 pt-6 text-center">
        <p className="text-red-500">{error}</p>
        <Button onClick={() => router.back()} variant="outline">Go Back</Button>
      </div>
    );
  }

  if (!module) {
    return (
      <div className="space-y-4 p-8 pt-6 text-center">
        <p>Module not found.</p>
        <Button asChild variant="outline">
          <Link href={`/organizations/${organizationId}/modules`}>Back to Modules</Link>
        </Button>
      </div>
    );
  }
  
  const orgName = selectedOrganization?.name || module.organization_id.toString();
  const gitRefString = module.git_reference.branch ? `Branch: ${module.git_reference.branch}`
                     : module.git_reference.tag ? `Tag: ${module.git_reference.tag}`
                     : module.git_reference.commit ? `Commit: ${module.git_reference.commit.substring(0,7)}...`
                     : "N/A";

  return (
    <div className="space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="icon" asChild>
          <Link href={`/organizations/${organizationId}/modules`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center">
            <Package className="mr-3 h-7 w-7 text-muted-foreground" /> {module.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            Module in <Link href={`/organizations/${organizationId}`} className="hover:underline">{orgName}</Link>.
            {module.project_id && <span> Project ID: {module.project_id}</span>}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Core Module Configuration</CardTitle>
          <CardDescription>
            Edit the fundamental properties of this module such as its name, source repository, Git reference, and working directory.
          </CardDescription>
        </CardHeader>
        <EditModuleForm 
            organizationId={organizationId} 
            moduleToEdit={module} 
            onModuleUpdated={handleModuleFormUpdated} 
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
                    {repository ? repository.name : `ID: ${module.repository_id}`}
                    {repository?.url && <Link href={repository.url} target="_blank" rel="noopener noreferrer" className="ml-2"><Info className='h-3 w-3'/></Link>}
                </div>
            </div>
            <div className="space-y-1">
                <Label>Selected Git Reference</Label>
                <p className="text-sm">{gitRefString}</p>
            </div>
            <div className="space-y-1">
                <Label>Working Directory</Label>
                <p className="text-sm"><Badge variant="outline">{module.working_directory}</Badge></p>
            </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Advanced Module Settings (module.tfvars.json)</CardTitle>
          <CardDescription>
            Define input variables, review requirements, credentials, and environment variables for this module.
            This can be driven by a `config_file_path` within the repository or manually configured here.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="configFilePath">Config File Path (Optional)</Label>
            <div className="flex items-center gap-2">
              <Input 
                id="configFilePath" 
                placeholder="e.g., formi.module.json or ./config/dev.json"
                value={editConfigFilePath || ""} 
                onChange={(e) => {
                  setEditConfigFilePath(e.target.value);
                  setIsConfigPathDriven(!!e.target.value);
                }}
              />
              <Button onClick={handleLoadFromConfigFile} disabled={!editConfigFilePath || isLoadingConfigFile} size="sm">
                {isLoadingConfigFile ? "Loading..." : "Load from Path"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              If specified, module settings will be loaded from this file in the repository. Clears manual settings below.
            </p>
          </div>

          {isConfigPathDriven && editConfigFilePath && module.module_config?.config_file_path === editConfigFilePath && (
             <Alert variant="default">
                <Info className="h-4 w-4" />
                <AlertTitle>Configuration Driven by File</AlertTitle>
                <AlertDescription>
                Module settings are currently loaded from <code className="font-mono text-sm bg-muted p-1 rounded">{editConfigFilePath}</code>.
                To edit manually, clear the path above. Manual changes here will be overridden if file path is reloaded.
                </AlertDescription>
            </Alert>
          )}

          <div className={`space-y-4 ${isConfigPathDriven ? 'opacity-50 pointer-events-none' : ''}`}>
            <Label className="text-base">Manual Configuration (Overrides file if path is cleared)</Label>
            <pre className="text-xs p-4 bg-muted rounded-md overflow-x-auto">
              {JSON.stringify(editModuleConfig, null, 2)}
            </pre>
            <p className="text-xs text-muted-foreground">
                This is a placeholder. A more sophisticated UI would be needed to edit these fields.
                Current fields: variables, review_required, credentials, environment_variables, deployment_variables, external_modules.
            </p>
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