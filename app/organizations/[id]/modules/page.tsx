"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useSession } from "next-auth/react"

import { Button } from "@/components/ui/button"
import { useOrganization } from "@/contexts/organization-context"
import { getModules, getOrganization, getProjects, type Module, type Organization, type Project } from "@/lib/api"
import { toast } from "@/components/ui/use-toast"
import { deleteModuleAction } from "@/app/actions/modules/actions"
import { ModulesOverview } from "@/components/modules/modules-overview"
import { Skeleton } from "@/components/ui/skeleton"

export default function OrganizationModulesPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { selectedOrganization: contextOrg, setSelectedOrganization: setContextSelectedOrg } = useOrganization()
  const { data: session, status: sessionStatus } = useSession()

  const organizationId = params.id

  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(contextOrg)
  const [modules, setModules] = useState<Module[]>([])
  const [projectsInOrg, setProjectsInOrg] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const getClientToken = useCallback(async () => {
    if (!session?.accessToken) {
      toast({ title: "Authentication Error", description: "Access token not available.", variant: "destructive" })
      throw new Error("Access token not available")
    }
    return session.accessToken
  }, [session])

  useEffect(() => {
    async function fetchData() {
      if (!organizationId || sessionStatus !== "authenticated") {
        if (sessionStatus === "loading") return
        setIsLoading(false)
        setError(sessionStatus !== "authenticated" ? "User not authenticated." : "Organization ID missing.")
        return
      }

      setIsLoading(true)
      setError(null)
      try {
        const token = await getClientToken()
        const numericOrgId = Number(organizationId)

        if (!contextOrg || contextOrg.id.toString() !== organizationId) {
          const orgData = await getOrganization(numericOrgId, async () => token)
          setCurrentOrganization(orgData)
          setContextSelectedOrg(orgData)
        } else {
          setCurrentOrganization(contextOrg)
        }

        const [fetchedModules, fetchedProjects] = await Promise.all([
          getModules({ organization_id: numericOrgId }, async () => token),
          getProjects(numericOrgId, async () => token) // Fetch projects in the org
        ])
        
        setModules(fetchedModules)
        setProjectsInOrg(fetchedProjects)

      } catch (err: any) {
        console.error("Error fetching organization modules data:", err)
        setError(err.message || "An unexpected error occurred.")
        toast({ title: "Error Loading Page Data", description: err.message, variant: "destructive" })
      } finally {
        setIsLoading(false)
      }
    }
    if (sessionStatus === "unauthenticated") router.push("/login")
    else fetchData()
  }, [organizationId, sessionStatus, getClientToken, router, contextOrg, setContextSelectedOrg])

  const handleDeleteModule = async (moduleId: number) => {
    const moduleToDelete = modules.find(m => m.id === moduleId)
    if (!moduleToDelete) return false

    try {
      const token = await getClientToken()
      const result = await deleteModuleAction(moduleId, token)
      if (result.success) {
        toast({ title: "Module Deleted", description: `Module "${moduleToDelete.name}" has been deleted.` })
        setModules(prevModules => prevModules.filter(m => m.id !== moduleId))
        return true
      } else {
        throw new Error(result.error || "Failed to delete module.")
      }
    } catch (error: any) {
      console.error("Error deleting module:", error)
      toast({ title: "Error Deleting Module", description: error.message, variant: "destructive" })
      return false
    }
  }
  
  if (isLoading || sessionStatus === "loading") {
    return (
      <div className="space-y-6 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-10" />
            <div><Skeleton className="h-8 w-48" /></div>
          </div>
          <Skeleton className="h-10 w-[200px]" /> 
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
            Modules in {currentOrganization.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            View and manage modules for this organization.
          </p>
        </div>
      </div>
      <ModulesOverview 
        modules={modules}
        organizationId={currentOrganization.id.toString()}
        projectsInOrg={projectsInOrg} // Pass the fetched projects
        isLoading={isLoading} // Pass the loading state from this page
        onDeleteModule={handleDeleteModule}
        pageTitle={`Modules in ${currentOrganization.name}`}
        pageDescription={`Manage modules associated with ${currentOrganization.name} or its projects.`}
      />
    </div>
  )
}
