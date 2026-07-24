import { PrismaClient } from "@prisma/client";

// Database client bootstrap.
//
// PRODUCTION (PostgreSQL):
//   Set DATABASE_URL to a postgres connection string, e.g.
//   postgresql://ensnake:password@localhost:5432/ensnake?schema=public
//   The generated Prisma client (provider = "postgresql") connects to it.
//
// LOCAL SANDBOX FALLBACK:
//   This sandbox cannot run a system PostgreSQL server, so when DATABASE_URL is
//   missing OR points at a sqlite file, we fall back to the local SQLite
//   database at db/custom.db. This keeps the app runnable for preview while the
//   schema + client are fully PostgreSQL-ready for real deployments.
//
// To switch to PostgreSQL, just set DATABASE_URL in .env (or the server
// environment) to a postgres:// URL and restart. No code changes needed.

const SQLITE_FALLBACK_URL = "file:/home/z/my-project/db/custom.db";

function resolveDatabaseUrl(): string {
  const env = process.env.DATABASE_URL;
  if (env && env.trim().length > 0) return env;
  return SQLITE_FALLBACK_URL;
}

const databaseUrl = resolveDatabaseUrl();
process.env.DATABASE_URL = databaseUrl;

const isPostgres = databaseUrl.startsWith("postgres");

// For the SQLite fallback we need the SQLite Prisma client. We import it from a
// side schema so both providers can coexist. In production (postgres URL), we
// use the main (postgresql) client directly.
let db: PrismaClient;

if (isPostgres) {
  db = new PrismaClient({ log: ["error", "warn"] });
} else {
  // Local SQLite fallback. Load a dedicated SQLite client built from
  // prisma/schema.sqlite.prisma to avoid provider mismatch errors.
  // Direct file path import because @prisma/client doesn't expose the sqlite
  // subpath in its "exports" map.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const sqliteClient = require("@prisma/client/sqlite/default.js");
  const SqlitePrismaClient = sqliteClient.PrismaClient as typeof PrismaClient;
  db = new SqlitePrismaClient({ log: ["error", "warn"] });
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaSqlite?: PrismaClient;
};

if (process.env.NODE_ENV !== "production") {
  if (isPostgres) {
    globalForPrisma.prisma = db;
  } else {
    globalForPrisma.prismaSqlite = db;
  }
}

export { db };
