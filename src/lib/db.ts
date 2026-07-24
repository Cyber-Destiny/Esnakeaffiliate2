import { PrismaClient } from '@prisma/client'

// Ensure DATABASE_URL is always defined. Falls back to a local SQLite file
// when the environment variable is not set (e.g. fresh production deployment
// without a .env file). This prevents the "Environment variable not found:
// DATABASE_URL" Prisma validation error.
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'file:/home/z/my-project/db/custom.db'
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['error', 'warn'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
