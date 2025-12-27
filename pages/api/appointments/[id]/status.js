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
    
    if (!status || !['pending', 'confirmed', 'cancelled', 'completed', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' })
    }
    
    const appointment = await prisma.appointment.findUnique({
      where: { id: req.query.id }
    })
    
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' })
    }
    
    // Allow users to manage their own appointments, or admins to manage any appointment
    if (req.user.role !== 'admin' && appointment.userId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied. You can only manage your own appointments.' })
    }
    
    await prisma.appointment.update({
      where: { id: req.query.id },
      data: { status }
    })
    
    res.status(200).json({ message: 'Appointment status updated successfully', status })
  } catch (error) {
    console.error('Error updating appointment status:', error)
    res.status(500).json({ message: 'Server error while updating appointment' })
  }
}
