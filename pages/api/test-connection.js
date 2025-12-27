import { connectDB } from '../../lib/database'
import prisma from '../../lib/prisma'

export default async function handler(req, res) {
  try {
    await connectDB()

    // Test database connection
    await prisma.$connect()
    const result = await prisma.$queryRaw`SELECT 1 as test`

    res.status(200).json({
      status: 'success',
      message: 'Database connection successful',
      testResult: result
    })
  } catch (error) {
    console.error('Database connection test failed:', error)

    res.status(500).json({
      status: 'error',
      message: 'Database connection failed',
      error: error.message
    })
  } finally {
    await prisma.$disconnect()
  }
}
