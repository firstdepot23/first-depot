import { verifyToken } from "@clerk/backend";
import type { Context } from "hono";
import { createMiddleware } from "hono/factory";
import { CustomJwtSessionClaims } from "@repo/types";

type Claims = CustomJwtSessionClaims & { sub?: string };

/**
 * Reads "Authorization: Bearer <Clerk session token>" and verifies it with
 * Clerk. Returns the token's claims, or null when it's missing, expired or
 * invalid.
 *
 * This replaces @hono/clerk-auth. Its middleware crashed on every request with
 * "TypeError: Illegal invocation" (it builds a Request out of the object
 * @hono/node-server hands over, which newer Node versions reject), so even
 * /health and the Pesapal webhook were failing. Verifying the token directly
 * with @clerk/backend never builds that Request.
 */
const getClaims = async (c: Context): Promise<Claims | null> => {
  const token = c.req.header("Authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return null;

  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) {
    console.error("CLERK_SECRET_KEY is not set");
    return null;
  }

  try {
    // Depending on the @clerk/backend version this resolves to the payload
    // itself or to { data, errors }, so handle both shapes.
    const result = (await verifyToken(token, { secretKey })) as unknown as {
      data?: Claims;
      errors?: unknown[];
    } & Claims;

    if (Array.isArray(result?.errors) && result.errors.length > 0) return null;

    const payload = result && "data" in result ? result.data : result;
    return payload?.sub ? payload : null;
  } catch {
    // Expired or invalid token.
    return null;
  }
};

export const shouldBeUser = createMiddleware<{
  Variables: {
    userId: string;
  };
}>(async (c, next) => {
  const claims = await getClaims(c);

  if (!claims?.sub) {
    return c.json({ message: "You are not logged in." }, 401);
  }

  c.set("userId", claims.sub);

  await next();
});

export const shouldBeAdmin = createMiddleware<{
  Variables: {
    userId: string;
  };
}>(async (c, next) => {
  const claims = await getClaims(c);

  if (!claims?.sub) {
    return c.json({ message: "You are not logged in." }, 401);
  }

  if (claims.metadata?.role !== "admin") {
    return c.json({ message: "Unauthorized!" }, 403);
  }

  c.set("userId", claims.sub);

  await next();
});