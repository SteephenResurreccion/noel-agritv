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

  // --- Per-request Content-Security-Policy nonce ---
  // Next.js parses the `'nonce-…'` token from the Content-Security-Policy on
  // the REQUEST headers and auto-applies it to its framework scripts, page
  // bundles, and Next-generated inline scripts. That lets us drop
  // `'unsafe-inline'`/`'unsafe-eval'` from script-src in production.
  // `'strict-dynamic'` propagates trust to scripts/iframes those trusted
  // scripts load themselves via createElement — Vercel Analytics + Speed
  // Insights and Cloudflare Turnstile both inject that way — so host
  // allowlists in script-src are unnecessary (and ignored under
  // strict-dynamic). They remain in connect-src / frame-src.
  // `'unsafe-eval'` is only added in development (React uses eval for richer
  // error stacks); production never needs it.
  // style-src deliberately KEEPS `'unsafe-inline'`: inline `style=` attributes
  // and dnd-kit drag transforms cannot carry a nonce. Documented residual risk
  // (CSS injection is far lower severity than script injection).
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const isDev = process.env.NODE_ENV === "development";

  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://i.ytimg.com https://lh3.googleusercontent.com",
    "font-src 'self'",
    "connect-src 'self' https://va.vercel-scripts.com https://*.blob.vercel-storage.com https://challenges.cloudflare.com",
    "frame-src https://www.youtube.com https://challenges.cloudflare.com",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests",
  ].join("; ");

  // Forward the pathname (defense-in-depth input for the (admin) layout
  // guard), the nonce, and the CSP on the REQUEST so Next can read them
  // during SSR; mirror the SAME CSP onto the RESPONSE for the browser.
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-pathname", req.nextUrl.pathname);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
});

export const config = {
  matcher: [
    /*
     * Run on all HTML routes. Exclude API routes, Next internals, and static
     * assets that don't need a CSP, and skip link prefetches (no HTML body to
     * apply a nonce to).
     */
    {
      source:
        "/((?!api|_next/static|_next/image|favicon.ico|icon.png|sitemap.xml|robots.txt|images|data).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
