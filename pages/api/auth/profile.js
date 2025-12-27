import { connectDB } from '../../../lib/database'
import jwt from 'jsonwebtoken'
import prisma from '../../../lib/prisma'
import { applyCors } from '../../../lib/cors'

export default async function handler(req, res) {
  // Handle CORS first
  if (applyCors(req, res)) return

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  // Handle authentication after CORS
  const authHeader = req.headers.authorization
  const token = authHeader?.split(' ')[1]

  if (!token) {
    return res.status(401).json({
      message: 'No authentication token, access denied'
    })
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET)
    req.user = verified
  } catch (error) {
    return res.status(401).json({
      message: 'Token verification failed'
    })
  }

  await connectDB()

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        image: true,
        address: true,
        gender: true,
        dob: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    })

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    // Backward compatibility
    res.status(200).json({
      ...user,
      _id: user.id
    })
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
}
