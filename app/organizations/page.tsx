"use client"

import { useState, useEffect } from "react"
import { Building2, PlusCircle, MoreHorizontal, Search, ArrowUpDown, ChevronDown } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { type Organization } from "@/lib/api"
import { useOrganization } from "@/contexts/organization-context"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function OrganizationsPage() {
  const [loading, setLoading] = useState(true)
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<"name" | "id">("name")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const { setSelectedOrganization } = useOrganization()
  const router = useRouter()

  useEffect(() => {
    async function fetchOrganizations() {
      try {
        setLoading(true)
        const response = await fetch('/api/organizations');
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `Error fetching organizations: ${response.status}`);
        }
        const orgs = await response.json();
        setOrganizations(orgs)
      } catch (error: any) {
        console.error("Error fetching organizations:", error.message ? error.message : error)
      } finally {
        setLoading(false)
      }
    }

    fetchOrganizations()
  }, [])

  const handleOrganizationSelect = (org: Organization) => {
    setSelectedOrganization(org)
    router.push(`/organizations/${org.id}`)
  }

  const toggleSort = (column: "name" | "id") => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortBy(column)
      setSortOrder("asc")
    }
  }

  // Filter and sort organizations
  const filteredAndSortedOrganizations = organizations
    .filter(
      (org) =>
        org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (org.description && org.description.toLowerCase().includes(searchQuery.toLowerCase())),
    )
    .sort((a, b) => {
      if (sortBy === "name") {
        return sortOrder === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
      } else {
        return sortOrder === "asc" ? a.id - b.id : b.id - a.id
      }
    })

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Organizations</h1>
          <p className="text-muted-foreground">Manage and organize your infrastructure deployments</p>
        </div>
        <Button asChild>
          <Link href="/organizations/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Organization
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>All Organizations</CardTitle>
          <CardDescription>View and manage all your organizations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search organizations..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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
                  <TableHead className="hidden md:table-cell">Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array(5)
                    .fill(0)
                    .map((_, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Skeleton className="h-8 w-8 rounded-full" />
                            <Skeleton className="h-4 w-32" />
                          </div>
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-8" />
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Skeleton className="h-4 w-48" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-6 w-16" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-8 w-8" />
                        </TableCell>
                      </TableRow>
                    ))
                ) : filteredAndSortedOrganizations.length > 0 ? (
                  filteredAndSortedOrganizations.map((org) => (
                    <TableRow
                      key={org.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleOrganizationSelect(org)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                            <Building2 className="h-5 w-5 text-primary" />
                          </div>
                          <span className="font-medium">{org.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{org.id}</TableCell>
                      <TableCell className="hidden max-w-md truncate md:table-cell">
                        {org.description || "No description provided"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="bg-status-active/10 text-status-active border-status-active/20"
                        >
                          Active
                        </Badge>
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
                                handleOrganizationSelect(org)
                              }}
                            >
                              View Organization
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => e.stopPropagation()}>Edit Organization</DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => e.stopPropagation()}>Manage Members</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive" onClick={(e) => e.stopPropagation()}>
                              Delete Organization
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      No organizations found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
