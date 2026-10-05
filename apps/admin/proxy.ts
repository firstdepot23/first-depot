import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { CustomJwtSessionClaims } from "@repo/types";

const isPublicRoute = createRouteMatcher(["/sign-in(.*)", "/unauthorized(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();

    const { userId, sessionClaims } = await auth();

    if (userId && sessionClaims) {
      const userRole = (sessionClaims as CustomJwtSessionClaims).metadata?.role;

      if (userRole !== "admin") {
        // NextResponse (not the plain Response.redirect) has headers that
        // Clerk is allowed to modify. Response.redirect() returns an
        // immutable response, which caused "TypeError: immutable".
        const url = req.nextUrl.clone();
        url.pathname = "/unauthorized";
        url.search = "";
        return NextResponse.redirect(url);
      }
    }
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};