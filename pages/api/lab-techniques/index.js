// pages/api/lab-techniques/index.js

import { connectDB } from '../../../lib/database';
import { withAdmin } from '../../../lib/auth';
import LabTechnique, { createLabTechnique } from '../../../lib/models/LabTechnique';
import prisma from '../../../lib/prisma';
import { applyCors } from '../../../lib/cors';

// 🧠 GET: Fetch all available lab techniques
async function handleGet(req, res) {
  await connectDB();

  try {
    const labTechniques = await prisma.labTechnique.findMany({
      where: { available: true },
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
      },
      orderBy: { createdAt: 'desc' }
    });
    // Add _id for backward compatibility
    const labTechniquesWithId = labTechniques.map(lt => ({ ...lt, _id: lt.id }));
    return res.status(200).json(labTechniquesWithId);
  } catch (error) {
    console.error('GET /api/lab-techniques error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// 🧠 POST: Add a new lab technique (protected route)
async function handlePost(req, res) {
  await connectDB();

  try {
    const {
      name,
      description,
      category,
      duration,
      price,
      image,
      requirements,
      preparation,
      available,
    } = req.body;

    if (!name || !category || !price) {
      return res.status(400).json({ message: 'Missing required fields (name, category, price)' });
    }

    const existingLabTechnique = await LabTechnique.findOne({ name });
    if (existingLabTechnique) {
      return res.status(400).json({ message: 'Lab technique with this name already exists' });
    }

    const labTechnique = createLabTechnique({
      name,
      description: description || '',
      category,
      duration: duration || '30 mins',
      price: Number(price),
      image: image || '',
      requirements: requirements || '',
      preparation: preparation || '',
      available: available !== undefined ? available : true,
    });

    const savedLabTechnique = await labTechnique.save();

    return res.status(201).json({
      message: 'Lab technique added successfully',
      labTechnique: savedLabTechnique,
    });
  } catch (error) {
    console.error('POST /api/lab-techniques error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// 🧩 Main Handler
export default async function handler(req, res) {
  // ✅ Apply CORS first
  if (applyCors(req, res)) return;

  try {
    if (req.method === 'GET') {
      return handleGet(req, res);
    } else if (req.method === 'POST') {
      // Protected route
      return withAdmin(handlePost)(req, res);
    } else {
      res.setHeader('Allow', ['GET', 'POST', 'OPTIONS']);
      return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
    }
  } catch (error) {
    console.error('Handler error:', error);
    return res.status(500).json({ message: 'Unexpected server error', error: error.message });
  }
}
