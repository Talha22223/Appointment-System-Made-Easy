import { connectDB } from '../../../lib/database'
import jwt from 'jsonwebtoken'
import prisma from '../../../lib/prisma'
import { applyCors } from '../../../lib/cors'

// Map method string to enum value
function mapMethodToEnum(method) {
  const methodMap = {
    'In Person': 'InPerson',
    'Video Call': 'VideoCall',
    'Phone Call': 'PhoneCall'
  }
  return methodMap[method] || 'InPerson'
}

export default async function handler(req, res) {
  // Handle CORS first
  if (applyCors(req, res)) return
  
  if (req.method !== 'POST') {
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
    const { doctorId, doctorData, appointmentDate, purpose, method, notes } = req.body
    
    if (!doctorId && !doctorData) {
      return res.status(400).json({ message: 'Doctor information is required' })
    }
    
    if (!appointmentDate) {
      return res.status(400).json({ message: 'Appointment date is required' })
    }
    
    // Check if doctorId is a valid ID (for Prisma, we check if it's a non-empty string)
    const isValidDoctorId = doctorId && typeof doctorId === 'string' && doctorId.length > 5
    
    if (!isValidDoctorId) {
      // Create appointment without doctor reference, just with doctorDetails
      const appointment = await prisma.appointment.create({
        data: {
          doctorDetails: doctorData || { name: 'Unknown Doctor', speciality: 'Not specified' },
          userId: req.user.id,
          appointmentDate: new Date(appointmentDate),
          purpose: purpose || 'General Checkup',
          method: mapMethodToEnum(method || 'In Person'),
          notes: notes || null,
          status: 'pending'
        }
      })
      
      return res.status(201).json({
        message: 'Appointment created successfully',
        appointment: {
          id: appointment.id,
          doctorName: doctorData?.name || 'Unknown Doctor',
          appointmentDate: appointment.appointmentDate,
          status: appointment.status
        }
      })
    }
    
    // Create appointment with doctor reference
    const appointment = await prisma.appointment.create({
      data: {
        doctorId: doctorId,
        doctorDetails: doctorData || { name: 'Unknown Doctor', speciality: 'Not specified' },
        userId: req.user.id,
        appointmentDate: new Date(appointmentDate),
        purpose: purpose || 'General Checkup',
        method: mapMethodToEnum(method || 'In Person'),
        notes: notes || null,
        status: 'pending'
      }
    })
    
    res.status(201).json({
      message: 'Appointment created successfully',
      appointment: {
        id: appointment.id,
        doctorName: doctorData?.name || 'Unknown Doctor',
        appointmentDate: appointment.appointmentDate,
        status: appointment.status
      }
    })
  } catch (error) {
    console.error('Error creating appointment:', error)
    res.status(500).json({ message: 'Server error while creating appointment', error: error.message })
  }
}


