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
    const { status } = req.body
    
    if (!status) {
      return res.status(400).json({ message: 'Status is required' })
    }
    
    const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed', 'rejected']
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' })
    }
    
    const labBooking = await prisma.labBooking.findUnique({
      where: { id: req.query.id }
    })
    
    if (!labBooking) {
      return res.status(404).json({ message: 'Lab booking not found' })
    }
    
    // Allow users to manage their own bookings, or admins to manage any booking
    if (req.user.role !== 'admin' && labBooking.userId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied. You can only manage your own bookings.' })
    }
    
    const updatedLabBooking = await prisma.labBooking.update({
      where: { id: req.query.id },
      data: { status }
    })
    
    res.status(200).json({ 
      message: 'Lab booking status updated successfully',
      labBooking: { ...updatedLabBooking, _id: updatedLabBooking.id }
    })
  } catch (error) {
    console.error('Error updating lab booking status:', error)
    res.status(500).json({ message: 'Server error while updating lab booking status' })
  }
}
