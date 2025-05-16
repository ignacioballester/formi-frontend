"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, PackagePlus } from "lucide-react";
import { useSession } from "next-auth/react";
import { useEffect, useState, useCallback } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { NewModuleForm } from "@/components/modules/new-module-form";
import { useOrganization } from "@/contexts/organization-context";
import { getOrganization, type Organization } from "@/lib/api-core";
import { toast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

export default function NewOrgModulePage() {
  const params = useParams<{ id: string }>(); // Organization ID
  const router = useRouter();
  const organizationId = params.id;
  const { selectedOrganization: contextOrg, setSelectedOrganization: setContextSelectedOrg } = useOrganization();
  const { data: session, status: sessionStatus } = useSession();

  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(contextOrg);
  const [isLoadingOrg, setIsLoadingOrg] = useState(true);

  const getClientToken = useCallback(async () => {
    if (!session?.accessToken) {
      toast({ title: "Authentication Error", description: "Access token not available.", variant: "destructive" });
      throw new Error("Access token not available");
    }
    return session.accessToken;
  }, [session]);

  useEffect(() => {
    if (sessionStatus === "loading") return;
    if (sessionStatus === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (organizationId && sessionStatus === "authenticated") {
      if (contextOrg && contextOrg.id.toString() === organizationId) {
        setCurrentOrganization(contextOrg);
        setIsLoadingOrg(false);
      } else {
        setIsLoadingOrg(true);
        getClientToken().then(token => {
          getOrganization(Number(organizationId), async () => token)
            .then(org => {
              setCurrentOrganization(org);
              setContextSelectedOrg(org);
            })
            .catch(err => {
              console.error("Failed to load organization:", err);
              toast({ title: "Error", description: err.message || "Could not load organization details.", variant: "destructive" });
              router.push("/organizations"); // Redirect if org fails to load
            })
            .finally(() => setIsLoadingOrg(false));
        }).catch(err => {
          setIsLoadingOrg(false);
          toast({ title: "Token Error", description: "Failed to get client token.", variant: "destructive" });
        });
      }
    } else {
      setIsLoadingOrg(false); // Not enough info or not auth'd
    }
  }, [organizationId, sessionStatus, router, getClientToken, contextOrg, setContextSelectedOrg]);

  const handleModuleCreated = () => {
    router.push(`/organizations/${organizationId}/modules`);
    router.refresh(); // Ensures the module list on the previous page is updated
  };

  if (isLoadingOrg || sessionStatus === "loading") {
    return (
      <div className="flex flex-col items-center w-full min-h-screen pt-6 bg-muted/40 p-4 md:p-0">
        <div className="w-full max-w-2xl space-y-6">
            <Skeleton className="h-10 w-1/2" />
            <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!currentOrganization) {
    return (
      <div className="flex flex-col items-center justify-center w-full min-h-[calc(100vh-100px)] p-4">
        <p className="text-lg text-muted-foreground">Organization not found or not authorized.</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href={`/organizations`}>Back to Organizations</Link>
        </Button>
      </div>
    );
  }
  
  const orgName = currentOrganization?.name || `Organization ${organizationId}`;

  return (
    <div className="flex flex-col items-center w-full min-h-screen pt-6 bg-muted/40">
      <div className="w-full max-w-2xl space-y-6 p-4 md:p-0">
        <div className="flex items-center gap-2 self-start">
          <Button variant="outline" size="icon" asChild>
            <Link href={`/organizations/${organizationId}/modules`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Create Module in {orgName}</h2>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PackagePlus className="h-6 w-6" /> New Module
            </CardTitle>
            <CardDescription>Configure a new module by linking it to a repository and specifying its details.</CardDescription>
          </CardHeader>
          <NewModuleForm 
            organizationId={organizationId} 
            onModuleCreated={handleModuleCreated} 
          />
        </Card>
      </div>
    </div>
  );
} 