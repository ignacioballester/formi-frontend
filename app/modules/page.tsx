"use client"

import { useState, useEffect } from "react"
import { Package, GitBranch, Folder, PlusCircle } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { getModules, getOrganizations, type Module, type Organization } from "@/lib/api"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function ModulesPage() {
  const [loading, setLoading] = useState(true)
  const [modules, setModules] = useState<Module[]>([])
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null)

  useEffect(() => {
    async function fetchOrganizations() {
      try {
        const orgs = await getOrganizations()
        setOrganizations(orgs)

        if (orgs.length > 0) {
          setSelectedOrg(orgs[0].id.toString())
        }
      } catch (error) {
        console.error("Error fetching organizations:", error)
      }
    }

    fetchOrganizations()
  }, [])

  useEffect(() => {
    async function fetchModules() {
      if (!selectedOrg) return

      try {
        setLoading(true)
        const orgId = Number.parseInt(selectedOrg)
        const modulesData = await getModules({ organization_id: orgId })
        setModules(modulesData)
      } catch (error) {
        console.error("Error fetching modules:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchModules()
  }, [selectedOrg])

  const handleOrgChange = (value: string) => {
    setSelectedOrg(value)
  }

  return (
    <div className="ml-72 flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Modules</h2>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Module
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <span className="text-sm font-medium">Organization:</span>
        <Select value={selectedOrg || ""} onValueChange={handleOrgChange}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select organization" />
          </SelectTrigger>
          <SelectContent>
            {organizations.map((org) => (
              <SelectItem key={org.id} value={org.id.toString()}>
                {org.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          Array(6)
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
        ) : modules.length > 0 ? (
          modules.map((module) => (
            <Card key={module.id}>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Package className="mr-2 h-5 w-5" />
                  {module.name}
                </CardTitle>
                <CardDescription>ID: {module.id}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center text-sm">
                  <GitBranch className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>
                    {module.git_reference.branch ||
                      module.git_reference.tag ||
                      module.git_reference.commit ||
                      "Unknown reference"}
                  </span>
                </div>
                <div className="flex items-center text-sm">
                  <Folder className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>{module.working_directory || "/"}</span>
                </div>
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
                  <Link href={`/modules/${module.id}`}>View Details</Link>
                </Button>
              </CardFooter>
            </Card>
          ))
        ) : (
          <Card className="col-span-full">
            <CardHeader>
              <CardTitle>No Modules Found</CardTitle>
              <CardDescription>No modules found for the selected organization.</CardDescription>
            </CardHeader>
            <CardFooter>
              <Button className="w-full">
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Module
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  )
}
