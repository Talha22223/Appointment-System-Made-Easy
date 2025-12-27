import { connectDB } from '../../../lib/database'
import { withDoctor } from '../../../lib/auth'
import prisma from '../../../lib/prisma'
import { applyCors } from '../../../lib/cors'

async function handler(req, res) {
  // Handle CORS
  if (applyCors(req, res)) return
  
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  await connectDB()

  try {
    const { patientId, appointmentId, medicines, diagnosis, advice, followUp } = req.body
    
    // Find doctor by userId (the logged-in user's ID)
    const doctor = await prisma.doctor.findFirst({
      where: { id: req.user.id }
    })
    
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found' })
    }
    
    if (appointmentId) {
      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId }
      })
      
      if (!appointment) {
        return res.status(404).json({ message: 'Appointment not found' })
      }
      
      await prisma.appointment.update({
        where: { id: appointmentId },
        data: { status: 'completed' }
      })
    }
    
    const prescription = await prisma.prescription.create({
      data: {
        patientId,
        doctorId: doctor.id,
        appointmentId: appointmentId || null,
        medicines: medicines || [],
        diagnosis: diagnosis || null,
        advice: advice || null,
        followUp: followUp ? new Date(followUp) : null
      }
    })
    
    res.status(201).json({ ...prescription, _id: prescription.id })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

export default withDoctor(handler)
