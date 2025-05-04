import type React from "react"
import type { Metadata } from "next/dist/lib/metadata/types/metadata-interface"
import { Inter, Plus_Jakarta_Sans } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { OrganizationProvider } from "@/contexts/organization-context"
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from "@/contexts/auth-context"
import { cn } from "@/lib/utils"
import { AppShell } from "@/components/app-shell"

// Font definitions
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
})

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-heading",
})

export const metadata: Metadata = {
  title: "Formi - Enterprise Dashboard",
  description: "Internal developer platform for deploying Terraform modules",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(inter.variable, plusJakartaSans.variable, "font-sans antialiased")}>
        <AuthProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            <OrganizationProvider>
              <AppShell>{children}</AppShell>
              <Toaster />
            </OrganizationProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
