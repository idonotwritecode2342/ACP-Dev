import { PrismaClient } from '@prisma/client'

// Lazily instantiate the Prisma client so the same instance can be reused
// across API routes during development. This avoids exhausting database
// connections when Next.js hot reloads.
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
