import { connectDB } from '../../../lib/database'
import jwt from 'jsonwebtoken'
import prisma from '../../../lib/prisma'
import { applyCors } from '../../../lib/cors'

// Map enum value back to display string
function mapEnumToMethod(enumValue) {
  const methodMap = {
    'InPerson': 'In Person',
    'VideoCall': 'Video Call',
    'PhoneCall': 'Phone Call'
  }
  return methodMap[enumValue] || 'In Person'
}

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
    const appointments = await prisma.pharmacistAppointment.findMany({
      include: {
        pharmacist: {
          select: {
            id: true,
            name: true,
            speciality: true,
            image: true,
            email: true,
            degree: true,
            experience: true,
            fees: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        }
      },
      orderBy: { appointmentDate: 'desc' }
    })
    
    const processedAppointments = appointments.map(appointment => {
      const appointmentObj = {
        ...appointment,
        _id: appointment.id,
        method: mapEnumToMethod(appointment.method)
      }
      
      if (!appointmentObj.pharmacist && appointmentObj.pharmacistDetails) {
        appointmentObj.pharmacist = appointmentObj.pharmacistDetails
      } else if (appointmentObj.pharmacist) {
        appointmentObj.pharmacist = { ...appointmentObj.pharmacist, _id: appointmentObj.pharmacist.id }
      }
      
      if (appointmentObj.user) {
        appointmentObj.user = { ...appointmentObj.user, _id: appointmentObj.user.id }
      }
      
      return appointmentObj
    })
    
    res.status(200).json(processedAppointments)
  } catch (error) {
    console.error('Get all pharmacist appointments error:', error)
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}
