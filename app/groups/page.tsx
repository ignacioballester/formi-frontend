"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { PlusCircle, Search, MoreHorizontal, Users, ExternalLink } from "lucide-react"

import { Button } from "@/components/ui/button"
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
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { getGroups, type IAMGroup } from "@/lib/iam"

export default function GroupsPage() {
  const { data: session, status: sessionStatus } = useSession()
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [groups, setGroups] = useState<IAMGroup[]>([])
  const [error, setError] = useState<string | null>(null)

  // Keycloak URL - replace with your actual Keycloak URL
  const KEYCLOAK_GROUPS_URL = "https://keycloak.example.com/admin/groups"

  useEffect(() => {
    async function fetchGroups() {
      if (sessionStatus === "loading" || !session?.accessToken) {
        if (sessionStatus !== "loading") {
          setLoading(false)
          setError("Authentication token not available.")
        }
        return
      }

      try {
        setLoading(true)
        setError(null)
        const groupsData = await getGroups(session.accessToken)
        setGroups(groupsData)
      } catch (err: any) {
        console.error("Error fetching groups:", err)
        setError(err.message || "Failed to fetch groups.")
        setGroups([])
      } finally {
        setLoading(false)
      }
    }

    if (sessionStatus === "authenticated" && session?.accessToken) {
      fetchGroups()
    } else if (sessionStatus === "unauthenticated") {
      setLoading(false)
      setError("User is not authenticated.")
    } else {
      setLoading(true)
    }
  }, [session, sessionStatus])

  const filteredGroups = groups.filter((group) => group.name.toLowerCase().includes(searchQuery.toLowerCase()))

  const redirectToKeycloakGroups = () => {
    window.open(KEYCLOAK_GROUPS_URL, "_blank")
  }

  return (
    <div className="space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Groups</h2>
        <div className="flex gap-2">
          <Button onClick={redirectToKeycloakGroups}>
            <ExternalLink className="mr-2 h-4 w-4" />
            Manage in Keycloak
          </Button>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Group
          </Button>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search groups..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {error && <p className="text-red-500 text-center py-4">Error: {error}</p>}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Group</TableHead>
              <TableHead>ID</TableHead>
              <TableHead>Members</TableHead>
              <TableHead className="w-[70px]"></TableHead>
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
                      <Skeleton className="h-4 w-40" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-8 w-8" />
                    </TableCell>
                  </TableRow>
                ))
            ) : !error && filteredGroups.length > 0 ? (
              filteredGroups.map((group) => (
                <TableRow key={group.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Users className="h-8 w-8" />
                      <div>
                        <div className="font-medium">{group.name}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{group.id}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{group.members?.length || 0} members</Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>View Group</DropdownMenuItem>
                        <DropdownMenuItem>Edit Group</DropdownMenuItem>
                        <DropdownMenuItem>Manage Members</DropdownMenuItem>
                        <DropdownMenuItem>Manage Roles</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">Delete Group</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  {error ? "Could not load groups." : "No groups found."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
