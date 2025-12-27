import { connectDB } from '../../../../lib/database'
import jwt from 'jsonwebtoken'
import prisma from '../../../../lib/prisma'
import { applyCors } from '../../../../lib/cors'

export default async function handler(req, res) {
  // Handle CORS first
  if (applyCors(req, res)) return
  
  if (req.method !== 'PATCH' && req.method !== 'PUT') {
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
    const { id } = req.query
    
    const appointment = await prisma.pharmacistAppointment.findUnique({
      where: { id }
    })
    
    if (!appointment) {
      return res.status(404).json({ message: 'Pharmacist appointment not found' })
    }
    
    // Verify user owns this appointment
    if (appointment.userId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' })
    }
    
    // Only allow cancellation if not already cancelled or completed
    if (appointment.status === 'cancelled') {
      return res.status(400).json({ message: 'Appointment is already cancelled' })
    }
    
    if (appointment.status === 'completed') {
      return res.status(400).json({ message: 'Cannot cancel a completed appointment' })
    }
    
    const updatedAppointment = await prisma.pharmacistAppointment.update({
      where: { id },
      data: { status: 'cancelled' },
      include: {
        pharmacist: {
          select: {
            id: true,
            name: true,
            speciality: true
          }
        }
      }
    })
    
    res.status(200).json({
      message: 'Pharmacist appointment cancelled successfully',
      appointment: {
        ...updatedAppointment,
        _id: updatedAppointment.id,
        pharmacist: updatedAppointment.pharmacist ? 
          { ...updatedAppointment.pharmacist, _id: updatedAppointment.pharmacist.id } : 
          updatedAppointment.pharmacistDetails
      }
    })
  } catch (error) {
    console.error('Cancel pharmacist appointment error:', error)
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}
