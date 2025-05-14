"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Eye, RefreshCw } from "lucide-react"; // Eye for view details, RefreshCw for refresh
import { type RunnerRun, type RunnerRunStatus } from "@/lib/api"; // Assuming these types will be defined in lib/api
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from 'date-fns'; // For formatting timestamps

interface RunsOverviewProps {
  runs: RunnerRun[];
  isLoading: boolean;
  error?: string | null;
  pageTitle: string;
  pageDescription: string;
  projectId?: string; // For linking back or context within run details link
  onRefresh?: () => void; // Optional refresh handler
}

// Helper function to determine badge variant based on status
const getStatusVariant = (status: RunnerRunStatus): "default" | "secondary" | "destructive" | "outline" => {
  switch (status) {
    case "completed": return "default";
    case "failed": return "destructive";
    case "running": return "secondary";
    case "pending": return "outline";
    case "claimed": return "secondary"; // Mapped to secondary as "warning" might not be standard
    default: return "outline";
  }
};

export function RunsOverview({
  runs,
  isLoading,
  error,
  pageTitle,
  pageDescription,
  projectId,
  onRefresh,
}: RunsOverviewProps) {

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <Skeleton className="h-7 w-1/2" />
              <Skeleton className="h-4 w-3/4 mt-2" />
            </div>
            <Skeleton className="h-8 w-8" /> {/* For refresh button */}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" /> // Table row skeleton
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{pageTitle}</CardTitle>
          <CardDescription>{pageDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">Error loading runs: {error}</p>
          {onRefresh && (
            <Button onClick={onRefresh} className="mt-4">
              <RefreshCw className="mr-2 h-4 w-4" /> Try Again
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>{pageTitle}</CardTitle>
            <CardDescription>{pageDescription}</CardDescription>
          </div>
          {onRefresh && (
             <Button onClick={onRefresh} variant="outline" size="icon" disabled={isLoading} aria-label="Refresh runs list">
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {runs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No runs found for the current criteria.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Run ID</TableHead>
                <TableHead>Deployment ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Run By</TableHead>
                <TableHead>Command</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {runs.map((run) => (
                <TableRow key={run.id}>
                  <TableCell className="font-medium">
                    <Link href={projectId ? `/projects/${projectId}/runs/${run.id}` : `/runs/${run.id}`} className="hover:underline">
                      {run.id}
                    </Link>
                  </TableCell>
                  <TableCell>{run.deployment_id}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(run.status)}>{run.status}</Badge>
                  </TableCell>
                  <TableCell>{run.properties?.run_by || "N/A"}</TableCell>
                  <TableCell>{run.properties?.terraform_command || "N/A"}</TableCell>
                  <TableCell>{run.timestamp ? format(new Date(run.timestamp), 'PPpp') : "N/A"}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={projectId ? `/projects/${projectId}/runs/${run.id}` : `/runs/${run.id}`}>
                        <Eye className="mr-2 h-4 w-4" /> View
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
} 