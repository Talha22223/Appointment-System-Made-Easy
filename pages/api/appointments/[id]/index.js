import { connectDB } from '../../../../lib/database'
import { withAuth } from '../../../../lib/auth'
import prisma from '../../../../lib/prisma'
import { applyCors } from '../../../../lib/cors'

// Map enum value back to display string
function mapEnumToMethod(enumValue) {
  const methodMap = {
    'InPerson': 'In Person',
    'VideoCall': 'Video Call',
    'PhoneCall': 'Phone Call'
  }
  return methodMap[enumValue] || 'In Person'
}

async function handler(req, res) {
  // Handle CORS
  if (applyCors(req, res)) return
  
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  await connectDB()

  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id: req.query.id },
      include: {
        doctor: {
          select: {
            id: true,
            name: true,
            speciality: true,
            image: true,
            email: true
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
      
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' })
    }
    
    const userIsPatient = appointment.userId === req.user.id
    const userIsDoctor = appointment.doctorId === req.user.id
    
    if (!userIsPatient && !userIsDoctor && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view this appointment' })
    }
    
    // Build response object
    const appointmentObj = {
      ...appointment,
      _id: appointment.id,
      method: mapEnumToMethod(appointment.method)
    }
    
    if (appointment.user) {
      appointmentObj.user = { ...appointment.user, _id: appointment.user.id }
    }
    
    if (!appointment.doctor && appointment.doctorDetails) {
      appointmentObj.doctor = appointment.doctorDetails
    } else if (appointment.doctor) {
      appointmentObj.doctor = { ...appointment.doctor, _id: appointment.doctor.id }
    }
    
    res.status(200).json(appointmentObj)
  } catch (error) {
    res.status(500).json({ message: 'Server error while fetching appointment details' })
  }
}

export default withAuth(handler)
