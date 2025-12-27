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
    const prescription = await prisma.prescription.findUnique({
      where: { id: req.query.id },
      include: {
        doctor: {
          select: {
            id: true,
            name: true,
            email: true,
            speciality: true,
            degree: true
          }
        },
        patient: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })
    
    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' })
    }
    
    // Map for backward compatibility
    const mappedPrescription = {
      ...prescription,
      _id: prescription.id,
      doctorId: prescription.doctor ? { ...prescription.doctor, _id: prescription.doctor.id } : null,
      patientId: prescription.patient ? { ...prescription.patient, _id: prescription.patient.id } : null
    }
    
    res.status(200).json(mappedPrescription)
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

export default withAuth(handler)
