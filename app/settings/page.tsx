"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { PlusCircle, Search, Trash2, UserCircle, Users, ExternalLink } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import type {
  Organization,
  Project,
  // Repository, // Assuming Repository type might come from lib/api.ts or elsewhere if needed
} from "@/lib/api";
import type {
  RoleAssignment,
  IAMRole as Role, // Import with alias
  IAMUser as User, // Import with alias
  IAMGroup as Group // Import with alias
} from "@/lib/iam-api";
import {
  getRoleAssignmentsOnResource,
  getRolesByResourceType,
  getUsers,
  getGroups,
  createRoleAssignment,
  removeRoleAssignment,
  checkAuthorization
} from "@/lib/iam-api";

export default function SettingsPage() {
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("general")

  const handleSave = () => {
    setSaving(true)
    // Simulate API call
    setTimeout(() => {
      setSaving(false)
    }, 1000)
  }

  return (
    <div className="ml-72 flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
      </div>

      <Tabs defaultValue="general" className="space-y-4" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="api">API</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="role-assignments">Role Assignments</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Manage your general application settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="app-name">Application Name</Label>
                <Input id="app-name" defaultValue="Formi" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="default-org">Default Organization</Label>
                <Input id="default-org" defaultValue="1" />
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="dark-mode" />
                <Label htmlFor="dark-mode">Enable Dark Mode</Label>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>API Settings</CardTitle>
              <CardDescription>Manage your API keys and access tokens</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="api-key">API Key</Label>
                <div className="flex space-x-2">
                  <Input id="api-key" defaultValue="••••••••••••••••••••••••••••••" readOnly />
                  <Button variant="outline">Show</Button>
                  <Button variant="outline">Regenerate</Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="api-url">API URL</Label>
                <Input id="api-url" defaultValue="/api/v1" />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>Configure how you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive email notifications for important events</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Deployment Alerts</Label>
                  <p className="text-sm text-muted-foreground">Get notified when deployments succeed or fail</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>System Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive notifications about system updates</p>
                </div>
                <Switch />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Manage your security preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Two-Factor Authentication</Label>
                  <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
                </div>
                <Switch />
              </div>
              <div className="space-y-2">
                <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
                <Input id="session-timeout" type="number" defaultValue="30" />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>API Access Logging</Label>
                  <p className="text-sm text-muted-foreground">Log all API access attempts</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="role-assignments" className="space-y-4">
          <RoleAssignmentsTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function RoleAssignmentsTab() {
  const [loading, setLoading] = useState(true)
  const [roleAssignments, setRoleAssignments] = useState<RoleAssignment[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedRoleAssignment, setSelectedRoleAssignment] = useState<RoleAssignment | null>(null)

  const resourceName = "enterprise-1" // Hardcoded resource name as per requirements

  useEffect(() => {
    async function fetchRoleAssignments() {
      try {
        setLoading(true)
        const assignments = await getRoleAssignmentsOnResource(resourceName)
        setRoleAssignments(assignments)
      } catch (error) {
        console.error("Error fetching role assignments:", error)
        toast({
          title: "Error",
          description: "Failed to fetch role assignments",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchRoleAssignments()
  }, [])

  const filteredRoleAssignments = roleAssignments.filter(
    (assignment) =>
      assignment.principal_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      assignment.role_name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleDeleteRoleAssignment = async (assignment: RoleAssignment) => {
    try {
      await removeRoleAssignment(assignment)
      setRoleAssignments(
        roleAssignments.filter(
          (a) =>
            !(
              a.resource_name === assignment.resource_name &&
              a.principal_id === assignment.principal_id &&
              a.principal_type === assignment.principal_type &&
              a.role_name === assignment.role_name
            ),
        ),
      )
      toast({
        title: "Role assignment removed",
        description: "The role assignment has been successfully removed.",
      })
    } catch (error) {
      console.error("Error removing role assignment:", error)
      toast({
        title: "Error",
        description: "Failed to remove role assignment",
        variant: "destructive",
      })
    } finally {
      setIsDeleteDialogOpen(false)
      setSelectedRoleAssignment(null)
    }
  }

  const confirmDelete = (assignment: RoleAssignment) => {
    setSelectedRoleAssignment(assignment)
    setIsDeleteDialogOpen(true)
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle>Role Assignments</CardTitle>
            <CardDescription>Manage role assignments for enterprise-1 resource</CardDescription>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Role Assignment
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <AddRoleAssignmentForm
                resourceName={resourceName}
                onSuccess={(newAssignment) => {
                  setRoleAssignments([...roleAssignments, newAssignment])
                  setIsAddDialogOpen(false)
                }}
              />
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search role assignments..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Principal</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Role</TableHead>
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
                          <Skeleton className="h-4 w-32" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-20" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-24" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-8 w-8" />
                        </TableCell>
                      </TableRow>
                    ))
                ) : filteredRoleAssignments.length > 0 ? (
                  filteredRoleAssignments.map((assignment, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {assignment.principal_type === "user" ? (
                            <UserCircle className="h-5 w-5" />
                          ) : (
                            <Users className="h-5 w-5" />
                          )}
                          <span>{assignment.principal_id}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{assignment.principal_type === "user" ? "User" : "Group"}</Badge>
                      </TableCell>
                      <TableCell>{assignment.role_name}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => confirmDelete(assignment)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-100"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      No role assignments found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this role assignment? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedRoleAssignment && handleDeleteRoleAssignment(selectedRoleAssignment)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function AddRoleAssignmentForm({
  resourceName,
  onSuccess,
}: {
  resourceName: string
  onSuccess: (assignment: RoleAssignment) => void
}) {
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [roles, setRoles] = useState<Role[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [principalType, setPrincipalType] = useState<"user" | "group">("user")
  const [selectedPrincipalId, setSelectedPrincipalId] = useState("")
  const [selectedRoleName, setSelectedRoleName] = useState("")

  // Keycloak URLs - replace with your actual Keycloak URLs
  const KEYCLOAK_ADMIN_URL = "https://keycloak.example.com/admin/"
  const KEYCLOAK_USERS_URL = `${KEYCLOAK_ADMIN_URL}users`
  const KEYCLOAK_GROUPS_URL = `${KEYCLOAK_ADMIN_URL}groups`

  useEffect(() => {
    async function fetchFormData() {
      try {
        setLoading(true)
        const [rolesData, usersData, groupsData] = await Promise.all([
          getRolesByResourceType("enterprise"),
          getUsers(),
          getGroups(),
        ])
        setRoles(rolesData)
        setUsers(usersData)
        setGroups(groupsData)
      } catch (error) {
        console.error("Error fetching form data:", error)
        toast({
          title: "Error",
          description: "Failed to load form data",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchFormData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedPrincipalId || !selectedRoleName) {
      toast({
        title: "Validation Error",
        description: "Please select both a principal and a role",
        variant: "destructive",
      })
      return
    }

    const newAssignment: RoleAssignment = {
      resource_name: resourceName,
      principal_id: selectedPrincipalId,
      principal_type: principalType,
      role_name: selectedRoleName,
    }

    try {
      setSubmitting(true)
      await createRoleAssignment(newAssignment)
      toast({
        title: "Role assignment created",
        description: "The role assignment has been successfully created.",
      })
      onSuccess(newAssignment)
    } catch (error) {
      console.error("Error creating role assignment:", error)
      toast({
        title: "Error",
        description: "Failed to create role assignment",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const redirectToKeycloak = (type: "user" | "group") => {
    const url = type === "user" ? KEYCLOAK_USERS_URL : KEYCLOAK_GROUPS_URL
    window.open(url, "_blank")
  }

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>Add Role Assignment</DialogTitle>
        <DialogDescription>Assign a role to a user or group for the {resourceName} resource.</DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="principal-type" className="text-right">
            Principal Type
          </Label>
          <Select
            value={principalType}
            onValueChange={(value: "user" | "group") => {
              setPrincipalType(value)
              setSelectedPrincipalId("")
            }}
            disabled={loading}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="user">User</SelectItem>
              <SelectItem value="group">Group</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="principal-id" className="text-right">
            Principal
          </Label>
          <div className="col-span-3 flex gap-2">
            <Select
              value={selectedPrincipalId}
              onValueChange={setSelectedPrincipalId}
              disabled={loading}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder={`Select ${principalType}`} />
              </SelectTrigger>
              <SelectContent>
                {principalType === "user" ? (
                  <SelectGroup>
                    <SelectLabel>Users</SelectLabel>
                    {users.map((user) => (
                      <SelectItem key={user.username} value={user.username}>
                        {user.username}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ) : (
                  <SelectGroup>
                    <SelectLabel>Groups</SelectLabel>
                    {groups.filter(group => group.id)
                      .map((group) => (
                      <SelectItem key={group.id!} value={group.id!}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                )}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => redirectToKeycloak(principalType)}
              title={`Manage ${principalType}s in Keycloak`}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="role-name" className="text-right">
            Role
          </Label>
          <Select
            value={selectedRoleName}
            onValueChange={setSelectedRoleName}
            disabled={loading}
          >
            <SelectTrigger className="col-span-3">
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Enterprise Roles</SelectLabel>
                {roles.map((role) => (
                  <SelectItem key={role.name} value={role.name}>
                    {role.display_name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>
      <DialogFooter>
        <Button type="submit" disabled={loading || submitting}>
          {submitting ? "Creating..." : "Create Assignment"}
        </Button>
      </DialogFooter>
    </form>
  )
}
