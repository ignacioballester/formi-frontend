"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Layers3, PlusCircle, MoreHorizontal, Search, ArrowUpDown, ChevronDown } from "lucide-react"
import Link from "next/link"
import { useSession } from "next-auth/react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getProjects, getOrganization, type Project, type Organization } from "@/lib/api-core"
import { useOrganization } from "@/contexts/organization-context"
import { toast } from "@/components/ui/use-toast"


export default function OrganizationProjectsPage() {
  const { id: organizationId } = useParams<{ id: string }>()
  const router = useRouter()
  const { setSelectedOrganization } = useOrganization()
  const { data: session, status: sessionStatus } = useSession()

  const [loading, setLoading] = useState(true)
  const [projects, setProjects] = useState<Project[]>([])
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<"name" | "id">("name")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")

  const getClientToken = async () => {
    if (!session?.accessToken) {
      toast({
        title: "Authentication Error",
        description: "Access token not available. Please log in again.",
        variant: "destructive",
      })
      throw new Error("Access token not available")
    }
    return session.accessToken
  }

  useEffect(() => {
    async function fetchData() {
      if (!organizationId || sessionStatus !== "authenticated" || !session?.accessToken) {
        if (sessionStatus === "authenticated" && !session?.accessToken) {
            toast({ title: "Token Error", description: "Session authenticated but access token is missing.", variant: "destructive" });
        }
        setLoading(false);
        return
      }
      
      setLoading(true)
      try {
        const orgId = Number.parseInt(organizationId as string)

        const orgData = await getOrganization(orgId, getClientToken)
        setOrganization(orgData)
        setSelectedOrganization(orgData)

        const projectsData = await getProjects(orgId, getClientToken)
        setProjects(projectsData)

      } catch (error: any) {
        console.error("Error fetching data:", error)
        toast({
          title: "Error Fetching Data",
          description: error.message || "Could not load organization or project details.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }
    
    if (sessionStatus === "loading") {
      setLoading(true);
      return;
    }
    
    if (sessionStatus === "unauthenticated") {
      setLoading(false);
      toast({ title: "Unauthorized", description: "Please log in to view projects.", variant: "destructive" });
      router.push("/login");
      return;
    }

    fetchData()
  }, [organizationId, setSelectedOrganization, router, sessionStatus, session?.accessToken])

  const handleProjectSelect = (project: Project) => {
    router.push(`/projects/${project.id}`)
  }

  const toggleSort = (column: "name" | "id") => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortBy(column)
      setSortOrder("asc")
    }
  }

  const filteredAndSortedProjects = projects
    .filter((project) => project.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "name") {
        return sortOrder === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
      } else { // Sort by ID
        return sortOrder === "asc" ? a.id - b.id : b.id - a.id
      }
    })
  
  if (sessionStatus === "loading" || (loading && projects.length === 0 && !organization) ) {
    return (
        <div className="space-y-4 p-8 pt-6">
            <Skeleton className="h-8 w-1/2 mb-4" />
            <Skeleton className="h-10 w-full mb-6" />
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-1/4" />
                    <Skeleton className="h-4 w-1/2 mt-1" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-10 w-full mb-4" />
                    <Skeleton className="h-40 w-full" />
                </CardContent>
            </Card>
        </div>
    );
  }

  if (!organization && !loading) {
    return (
        <div className="space-y-4 p-8 pt-6">
            <p>Organization not found or could not be loaded.</p>
            <Button onClick={() => router.push('/organizations')}>Back to Organizations</Button>
        </div>
    );
  }


  return (
    <div className="space-y-6 p-8 pt-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {organization ? `${organization.name} - Projects` : "Projects"}
          </h1>
          <p className="text-muted-foreground">Manage projects within this organization.</p>
        </div>
        <Button asChild>
          <Link href={`/projects/new?orgId=${organizationId}`}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Project
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>All Projects</CardTitle>
          <CardDescription>
            View and manage all projects for {organization ? organization.name : "this organization"}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search projects..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                disabled={sessionStatus !== 'authenticated'}
              />
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={`${sortBy}-${sortOrder}`}
                onValueChange={(value) => {
                  const [newSortBy, newSortOrder] = value.split("-") as ["name" | "id", "asc" | "desc"]
                  setSortBy(newSortBy)
                  setSortOrder(newSortOrder)
                }}
                disabled={sessionStatus !== 'authenticated'}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                  <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                  <SelectItem value="id-asc">ID (Ascending)</SelectItem>
                  <SelectItem value="id-desc">ID (Descending)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-6 rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px]">
                    <Button
                      variant="ghost"
                      className="flex items-center gap-1 p-0 font-medium"
                      onClick={() => toggleSort("name")}
                      disabled={sessionStatus !== 'authenticated'}
                    >
                      Name
                      {sortBy === "name" ? (
                        sortOrder === "asc" ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4 rotate-180" />
                        )
                      ) : (
                        <ArrowUpDown className="h-4 w-4 opacity-50" />
                      )}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      className="flex items-center gap-1 p-0 font-medium"
                      onClick={() => toggleSort("id")}
                      disabled={sessionStatus !== 'authenticated'}
                    >
                      ID
                      {sortBy === "id" ? (
                        sortOrder === "asc" ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4 rotate-180" />
                        )
                      ) : (
                        <ArrowUpDown className="h-4 w-4 opacity-50" />
                      )}
                    </Button>
                  </TableHead>
                  <TableHead className="hidden md:table-cell">Organization</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessionStatus === 'authenticated' && filteredAndSortedProjects.length > 0 ? (
                  filteredAndSortedProjects.map((project) => (
                    <TableRow
                      key={project.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleProjectSelect(project)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-sm bg-muted"> 
                            <Layers3 className="h-5 w-5 text-foreground" /> 
                          </div>
                          <span className="font-medium">{project.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{project.id}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        {organization?.name || `Org #${project.organization_id}`}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                handleProjectSelect(project)
                              }}
                            >
                              View Details
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : sessionStatus === 'authenticated' && projects.length === 0 && !loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      No projects found for {organization?.name}.
                      <Button variant="link" asChild className="ml-2">
                        <Link href={`/projects/new?orgId=${organizationId}`}>
                          Create one now.
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ) : null }
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
