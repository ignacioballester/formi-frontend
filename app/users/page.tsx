"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { PlusCircle, Search, MoreHorizontal, UserCircle, ExternalLink } from "lucide-react"

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
import { getIamUsers, type User as IAMUser } from "@/lib/api-iam"

export default function UsersPage() {
  const { data: session, status: sessionStatus } = useSession()
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<IAMUser[]>([])
  const [error, setError] = useState<string | null>(null)

  // Keycloak URL - replace with your actual Keycloak URL
  const KEYCLOAK_USERS_URL = "https://keycloak.example.com/admin/users"

  useEffect(() => {
    async function fetchUsers() {
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
        const usersData = await getIamUsers()
        setUsers(usersData)
      } catch (err: any) {
        console.error("Error fetching users:", err)
        setError(err.message || "Failed to fetch users.")
        setUsers([])
      } finally {
        setLoading(false)
      }
    }

    if (sessionStatus === "authenticated" && session?.accessToken) {
      fetchUsers()
    } else if (sessionStatus === "unauthenticated") {
      setLoading(false)
      setError("User is not authenticated.")
    } else {
      setLoading(true)
    }
  }, [session, sessionStatus])

  const filteredUsers = users.filter(
    (user) =>
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.email && user.email.toLowerCase().includes(searchQuery.toLowerCase())),
  )

  const redirectToKeycloakUsers = () => {
    window.open(KEYCLOAK_USERS_URL, "_blank")
  }

  return (
    <div className="space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Users</h2>
        <div className="flex gap-2">
          <Button onClick={redirectToKeycloakUsers}>
            <ExternalLink className="mr-2 h-4 w-4" />
            Manage in Keycloak
          </Button>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search users..."
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
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
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
            ) : !error && filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <TableRow key={user.username}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <UserCircle className="h-8 w-8" />
                      <div>
                        <div className="font-medium">{user.username}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{user.email || "No email provided"}</TableCell>
                  <TableCell>
                    <Badge variant="default" className="bg-green-500">
                      Active
                    </Badge>
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
                        <DropdownMenuItem>View User</DropdownMenuItem>
                        <DropdownMenuItem>Edit User</DropdownMenuItem>
                        <DropdownMenuItem>Manage Roles</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">Deactivate User</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  {error ? "Could not load users." : "No users found."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
