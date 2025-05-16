"use client"

import { useState, useEffect } from "react"
import { Building2, Users, UserPlus, ArrowUpRight, Package, GitBranch } from "lucide-react"
import Link from "next/link"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"
import { type Organization } from "@/lib/api-core"

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        setError(null)
        const response = await fetch('/api/organizations')
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || `Error: ${response.status}`)
        }
        const orgs = await response.json()
        setOrganizations(orgs)
      } catch (err: any) {
        console.error("Error fetching data:", err)
        setError(err.message || "Failed to fetch organizations")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Mock data for charts
  const deploymentData = [
    { name: "Jan", successful: 65, failed: 12 },
    { name: "Feb", successful: 59, failed: 8 },
    { name: "Mar", successful: 80, failed: 10 },
    { name: "Apr", successful: 81, failed: 5 },
    { name: "May", successful: 56, failed: 15 },
    { name: "Jun", successful: 95, failed: 3 },
    { name: "Jul", successful: 100, failed: 8 },
  ]

  const moduleStatusData = [
    { name: "Active", value: 65, color: "var(--status-active)" },
    { name: "Inactive", value: 15, color: "var(--status-inactive)" },
    { name: "Warning", value: 10, color: "var(--status-warning)" },
    { name: "Error", value: 5, color: "var(--status-error)" },
  ]

  const resourceUsageData = [
    { name: "Mon", cpu: 30, memory: 45, network: 20 },
    { name: "Tue", cpu: 40, memory: 50, network: 25 },
    { name: "Wed", cpu: 45, memory: 55, network: 30 },
    { name: "Thu", cpu: 50, memory: 60, network: 35 },
    { name: "Fri", cpu: 55, memory: 65, network: 40 },
    { name: "Sat", cpu: 35, memory: 40, network: 20 },
    { name: "Sun", cpu: 25, memory: 30, network: 15 },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Enterprise Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's an overview of your platform.</p>
        </div>
        <Button asChild>
          <Link href="/organizations/new">
            <Building2 className="mr-2 h-4 w-4" />
            New Organization
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Organizations</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <Skeleton className="h-8 w-16" />
            </div>
            <p className="text-xs text-muted-foreground">+2 from last month</p>
          </CardContent>
          <CardFooter>
            <Button asChild variant="ghost" size="sm" className="w-full">
              <Link href="/organizations" className="flex items-center justify-between w-full">
                <span>View All</span>
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <Skeleton className="h-8 w-16" />
            </div>
            <p className="text-xs text-muted-foreground">+4 from last month</p>
          </CardContent>
          <CardFooter>
            <Button asChild variant="ghost" size="sm" className="w-full">
              <Link href="/users" className="flex items-center justify-between w-full">
                <span>Manage Users</span>
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Groups</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <Skeleton className="h-8 w-16" />
            </div>
            <p className="text-xs text-muted-foreground">+1 from last month</p>
          </CardContent>
          <CardFooter>
            <Button asChild variant="ghost" size="sm" className="w-full">
              <Link href="/groups" className="flex items-center justify-between w-full">
                <span>Manage Groups</span>
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Modules</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <Skeleton className="h-8 w-16" />
            </div>
            <p className="text-xs text-muted-foreground">+8 from last month</p>
          </CardContent>
          <CardFooter>
            <Button asChild variant="ghost" size="sm" className="w-full">
              <Link href="/modules" className="flex items-center justify-between w-full">
                <span>View Modules</span>
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="lg:col-span-4">
              <CardHeader>
                <CardTitle>Deployment Activity</CardTitle>
                <CardDescription>Successful vs failed deployments over time</CardDescription>
              </CardHeader>
              <CardContent className="px-2">
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">Chart temporarily hidden</div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>Module Status</CardTitle>
                <CardDescription>Current status of all modules</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">Chart temporarily hidden</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>Resource Usage</CardTitle>
                <CardDescription>CPU, Memory and Network usage</CardDescription>
              </CardHeader>
              <CardContent className="px-2">
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">Chart temporarily hidden</div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-4">
              <CardHeader>
                <CardTitle>Recent Organizations</CardTitle>
                <CardDescription>Your most recently accessed organizations</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-2">
                    {Array(3)
                      .fill(0)
                      .map((_, i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                      ))}
                  </div>
                ) : error ? (
                  <p className="text-red-500">{error}</p>
                ) : organizations.length > 0 ? (
                  <div className="space-y-2">
                    {/* --- TEMPORARILY COMMENTED OUT ORGS LIST --- */}
                    {/* {organizations.slice(0, 5).map((org) => (
                      <Link
                        key={org.id}
                        href={`/organizations/${org.id}`}
                        className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                            <Building2 className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{org.name}</p>
                            <p className="text-sm text-muted-foreground">{org.description}</p>
                          </div>
                        </div>
                        <Badge variant="outline">Active</Badge>
                      </Link>
                    ))} */}
                     <div className="h-[100px] flex items-center justify-center text-muted-foreground">Org list temporarily hidden</div>
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground">No organizations found</p>
                )}
              </CardContent>
              <CardFooter>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/organizations">View All Organizations</Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Analytics</CardTitle>
              <CardDescription>Detailed platform analytics and metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex h-[400px] items-center justify-center rounded-md border border-dashed">
                <div className="flex flex-col items-center gap-2 text-center">
                  <Package className="h-10 w-10 text-muted-foreground" />
                  <h3 className="text-xl font-medium">Analytics Dashboard</h3>
                  <p className="max-w-xs text-sm text-muted-foreground">
                    Advanced analytics features are coming soon. Stay tuned for detailed insights and metrics.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Generated Reports</CardTitle>
              <CardDescription>Access and download platform reports</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex h-[400px] items-center justify-center rounded-md border border-dashed">
                <div className="flex flex-col items-center gap-2 text-center">
                  <GitBranch className="h-10 w-10 text-muted-foreground" />
                  <h3 className="text-xl font-medium">Reports Dashboard</h3>
                  <p className="max-w-xs text-sm text-muted-foreground">
                    Reporting features are coming soon. You'll be able to generate and download custom reports.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
