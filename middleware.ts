import { auth } from "@/lib/auth-edge"
import { NextResponse } from "next/server"

export default auth((req) => {
  const { pathname } = req.nextUrl
  const setupDone = req.cookies.get("setup_done")?.value === "1"

  // Pass Auth.js internal routes through always
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next()
  }

  // /setup: return 403 if setup already done
  if (pathname.startsWith("/setup")) {
    if (setupDone) {
      return new NextResponse("Forbidden", { status: 403 })
    }
    return NextResponse.next()
  }

  // /login: redirect to /overview if already authenticated
  if (pathname.startsWith("/login")) {
    if (req.auth) {
      return NextResponse.redirect(new URL("/overview", req.url))
    }
    return NextResponse.next()
  }

  // All app routes: require authentication
  if (!req.auth) {
    // If setup never completed, redirect to /setup first
    if (!setupDone) {
      return NextResponse.redirect(new URL("/setup", req.url))
    }
    return NextResponse.redirect(new URL("/login", req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon-192x192\\.png|icon-512x512\\.png|manifest\\.webmanifest).*)",
  ],
}
