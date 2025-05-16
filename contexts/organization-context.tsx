"use client"

import { createContext, useContext, useState, type ReactNode } from "react"
import type { Organization, Project } from "@/lib/api-core"

interface OrganizationContextType {
  selectedOrganization: Organization | null
  setSelectedOrganization: (org: Organization | null) => void
  isOrganizationView: boolean
  selectedProject: Project | null
  setSelectedProject: (project: Project | null) => void
  isProjectView: boolean
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined)

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)

  return (
    <OrganizationContext.Provider
      value={{
        selectedOrganization,
        setSelectedOrganization,
        isOrganizationView: selectedOrganization !== null || selectedProject !== null,
        selectedProject,
        setSelectedProject,
        isProjectView: selectedProject !== null,
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
