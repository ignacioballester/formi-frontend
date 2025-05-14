"use client";

import Link from "next/link";
import { PlusCircle, MoreHorizontal, Eye, Edit, PlayCircle, Repeat, Trash2 } from "lucide-react";
import { Deployment, Module } from "@/lib/api"; // Assuming Module type is needed for display
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from 'date-fns'; // For formatting dates if available

interface DeploymentsOverviewProps {
  deployments: Deployment[];
  projectId: string;
  modules?: Module[]; // Optional: to display module names instead of just IDs
  isLoading?: boolean;
  pageTitle?: string;
  pageDescription?: string;
  onRedeploy?: (deploymentId: number) => Promise<boolean>;
  onUpdate?: (deploymentId: number) => Promise<boolean>; // Or navigate to update page
  onDestroy?: (deploymentId: number) => Promise<boolean>;
}

const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
  switch (status?.toLowerCase()) {
    case "active":
      return "default"; // Greenish in default theme
    case "creating":
    case "updating":
      return "secondary"; // Bluish/Grayish
    case "inactive":
      return "outline"; // Grayish
    case "destroying":
        return "outline";
    case "failed":
      return "destructive"; // Reddish
    default:
      return "outline";
  }
};

export function DeploymentsOverview({
  deployments,
  projectId,
  modules = [],
  isLoading,
  pageTitle = "Deployments",
  pageDescription = "View and manage your module deployments.",
  onRedeploy,
  onUpdate,
  onDestroy,
}: DeploymentsOverviewProps) {

  const getModuleName = (moduleId: number) => {
    const module = modules.find(m => m.id === moduleId);
    return module ? module.name : `ID: ${moduleId}`;
  };

  const getNewDeploymentLink = () => {
    return `/projects/${projectId}/deployments/new`;
  };

  const getDeploymentDetailsLink = (deploymentId: number) => {
    return `/projects/${projectId}/deployments/${deploymentId}`;
  };
  
  const getRunDetailsLink = (runId: number | undefined) => {
    if (!runId) return '#'; // Or some other placeholder
    return `/projects/${projectId}/runs/${runId}`;
  };


  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <CardTitle className="flex items-center">
            <PlayCircle className="mr-2 h-5 w-5 text-primary" />
            {pageTitle}
          </CardTitle>
          <CardDescription>{pageDescription}</CardDescription>
        </div>
        <Button asChild size="sm">
          <Link href={getNewDeploymentLink()}>
            <PlusCircle className="mr-2 h-4 w-4" /> New Deployment
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">ID</TableHead>
              <TableHead className="w-[80px]">Version</TableHead>
              <TableHead>Module</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Run ID</TableHead>
              {/* <TableHead>Created At</TableHead> */}
              {/* <TableHead>Updated At</TableHead> */}
              <TableHead className="w-[100px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array(3).fill(0).map((_, i) => (
                <TableRow key={`skeleton-deployment-${i}`}>
                  <TableCell><Skeleton className="h-5 w-12" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-12" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-3/4" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                  {/* <TableCell><Skeleton className="h-5 w-32" /></TableCell> */}
                  {/* <TableCell><Skeleton className="h-5 w-32" /></TableCell> */}
                  <TableCell className="text-right"><Skeleton className="h-8 w-8 float-right" /></TableCell>
                </TableRow>
              ))
            ) : deployments.length > 0 ? (
              deployments.map((dep) => (
                <TableRow key={dep.id}>
                  <TableCell className="font-mono text-xs">{dep.id}</TableCell>
                  <TableCell className="font-mono text-xs">v{dep.version}</TableCell>
                  <TableCell>{getModuleName(dep.module_id)}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(dep.status)}>{dep.status || "N/A"}</Badge>
                  </TableCell>
                  <TableCell>
                    {dep.status_details?.last_run_id ? (
                        <Link href={getRunDetailsLink(dep.status_details.last_run_id)} className="font-mono text-xs hover:underline text-blue-600">
                            {dep.status_details.last_run_id}
                        </Link>
                    ) : '-'}
                  </TableCell>
                  {/* <TableCell>{dep.created_at ? format(new Date(dep.created_at), "PPpp") : "-"}</TableCell> */}
                  {/* <TableCell>{dep.updated_at ? format(new Date(dep.updated_at), "PPpp") : "-"}</TableCell> */}
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Deployment Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                          <Link href={getDeploymentDetailsLink(dep.id)}>
                            <Eye className="mr-2 h-4 w-4" /> View Details
                          </Link>
                        </DropdownMenuItem>
                        {onUpdate && (
                            <DropdownMenuItem onClick={() => onUpdate(dep.id)}>
                                <Edit className="mr-2 h-4 w-4" /> Update/Modify
                            </DropdownMenuItem>
                        )}
                        {onRedeploy && (
                            <DropdownMenuItem onClick={() => onRedeploy(dep.id)}>
                                <Repeat className="mr-2 h-4 w-4" /> Redeploy
                            </DropdownMenuItem>
                        )}
                         {onDestroy && (
                           <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => onDestroy(dep.id)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                                <Trash2 className="mr-2 h-4 w-4" /> Destroy
                            </DropdownMenuItem>
                           </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No deployments found for this project.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
} 