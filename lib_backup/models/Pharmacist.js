// lib/models/Pharmacist.js
import mongoose from 'mongoose';

const pharmacistSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  speciality: { type: String, default: 'General Pharmacy' },
  degree: { type: String, required: true },
  experience: { type: String, required: true },
  fees: { type: Number, required: true },
  image: { type: String, default: '' },
  about: { type: String, default: '' },
  available: { type: Boolean, default: true },
  address: { type: Object, default: {} },
  slotsBooked: { type: Object, default: {} },
  role: { type: String, default: 'pharmacist' },
}, { timestamps: true });

const Pharmacist = mongoose.models.Pharmacist || mongoose.model('Pharmacist', pharmacistSchema);

export const createPharmacist = (data) => {
  return new Pharmacist(data);
};

export default Pharmacist;
