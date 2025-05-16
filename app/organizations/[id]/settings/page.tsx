"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { useSession } from "next-auth/react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/use-toast"
import { getOrganization, type Organization } from "@/lib/api-core"
import { useOrganization } from "@/contexts/organization-context"
import { SecretsManager } from "@/components/secrets/secrets-manager"

export default function OrganizationSettingsPage() {
  const { id } = useParams<{ id: string }>()
  const { setSelectedOrganization } = useOrganization()
  const { data: session, status: sessionStatus } = useSession()
  const [loading, setLoading] = useState(true)
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [saving, setSaving] = useState(false)

  const getClientToken = async (): Promise<string> => {
    if (sessionStatus === "loading") {
      await new Promise<void>((resolve) => {
        const checkSession = () => {
          if (sessionStatus !== "loading") {
            resolve();
          } else {
            setTimeout(checkSession, 50);
          }
        };
        checkSession();
      });
    }

    if (sessionStatus === "authenticated" && session?.accessToken) {
      return session.accessToken as string;
    } else {
      toast({
        title: "Authentication Error",
        description: "Access token not available. User may not be authenticated or session is invalid.",
        variant: "destructive",
      });
      throw new Error("Access token not available");
    }
  };

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const orgId = Number.parseInt(id as string)
        
        const orgDetails = await getOrganization(orgId, getClientToken)

        setOrganization(orgDetails)
        setSelectedOrganization(orgDetails)
      } catch (error) {
        console.error("Error fetching data:", error)
        toast({
            title: "Error fetching organization",
            description: error instanceof Error ? error.message : "Could not load organization details.",
            variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }
    
    if (sessionStatus === "authenticated" || sessionStatus === "loading") {
        fetchData()
    } else if (sessionStatus === "unauthenticated") {
        toast({
            title: "Unauthorized",
            description: "You need to be logged in to view organization settings.",
            variant: "destructive",
        });
        setLoading(false);
    }

  }, [id, setSelectedOrganization, sessionStatus, session?.accessToken])

  const handleSave = async () => {
    setSaving(true)
    try {
        toast({ title: "Simulated Save", description: "Save functionality not fully implemented."})
        setTimeout(() => {
          setSaving(false)
        }, 1000)
    } catch (error) {
        toast({ title: "Error saving", description: error instanceof Error ? error.message : "Could not save changes.", variant: "destructive" })
        setSaving(false)
    }
  }

  if (loading || sessionStatus === "loading") {
    return (
      <div className="space-y-4 p-8 pt-6">
        <Skeleton className="h-10 w-1/4" />
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    )
  }

  if (sessionStatus === "unauthenticated") {
    return (
      <div className="space-y-4 p-8 pt-6">
        <p className="text-center text-muted-foreground">Please log in to manage organization settings.</p>
      </div>
    );
  }
  
  if (!organization) {
    return (
      <div className="space-y-4 p-8 pt-6">
        <p className="text-center text-red-500">Failed to load organization details. Please try again later.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Organization Settings</h2>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="secrets">Secrets</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Manage your organization's general settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="org-name">Organization Name</Label>
                <Input id="org-name" defaultValue={organization?.name} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="org-description">Description</Label>
                <Input id="org-description" defaultValue={organization?.description} />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="members" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Organization Members</CardTitle>
              <CardDescription>Manage members and their roles within this organization</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Member management functionality will be implemented here.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="secrets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Secrets Management</CardTitle>
              <CardDescription>
                Manage secrets for this organization. Secrets listed here are typically organization-wide.
                Project-specific secrets might be managed within the project settings if applicable.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {organization && (
                <SecretsManager
                  organizationId={organization.id}
                  getClientToken={getClientToken}
                  
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Integrations</CardTitle>
              <CardDescription>Manage third-party integrations for this organization</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Integration management functionality will be implemented here.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Settings</CardTitle>
              <CardDescription>Manage advanced settings for this organization</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-md border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
                <h4 className="text-sm font-medium text-red-800 dark:text-red-300">Danger Zone</h4>
                <p className="mt-1 text-sm text-red-700 dark:text-red-400">
                  Deleting this organization will permanently remove all associated projects, modules, and deployments.
                </p>
                <Button variant="destructive" className="mt-4">
                  Delete Organization
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
