import { connectDB } from '../../../lib/database'
import { withAuth } from '../../../lib/auth'
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

async function handler(req, res) {
  // Handle CORS
  if (applyCors(req, res)) return
  
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  await connectDB()

  try {
    const appointments = await prisma.appointment.findMany({
      where: { doctorId: req.user.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { appointmentDate: 'desc' }
    })
    
    // Process appointments for backward compatibility
    const processedAppointments = appointments.map(appt => ({
      ...appt,
      _id: appt.id,
      method: mapEnumToMethod(appt.method),
      user: appt.user ? { ...appt.user, _id: appt.user.id } : null
    }))
      
    res.status(200).json(processedAppointments)
  } catch (error) {
    res.status(500).json({ message: 'Server error while fetching appointments' })
  }
}

export default withAuth(handler)
