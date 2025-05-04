"use client"

import { createContext, useContext, useState, type ReactNode } from "react"
import type { Organization } from "@/lib/api"

interface OrganizationContextType {
  selectedOrganization: Organization | null
  setSelectedOrganization: (org: Organization | null) => void
  isOrganizationView: boolean
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined)

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null)

  return (
    <OrganizationContext.Provider
      value={{
        selectedOrganization,
        setSelectedOrganization,
        isOrganizationView: selectedOrganization !== null,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  )
}

export function useOrganization() {
  const context = useContext(OrganizationContext)
  if (context === undefined) {
    throw new Error("useOrganization must be used within an OrganizationProvider")
  }
  return context
}
