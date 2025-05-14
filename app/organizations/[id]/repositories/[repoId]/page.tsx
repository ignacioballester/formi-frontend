"use client"

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/use-toast";
import { type Repository, type Organization } from "@/lib/api";
import { getRepositoryAction } from "@/app/actions/repositories/actions";
import { getOrganization } from "@/lib/api"; // To fetch org name if not in context
import { useOrganization } from "@/contexts/organization-context";
import { EditRepositoryForm } from "@/components/repositories/edit-repository-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"; // For additional info display

export default function RepositoryDetailPageOrg() {
  const params = useParams<{ id: string; repoId: string }>();
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const { selectedOrganization: contextOrg, setSelectedOrganization: setContextSelectedOrg } = useOrganization();

  const organizationId = params.id;
  const repositoryId = params.repoId;

  const [repository, setRepository] = useState<Repository | null>(null);
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(contextOrg);
  const [loading, setLoading] = useState(true);
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
      if (!repositoryId || !organizationId || sessionStatus !== "authenticated") {
        if (sessionStatus === "loading") return;
        setLoading(false);
        setError(sessionStatus !== "authenticated" ? "User not authenticated." : "Repository or Organization ID missing.");
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const token = await getClientToken();
        const repoResult = await getRepositoryAction(Number(repositoryId), token);
        if (repoResult.success && repoResult.data) {
          setRepository(repoResult.data.repository);

          // Fetch organization if not in context or if IDs don't match
          if (!contextOrg || contextOrg.id.toString() !== organizationId) {
            const orgData = await getOrganization(Number(organizationId), async () => token);
            setCurrentOrganization(orgData);
            setContextSelectedOrg(orgData); // Update context
          } else {
            setCurrentOrganization(contextOrg);
          }
        } else {
          throw new Error(repoResult.error || "Failed to load repository details.");
        }
      } catch (err: any) {
        console.error("Error fetching data:", err);
        setError(err.message || "An unexpected error occurred.");
        toast({ title: "Error Loading Data", description: err.message, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    }
    if (sessionStatus === "unauthenticated") router.push("/login");
    else fetchData();
  }, [repositoryId, organizationId, sessionStatus, getClientToken, router, contextOrg, setContextSelectedOrg]);

  const handleUpdateSuccess = (updatedRepository: Repository) => {
    setRepository(updatedRepository); // Update local state with the new repository data
    // Optionally, re-fetch or just update state if form syncs well
    toast({ title: "Success", description: "Repository updated successfully." });
    // No navigation needed, stay on the same page
  };

  if (loading || sessionStatus === "loading") {
    return (
      <div className="space-y-6 p-4 md:p-8 pt-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64 mt-1" />
          </div>
        </div>
        <Skeleton className="h-[400px] w-full" /> 
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

  if (!repository || !currentOrganization) {
    return (
      <div className="flex flex-col items-center justify-center w-full min-h-[calc(100vh-100px)] p-4">
        <p className="text-lg text-muted-foreground">Repository or Organization data not found.</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href={`/organizations/${organizationId}/repositories`}>Back to Repositories</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="icon" asChild>
          <Link href={`/organizations/${currentOrganization.id}/repositories`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{repository.name}</h1>
          <p className="text-sm text-muted-foreground">
            In Organization: <Link href={`/organizations/${currentOrganization.id}`} className="hover:underline">{currentOrganization.name}</Link>
          </p>
        </div>
      </div>

      <EditRepositoryForm 
        organizationId={currentOrganization.id.toString()} 
        repository={repository} 
        getClientToken={getClientToken} 
        onSuccess={handleUpdateSuccess} 
      />

      {/* Optional: Display additional read-only info or related data here */}
      <Card className="mt-6">
        <CardHeader>
            <CardTitle>Additional Information</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
            <p><strong>Repository ID:</strong> {repository.id}</p>
            <p><strong>URL:</strong> <a href={repository.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{repository.url} <ExternalLink className="inline-block h-3 w-3 ml-1"/></a></p>
            <p><strong>Connection Status:</strong> {repository.status?.connection_successful ? <span className="text-green-600">Connected</span> : <span className="text-red-600">Error</span>}</p>
            {repository.secret && <p><strong>Current Secret:</strong> {repository.secret.name} ({repository.secret.type})</p>}
        </CardContent>
      </Card>
    </div>
  );
} 