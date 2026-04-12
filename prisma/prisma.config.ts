import path from "node:path";
import { defineConfig } from "prisma/config";

// This file is used by the Prisma CLI (db push, migrate, studio).
// The runtime client adapter is configured separately in lib/db.ts.
export default defineConfig({
  schema: path.join(__dirname, "schema.prisma"),
  datasource: {
    url: process.env.DATABASE_URL as string,
  },
});
