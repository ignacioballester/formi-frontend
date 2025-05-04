import { type NextRequest, NextResponse } from "next/server"

// Simple check for authentication based on cookies
// This is a simplified approach since we can't use getToken directly in Edge middleware
export async function middleware(request: NextRequest) {
  const authCookie =
    request.cookies.get("next-auth.session-token") || request.cookies.get("__Secure-next-auth.session-token")
  const isAuthenticated = !!authCookie

  // Define public paths that don't require authentication
  const publicPaths = ["/login", "/api/auth"]
  const isPublicPath = publicPaths.some(
    (path) => request.nextUrl.pathname.startsWith(path) || request.nextUrl.pathname === "/",
  )

  // Redirect to login if accessing a protected route without authentication
  if (!isAuthenticated && !isPublicPath) {
    const url = new URL("/login", request.url)
    url.searchParams.set("callbackUrl", request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  // Redirect to dashboard if accessing login while already authenticated
  if (isAuthenticated && request.nextUrl.pathname === "/login") {
    return NextResponse.redirect(new URL("/", request.url))
  }

  return NextResponse.next()
}

// Configure the middleware to run on specific paths
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
