"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
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
} from "@/lib/iam";
import {
  getRoleAssignmentsOnResource,
  getRolesByResourceType,
  getUsers,
  getGroups,
  createRoleAssignment,
  removeRoleAssignment,
  getUserByUsername,
  getGroupByName,
  isUserAuthorized
} from "@/lib/iam";

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
    <div className="space-y-4 p-8 pt-6">
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
  const { data: session, status: sessionStatus } = useSession();
  const [loading, setLoading] = useState(true);
  const [roleAssignments, setRoleAssignments] = useState<RoleAssignment[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedRoleAssignment, setSelectedRoleAssignment] = useState<RoleAssignment | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const resourceName = "enterprise-1";

  const fetchAssignments = async () => {
    if (!session?.accessToken || !resourceName) return;
    setLoading(true);
    try {
      setApiError(null);
      const assignments = await getRoleAssignmentsOnResource(resourceName, session.accessToken);
      setRoleAssignments(assignments);
    } catch (error: any) {
      console.error("Error fetching role assignments:", error);
      setApiError(error.message || "Failed to fetch role assignments");
      toast({
        title: "Error",
        description: error.message || "Failed to fetch role assignments",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (sessionStatus === "authenticated" && session?.accessToken) {
      fetchAssignments();
    } else if (sessionStatus === "unauthenticated"){
      setLoading(false);
      setApiError("User is not authenticated.");
    } else {
      setLoading(true); // session is loading
    }
  }, [session, sessionStatus]);

  const handleDeleteRoleAssignment = async (assignment: RoleAssignment) => {
    if (!session?.accessToken) {
      toast({ title: "Error", description: "Authentication token not available.", variant: "destructive" });
      return;
    }
    try {
      console.log("[RoleAssignmentsTab] handleDeleteRoleAssignment: removing assignment:", assignment);
      await removeRoleAssignment(assignment, session.accessToken);
      toast({ title: "Success", description: "Role assignment removed." });
      fetchAssignments(); // Refetch after delete
    } catch (error: any) {
      console.error("Error removing role assignment:", error);
      toast({ title: "Error", description: error.message || "Failed to remove role assignment.", variant: "destructive" });
    }
    setIsDeleteDialogOpen(false);
    setSelectedRoleAssignment(null);
  };
  
  const confirmDelete = (assignment: RoleAssignment) => {
    setSelectedRoleAssignment(assignment);
    setIsDeleteDialogOpen(true);
  };
  
  const filteredAssignments = roleAssignments.filter(
    (ra) =>
      ra.role_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ra.principal_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ra.principal_type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Role Assignments</CardTitle>
          <CardDescription>Manage who has which roles on the enterprise.</CardDescription>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button><PlusCircle className="mr-2 h-4 w-4" /> Add Assignment</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add Role Assignment</DialogTitle>
              <DialogDescription>
                Assign a role to a user or group for the resource: {resourceName}
              </DialogDescription>
            </DialogHeader>
            <AddRoleAssignmentForm resourceName={resourceName} onSuccess={() => { setIsAddDialogOpen(false); fetchAssignments(); }} />
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input type="search" placeholder="Search assignments..." className="pl-8" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
        {apiError && <p className="text-red-500">Error: {apiError}</p>}
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
              ) : filteredAssignments.length > 0 ? (
                filteredAssignments.map((assignment, index) => (
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
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this role assignment? 
              Role: {selectedRoleAssignment?.role_name} for {selectedRoleAssignment?.principal_type} {selectedRoleAssignment?.principal_id}.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={() => selectedRoleAssignment && handleDeleteRoleAssignment(selectedRoleAssignment)}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

function AddRoleAssignmentForm({
  resourceName,
  onSuccess,
}: {
  resourceName: string;
  onSuccess: (assignment: RoleAssignment) => void;
}) {
  const { data: session, status: sessionStatus } = useSession();
  const [principalType, setPrincipalType] = useState<"user" | "group">("user");
  const [principalIdentifier, setPrincipalIdentifier] = useState(""); // Username or Group Name
  const [roleName, setRoleName] = useState("");
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [suggestions, setSuggestions] = useState<(User | Group)[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchFormData() {
      if (!session?.accessToken) return;
      setLoadingRoles(true);
      try {
        const roles = await getRolesByResourceType("enterprise", session.accessToken);
        setAvailableRoles(roles);
      } catch (error) { 
        console.error("Failed to fetch roles", error);
        setFormError("Failed to load roles.");
      } finally {
        setLoadingRoles(false);
      }
    }
    if (sessionStatus === "authenticated") fetchFormData();
  }, [session, sessionStatus]);

  useEffect(() => {
    async function fetchPrincipals() {
      console.log("[AddRoleAssignmentForm] fetchPrincipals called. principalIdentifier:", principalIdentifier, "session?.accessToken exists:", !!session?.accessToken);
      if (!session?.accessToken) {
        console.log("[AddRoleAssignmentForm] fetchPrincipals exiting early: accessToken missing.");
        setSuggestions([]);
        return;
      }
      setLoadingSuggestions(true);
      console.log("[AddRoleAssignmentForm] fetchPrincipals: attempting to fetch", principalType);
      try {
        let fetchedPrincipals: (User | Group)[] = [];
        if (principalType === "user") {
          const users = await getUsers(session.accessToken);
          console.log("users", users);
          fetchedPrincipals = users;
        } else {
          const groups = await getGroups(session.accessToken);
          console.log("groups", groups);
          fetchedPrincipals = groups;
        }

        if (principalIdentifier) {
          if (principalType === "user") {
            setSuggestions(fetchedPrincipals.filter(p => (p as User).username.toLowerCase().includes(principalIdentifier.toLowerCase())));
          } else {
            setSuggestions(fetchedPrincipals.filter(p => (p as Group).name.toLowerCase().includes(principalIdentifier.toLowerCase())));
          }
        } else {
          setSuggestions(fetchedPrincipals);
        }

      } catch (error) {
        console.error(`Failed to fetch ${principalType}s:`, error);
        setSuggestions([]);
      } finally {
        setLoadingSuggestions(false);
      }
    }
    const debounce = setTimeout(() => {
        console.log("[AddRoleAssignmentForm] useEffect for fetchPrincipals. sessionStatus:", sessionStatus, "principalIdentifier:", principalIdentifier);
        if (sessionStatus === "authenticated") {
            console.log("[AddRoleAssignmentForm] useEffect: session is authenticated, calling fetchPrincipals.");
            fetchPrincipals();
        } else {
            console.log("[AddRoleAssignmentForm] useEffect: session NOT authenticated or principalIdentifier empty, NOT calling fetchPrincipals.");
        }
    }, 300);
    return () => clearTimeout(debounce);
  }, [principalIdentifier, principalType, session, sessionStatus]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.accessToken) {
      setFormError("Authentication token not available.");
      return;
    }
    if (!roleName || !principalIdentifier) {
        setFormError("All fields are required.");
        return;
    }
    
    let principalId = "";
    setFormError(null);

    try {
        // Resolve principalIdentifier to principalId
        if (principalType === "user") {
            const user = await getUserByUsername(principalIdentifier, session.accessToken);
            if (!user || !user.id) throw new Error("User not found.");
            principalId = user.id;
        } else {
            const group = await getGroupByName(principalIdentifier, session.accessToken);
            if (!group || !group.id) throw new Error("Group not found.");
            principalId = group.id;
        }

        const assignment: Omit<RoleAssignment, 'resource_name'> & { resource_name: string } = {
            resource_name: resourceName,
            principal_id: principalId, 
            principal_type: principalType,
            role_name: roleName,
        };
        await createRoleAssignment(assignment as RoleAssignment, session.accessToken);
        toast({ title: "Success", description: "Role assignment created." });
        onSuccess(assignment as RoleAssignment);
    } catch (error: any) {
        console.error("Error creating role assignment:", error);
        setFormError(error.message || "Failed to create role assignment.");
        toast({ title: "Error", description: error.message || "Failed to create assignment.", variant: "destructive" });
    }
  };
  
  const redirectToKeycloak = (type: "user" | "group") => {
    const baseUrl = "https://keycloak.example.com/admin/master/console/#/"; // Adjust to your Keycloak admin console URL
    window.open(type === "user" ? `${baseUrl}users` : `${baseUrl}groups`, "_blank");
  };

  return <form onSubmit={handleSubmit} className="space-y-4">
    <DialogHeader>
      <DialogTitle>Add Role Assignment</DialogTitle>
      <DialogDescription>
        Assign a role to a user or group for the resource: {resourceName}
      </DialogDescription>
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
            setPrincipalIdentifier("")
          }}
          disabled={loadingRoles}
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
            value={principalIdentifier}
            onValueChange={(value) => {
              setPrincipalIdentifier(value);
            }}
            disabled={loadingSuggestions || loadingRoles}
          >
            <SelectTrigger className="flex-1">
              <SelectValue placeholder={`Select ${principalType}`} />
            </SelectTrigger>
            <SelectContent>
              {principalType === "user" && suggestions.length > 0 && (
                <SelectGroup>
                  <SelectLabel>Users</SelectLabel>
                  {suggestions.map((item) => {
                    const user = item as User;
                    return (
                      <SelectItem key={user.id || user.username} value={user.username}>
                        {user.username}
                      </SelectItem>
                    );
                  })}
                </SelectGroup>
              )}
              {principalType === "group" && suggestions.length > 0 && (
                <SelectGroup>
                  <SelectLabel>Groups</SelectLabel>
                  {suggestions.map((item) => {
                    const group = item as Group;
                    return (
                      <SelectItem key={group.id || group.name} value={group.name}>
                        {group.name}
                      </SelectItem>
                    );
                  })}
                </SelectGroup>
              )}
              {(loadingSuggestions || (suggestions.length === 0 && principalIdentifier)) && (
                <SelectItem value="loading" disabled>
                  {loadingSuggestions ? "Loading..." : "No results found."}
                </SelectItem>
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
          value={roleName}
          onValueChange={setRoleName}
          disabled={loadingRoles}
        >
          <SelectTrigger className="col-span-3">
            <SelectValue placeholder="Select role" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Enterprise Roles</SelectLabel>
              {availableRoles.map((role) => (
                <SelectItem key={role.name} value={role.name}>
                  {role.display_name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
    </div>
    {formError && <p className="text-sm text-red-500 col-span-4 text-center">{formError}</p>}
    <DialogFooter>
      <Button type="submit" disabled={loadingRoles || loadingSuggestions}>
        {(loadingRoles || loadingSuggestions) ? "Loading Data..." : "Create Assignment"}
      </Button>
    </DialogFooter>
  </form>;
}
