import { clerkMiddleware } from "@clerk/nextjs/server";

// The proxy only makes Clerk's auth context available to the app.
// Access control lives with the resources themselves (see
// app/(admin)/layout.tsx and lib/requireAdmin.ts), not in path matching here.
export default clerkMiddleware();

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};