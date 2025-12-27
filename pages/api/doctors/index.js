// pages/api/doctors/index.js

import { connectDB } from '../../../lib/database';
import { withAdmin } from '../../../lib/auth';
import Doctor, { createDoctor } from '../../../lib/models/Doctor';
import prisma from '../../../lib/prisma';
import bcrypt from 'bcryptjs';
import { applyCors } from '../../../lib/cors';

// 🧠 GET: Fetch all available doctors
async function handleGet(req, res) {
  await connectDB();

  try {
    const doctors = await prisma.doctor.findMany({
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
    const doctorsWithId = doctors.map(d => ({ ...d, _id: d.id }));
    return res.status(200).json(doctorsWithId);
  } catch (error) {
    console.error('GET /api/doctors error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// 🧠 POST: Add a new doctor (protected route)
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

    if (!name || !email || !password || !speciality) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const existingDoctor = await Doctor.findOne({ email });
    if (existingDoctor) {
      return res.status(400).json({ message: 'Doctor with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const doctor = createDoctor({
      name,
      email,
      password: hashedPassword,
      speciality,
      degree,
      experience,
      fees: Number(fees),
      about: about || '',
      image: image || '',
      available: available !== undefined ? available : true,
    });

    const savedDoctor = await doctor.save();

    const doctorResponse = { ...savedDoctor };
    delete doctorResponse.password;

    return res.status(201).json({
      message: 'Doctor added successfully',
      doctor: doctorResponse,
    });
  } catch (error) {
    console.error('POST /api/doctors error:', error);
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
