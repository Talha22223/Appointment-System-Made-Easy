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
    
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' })
    }
  } catch (error) {
    return res.status(401).json({ message: 'Token verification failed' })
  }

  await connectDB()

  try {
    const { id } = req.query
    const { status } = req.body
    
    if (!status) {
      return res.status(400).json({ message: 'Status is required' })
    }
    
    const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed', 'rejected']
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' })
    }
    
    const appointment = await prisma.pharmacistAppointment.findUnique({
      where: { id }
    })
    
    if (!appointment) {
      return res.status(404).json({ message: 'Pharmacist appointment not found' })
    }
    
    const updatedAppointment = await prisma.pharmacistAppointment.update({
      where: { id },
      data: { status },
      include: {
        pharmacist: {
          select: {
            id: true,
            name: true,
            speciality: true,
            image: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })
    
    res.status(200).json({
      message: `Pharmacist appointment status updated to ${status}`,
      appointment: {
        ...updatedAppointment,
        _id: updatedAppointment.id,
        pharmacist: updatedAppointment.pharmacist ? 
          { ...updatedAppointment.pharmacist, _id: updatedAppointment.pharmacist.id } : 
          updatedAppointment.pharmacistDetails,
        user: updatedAppointment.user ? 
          { ...updatedAppointment.user, _id: updatedAppointment.user.id } : 
          null
      }
    })
  } catch (error) {
    console.error('Update pharmacist appointment status error:', error)
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}
