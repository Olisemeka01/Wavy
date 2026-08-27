import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // CLI connections (migrate/introspect/studio). Prisma 7 has no separate
    // directUrl here anymore, so migrations use the direct (port 5432)
    // connection; pgbouncer can't run shadow-database DDL.
    // The running app's pooled URL lives in lib/db.ts instead.
    url: process.env["DIRECT_URL"] ?? process.env["DATABASE_URL"],
  },
});
