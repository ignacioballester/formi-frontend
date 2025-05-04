"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { GitBranch, PlusCircle, ExternalLink } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { getRepositories, getOrganization, type Repository, type Organization } from "@/lib/api"
import { useOrganization } from "@/contexts/organization-context"

export default function OrganizationRepositoriesPage() {
  const { id } = useParams<{ id: string }>()
  const { setSelectedOrganization } = useOrganization()
  const [loading, setLoading] = useState(true)
  const [repositories, setRepositories] = useState<Repository[]>([])
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

        // Fetch repositories for this organization
        const reposData = await getRepositories({ organization_id: orgId })
        setRepositories(reposData)
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
        <h2 className="text-3xl font-bold tracking-tight">Repositories</h2>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Repository
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
        ) : repositories.length > 0 ? (
          repositories.map((repo) => (
            <Card key={repo.id}>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <GitBranch className="mr-2 h-5 w-5" />
                  {repo.name}
                </CardTitle>
                <CardDescription>ID: {repo.id}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center text-sm">
                  <ExternalLink className="mr-2 h-4 w-4 text-muted-foreground" />
                  <a
                    href={repo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    {repo.url}
                  </a>
                </div>
                <div>
                  <Badge variant={repo.status.connection_successful ? "default" : "destructive"}>
                    {repo.status.connection_successful ? "Connected" : "Connection Failed"}
                  </Badge>
                </div>
              </CardContent>
              <CardFooter>
                <Button asChild className="w-full">
                  <Link href={`/organizations/${id}/repositories/${repo.id}`}>View Details</Link>
                </Button>
              </CardFooter>
            </Card>
          ))
        ) : (
          <Card className="col-span-full">
            <CardHeader>
              <CardTitle>No Repositories Found</CardTitle>
              <CardDescription>No repositories found for this organization.</CardDescription>
            </CardHeader>
            <CardFooter>
              <Button className="w-full">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Repository
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  )
}
