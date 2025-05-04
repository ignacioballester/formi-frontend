"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  BarChart3,
  Settings,
  Users,
  LogOut,
  Building2,
  Layers3,
  Package,
  GitBranch,
  UserPlus,
  ChevronLeft,
  ChevronRight,
  Search,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useOrganization } from "@/contexts/organization-context"
import { useAuth } from "@/contexts/auth-context"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useSidebar } from "@/components/ui/sidebar"

interface SidebarProps {}

export function Sidebar({}: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { selectedOrganization, setSelectedOrganization, isOrganizationView } = useOrganization()
  const { user, logout } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const { open, toggleSidebar, isMobile, setOpen } = useSidebar()

  // Skip rendering sidebar on login page
  if (pathname === "/login") return null

  // Enterprise-level routes
  const enterpriseRoutes = [
    {
      title: "Dashboard",
      icon: BarChart3,
      href: "/",
    },
    {
      title: "Organizations",
      icon: Building2,
      href: "/organizations",
    },
    {
      title: "Users",
      icon: Users,
      href: "/users",
    },
    {
      title: "Groups",
      icon: UserPlus,
      href: "/groups",
    },
    {
      title: "Settings",
      icon: Settings,
      href: "/settings",
    },
  ]

  // Organization-specific routes
  const organizationRoutes = selectedOrganization
    ? [
        {
          title: "Overview",
          icon: BarChart3,
          href: `/organizations/${selectedOrganization.id}`,
        },
        {
          title: "Projects",
          icon: Layers3,
          href: `/organizations/${selectedOrganization.id}/projects`,
        },
        {
          title: "Modules",
          icon: Package,
          href: `/organizations/${selectedOrganization.id}/modules`,
        },
        {
          title: "Repositories",
          icon: GitBranch,
          href: `/organizations/${selectedOrganization.id}/repositories`,
        },
        {
          title: "Settings",
          icon: Settings,
          href: `/organizations/${selectedOrganization.id}/settings`,
        },
      ]
    : []

  const routes = isOrganizationView ? organizationRoutes : enterpriseRoutes

  // Filter routes based on search query
  const filteredRoutes = routes.filter((route) => route.title.toLowerCase().includes(searchQuery.toLowerCase()))

  const handleBackToEnterprise = () => {
    setSelectedOrganization(null)
    router.push("/")
  }

  const handleLogout = async () => {
    await logout()
  }

  return (
    <>
      {/* Mobile overlay */}
      {open && isMobile && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r bg-background transition-transform duration-300 ease-in-out lg:z-30",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0 lg:w-20",
        )}
      >
        {/* Logo and toggle */}
        <div className="flex h-16 items-center justify-between border-b px-4">
          <div className="flex items-center gap-2">
            <Package className="h-6 w-6 text-primary" />
            {open && <h1 className="text-xl font-bold">Formi</h1>}
          </div>
          <Button variant="ghost" size="icon" onClick={toggleSidebar} className="hidden lg:flex">
            {open ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
            <span className="sr-only">Toggle sidebar</span>
          </Button>
        </div>

        {/* Organization context */}
        {isOrganizationView && open && selectedOrganization && (
          <div className="border-b px-4 py-3">
            <Button
              variant="ghost"
              size="sm"
              className="flex w-full items-center justify-start gap-2 text-sm font-medium"
              onClick={handleBackToEnterprise}
            >
              <ChevronLeft className="h-4 w-4" />
              Back to Enterprise
            </Button>
            <div className="mt-2 rounded-md bg-muted/50 p-3">
              <h2 className="text-xs font-semibold text-muted-foreground">ORGANIZATION</h2>
              <p className="mt-1 truncate text-sm font-medium">{selectedOrganization.name}</p>
            </div>
          </div>
        )}

        {/* Search */}
        {open && (
          <div className="p-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Navigation */}
        <ScrollArea className="flex-1">
          <div className="space-y-1 p-2">
            <TooltipProvider delayDuration={0}>
              {filteredRoutes.map((route) => (
                <Tooltip key={route.href} delayDuration={0}>
                  <TooltipTrigger asChild>
                    <Button
                      variant={pathname === route.href ? "default" : "ghost"}
                      className={cn(
                        "w-full justify-start",
                        !open && "justify-center",
                        pathname === route.href && "bg-primary text-primary-foreground",
                      )}
                      asChild
                    >
                      <Link href={route.href}>
                        <route.icon className={cn("h-5 w-5", open && "mr-2")} />
                        {open && <span>{route.title}</span>}
                      </Link>
                    </Button>
                  </TooltipTrigger>
                  {!open && <TooltipContent side="right">{route.title}</TooltipContent>}
                </Tooltip>
              ))}
            </TooltipProvider>
          </div>
        </ScrollArea>

        {/* User profile */}
        <div className="border-t p-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className={cn("w-full justify-start gap-3 px-2", !open && "justify-center")}>
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.image || "/placeholder.svg"} alt={user?.name || "User"} />
                  <AvatarFallback>{user?.name?.[0] || "U"}</AvatarFallback>
                </Avatar>
                {open && (
                  <div className="flex flex-1 flex-col items-start text-left">
                    <span className="text-sm font-medium">{user?.name || "Admin User"}</span>
                    <span className="text-xs text-muted-foreground truncate max-w-[160px]">
                      {user?.email || "admin@formi.com"}
                    </span>
                  </div>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </>
  )
}
