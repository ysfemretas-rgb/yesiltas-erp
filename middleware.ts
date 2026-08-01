import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const isLoggedIn = request.cookies.has("yt_user") || 
    request.headers.get("x-localstorage-user") // Client-side auth check

  const isLoginPage = request.nextUrl.pathname === "/login"
  const isDashboard = request.nextUrl.pathname.startsWith("/dashboard")

  // If not logged in and trying to access dashboard, redirect to login
  if (!isLoggedIn && isDashboard) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // If logged in and trying to access login, redirect to dashboard
  if (isLoggedIn && isLoginPage) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*", "/login"]
}