import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is not set");
}

if (databaseUrl.startsWith("prisma+postgres://")) {
  throw new Error(
    "DATABASE_URL is set to a Prisma Accelerate URL (prisma+postgres://), " +
      "but this client uses the pg driver adapter, which requires a direct " +
      "Postgres connection string (postgresql://...). Grab the 'Direct " +
      "connection' string from your Prisma Postgres Cloud dashboard instead.",
  );
}

// 1. Create a standard pg connection pool using your database URL
const pool = new Pool({ connectionString: databaseUrl });

// Surface pool-level connection failures (e.g. wrong host, DB unreachable)
// as a clear log line instead of a bare ECONNREFUSED stack trace three
// files deep in a Prisma query.
pool.on("error", (err) => {
  console.error("Unexpected error on idle Postgres client:", err);
});

// 2. Wrap it in the Prisma v7 Driver Adapter
const adapter = new PrismaPg(pool);

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// 3. Inject the adapter into the PrismaClient constructor
export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter: adapter, // <-- This satisfies the Prisma 7 strict type system
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;