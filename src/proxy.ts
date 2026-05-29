import { auth } from "@/auth";
import { NextResponse } from "next/server";

export const proxy = auth((req) => {
  const isAdmin = req.nextUrl.pathname.startsWith("/admin");
  const isLoginPage = req.nextUrl.pathname === "/admin/login";

  // Protect all /admin routes except the login page
  if (isAdmin && !isLoginPage && !req.auth) {
    const loginUrl = new URL("/admin/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return Response.redirect(loginUrl);
  }

  // Redirect authenticated users away from login page
  if (isLoginPage && req.auth) {
    return Response.redirect(new URL("/admin", req.nextUrl.origin));
  }

  // Forward the pathname so the (admin) server layout can apply a
  // defense-in-depth auth guard while still exempting /admin/login
  // (which lives inside the (admin) route group).
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-pathname", req.nextUrl.pathname);
  return NextResponse.next({ request: { headers: requestHeaders } });
});

export const config = {
  matcher: ["/admin/:path*"],
};
