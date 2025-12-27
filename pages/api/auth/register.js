import { connectDB } from '../../../lib/database'
import User, { createUser } from '../../../lib/models/User'
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
    const { name, email, password, role } = req.body

    const existingUser = await User.findOne({
      email: email.toLowerCase()
    })

    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' })
    }

    const newUser = createUser({
      name,
      email: email.toLowerCase(),
      password,
      role: role || 'patient'
    })

    const savedUser = await newUser.save()

    const token = jwt.sign(
      { id: savedUser.id, role: savedUser.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    )

    res.status(201).json({
      token,
      user: {
        id: savedUser.id,
        name: savedUser.name,
        email: savedUser.email,
        role: savedUser.role
      }
    })
  } catch (error) {
    console.error('Registration error:', error)

    res.status(500).json({
      message: 'Server error',
      error: error.message
    })
  }
}
