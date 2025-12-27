import { connectDB } from '../../../../lib/database'
import { withAuth } from '../../../../lib/auth'
import prisma from '../../../../lib/prisma'
import { applyCors } from '../../../../lib/cors'

async function handler(req, res) {
  // Handle CORS
  if (applyCors(req, res)) return
  
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  await connectDB()

  try {
    const labBooking = await prisma.labBooking.findUnique({
      where: { id: req.query.id },
      include: {
        labTechnique: {
          select: {
            id: true,
            name: true,
            category: true,
            image: true,
            duration: true,
            price: true,
            requirements: true,
            preparation: true
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
      
    if (!labBooking) {
      return res.status(404).json({ message: 'Lab booking not found' })
    }
    
    const userIsPatient = labBooking.userId === req.user.id
    
    if (!userIsPatient && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view this lab booking' })
    }
    
    // Build response object
    const bookingObj = {
      ...labBooking,
      _id: labBooking.id
    }
    
    if (labBooking.user) {
      bookingObj.user = { ...labBooking.user, _id: labBooking.user.id }
    }
    
    if (!labBooking.labTechnique && labBooking.labTechniqueDetails) {
      bookingObj.labTechnique = labBooking.labTechniqueDetails
    } else if (labBooking.labTechnique) {
      bookingObj.labTechnique = { ...labBooking.labTechnique, _id: labBooking.labTechnique.id }
    }
    
    res.status(200).json(bookingObj)
  } catch (error) {
    res.status(500).json({ message: 'Server error while fetching lab booking details' })
  }
}

export default withAuth(handler)
