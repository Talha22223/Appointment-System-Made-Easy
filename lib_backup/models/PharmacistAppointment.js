// lib/models/PharmacistAppointment.js
import mongoose from 'mongoose';

const pharmacistAppointmentSchema = new mongoose.Schema({
  pharmacistId: { type: mongoose.Schema.Types.ObjectId, ref: 'Pharmacist' },
  pharmacistDetails: { type: Object, default: {} },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  appointmentDate: { type: Date, required: true },
  purpose: { type: String, default: 'Medication Consultation' },
  method: { 
    type: String, 
    enum: ['In Person', 'Video Call', 'Phone Call'], 
    default: 'In Person' 
  },
  notes: { type: String },
  status: { 
    type: String, 
    enum: ['pending', 'confirmed', 'cancelled', 'completed', 'rejected'], 
    default: 'pending' 
  },
}, { timestamps: true });

const PharmacistAppointment = mongoose.models.PharmacistAppointment || 
  mongoose.model('PharmacistAppointment', pharmacistAppointmentSchema);

export const createPharmacistAppointment = (data) => {
  return new PharmacistAppointment(data);
};

export default PharmacistAppointment;
