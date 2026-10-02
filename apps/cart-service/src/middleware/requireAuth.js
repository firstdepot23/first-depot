import { getAuth } from "@clerk/express";
// Unlike shouldBeAdmin in product-service, this only requires someone to
// be signed in (any role) - the cart belongs to whichever Clerk user is
// making the request. Needs clerkMiddleware() mounted globally first
// (see server.ts) for getAuth(req) to have anything to read.
export const requireAuth = (req, res, next) => {
    const { userId } = getAuth(req);
    if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    req.userId = userId;
    next();
};
