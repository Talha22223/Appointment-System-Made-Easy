import { connectDB } from '../../../lib/database'
import jwt from 'jsonwebtoken'
import prisma from '../../../lib/prisma'
import { applyCors } from '../../../lib/cors'

export default async function handler(req, res) {
  // Handle CORS first - this will handle OPTIONS and return early
  if (applyCors(req, res)) return
  
  if (req.method !== 'GET') {
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
    const labBookings = await prisma.labBooking.findMany({
      where: { userId: req.user.id },
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
      
      return bookingObj
    })
    
    res.status(200).json(processedLabBookings)
  } catch (error) {
    console.error('Error fetching patient lab bookings:', error)
    res.status(500).json({ message: 'Server error while fetching lab bookings' })
  }
}
