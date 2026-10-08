import { clerkMiddleware } from "@clerk/nextjs/server";

// Clerk's auth() only works on routes this file runs for. Without it Next.js
// throws "auth() was called but Clerk can't detect usage of clerkMiddleware()".
//
// No routes are protected here on purpose: the shop, product pages and blog
// stay public, and pages that need a signed-in user (cart, checkout, orders)
// already prompt for sign-in themselves.
//
// NEXT.JS VERSION: this file is named `proxy.ts` (Next.js 16). On Next.js 15
// or older, rename it to `middleware.ts`; the contents stay the same.
// Put it next to the `app` folder (inside `src/` if your app lives in `src/app`),
// and make sure you don't also have an old middleware.ts or proxy.ts.
export default clerkMiddleware();

export const config = {
  matcher: [
    // Skip Next.js internals and static files, run for everything else
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};