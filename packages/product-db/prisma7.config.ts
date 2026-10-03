import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Placeholder lets `prisma generate` run on CI/Render where the real
    // URL isn't set at install time. Real runtime and migrate commands
    // still use the actual DATABASE_URL when it's present.
    url: process.env.DATABASE_URL ?? "postgresql://placeholder:placeholder@localhost:5432/placeholder",
  },
});