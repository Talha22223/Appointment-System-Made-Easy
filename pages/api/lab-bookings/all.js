import { connectDB } from '../../../lib/database'
import { withAdmin } from '../../../lib/auth'
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
    const labBookings = await prisma.labBooking.findMany({
      include: {
        labTechnique: {
          select: {
            id: true,
            name: true,
            category: true,
            image: true,
            duration: true,
            price: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        }
      },
      orderBy: { bookingDate: 'desc' }
    })
    
    const processedLabBookings = labBookings.map(booking => {
      const bookingObj = {
        ...booking,
        _id: booking.id
      }
      
      if (!bookingObj.labTechnique || !bookingObj.labTechnique.name) {
        bookingObj.labTechnique = bookingObj.labTechniqueDetails || {
          name: 'Unknown Test',
          category: 'Not specified'
        }
      } else {
        bookingObj.labTechnique = {
          ...bookingObj.labTechnique,
          _id: bookingObj.labTechnique.id
        }
      }
      
      if (bookingObj.user) {
        bookingObj.user = {
          ...bookingObj.user,
          _id: bookingObj.user.id
        }
      }
      
      return bookingObj
    })
    
    res.status(200).json(processedLabBookings)
  } catch (error) {
    console.error('Error fetching all lab bookings:', error)
    res.status(500).json({ message: 'Server error while fetching lab bookings' })
  }
}

export default withAdmin(handler)
