import { connectDB } from '../../../lib/database'
import { withAuth } from '../../../lib/auth'
import prisma from '../../../lib/prisma'
import { applyCors } from '../../../lib/cors'

async function handler(req, res) {
  // Handle CORS
  if (applyCors(req, res)) return
  
  await connectDB()

  if (req.method === 'GET') {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          image: true,
          address: true,
          gender: true,
          dob: true,
          role: true,
          createdAt: true,
          updatedAt: true
        }
      })
      if (!user) {
        return res.status(404).json({ message: 'User not found' })
      }
      res.status(200).json({ ...user, _id: user.id })
    } catch (error) {
      res.status(500).json({ message: 'Server error while fetching profile' })
    }
  } else if (req.method === 'PUT') {
    try {
      const { name, phone, gender, dob, address } = req.body
      const user = await prisma.user.findUnique({
        where: { id: req.user.id }
      })
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' })
      }
      
      // Build update data
      const updateData = {}
      if (name) updateData.name = name
      if (phone) updateData.phone = phone
      if (gender) updateData.gender = gender
      if (dob) updateData.dob = dob
      if (address) {
        const currentAddress = user.address || {}
        updateData.address = {
          line1: address.line1 || currentAddress.line1 || '',
          line2: address.line2 || currentAddress.line2 || '',
          city: address.city || currentAddress.city || ''
        }
      }
      
      const updatedUser = await prisma.user.update({
        where: { id: req.user.id },
        data: updateData,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          image: true,
          address: true,
          gender: true,
          dob: true,
          role: true,
          createdAt: true,
          updatedAt: true
        }
      })
      
      res.status(200).json({ ...updatedUser, _id: updatedUser.id })
    } catch (error) {
      res.status(500).json({ message: 'Server error while updating profile' })
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' })
  }
}

export default withAuth(handler)
