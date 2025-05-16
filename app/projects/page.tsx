"use client"

import { useState, useEffect, useCallback, useMemo } from "react";
import { FolderKanban, PlusCircle, Search, ArrowUpDown, ChevronDown, MoreHorizontal, X, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { type Organization, type Project, getOrganizations, getProjects } from "@/lib/api-core";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { toast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils"; // Assuming you have a utility for class names
import { useOrganization } from "@/contexts/organization-context"; // Import useOrganization

export default function ProjectsPage() {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const { setSelectedOrganization, setSelectedProject } = useOrganization(); // Get context setters

  const [allOrganizations, setAllOrganizations] = useState<Organization[]>([]);
  const [selectedOrgIds, setSelectedOrgIds] = useState<Set<number>>(new Set());
  const [projects, setProjects] = useState<Project[]>([]);
  
  const [loadingOrganizations, setLoadingOrganizations] = useState(true);
  const [loadingProjects, setLoadingProjects] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "id" | "organization">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const getClientToken = useCallback(async () => {
    if (!session?.accessToken) {
      toast({ title: "Authentication Error", description: "Access token not available.", variant: "destructive" });
      throw new Error("Access token not available");
    }
    return session.accessToken;
  }, [session]);

  useEffect(() => {
    async function fetchOrgs() {
      if (sessionStatus !== "authenticated") {
        if (sessionStatus === "loading") return;
        setLoadingOrganizations(false);
        return;
      }
      setLoadingOrganizations(true);
      try {
        const token = await getClientToken();
        const orgs = await getOrganizations(async () => token);
        setAllOrganizations(orgs);
      } catch (error: any) {
        console.error("Error fetching organizations:", error);
        toast({ title: "Error Fetching Organizations", description: error.message, variant: "destructive" });
      } finally {
        setLoadingOrganizations(false);
      }
    }
    if (sessionStatus === "unauthenticated") router.push("/login");
    else fetchOrgs();
  }, [sessionStatus, getClientToken, router]);

  useEffect(() => {
    async function fetchProjs() {
      if (selectedOrgIds.size === 0 || sessionStatus !== "authenticated") {
        setProjects([]);
        return;
      }
      setLoadingProjects(true);
      try {
        const token = await getClientToken();
        const projectPromises = Array.from(selectedOrgIds).map(orgId => getProjects(orgId, async () => token));
        const projectsByOrg = await Promise.all(projectPromises);
        const flattenedProjects = projectsByOrg.flat();
        setProjects(flattenedProjects);
      } catch (error: any) {
        console.error("Error fetching projects:", error);
        toast({ title: "Error Fetching Projects", description: error.message, variant: "destructive" });
        setProjects([]);
      } finally {
        setLoadingProjects(false);
      }
    }
    fetchProjs();
  }, [selectedOrgIds, sessionStatus, getClientToken]);

  const getOrganizationName = (orgId: number) => {
    return allOrganizations.find(org => org.id === orgId)?.name || `Org ID: ${orgId}`;
  };

  const toggleSort = (column: "name" | "id" | "organization") => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  const filteredAndSortedProjects = useMemo(() => projects
    .filter(proj => proj.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "name") {
        return sortOrder === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
      } else if (sortBy === "id") {
        return sortOrder === "asc" ? a.id - b.id : b.id - a.id;
      } else if (sortBy === "organization") {
        const orgNameA = getOrganizationName(a.organization_id).toLowerCase();
        const orgNameB = getOrganizationName(b.organization_id).toLowerCase();
        return sortOrder === "asc" ? orgNameA.localeCompare(orgNameB) : orgNameB.localeCompare(orgNameA);
      }
      return 0;
    }), [projects, searchQuery, sortBy, sortOrder, getOrganizationName]);

  const handleOrgSelection = (orgId: number) => {
    setSelectedOrgIds(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(orgId)) {
        newSelection.delete(orgId);
      } else {
        newSelection.add(orgId);
      }
      return newSelection;
    });
  };

  if (sessionStatus === "loading" || (loadingOrganizations && allOrganizations.length === 0)) {
    return (
      <div className="space-y-6 p-4 md:p-8">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-8 w-1/4" />
        <Card>
          <CardHeader><Skeleton className="h-8 w-1/3" /></CardHeader>
          <CardContent><Skeleton className="h-40 w-full" /></CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">View and manage projects across your organizations.</p>
        </div>
        <Button asChild>
          <Link href="/projects/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Project
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>All Projects</CardTitle>
          <CardDescription>
            {selectedOrgIds.size > 0 
              ? `Showing projects for ${selectedOrgIds.size} selected organization(s).` 
              : "Select organizations to view their projects."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Organization Multi-Select Filter */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto justify-start">
                  <FolderKanban className="mr-2 h-4 w-4" />
                  Filter Organizations
                  {selectedOrgIds.size > 0 && (
                    <Badge variant="secondary" className="ml-2 rounded-sm px-1 font-normal">
                      {selectedOrgIds.size} selected
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search organizations..." />
                  <CommandList>
                    <CommandEmpty>No organizations found.</CommandEmpty>
                    <CommandGroup>
                      {allOrganizations.map((org) => (
                        <CommandItem
                          key={org.id}
                          onSelect={() => handleOrgSelection(org.id)}
                          className="cursor-pointer"
                        >
                          <div className={cn(
                            "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                            selectedOrgIds.has(org.id) ? "bg-primary text-primary-foreground" : "opacity-50 [&_svg]:invisible"
                          )}>
                            <Check className={cn("h-4 w-4")} />
                          </div>
                          <span>{org.name}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                    {selectedOrgIds.size > 0 && (
                      <>
                        <CommandSeparator />
                        <CommandGroup>
                          <CommandItem
                            onSelect={() => setSelectedOrgIds(new Set())}
                            className="justify-center text-center cursor-pointer text-sm text-muted-foreground hover:!text-accent-foreground"
                          >
                            Clear selection
                          </CommandItem>
                        </CommandGroup>
                      </>
                    )}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            {/* Search Projects Input */}
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search projects..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                disabled={selectedOrgIds.size === 0 && projects.length === 0}
              />
            </div>
          </div>

          <div className="mt-6 rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px]">
                    <Button variant="ghost" className="p-0" onClick={() => toggleSort("name")}>
                      Project Name {sortBy === 'name' && (sortOrder === 'asc' ? <ChevronDown className="h-4 w-4" /> : <ChevronDown className="h-4 w-4 rotate-180" />)}
                      {sortBy !== 'name' && <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />}
                    </Button>
                  </TableHead>
                  <TableHead className="w-[250px]">
                    <Button variant="ghost" className="p-0" onClick={() => toggleSort("organization")}>
                      Organization {sortBy === 'organization' && (sortOrder === 'asc' ? <ChevronDown className="h-4 w-4" /> : <ChevronDown className="h-4 w-4 rotate-180" />)}
                      {sortBy !== 'organization' && <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />}
                    </Button>
                  </TableHead>
                  <TableHead className="w-[100px]">
                    <Button variant="ghost" className="p-0" onClick={() => toggleSort("id")}>
                      ID {sortBy === 'id' && (sortOrder === 'asc' ? <ChevronDown className="h-4 w-4" /> : <ChevronDown className="h-4 w-4 rotate-180" />)}
                      {sortBy !== 'id' && <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />}
                    </Button>
                  </TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(loadingOrganizations || loadingProjects) && selectedOrgIds.size > 0 ? (
                  Array(3).fill(0).map((_, i) => (
                    <TableRow key={`skeleton-${i}`}>
                      <TableCell><Skeleton className="h-5 w-4/5" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-3/5" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-1/2" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredAndSortedProjects.length > 0 && selectedOrgIds.size > 0 ? (
                  filteredAndSortedProjects.map((project) => (
                    <TableRow 
                      key={project.id} 
                      onClick={() => {
                        const parentOrg = allOrganizations.find(org => org.id === project.organization_id);
                        if (parentOrg) {
                          setSelectedOrganization(parentOrg);
                          setSelectedProject(project);
                          router.push(`/projects/${project.id}`);
                        } else {
                          toast({title: "Error", description: "Parent organization not found for this project.", variant: "destructive"});
                        }
                      }}
                      className="cursor-pointer hover:bg-muted/50"
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-sm bg-muted text-muted-foreground">
                            <FolderKanban className="h-5 w-5" />
                          </div>
                          <span className="font-medium">{project.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{getOrganizationName(project.organization_id)}</TableCell>
                      <TableCell>{project.id}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Project Actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem 
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent row click
                                const parentOrg = allOrganizations.find(org => org.id === project.organization_id);
                                if (parentOrg) {
                                  setSelectedOrganization(parentOrg);
                                  setSelectedProject(project);
                                  router.push(`/projects/${project.id}`);
                                } else {
                                  toast({title: "Error", description: "Parent org not found.", variant: "destructive"});
                                }
                              }}
                            >
                              View Details
                            </DropdownMenuItem>
                            {/* Add Edit/Delete when ready */}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      {selectedOrgIds.size === 0 ? "Please select one or more organizations to view projects." : "No projects found for the selected organization(s)."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 