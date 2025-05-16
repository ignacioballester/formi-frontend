import { AlertCircle, CheckCircle2, Clock, Loader2, XCircle } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Deployment } from "@/lib/api-core"

interface ModuleStatusCardProps {
  deployment: Deployment
  moduleName: string
  projectName: string
}

export function ModuleStatusCard({ deployment, moduleName, projectName }: ModuleStatusCardProps) {
  const getStatusIcon = (status: Deployment["status"]) => {
    switch (status) {
      case "active":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case "creating":
      case "updating":
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
      case "inactive":
        return <Clock className="h-5 w-5 text-yellow-500" />
      case "destroying":
        return <Loader2 className="h-5 w-5 text-orange-500 animate-spin" />
      case "failed":
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusBadge = (status: Deployment["status"]) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500">Active</Badge>
      case "creating":
        return <Badge className="bg-blue-500">Creating</Badge>
      case "updating":
        return <Badge className="bg-blue-500">Updating</Badge>
      case "inactive":
        return <Badge className="bg-yellow-500">Inactive</Badge>
      case "destroying":
        return <Badge className="bg-orange-500">Destroying</Badge>
      case "failed":
        return <Badge className="bg-red-500">Failed</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>{moduleName}</CardTitle>
        <CardDescription>Project: {projectName}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            {getStatusBadge(deployment.status)}
            <span className="text-xs text-muted-foreground">Version: {deployment.version}</span>
          </div>
          {getStatusIcon(deployment.status)}
        </div>
        {deployment.status === "failed" && (
          <div className="mt-2 rounded-md bg-red-50 p-2 text-xs text-red-800 dark:bg-red-950 dark:text-red-300">
            {deployment.status_details.error_message || "An error occurred during deployment"}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
