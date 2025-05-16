"use client";

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { MoreHorizontal, PlusCircle, ArrowUpDown, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';
import { type Module, type Project } from '@/lib/api-core'; // Assuming Module and Project types are available
import { Skeleton } from '@/components/ui/skeleton';

interface ModulesOverviewProps {
  modules: Module[];
  organizationId: string;
  projectId?: string; // If present, viewing modules in project context
  projectsInOrg?: Project[]; // All projects in the org, for displaying scope names
  isLoading: boolean;
  pageTitle?: string;
  pageDescription?: string;
  onDeleteModule?: (moduleId: number) => void; // Callback for delete action
}

export function ModulesOverview({
  modules,
  organizationId,
  projectId,
  projectsInOrg = [],
  isLoading,
  pageTitle = "Modules",
  pageDescription = "View and manage modules.",
  onDeleteModule,
}: ModulesOverviewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortColumn, setSortColumn] = useState<keyof Module | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [scopeFilter, setScopeFilter] = useState<"all" | "organization" | "project">("all");

  const getProjectName = (pId: number | undefined): string | undefined => {
    if (!pId) return undefined;
    return projectsInOrg.find(p => p.id === pId)?.name;
  };

  const filteredModules = useMemo(() => {
    let filtered = modules;
    if (searchTerm) {
      filtered = filtered.filter(module =>
        module.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (scopeFilter !== "all") {
      if (scopeFilter === "organization") {
        filtered = filtered.filter(module => !module.project_id);
      } else if (scopeFilter === "project") {
        filtered = filtered.filter(module => !!module.project_id);
      }
    }
    return filtered;
  }, [modules, searchTerm, scopeFilter]);

  const sortedModules = useMemo(() => {
    if (!sortColumn) return filteredModules;
    return [...filteredModules].sort((a, b) => {
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];
      if (aValue === undefined || aValue === null) return sortDirection === "asc" ? 1 : -1;
      if (bValue === undefined || bValue === null) return sortDirection === "asc" ? -1 : 1;
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
      }
      return 0;
    });
  }, [filteredModules, sortColumn, sortDirection]);

  const handleSort = (column: keyof Module) => {
    if (sortColumn === column) {
      setSortDirection(prev => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const newModuleLink = projectId
    ? `/projects/${projectId}/modules/new`
    : `/organizations/${organizationId}/modules/new`;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <Skeleton className="h-10 w-1/3" /> 
            <Skeleton className="h-10 w-24" />
          </div>
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle>{pageTitle}</CardTitle>
            <CardDescription>{pageDescription}</CardDescription>
          </div>
          <Button asChild size="sm">
            <Link href={newModuleLink}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add New Module
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row justify-between items-center gap-2 mb-4">
          <Input
            placeholder="Search modules..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="max-w-xs"
          />
          { modules.some(m => m.project_id) && modules.some(m => !m.project_id) && (
            <Select value={scopeFilter} onValueChange={(value) => setScopeFilter(value as any)}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by scope" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Scopes</SelectItem>
                    <SelectItem value="organization">Organization-level</SelectItem>
                    <SelectItem value="project">Project-specific</SelectItem>
                </SelectContent>
            </Select>
          )}
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead onClick={() => handleSort("name")} className="cursor-pointer">
                  Name <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                </TableHead>
                <TableHead>Scope</TableHead>
                <TableHead>Repository</TableHead> {/* TODO: Fetch and display repo name */} 
                <TableHead>Git Reference</TableHead>
                <TableHead>Working Directory</TableHead>
                <TableHead>Status</TableHead> {/* TODO: Display module status based on module.status */} 
                <TableHead><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedModules.length > 0 ? (
                sortedModules.map(module => {
                  const editLink = projectId
                    ? `/projects/${projectId}/modules/${module.id}`
                    : `/organizations/${organizationId}/modules/${module.id}`;
                  const scopeDisplay = module.project_id 
                    ? `Project: ${getProjectName(module.project_id) || module.project_id}` 
                    : "Organization";
                  const gitRefDisplay = module.git_reference.branch 
                    ? `branch: ${module.git_reference.branch}` 
                    : module.git_reference.tag 
                    ? `tag: ${module.git_reference.tag}` 
                    : module.git_reference.commit 
                    ? `commit: ${module.git_reference.commit.substring(0,7)}` 
                    : "N/A";

                  return (
                    <TableRow key={module.id}>
                      <TableCell className="font-medium">{module.name}</TableCell>
                      <TableCell>{scopeDisplay}</TableCell>
                      <TableCell>{module.repository_id}</TableCell> {/* Placeholder */} 
                      <TableCell>{gitRefDisplay}</TableCell>
                      <TableCell><Badge variant="outline">{module.working_directory}</Badge></TableCell>
                      <TableCell>
                        {/* Placeholder for status - adapt based on actual status structure */}
                        {module.status?.configuration_valid && module.status?.terraform_valid 
                          ? <Badge variant="default">Valid</Badge> 
                          : <Badge variant="destructive">Invalid</Badge>}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem asChild>
                              <Link href={editLink}>Edit Module</Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => onDeleteModule ? onDeleteModule(module.id) : alert("Delete action not configured")}
                              className="text-red-600 hover:!text-red-600 hover:!bg-red-100"
                            >
                              Delete Module
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    No modules found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
} 