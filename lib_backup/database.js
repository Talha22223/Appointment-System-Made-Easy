import prisma from './prisma'

// This function is kept for backward compatibility
// Prisma handles connection automatically, so this is now a no-op
export async function connectDB() {
  // Prisma automatically connects on first query
  // This function exists to maintain the same API signatures
  try {
    await prisma.$connect()
    console.log('PostgreSQL Connected via Prisma')
  } catch (error) {
    console.error('PostgreSQL Connection Error:', error)
    throw error
  }
}

export { prisma }
