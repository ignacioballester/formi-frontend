"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { ChevronRight, Home } from "lucide-react"
import { useOrganization } from "@/contexts/organization-context"

export function Breadcrumbs() {
  const pathname = usePathname()
  const { selectedOrganization } = useOrganization()

  if (pathname === "/" || pathname === "/login") {
    return null
  }

  const pathSegments = pathname.split("/").filter(Boolean)

  // Generate breadcrumb items
  const breadcrumbItems = [{ label: "Home", href: "/" }]

  let currentPath = ""

  pathSegments.forEach((segment, index) => {
    currentPath += `/${segment}`

    // Skip adding organization ID as a separate breadcrumb
    if (segment === selectedOrganization?.id?.toString() && index === 1) {
      return
    }

    // Format the label
    let label = segment.charAt(0).toUpperCase() + segment.slice(1)

    // Replace IDs with names when possible
    if (segment === selectedOrganization?.id?.toString()) {
      label = selectedOrganization.name
    }

    // For organization subpages
    if (index > 1 && pathSegments[0] === "organizations" && pathSegments[1] === selectedOrganization?.id?.toString()) {
      label = segment.charAt(0).toUpperCase() + segment.slice(1)
    }

    breadcrumbItems.push({ label, href: currentPath })
  })

  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex items-center space-x-1 text-sm">
        {breadcrumbItems.map((item, index) => {
          const isLast = index === breadcrumbItems.length - 1

          return (
            <li key={item.href} className="flex items-center">
              {index === 0 ? (
                <Link href={item.href} className="flex items-center text-muted-foreground hover:text-foreground">
                  <Home className="h-4 w-4" />
                  <span className="sr-only">Home</span>
                </Link>
              ) : isLast ? (
                <span className="font-medium">{item.label}</span>
              ) : (
                <Link href={item.href} className="text-muted-foreground hover:text-foreground">
                  {item.label}
                </Link>
              )}

              {!isLast && <ChevronRight className="mx-1 h-4 w-4 text-muted-foreground" />}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
