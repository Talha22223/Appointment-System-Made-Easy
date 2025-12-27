import { connectDB } from '../../../lib/database'
import { withAuth } from '../../../lib/auth'
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
    const prescriptions = await prisma.prescription.findMany({
      where: { patientId: req.user.id },
      include: {
        doctor: {
          select: {
            id: true,
            name: true,
            email: true,
            speciality: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    
    // Map for backward compatibility
    const mappedPrescriptions = prescriptions.map(p => ({
      ...p,
      _id: p.id,
      doctorId: p.doctor ? { ...p.doctor, _id: p.doctor.id } : null
    }))
    
    res.status(200).json(mappedPrescriptions)
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

export default withAuth(handler)
