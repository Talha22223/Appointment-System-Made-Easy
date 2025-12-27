import { connectDB } from '../../../lib/database'
import { withDoctor } from '../../../lib/auth'
import prisma from '../../../lib/prisma'
import { applyCors } from '../../../lib/cors'

async function handler(req, res) {
  // Handle CORS
  if (applyCors(req, res)) return
  
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  await connectDB()

  try {
    // Find doctor - the logged-in user is the doctor
    const doctor = await prisma.doctor.findUnique({
      where: { id: req.user.id }
    })
    
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found' })
    }
    
    const prescriptions = await prisma.prescription.findMany({
      where: { doctorId: doctor.id },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    
    // Map for backward compatibility
    const mappedPrescriptions = prescriptions.map(p => ({
      ...p,
      _id: p.id,
      patientId: p.patient ? { ...p.patient, _id: p.patient.id } : null
    }))
    
    res.status(200).json(mappedPrescriptions)
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

export default withDoctor(handler)
