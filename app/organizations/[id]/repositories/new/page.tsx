"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, GitFork } from "lucide-react"
import Link from "next/link"
import { useSession } from "next-auth/react"

import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { Organization, getOrganization } from "@/lib/api-core"
import { useOrganization } from "@/contexts/organization-context"
import { NewRepositoryForm } from "@/components/repositories/new-repository-form"
import { Skeleton } from "@/components/ui/skeleton"

export default function NewRepositoryPageOrg() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const organizationId = params.id
  const { setSelectedOrganization: setContextSelectedOrg } = useOrganization()
  const { data: session, status: sessionStatus } = useSession()

  const [organization, setOrganization] = useState<Organization | null>(null)
  const [isLoadingPage, setIsLoadingPage] = useState(true)

  const getClientToken = useCallback(async () => {
    if (!session?.accessToken) {
      toast({
        title: "Authentication Error",
        description: "Access token not available. Please log in again.",
        variant: "destructive",
      })
      throw new Error("Access token not available")
    }
    return session.accessToken
  }, [session])

  useEffect(() => {
    if (sessionStatus === "loading") {
      setIsLoadingPage(true)
      return
    }
    if (sessionStatus === "unauthenticated") {
      setIsLoadingPage(false)
      router.push("/login")
      return
    }
    if (sessionStatus === "authenticated" && organizationId) {
      setIsLoadingPage(true)
      getClientToken().then(token => {
        getOrganization(Number.parseInt(organizationId as string), async () => token)
          .then((org) => {
            setOrganization(org)
            setContextSelectedOrg(org) // Update context
          })
          .catch((error) => {
            console.error("Failed to fetch organization details:", error)
            toast({
              title: "Error",
              description: error.message || "Failed to load organization details.",
              variant: "destructive",
            })
            // router.push("/organizations") // Optionally redirect
          })
          .finally(() => setIsLoadingPage(false))
      }).catch(err => {
         setIsLoadingPage(false)
         toast({ title: "Authentication Error", description: "Could not retrieve access token.", variant: "destructive" })
      })
    } else {
      setIsLoadingPage(false)
      if (!organizationId) toast({ title: "Error", description: "Organization ID is missing.", variant: "destructive" })
    }
  }, [organizationId, setContextSelectedOrg, sessionStatus, router, getClientToken])

  const handleSuccess = (newRepoId: number) => {
    router.push(`/organizations/${organizationId}/repositories/${newRepoId}`)
  }

  if (isLoadingPage || sessionStatus === "loading") {
    return (
      <div className="flex flex-col items-center w-full min-h-screen p-4 md:p-8 pt-6 space-y-4">
        <Skeleton className="h-10 w-1/2 self-start" />
        <Skeleton className="h-96 w-full max-w-2xl" />
      </div>
    )
  }

  if (!organization) {
    return (
      <div className="flex flex-col items-center justify-center w-full min-h-screen p-4">
        <p className="text-lg text-muted-foreground">Organization details could not be loaded or ID is invalid.</p>
        <Button asChild variant="link" className="mt-4">
          <Link href="/organizations">Go to Organizations</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center w-full min-h-full pt-6">
      <div className="w-full max-w-2xl space-y-4">
        <div className="flex items-center gap-2 self-start">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/organizations/${organizationId}/repositories`}>
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back to Repositories</span>
            </Link>
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center">
            <GitFork className="mr-2 h-6 w-6" /> 
            Create Repository in {organization.name}
          </h1>
        </div>
        <NewRepositoryForm 
            organization={organization} 
            getClientToken={getClientToken} 
            onSuccess={handleSuccess} 
        />
      </div>
    </div>
  )
} 