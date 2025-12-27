import { connectDB } from '../../../lib/database'
import User from '../../../lib/models/User'
import jwt from 'jsonwebtoken'
import { applyCors } from '../../../lib/cors'

export default async function handler(req, res) {
  // Handle CORS
  if (applyCors(req, res)) return

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  await connectDB()

  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        message: 'Email and password are required'
      })
    }

    const user = await User.findOne({ email: email.toLowerCase() })
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    const isMatch = await user.validatePassword(password)
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    )

    res.status(200).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}
