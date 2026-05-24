import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Super Admin panel security check
    if (path.startsWith("/superadmin") || path.startsWith("/api/superadmin")) {
      if (token?.role !== "superadmin") {
        return NextResponse.redirect(new URL("/", req.url));
      }
      return NextResponse.next();
    }

    // Subscription status validation
    const subscriptionEnd = token?.subscriptionEnd ? new Date(token.subscriptionEnd) : null;
    const isExpired = subscriptionEnd && subscriptionEnd < new Date();

    if (isExpired && token?.role !== "superadmin") {
      // Allow access to /paused, /profile, and user profile/subscription APIs
      const isAllowedPath = 
        path === "/paused" || 
        path === "/profile" || 
        path.startsWith("/api/auth") || 
        path.startsWith("/api/user/");

      if (!isAllowedPath) {
        return NextResponse.redirect(new URL("/paused", req.url));
      }
      return NextResponse.next();
    }

    // If active but trying to visit /paused page, redirect to home
    if (!isExpired && path === "/paused") {
      return NextResponse.redirect(new URL("/", req.url));
    }

    // Redirect from root route based on user role (since Dashboard is disabled)
    if (path === "/") {
      if (token?.role === "superadmin") {
        return NextResponse.redirect(new URL("/superadmin", req.url));
      }
      if (token?.role === "admin") {
        return NextResponse.redirect(new URL("/inventory", req.url));
      }
      return NextResponse.redirect(new URL("/sell", req.url));
    }

    // Staff restrictions for Purchase, Reports, and Distributors (Superadmin and Admin both have access)
    if (token?.role !== "admin" && token?.role !== "superadmin" && (path.startsWith("/purchase") || path.startsWith("/reports") || path.startsWith("/distributors"))) {
      return NextResponse.redirect(new URL("/sell", req.url));
    }
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/login", 
    },
  }
);

export const config = {
  matcher: [
    "/",
    "/purchase/:path*",
    "/sell/:path*",
    "/reports/:path*",
    "/inventory/:path*",
    "/profile/:path*",
    "/paused/:path*",
    "/superadmin/:path*",
    "/distributors/:path*",
    "/lookup/:path*",
    "/api/sell/:path*",
    "/api/medicine/:path*",
    "/api/dashboard/:path*",
    "/api/reports/:path*",
    "/api/superadmin/:path*",
    "/api/user/:path*"
  ],
};
