// pages/api/pharmacists/index.js

import { connectDB } from '../../../lib/database';
import { withAdmin } from '../../../lib/auth';
import prisma from '../../../lib/prisma';
import bcrypt from 'bcryptjs';
import { applyCors } from '../../../lib/cors';

// 🧠 GET: Fetch all available pharmacists
async function handleGet(req, res) {
  await connectDB();

  try {
    const pharmacists = await prisma.pharmacist.findMany({
      where: { available: true },
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
    });
    // Add _id for backward compatibility
    const pharmacistsWithId = pharmacists.map(p => ({ ...p, _id: p.id }));
    return res.status(200).json(pharmacistsWithId);
  } catch (error) {
    console.error('GET /api/pharmacists error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// 🧠 POST: Add a new pharmacist (protected route)
async function handlePost(req, res) {
  await connectDB();

  try {
    const {
      name,
      email,
      password,
      speciality,
      degree,
      experience,
      fees,
      about,
      image,
      available,
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const existingPharmacist = await prisma.pharmacist.findUnique({ 
      where: { email } 
    });
    
    if (existingPharmacist) {
      return res.status(400).json({ message: 'Pharmacist with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const savedPharmacist = await prisma.pharmacist.create({
      data: {
        name,
        email,
        password: hashedPassword,
        speciality: speciality || 'General Pharmacy',
        degree: degree || 'B.Pharm',
        experience: experience || '1 Year',
        fees: Number(fees) || 30,
        about: about || '',
        image: image || '',
        available: available !== undefined ? available : true,
      }
    });

    const pharmacistResponse = { ...savedPharmacist, _id: savedPharmacist.id };
    delete pharmacistResponse.password;

    return res.status(201).json({
      message: 'Pharmacist added successfully',
      pharmacist: pharmacistResponse,
    });
  } catch (error) {
    console.error('POST /api/pharmacists error:', error);
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
