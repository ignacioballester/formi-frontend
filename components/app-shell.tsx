"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { useAuth } from "@/contexts/auth-context"
import { cn } from "@/lib/utils"
import { SidebarProvider, useSidebar } from "@/components/ui/sidebar"

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname()
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 1024 : false)

  const initialSidebarOpen = typeof window !== 'undefined' ? window.innerWidth >= 1024 : true

  const isPublicRoute = pathname === "/login"

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024)
    }
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  useEffect(() => {
    console.log(`[AppShell Auth Check] Path: ${pathname}, Loading: ${isLoading}, Authenticated: ${isAuthenticated}`);
  }, [pathname, isLoading, isAuthenticated]);

  useEffect(() => {
    console.log(`[AppShell Redirect Check] Path: ${pathname}, Loading: ${isLoading}, Authenticated: ${isAuthenticated}, Is Public: ${isPublicRoute}`);
    if (!isLoading && !isAuthenticated && !isPublicRoute) {
      console.log(`[AppShell Redirecting] User not authenticated on protected route. Redirecting to /login...`);
      router.replace('/login');
    }
  }, [isLoading, isAuthenticated, isPublicRoute, router, pathname]);

  if (!isAuthenticated && !isPublicRoute) {
    console.log(`[AppShell Render Block] Path: ${pathname}, Authenticated: ${isAuthenticated}, Is Public: ${isPublicRoute} -> Rendering null/loader (Unauthenticated on protected route).`);
    return null;
  }

  if (isPublicRoute) {
    console.log(`[AppShell Render] Path: ${pathname} -> Rendering public route children.`);
    return <>{children}</>
  }

  console.log(`[AppShell Render] Path: ${pathname} -> Rendering authenticated shell.`);
  return (
    <SidebarProvider defaultOpen={initialSidebarOpen}>
      <AppShellContent isMobile={isMobile}>{children}</AppShellContent>
    </SidebarProvider>
  )
}

function AppShellContent({ children, isMobile }: { children: React.ReactNode; isMobile: boolean }) {
  const { open: sidebarOpen } = useSidebar()

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main
          className={cn(
            "flex-1 overflow-y-auto transition-all duration-300 ease-in-out",
            sidebarOpen ? "lg:pl-72" : "pl-0",
          )}
        >
          <div className="container mx-auto p-4 md:p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  )
}
