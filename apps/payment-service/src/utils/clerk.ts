// Mirrors utils/clerk.ts in the user service. If the payment service
// already has its own copy of this file, you don't need this one - just
// make sure it exports a clerkClient built with CLERK_SECRET_KEY as its
// default export, since that's what mobilemoney.route.ts imports.
import { createClerkClient } from "@clerk/backend";

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

export default clerkClient;