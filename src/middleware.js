import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // RULE 1: Agar user "staff" (dukan ka ladka) hai, aur wo Purchase ya Reports dekhna chahta hai
    if (token?.role !== "admin" && (path.startsWith("/purchase") || path.startsWith("/reports") || path === "/")) {
      // Toh usko zabardasti "Sell" (Dawai bechne wale) page par bhej do
      return NextResponse.redirect(new URL("/sell", req.url));
    }
  },
  {
    callbacks: {
      // Ye check karta hai ki user logged in hai ya nahi
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/login", // Agar login nahi hai, toh yahan bhej do
    },
  }
);

// Ye batata hai ki kin pages par security lagani hai
export const config = {
  matcher: [
    "/",
    "/purchase/:path*",
    "/sell/:path*",
    "/reports/:path*",
  ],
};