import { getAuth } from "@clerk/express";
import type { NextFunction, Request, Response } from "express";

// Requires clerkMiddleware() to be installed on the app (see server.ts).

type Claims = { metadata?: { role?: string } } | null | undefined;

export const isAdminRequest = (req: Request) => {
  const { sessionClaims } = getAuth(req);
  // KEEP THIS IN STEP with shouldBeAdmin in the product service: whatever it
  // checks to decide "this person is an admin" must be checked here too.
  return (sessionClaims as Claims)?.metadata?.role === "admin";
};

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const { userId } = getAuth(req);
  if (!userId) {
    return res.status(401).json({ error: "Please sign in to continue." });
  }
  res.locals.userId = userId;
  next();
};

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  const { userId } = getAuth(req);
  if (!userId) {
    return res.status(401).json({ error: "Please sign in to continue." });
  }
  if (!isAdminRequest(req)) {
    return res.status(403).json({ error: "Not allowed." });
  }
  res.locals.userId = userId;
  next();
};