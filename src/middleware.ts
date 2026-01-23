import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { betterFetch } from "@better-fetch/fetch";

import type { auth } from "./server/auth";
import { ROUTES } from "./constants/routes";

const AUTH_ROUTES = [
  ROUTES.FORGOT_PASSWORD,
  ROUTES.LOGIN,
  ROUTES.REGISTER,
  ROUTES.RESET_PASSWORD,
];

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  "/",
  "/external-request",
  "/products",
  "/solutions",
  "/resources",
];

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Check if it's a public route (exact match or starts with)
  const isPublicPath = PUBLIC_ROUTES.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  );

  // Skip auth check for public routes
  if (isPublicPath) {
    return NextResponse.next();
  }

  const isAuthPath = AUTH_ROUTES.includes(
    pathname as (typeof AUTH_ROUTES)[number],
  );

  const { data } = await betterFetch<typeof auth.$Infer.Session>(
    "/api/auth/get-session",
    {
      baseURL: request.nextUrl.origin,
      headers: {
        cookie: request.headers.get("cookie") ?? "",
      },
    },
  );

  const isAuthenticated = !!data;
  const hasActiveOrganization = !!data?.session?.activeOrganizationId;

  if (isAuthPath && isAuthenticated) {
    const redirectUrl = new URL(ROUTES.REQUESTS, request.url);
    return NextResponse.redirect(redirectUrl);
  }

  if (!isAuthPath && !isAuthenticated) {
    const signInUrl = new URL(ROUTES.LOGIN, request.url);
    return NextResponse.redirect(signInUrl);
  }

  if (isAuthenticated && !hasActiveOrganization && !isAuthPath) {
    if (pathname !== ROUTES.ACCOUNT) {
      const analyticsUrl = new URL(ROUTES.ACCOUNT, request.url);
      return NextResponse.redirect(analyticsUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.svg$|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.ico$|$).*)",
  ],
};
