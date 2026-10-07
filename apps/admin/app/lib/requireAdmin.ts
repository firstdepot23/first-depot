import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import type { CustomJwtSessionClaims } from "@repo/types";

/**
 * Call at the top of any admin page, layout, route handler or server action.
 * - Not signed in  -> Clerk sends them to the sign-in page.
 * - Signed in, not an admin -> sent to /unauthorized.
 * Returns the admin's userId.
 */
export const requireAdmin = async (): Promise<string> => {
  const { userId, sessionClaims } = await auth.protect();

  const role = (sessionClaims as CustomJwtSessionClaims | null)?.metadata?.role;

  if (role !== "admin") {
    redirect("/unauthorized");
  }

  return userId;
};