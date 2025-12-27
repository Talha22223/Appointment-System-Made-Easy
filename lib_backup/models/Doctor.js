import prisma from '../prisma'

// Doctor helper functions that replicate Mongoose model behavior
const Doctor = {
  // Find one doctor by query
  async findOne(query) {
    const where = {}
    if (query.email) where.email = query.email
    if (query.userId) where.userId = query.userId
    if (query.id) where.id = query.id
    
    const doctor = await prisma.doctor.findFirst({ where })
    if (doctor) {
      doctor._id = doctor.id // Backward compatibility
      doctor.toObject = () => ({ ...doctor })
    }
    return doctor
  },

  // Find doctor by ID
  async findById(id) {
    if (!id) return null
    const doctor = await prisma.doctor.findUnique({ where: { id } })
    if (doctor) {
      doctor._id = doctor.id // Backward compatibility
      doctor.toObject = () => ({ ...doctor })
    }
    return doctor
  },

  // Find all doctors with optional query
  async find(query = {}) {
    const where = {}
    if (query.available !== undefined) where.available = query.available
    if (query.speciality) where.speciality = query.speciality
    
    const doctors = await prisma.doctor.findMany({ where })
    return {
      select: (fields) => {
        const exclude = fields.startsWith('-')
        const fieldList = fields.replace('-', '').split(' ')
        
        return doctors.map(doctor => {
          const doc = { ...doctor, _id: doctor.id }
          if (exclude) {
            fieldList.forEach(field => delete doc[field])
          }
          return doc
        })
      },
      then: (resolve) => resolve(doctors.map(d => ({ ...d, _id: d.id })))
    }
  },

  // Find by ID and update
  async findByIdAndUpdate(id, updates, options = {}) {
    if (!id) return null
    
    // Remove undefined values
    const data = {}
    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        data[key] = updates[key]
      }
    })
    
    const doctor = await prisma.doctor.update({
      where: { id },
      data
    })
    
    if (doctor) {
      doctor._id = doctor.id
      if (options.select) {
        const exclude = options.select.startsWith('-')
        const fieldList = options.select.replace('-', '').split(' ')
        if (exclude) {
          fieldList.forEach(field => delete doctor[field])
        }
      }
    }
    return doctor
  },

  // Find by ID and delete
  async findByIdAndDelete(id) {
    if (!id) return null
    try {
      const doctor = await prisma.doctor.delete({ where: { id } })
      if (doctor) doctor._id = doctor.id
      return doctor
    } catch (error) {
      return null
    }
  },

  // Create a new doctor (for backward compatibility with new Doctor() pattern)
  create(data) {
    return {
      ...data,
      toObject() {
        return { ...this }
      },
      async save() {
        const doctor = await prisma.doctor.create({
          data: {
            name: data.name,
            email: data.email,
            password: data.password,
            speciality: data.speciality,
            degree: data.degree,
            experience: data.experience,
            fees: Number(data.fees),
            image: data.image || '',
            about: data.about || '',
            available: data.available !== undefined ? data.available : true,
            address: data.address || {},
            slotsBooked: data.slots_booked || {},
            role: data.role || 'doctor'
          }
        })
        
        doctor._id = doctor.id
        doctor.toObject = () => ({ ...doctor })
        return doctor
      }
    }
  }
}

// Helper function to create a new Doctor instance
export function createDoctor(data) {
  return Doctor.create(data)
}

export default Doctor

