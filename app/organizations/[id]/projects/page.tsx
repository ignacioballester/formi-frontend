"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Layers3, PlusCircle } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { getProjects, getOrganization, type Project, type Organization } from "@/lib/api"
import { useOrganization } from "@/contexts/organization-context"

export default function OrganizationProjectsPage() {
  const { id } = useParams<{ id: string }>()
  const { setSelectedOrganization } = useOrganization()
  const [loading, setLoading] = useState(true)
  const [projects, setProjects] = useState<Project[]>([])
  const [organization, setOrganization] = useState<Organization | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const orgId = Number.parseInt(id as string)

        // Fetch organization details
        const org = await getOrganization(orgId)
        setOrganization(org)
        setSelectedOrganization(org)

        // Fetch projects for this organization
        const projectsData = await getProjects(orgId)
        setProjects(projectsData)
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id, setSelectedOrganization])

  return (
    <div className="ml-72 flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Projects</h2>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Project
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          Array(3)
            .fill(0)
            .map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-1/2" />
                  <Skeleton className="h-4 w-full" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
                <CardFooter>
                  <Skeleton className="h-10 w-full" />
                </CardFooter>
              </Card>
            ))
        ) : projects.length > 0 ? (
          projects.map((project) => (
            <Card key={project.id}>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Layers3 className="mr-2 h-5 w-5" />
                  {project.name}
                </CardTitle>
                <CardDescription>ID: {project.id}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Organization: {organization?.name || `Organization #${project.organization_id}`}
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
              <CardDescription>Get started by creating your first project in this organization.</CardDescription>
            </CardHeader>
            <CardFooter>
              <Button className="w-full">
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Project
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  )
}
