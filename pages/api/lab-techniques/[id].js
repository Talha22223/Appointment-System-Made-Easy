import { connectDB } from '../../../lib/database'
import { withAdmin } from '../../../lib/auth'
import prisma from '../../../lib/prisma'
import { applyCors } from '../../../lib/cors'

async function handleGet(req, res) {
  await connectDB()
  
  try {
    const labTechnique = await prisma.labTechnique.findUnique({
      where: { id: req.query.id },
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        duration: true,
        price: true,
        image: true,
        requirements: true,
        preparation: true,
        available: true,
        slotsBooked: true,
        createdAt: true
      }
    })
    if (!labTechnique) {
      return res.status(404).json({ message: 'Lab technique not found' })
    }
    res.json({ ...labTechnique, _id: labTechnique.id })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

async function handlePut(req, res) {
  await connectDB()
  
  try {
    const updates = req.body

    // Build update data object
    const data = {}
    if (updates.name !== undefined) data.name = updates.name
    if (updates.description !== undefined) data.description = updates.description
    if (updates.category !== undefined) data.category = updates.category
    if (updates.duration !== undefined) data.duration = updates.duration
    if (updates.price !== undefined) data.price = Number(updates.price)
    if (updates.image !== undefined) data.image = updates.image
    if (updates.requirements !== undefined) data.requirements = updates.requirements
    if (updates.preparation !== undefined) data.preparation = updates.preparation
    if (updates.available !== undefined) data.available = updates.available

    const labTechnique = await prisma.labTechnique.update({
      where: { id: req.query.id },
      data,
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        duration: true,
        price: true,
        image: true,
        requirements: true,
        preparation: true,
        available: true,
        slotsBooked: true,
        createdAt: true
      }
    })

    res.json({ message: 'Lab technique updated successfully', labTechnique: { ...labTechnique, _id: labTechnique.id } })
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Lab technique not found' })
    }
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

async function handleDelete(req, res) {
  await connectDB()
  
  try {
    await prisma.labTechnique.delete({ where: { id: req.query.id } })
    res.json({ message: 'Lab technique deleted successfully' })
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Lab technique not found' })
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
    return withAdmin(handlePut)(req, res)
  } else if (req.method === 'DELETE') {
    return withAdmin(handleDelete)(req, res)
  } else {
    res.status(405).json({ message: 'Method not allowed' })
  }
}
