import prisma from './prisma'

// This function is kept for backward compatibility with existing imports
// Prisma handles connection pooling automatically
async function dbConnect() {
  try {
    await prisma.$connect()
    console.log('PostgreSQL Connected via Prisma')
    return prisma
  } catch (error) {
    console.error('PostgreSQL Connection Error:', error)
    throw error
  }
}

export default dbConnect
export { prisma }
