import { connectDB } from '../../../../lib/database'
import { withAuth } from '../../../../lib/auth'
import prisma from '../../../../lib/prisma'
import { applyCors } from '../../../../lib/cors'

async function handler(req, res) {
  // Handle CORS
  if (applyCors(req, res)) return
  
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  await connectDB()

  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' })
    }
    
    const count = await prisma.user.count({
      where: { role: 'patient' }
    })
    res.status(200).json({ count })
  } catch (error) {
    res.status(500).json({ message: 'Server error while counting patients' })
  }
}

export default withAuth(handler)
