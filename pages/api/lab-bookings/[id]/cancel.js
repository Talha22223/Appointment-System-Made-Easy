import { connectDB } from '../../../../lib/database'
import jwt from 'jsonwebtoken'
import prisma from '../../../../lib/prisma'
import { applyCors } from '../../../../lib/cors'

export default async function handler(req, res) {
  // Handle CORS first
  if (applyCors(req, res)) return
  
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  // Handle authentication after CORS
  const authHeader = req.headers.authorization
  const token = authHeader?.split(' ')[1]

  if (!token) {
    return res.status(401).json({ message: 'No authentication token, access denied' })
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET)
    req.user = verified
  } catch (error) {
    return res.status(401).json({ message: 'Token verification failed' })
  }

  await connectDB()

  try {
    const labBooking = await prisma.labBooking.findUnique({
      where: { id: req.query.id }
    })
    
    if (!labBooking) {
      return res.status(404).json({ message: 'Lab booking not found' })
    }
    
    if (labBooking.userId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to cancel this lab booking' })
    }
    
    if (labBooking.status === 'cancelled') {
      return res.status(400).json({ message: 'This lab booking is already cancelled' })
    }
    
    if (new Date(labBooking.bookingDate) < new Date()) {
      return res.status(400).json({ message: 'Cannot cancel past lab bookings' })
    }
    
    await prisma.labBooking.update({
      where: { id: req.query.id },
      data: { status: 'cancelled' }
    })
    
    res.status(200).json({ message: 'Lab booking cancelled successfully' })
  } catch (error) {
    res.status(500).json({ message: 'Server error while cancelling lab booking' })
  }
}


