"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Layers3, Package, GitBranch, Settings, AlertCircle, CheckCircle2, Clock, Loader2, XCircle } from "lucide-react"
import Link from "next/link"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  getOrganization,
  getProjects,
  getModules,
  getDeployments,
  type Organization,
  type Project,
  type Module,
  type Deployment,
} from "@/lib/api"
import { useOrganization } from "@/contexts/organization-context"

export default function OrganizationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { selectedOrganization, setSelectedOrganization } = useOrganization()
  const [loading, setLoading] = useState(true)
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [modules, setModules] = useState<Module[]>([])
  const [deployments, setDeployments] = useState<Deployment[]>([])

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const orgId = Number.parseInt(id as string)

        // Fetch organization details
        const orgResponse = await fetch(`/api/organizations/${orgId}`);
        if (!orgResponse.ok) {
          const errorData = await orgResponse.json().catch(() => ({ message: "Failed to fetch organization" }));
          throw new Error(errorData.message || `HTTP error! status: ${orgResponse.status}`);
        }
        const org = await orgResponse.json();

        setOrganization(org)
        setSelectedOrganization(org)

        // Fetch projects for this organization
        const projectsResponse = await fetch(`/api/organizations/${orgId}/projects`);
        if (!projectsResponse.ok) {
          const errorData = await projectsResponse.json().catch(() => ({ message: "Failed to fetch projects"}));
          throw new Error(errorData.message || `HTTP error! status: ${projectsResponse.status}`);
        }
        const projectsData = await projectsResponse.json();
        setProjects(projectsData)

        // Fetch modules for this organization
        const modulesResponse = await fetch(`/api/organizations/${orgId}/modules`);
        if (!modulesResponse.ok) {
          const errorData = await modulesResponse.json().catch(() => ({ message: "Failed to fetch modules"}));
          throw new Error(errorData.message || `HTTP error! status: ${modulesResponse.status}`);
        }
        const modulesData = await modulesResponse.json();
        setModules(modulesData)

        // Fetch deployments for each project
        const allDeployments: Deployment[] = []
        for (const project of projectsData) {
          const deploymentsResponse = await fetch(`/api/projects/${project.id}/deployments`);
          if (!deploymentsResponse.ok) {
            const errorData = await deploymentsResponse.json().catch(() => ({ message: `Failed to fetch deployments for project ${project.id}`}));
            console.error(`Error fetching deployments for project ${project.id}: ${errorData.message || deploymentsResponse.status}`);
            continue;
          }
          const projectDeployments = await deploymentsResponse.json();
          allDeployments.push(...projectDeployments)
        }
        setDeployments(allDeployments)
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id, setSelectedOrganization])

  const getStatusIcon = (status: Deployment["status"]) => {
    switch (status) {
      case "active":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case "creating":
      case "updating":
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
      case "inactive":
        return <Clock className="h-5 w-5 text-yellow-500" />
      case "destroying":
        return <Loader2 className="h-5 w-5 text-orange-500 animate-spin" />
      case "failed":
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusBadge = (status: Deployment["status"]) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500">Active</Badge>
      case "creating":
        return <Badge className="bg-blue-500">Creating</Badge>
      case "updating":
        return <Badge className="bg-blue-500">Updating</Badge>
      case "inactive":
        return <Badge className="bg-yellow-500">Inactive</Badge>
      case "destroying":
        return <Badge className="bg-orange-500">Destroying</Badge>
      case "failed":
        return <Badge className="bg-red-500">Failed</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const getModuleName = (moduleId: number) => {
    const module = modules.find((m) => m.id === moduleId)
    return module ? module.name : `Module #${moduleId}`
  }

  const getProjectName = (projectId: number) => {
    const project = projects.find((p) => p.id === projectId)
    return project ? project.name : `Project #${projectId}`
  }

  if (loading) {
    return (
      <div className="space-y-4 p-8 pt-6">
        <Skeleton className="h-10 w-1/4" />
        <Skeleton className="h-6 w-1/3" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array(4)
            .fill(0)
            .map((_, i) => (
              <Skeleton key={i} className="h-40 w-full" />
            ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-8 pt-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">{organization?.name}</h2>
        <p className="text-muted-foreground">{organization?.description}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projects</CardTitle>
            <Layers3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projects.length}</div>
          </CardContent>
          <CardFooter>
            <Button asChild variant="ghost" className="w-full">
              <Link href={`/organizations/${id}/projects`}>View All Projects</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Modules</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{modules.length}</div>
          </CardContent>
          <CardFooter>
            <Button asChild variant="ghost" className="w-full">
              <Link href={`/organizations/${id}/modules`}>View All Modules</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Repositories</CardTitle>
            <GitBranch className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
          </CardContent>
          <CardFooter>
            <Button asChild variant="ghost" className="w-full">
              <Link href={`/organizations/${id}/repositories`}>View Repositories</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Settings</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Organization</div>
          </CardContent>
          <CardFooter>
            <Button asChild variant="ghost" className="w-full">
              <Link href={`/organizations/${id}/settings`}>Configure</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>

      <Tabs defaultValue="deployments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="deployments">Recent Deployments</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="modules">Modules</TabsTrigger>
        </TabsList>

        <TabsContent value="deployments" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {deployments.length > 0 ? (
              deployments.map((deployment) => (
                <Card key={`${deployment.id}-${deployment.version}`}>
                  <CardHeader className="pb-2">
                    <CardTitle>{getModuleName(deployment.module_id)}</CardTitle>
                    <CardDescription>Project: {getProjectName(deployment.project_id)}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col gap-1">
                        {getStatusBadge(deployment.status)}
                        <span className="text-xs text-muted-foreground">Version: {deployment.version}</span>
                      </div>
                      {getStatusIcon(deployment.status)}
                    </div>
                    {deployment.status === "failed" && (
                      <div className="mt-2 rounded-md bg-red-50 p-2 text-xs text-red-800 dark:bg-red-950 dark:text-red-300">
                        {deployment.status_details.error_message || "An error occurred during deployment"}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="col-span-full">
                <CardHeader>
                  <CardTitle>No Deployments Found</CardTitle>
                  <CardDescription>There are no active deployments in this organization.</CardDescription>
                </CardHeader>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="projects" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projects.length > 0 ? (
              projects.map((project) => (
                <Card key={project.id}>
                  <CardHeader>
                    <CardTitle>{project.name}</CardTitle>
                    <CardDescription>ID: {project.id}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {deployments.filter((d) => d.project_id === project.id).length} deployments
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button asChild className="w-full">
                      <Link href={`/organizations/${id}/projects/${project.id}`}>View Details</Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))
            ) : (
              <Card className="col-span-full">
                <CardHeader>
                  <CardTitle>No Projects Found</CardTitle>
                  <CardDescription>There are no projects in this organization.</CardDescription>
                </CardHeader>
                <CardFooter>
                  <Button className="w-full">Create Project</Button>
                </CardFooter>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="modules" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {modules.length > 0 ? (
              modules.map((module) => (
                <Card key={module.id}>
                  <CardHeader>
                    <CardTitle>{module.name}</CardTitle>
                    <CardDescription>ID: {module.id}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <Badge variant={module.status.configuration_valid ? "default" : "destructive"}>
                        Config: {module.status.configuration_valid ? "Valid" : "Invalid"}
                      </Badge>
                      <Badge variant={module.status.terraform_valid ? "default" : "destructive"}>
                        Terraform: {module.status.terraform_valid ? "Valid" : "Invalid"}
                      </Badge>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button asChild className="w-full">
                      <Link href={`/organizations/${id}/modules/${module.id}`}>View Details</Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))
            ) : (
              <Card className="col-span-full">
                <CardHeader>
                  <CardTitle>No Modules Found</CardTitle>
                  <CardDescription>There are no modules in this organization.</CardDescription>
                </CardHeader>
                <CardFooter>
                  <Button className="w-full">Create Module</Button>
                </CardFooter>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
