"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { GitBranch, PlusCircle, ExternalLink, MoreHorizontal, Search, ArrowUpDown, ChevronDown, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useSession } from "next-auth/react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
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
import { getRepositories, getOrganization, type Repository, type Organization, type Project, getProjects } from "@/lib/api-core"
import { useOrganization } from "@/contexts/organization-context"
import { toast } from "@/components/ui/use-toast"
import { deleteRepositoryAction } from "@/app/actions/repositories/actions"
import { RepositoriesOverview } from "@/components/repositories/repositories-overview"

export default function OrganizationRepositoriesPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { data: session, status: sessionStatus } = useSession()
  const { selectedOrganization: contextOrg, setSelectedOrganization: setContextSelectedOrg } = useOrganization()

  const organizationId = params.id

  const [repositories, setRepositories] = useState<Repository[]>([])
  const [projectsInOrg, setProjectsInOrg] = useState<Project[]>([])
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(contextOrg)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const getClientToken = useCallback(async () => {
    if (!session?.accessToken) {
      toast({ title: "Authentication Error", description: "Access token not available.", variant: "destructive" })
      throw new Error("Access token not available")
    }
    return session.accessToken
  }, [session])

  useEffect(() => {
    // Clear previous data when organizationId changes to prevent flicker of old data
    setRepositories([]);
    setProjectsInOrg([]);
    // We might want to set currentOrganization to null too, 
    // but contextOrg and subsequent fetch should handle it.
    // However, for a cleaner loading state, it can be beneficial.
    // setCurrentOrganization(null); 

    async function fetchData() {
      if (!organizationId || sessionStatus !== "authenticated") {
        if (sessionStatus === "loading") return
        setLoading(false)
        setError(sessionStatus !== "authenticated" ? "User not authenticated." : "Organization ID missing.")
        return
      }

      setLoading(true)
      setError(null)
      try {
        const token = await getClientToken()
        const numericOrgId = Number(organizationId)

        // Fetch organization if not in context or if IDs don't match
        if (!contextOrg || contextOrg.id.toString() !== organizationId) {
          const orgData = await getOrganization(numericOrgId, async () => token)
          setCurrentOrganization(orgData)
          setContextSelectedOrg(orgData)
        } else {
          setCurrentOrganization(contextOrg)
        }
        
        // Fetch repositories for this organization
        const repos = await getRepositories({ organization_id: numericOrgId }, async () => token)
        setRepositories(repos)

        // Fetch all projects in this organization
        const orgProjects = await getProjects(numericOrgId, async () => token);
        setProjectsInOrg(orgProjects);

      } catch (err: any) {
        console.error("Error fetching data:", err)
        setError(err.message || "An unexpected error occurred.")
        toast({ title: "Error Loading Page Data", description: err.message, variant: "destructive" })
      } finally {
        setLoading(false)
      }
    }
    if (sessionStatus === "unauthenticated") router.push("/login")
    else fetchData()
  }, [organizationId, sessionStatus, getClientToken, router, contextOrg, setContextSelectedOrg])

  if (loading || sessionStatus === "loading") {
    return (
      <div className="space-y-6 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-10" />
            <div><Skeleton className="h-8 w-48" /></div>
          </div>
          <Skeleton className="h-10 w-[280px]" />
        </div>
        <Skeleton className="h-[300px] w-full" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center w-full min-h-[calc(100vh-100px)] p-4">
        <p className="text-lg text-destructive text-center mb-4">{error}</p>
        <Button onClick={() => router.back()} variant="outline">Go Back</Button>
      </div>
    )
  }
  
  if (!currentOrganization) {
    return (
      <div className="flex flex-col items-center justify-center w-full min-h-[calc(100vh-100px)] p-4">
        <p className="text-lg text-muted-foreground">Organization data not found.</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href={`/organizations`}>Back to Organizations</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="icon" asChild>
          <Link href={`/organizations/${currentOrganization.id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Repositories in {currentOrganization.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            View and manage repositories for this organization.
          </p>
        </div>
      </div>
      <RepositoriesOverview 
        repositories={repositories} 
        organizationId={currentOrganization.id.toString()} 
        projectsInOrg={projectsInOrg}
        isLoading={loading}
        pageTitle={`Repositories in ${currentOrganization.name}`}
        pageDescription={`Manage repositories for ${currentOrganization.name}.`}
      />
    </div>
  )
}
