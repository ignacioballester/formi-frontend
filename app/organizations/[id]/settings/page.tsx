"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { getOrganization, type Organization } from "@/lib/api"
import { useOrganization } from "@/contexts/organization-context"

export default function OrganizationSettingsPage() {
  const { id } = useParams<{ id: string }>()
  const { setSelectedOrganization } = useOrganization()
  const [loading, setLoading] = useState(true)
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const orgId = Number.parseInt(id as string)

        // Fetch organization details
        const org = await getOrganization(orgId)
        setOrganization(org)
        setSelectedOrganization(org)
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id, setSelectedOrganization])

  const handleSave = () => {
    setSaving(true)
    // Simulate API call
    setTimeout(() => {
      setSaving(false)
    }, 1000)
  }

  if (loading) {
    return (
      <div className="ml-72 flex-1 space-y-4 p-8 pt-6">
        <Skeleton className="h-10 w-1/4" />
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    )
  }

  return (
    <div className="ml-72 flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Organization Settings</h2>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
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
