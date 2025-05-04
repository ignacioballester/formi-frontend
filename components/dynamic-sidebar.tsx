"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  BarChart3,
  Settings,
  Users,
  UserCircle,
  LogOut,
  Building2,
  Layers3,
  Package,
  GitBranch,
  UserPlus,
  ChevronLeft,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useOrganization } from "@/contexts/organization-context"
import { useAuth } from "@/contexts/auth-context"

export function DynamicSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { selectedOrganization, setSelectedOrganization, isOrganizationView } = useOrganization()
  const { user, logout } = useAuth()

  // Enterprise-level routes
  const enterpriseRoutes = [
    {
      title: "Dashboard",
      icon: BarChart3,
      href: "/",
      variant: "default",
    },
    {
      title: "Organizations",
      icon: Building2,
      href: "/organizations",
      variant: "ghost",
    },
    {
      title: "Users",
      icon: Users,
      href: "/users",
      variant: "ghost",
    },
    {
      title: "Groups",
      icon: UserPlus,
      href: "/groups",
      variant: "ghost",
    },
    {
      title: "Settings",
      icon: Settings,
      href: "/settings",
      variant: "ghost",
    },
  ]

  // Organization-specific routes
  const organizationRoutes = [
    {
      title: "Overview",
      icon: BarChart3,
      href: `/organizations/${selectedOrganization?.id}`,
      variant: "default",
    },
    {
      title: "Projects",
      icon: Layers3,
      href: `/organizations/${selectedOrganization?.id}/projects`,
      variant: "ghost",
    },
    {
      title: "Modules",
      icon: Package,
      href: `/organizations/${selectedOrganization?.id}/modules`,
      variant: "ghost",
    },
    {
      title: "Repositories",
      icon: GitBranch,
      href: `/organizations/${selectedOrganization?.id}/repositories`,
      variant: "ghost",
    },
    {
      title: "Settings",
      icon: Settings,
      href: `/organizations/${selectedOrganization?.id}/settings`,
      variant: "ghost",
    },
  ]

  const routes = isOrganizationView ? organizationRoutes : enterpriseRoutes

  const handleBackToEnterprise = () => {
    setSelectedOrganization(null)
    router.push("/")
  }

  const handleLogout = async () => {
    await logout()
  }

  return (
    <div className="group fixed inset-y-0 z-30 flex h-full w-72 flex-col border-r bg-background">
      <div className="border-b px-3 py-4">
        <div className="flex items-center gap-2 px-2">
          <Package className="h-6 w-6" />
          <h1 className="text-xl font-bold">Formi</h1>
        </div>
      </div>

      {isOrganizationView && (
        <div className="border-b px-3 py-2">
          <Button
            variant="ghost"
            className="flex w-full items-center justify-start gap-2 text-sm font-medium"
            onClick={handleBackToEnterprise}
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Enterprise
          </Button>
          <div className="px-2 py-2">
            <h2 className="text-sm font-semibold text-muted-foreground">Organization</h2>
            <p className="text-base font-medium">{selectedOrganization?.name}</p>
          </div>
        </div>
      )}

      <ScrollArea className="flex-1 px-3 py-2">
        <div className="space-y-1 py-2">
          {routes.map((route) => (
            <Button
              key={route.href}
              variant={pathname === route.href ? "default" : "ghost"}
              className={cn("w-full justify-start", pathname === route.href && "bg-primary text-primary-foreground")}
              asChild
            >
              <Link href={route.href}>
                <route.icon className="mr-2 h-5 w-5" />
                {route.title}
              </Link>
            </Button>
          ))}
        </div>
      </ScrollArea>

      <div className="mt-auto border-t p-4">
        <div className="flex items-center gap-2 rounded-lg px-2 py-2">
          <UserCircle className="h-8 w-8" />
          <div className="flex flex-col">
            <span className="text-sm font-medium">{user?.name || "Admin User"}</span>
            <span className="text-xs text-muted-foreground">{user?.email || "admin@formi.com"}</span>
          </div>
          <Button variant="ghost" size="icon" className="ml-auto" onClick={handleLogout}>
            <LogOut className="h-5 w-5" />
            <span className="sr-only">Log out</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
