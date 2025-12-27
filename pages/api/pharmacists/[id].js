import { connectDB } from '../../../lib/database'
import { withAdmin } from '../../../lib/auth'
import prisma from '../../../lib/prisma'
import { applyCors } from '../../../lib/cors'

async function handleGet(req, res) {
  await connectDB()
  
  try {
    const pharmacist = await prisma.pharmacist.findUnique({
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
    if (!pharmacist) {
      return res.status(404).json({ message: 'Pharmacist not found' })
    }
    res.json({ ...pharmacist, _id: pharmacist.id })
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

    const pharmacist = await prisma.pharmacist.update({
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

    res.json({ message: 'Pharmacist updated successfully', pharmacist: { ...pharmacist, _id: pharmacist.id } })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

async function handleDelete(req, res) {
  await connectDB()
  
  try {
    await prisma.pharmacist.delete({
      where: { id: req.query.id }
    })
    res.json({ message: 'Pharmacist deleted successfully' })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

export default async function handler(req, res) {
  if (applyCors(req, res)) return

  try {
    if (req.method === 'GET') {
      return handleGet(req, res)
    } else if (req.method === 'PUT') {
      return withAdmin(handlePut)(req, res)
    } else if (req.method === 'DELETE') {
      return withAdmin(handleDelete)(req, res)
    } else {
      res.setHeader('Allow', ['GET', 'PUT', 'DELETE', 'OPTIONS'])
      return res.status(405).json({ message: `Method ${req.method} Not Allowed` })
    }
  } catch (error) {
    return res.status(500).json({ message: 'Unexpected server error', error: error.message })
  }
}
