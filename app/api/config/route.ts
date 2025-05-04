import { NextResponse } from "next/server"

export async function GET() {
  // Return only non-sensitive configuration that's safe for the client
  return NextResponse.json({
    apiUrl: process.env.API_URL || "/api/v1",
    keycloakAdminUrl: process.env.KEYCLOAK_ADMIN_URL,
  })
}
