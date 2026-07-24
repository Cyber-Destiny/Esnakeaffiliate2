import { PrismaClient } from "@prisma/client";

// Database client bootstrap.
//
// PRODUCTION (Vercel / any real server) — PostgreSQL REQUIRED:
//   Set DATABASE_URL to a postgres connection string in your environment, e.g.
//   postgresql://user:password@host:5432/dbname?schema=public
//   Use Vercel Postgres, Neon, Supabase, or any hosted PostgreSQL.
//
// LOCAL SANDBOX FALLBACK (this dev sandbox only):
//   When DATABASE_URL is missing AND we're NOT on Vercel, fall back to a local
//   SQLite file so the preview stays runnable. This CANNOT work on Vercel
//   (read-only filesystem), so on Vercel we throw a clear error instead.
//
// To go live: set DATABASE_URL to a postgres:// URL in Vercel project settings
// → Settings → Environment Variables. No code changes needed.

const SQLITE_FALLBACK_URL = "file:/home/z/my-project/db/custom.db";
const isVercel = Boolean(process.env.VERCEL || process.env.VERCEL_ENV);

function resolveDatabaseUrl(): string {
  const env = process.env.DATABASE_URL;
  if (env && env.trim().length > 0) return env;

  // No DATABASE_URL set.
  if (isVercel) {
    throw new Error(
      "DATABASE_URL environment variable is not set. On Vercel you MUST use PostgreSQL (SQLite cannot work on Vercel's read-only filesystem). Add DATABASE_URL in Vercel → Settings → Environment Variables with a postgres:// connection string (e.g. from Vercel Postgres, Neon, or Supabase), then redeploy."
    );
  }
  return SQLITE_FALLBACK_URL;
}

const databaseUrl = resolveDatabaseUrl();
process.env.DATABASE_URL = databaseUrl;

const isPostgres = databaseUrl.startsWith("postgres");

let db: PrismaClient;

if (isPostgres) {
  // Production: PostgreSQL client (generated from prisma/schema.prisma).
  db = new PrismaClient({ log: ["error", "warn"] });
} else {
  // Local sandbox only: SQLite fallback client (generated from
  // prisma/schema.sqlite.prisma). Direct file-path require because
  // @prisma/client doesn't expose the sqlite subpath in its "exports" map.
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
