import { connectDB } from '../../../lib/database'
import { withAuth } from '../../../lib/auth'
import prisma from '../../../lib/prisma'
import bcrypt from 'bcryptjs'
import { applyCors } from '../../../lib/cors'

async function handler(req, res) {
  // Handle CORS
  if (applyCors(req, res)) return
  
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  await connectDB()

  try {
    const { currentPassword, newPassword } = req.body
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' })
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters long' })
    }
    
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    })
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }
    
    const isMatch = await bcrypt.compare(currentPassword, user.password)
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' })
    }
    
    // Hash new password
    const salt = await bcrypt.genSalt(12)
    const hashedPassword = await bcrypt.hash(newPassword, salt)
    
    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashedPassword }
    })
    
    res.status(200).json({ message: 'Password updated successfully' })
  } catch (error) {
    res.status(500).json({ message: 'Server error while changing password' })
  }
}

export default withAuth(handler)
