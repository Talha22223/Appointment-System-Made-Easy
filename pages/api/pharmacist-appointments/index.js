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
    const { pharmacistId, pharmacistData, appointmentDate, purpose, method, notes } = req.body
    
    if (!pharmacistId && !pharmacistData) {
      return res.status(400).json({ message: 'Pharmacist information is required' })
    }
    
    if (!appointmentDate) {
      return res.status(400).json({ message: 'Appointment date is required' })
    }
    
    // Check if pharmacistId is a valid ID
    const isValidPharmacistId = pharmacistId && typeof pharmacistId === 'string' && pharmacistId.length > 5
    
    if (!isValidPharmacistId) {
      // Create appointment without pharmacist reference, just with pharmacistDetails
      const appointment = await prisma.pharmacistAppointment.create({
        data: {
          pharmacistDetails: pharmacistData || { name: 'Unknown Pharmacist', speciality: 'General Pharmacy' },
          userId: req.user.id,
          appointmentDate: new Date(appointmentDate),
          purpose: purpose || 'Medication Consultation',
          method: mapMethodToEnum(method || 'In Person'),
          notes: notes || null,
          status: 'pending'
        }
      })
      
      return res.status(201).json({
        message: 'Pharmacist appointment created successfully',
        appointment: {
          id: appointment.id,
          pharmacistName: pharmacistData?.name || 'Unknown Pharmacist',
          appointmentDate: appointment.appointmentDate,
          status: appointment.status
        }
      })
    }
    
    // Create appointment with pharmacist reference
    const appointment = await prisma.pharmacistAppointment.create({
      data: {
        pharmacistId: pharmacistId,
        pharmacistDetails: pharmacistData || { name: 'Unknown Pharmacist', speciality: 'General Pharmacy' },
        userId: req.user.id,
        appointmentDate: new Date(appointmentDate),
        purpose: purpose || 'Medication Consultation',
        method: mapMethodToEnum(method || 'In Person'),
        notes: notes || null,
        status: 'pending'
      }
    })
    
    res.status(201).json({
      message: 'Pharmacist appointment created successfully',
      appointment: {
        id: appointment.id,
        pharmacistName: pharmacistData?.name || 'Unknown Pharmacist',
        appointmentDate: appointment.appointmentDate,
        status: appointment.status
      }
    })
  } catch (error) {
    console.error('Create pharmacist appointment error:', error)
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}
