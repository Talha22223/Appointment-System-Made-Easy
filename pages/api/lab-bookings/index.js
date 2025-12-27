import { connectDB } from '../../../lib/database'
import jwt from 'jsonwebtoken'
import prisma from '../../../lib/prisma'
import { applyCors } from '../../../lib/cors'

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
    const { labTechniqueId, labTechniqueData, bookingDate, notes } = req.body
    
    if (!labTechniqueId && !labTechniqueData) {
      return res.status(400).json({ message: 'Lab technique information is required' })
    }
    
    if (!bookingDate) {
      return res.status(400).json({ message: 'Booking date is required' })
    }
    
    // Check if labTechniqueId is a valid ID
    const isValidLabTechniqueId = labTechniqueId && typeof labTechniqueId === 'string' && labTechniqueId.length > 5
    
    if (!isValidLabTechniqueId) {
      // Create booking without lab technique reference, just with labTechniqueDetails
      const labBooking = await prisma.labBooking.create({
        data: {
          labTechniqueDetails: labTechniqueData || { name: 'Unknown Test', category: 'Not specified' },
          userId: req.user.id,
          bookingDate: new Date(bookingDate),
          notes: notes || null,
          status: 'pending'
        }
      })
      
      return res.status(201).json({
        message: 'Lab test booking created successfully',
        labBooking: {
          id: labBooking.id,
          labTechniqueName: labTechniqueData?.name || 'Unknown Test',
          bookingDate: labBooking.bookingDate,
          status: labBooking.status
        }
      })
    }
    
    // Create booking with lab technique reference
    const labBooking = await prisma.labBooking.create({
      data: {
        labTechniqueId: labTechniqueId,
        labTechniqueDetails: labTechniqueData || { name: 'Unknown Test', category: 'Not specified' },
        userId: req.user.id,
        bookingDate: new Date(bookingDate),
        notes: notes || null,
        status: 'pending'
      }
    })
    
    res.status(201).json({
      message: 'Lab test booking created successfully',
      labBooking: {
        id: labBooking.id,
        labTechniqueName: labTechniqueData?.name || 'Unknown Test',
        bookingDate: labBooking.bookingDate,
        status: labBooking.status
      }
    })
  } catch (error) {
    console.error('Error creating lab booking:', error)
    res.status(500).json({ message: 'Server error while creating lab booking', error: error.message })
  }
}


