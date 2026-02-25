import { auth } from "@/lib/auth-edge"
import { NextResponse } from "next/server"

export default auth((req) => {
  const { pathname } = req.nextUrl

  // Pass Auth.js internal routes through always
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next()
  }

  // /setup and /login: always pass through — pages handle their own redirects
  if (pathname.startsWith("/setup") || pathname.startsWith("/login")) {
    return NextResponse.next()
  }

  // Diagnostic endpoint: skip auth (dev only — remove before production)
  if (pathname === "/api/ha/diagnostic") {
    return NextResponse.next()
  }

  // All app routes: require authentication → /login (login page checks if /setup needed)
  if (!req.auth) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon-192x192\\.png|icon-512x512\\.png|manifest\\.webmanifest|serwist\\/).*)",
  ],
}
