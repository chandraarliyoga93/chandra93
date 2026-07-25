import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

// Add this to help LSP/Type checking
export * from '@prisma/client'

const globalForPrisma = global as unknown as { 
  prisma: PrismaClient | undefined,
  pgPool: Pool | undefined
}

const connectionString = process.env.DATABASE_URL

// Singleton pattern for the PG Pool to avoid too many connections in development
const pool = globalForPrisma.pgPool || new Pool({ 
  connectionString,
  // Add some defaults for stability
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.pgPool = pool

const adapter = new PrismaPg(pool)

// Singleton pattern for PrismaClient
export const prisma = globalForPrisma.prisma || new PrismaClient({ adapter })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
