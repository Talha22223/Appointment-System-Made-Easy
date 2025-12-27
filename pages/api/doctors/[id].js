import { connectDB } from '../../../lib/database'
import { withAdmin, withDoctor } from '../../../lib/auth'
import prisma from '../../../lib/prisma'
import { applyCors } from '../../../lib/cors'

async function handleGet(req, res) {
  await connectDB()
  
  try {
    const doctor = await prisma.doctor.findUnique({
      where: { id: req.query.id },
      select: {
        id: true,
        name: true,
        email: true,
        speciality: true,
        degree: true,
        experience: true,
        fees: true,
        image: true,
        about: true,
        available: true,
        address: true,
        slotsBooked: true,
        role: true,
        createdAt: true
      }
    })
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' })
    }
    res.json({ ...doctor, _id: doctor.id })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

async function handlePut(req, res) {
  await connectDB()
  
  try {
    const updates = req.body
    delete updates.password

    // Build update data object
    const data = {}
    if (updates.name !== undefined) data.name = updates.name
    if (updates.email !== undefined) data.email = updates.email
    if (updates.speciality !== undefined) data.speciality = updates.speciality
    if (updates.degree !== undefined) data.degree = updates.degree
    if (updates.experience !== undefined) data.experience = updates.experience
    if (updates.fees !== undefined) data.fees = Number(updates.fees)
    if (updates.image !== undefined) data.image = updates.image
    if (updates.about !== undefined) data.about = updates.about
    if (updates.available !== undefined) data.available = updates.available
    if (updates.address !== undefined) data.address = updates.address

    const doctor = await prisma.doctor.update({
      where: { id: req.query.id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        speciality: true,
        degree: true,
        experience: true,
        fees: true,
        image: true,
        about: true,
        available: true,
        address: true,
        slotsBooked: true,
        role: true,
        createdAt: true
      }
    })

    res.json({ message: 'Doctor updated successfully', doctor: { ...doctor, _id: doctor.id } })
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Doctor not found' })
    }
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

async function handleDelete(req, res) {
  await connectDB()
  
  try {
    await prisma.doctor.delete({ where: { id: req.query.id } })
    res.json({ message: 'Doctor deleted successfully' })
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Doctor not found' })
    }
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

export default async function handler(req, res) {
  // Handle CORS
  if (applyCors(req, res)) return
  
  if (req.method === 'GET') {
    return handleGet(req, res)
  } else if (req.method === 'PUT') {
    return withDoctor(handlePut)(req, res)
  } else if (req.method === 'DELETE') {
    return withAdmin(handleDelete)(req, res)
  } else {
    res.status(405).json({ message: 'Method not allowed' })
  }
}
