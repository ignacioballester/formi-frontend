"use client"

import Link from "next/link"
import { useState, useMemo } from "react"
import { PlusCircle, GitFork, MoreHorizontal, Edit, ExternalLink, Filter } from "lucide-react"
import { Repository, Project } from "@/lib/api"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

interface RepositoriesOverviewProps {
  repositories: Repository[]
  organizationId: string
  projectId?: string
  projectsInOrg?: Project[]
  isLoading?: boolean
  pageTitle?: string
  pageDescription?: string
}

export function RepositoriesOverview({
  repositories,
  organizationId,
  projectId,
  projectsInOrg = [],
  isLoading,
  pageTitle = "Repositories",
  pageDescription = "Manage your code repositories."
}: RepositoriesOverviewProps) {
  const [scopeFilter, setScopeFilter] = useState<"all" | "organization" | "project">("all")

  const getProjectName = (pId: number | undefined) => {
    if (!pId) return "N/A";
    const project = projectsInOrg.find(p => p.id === pId);
    return project ? project.name : `ID: ${pId}`;
  };

  const filteredRepositories = useMemo(() => {
    return repositories.filter(repo => {
      if (scopeFilter === "all") return true;
      const isProjectSpecific = repo.project_id !== null && repo.project_id !== undefined;
      if (scopeFilter === "organization") return !isProjectSpecific;
      if (scopeFilter === "project") {
        if (projectId) {
          return repo.project_id === Number(projectId);
        } else {
          return isProjectSpecific;
        }
      }
      return true;
    });
  }, [repositories, scopeFilter, projectId]);

  const getNewRepositoryLink = () => {
    return projectId 
      ? `/projects/${projectId}/repositories/new` 
      : `/organizations/${organizationId}/repositories/new`;
  };

  const getRepositoryLink = (repoId: number) => {
    return projectId
      ? `/projects/${projectId}/repositories/${repoId}`
      : `/organizations/${organizationId}/repositories/${repoId}`;
  };

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <CardTitle className="flex items-center">
            <GitFork className="mr-2 h-5 w-5" /> 
            {pageTitle}
          </CardTitle>
          <CardDescription>{pageDescription}</CardDescription>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <Select value={scopeFilter} onValueChange={(value: "all" | "organization" | "project") => setScopeFilter(value)}>
                <SelectTrigger className="w-full sm:w-[180px]">
                    <Filter className="mr-2 h-4 w-4 opacity-50" />
                    <SelectValue placeholder="Filter by scope" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Repositories</SelectItem>
                    <SelectItem value="organization">Organization-Level</SelectItem>
                    <SelectItem value="project">Project-Specific</SelectItem>
                </SelectContent>
            </Select>
            <Button asChild size="sm" className="w-full sm:w-auto">
                <Link href={getNewRepositoryLink()}>
                    <PlusCircle className="mr-2 h-4 w-4" /> New Repository
                </Link>
            </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>URL</TableHead>
              <TableHead>Scope</TableHead>
              <TableHead>Secret</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array(3).fill(0).map((_, i) => (
                <TableRow key={`skeleton-${i}`}>
                  <TableCell className="h-12 font-medium"><Skeleton className="h-5 w-3/4" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-1/2" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-1/2" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-1/2" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                </TableRow>
              ))
            ) : filteredRepositories.length > 0 ? (
              filteredRepositories.map((repo) => (
                <TableRow key={repo.id}>
                  <TableCell className="font-medium">{repo.name}</TableCell>
                  <TableCell>
                    <a href={repo.url} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center text-blue-600">
                      {repo.url.length > 40 ? `${repo.url.substring(0, 40)}...` : repo.url}
                      <ExternalLink className="ml-1 h-3 w-3" />
                    </a>
                  </TableCell>
                  <TableCell>
                    {repo.project_id ? (
                        <Badge variant="outline">Project: {getProjectName(repo.project_id)}</Badge>
                    ) : (
                        <Badge variant="secondary">Organization</Badge>
                    )}
                  </TableCell>
                  <TableCell>{repo.secret?.name || "-"}</TableCell>
                  <TableCell>
                    {repo.status?.connection_successful ? (
                      <Badge variant="default">Connected</Badge>
                    ) : (
                      <Badge variant="destructive">Error</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Repository Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                          <Link href={getRepositoryLink(repo.id)}>
                            <Edit className="mr-2 h-4 w-4" /> View/Edit
                          </Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No repositories found{scopeFilter !== 'all' ? ' for the selected scope' : ''}.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
} 