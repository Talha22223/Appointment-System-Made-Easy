import prisma from '../prisma'

// Prescription helper functions that replicate Mongoose model behavior
const Prescription = {
  // Find one prescription by query
  async findOne(query) {
    const where = {}
    if (query.id) where.id = query.id
    if (query.patientId) where.patientId = query.patientId
    if (query.doctorId) where.doctorId = query.doctorId
    
    const prescription = await prisma.prescription.findFirst({ where })
    if (prescription) {
      prescription._id = prescription.id
    }
    return prescription
  },

  // Find prescription by ID
  async findById(id) {
    if (!id) return null
    const prescription = await prisma.prescription.findUnique({ where: { id } })
    if (prescription) {
      prescription._id = prescription.id
    }
    return prescription
  },

  // Find all prescriptions with optional query
  async find(query = {}) {
    const where = {}
    if (query.patientId) where.patientId = query.patientId
    if (query.doctorId) where.doctorId = query.doctorId
    
    const prescriptions = await prisma.prescription.findMany({ where })
    
    // Return chainable object that supports .populate() and .sort()
    return {
      _prescriptions: prescriptions,
      _where: where,
      
      populate(config) {
        this._populateConfig = this._populateConfig || []
        if (typeof config === 'string') {
          this._populateConfig.push({ path: config })
        } else {
          this._populateConfig.push(config)
        }
        return this
      },
      
      sort(sortConfig) {
        this._sortConfig = sortConfig
        return this
      },
      
      async then(resolve) {
        let include = {}
        
        // Process populate configs
        if (this._populateConfig) {
          for (const config of this._populateConfig) {
            const path = config.path || config
            if (path === 'patientId' || path === 'patient') {
              include.patient = { select: buildSelect(config.select) }
            }
            if (path === 'doctorId' || path === 'doctor') {
              include.doctor = { select: buildSelect(config.select) }
            }
            if (path === 'appointmentId' || path === 'appointment') {
              include.appointment = true
            }
          }
        }
        
        // Re-fetch with includes
        const results = await prisma.prescription.findMany({
          where: this._where,
          include: Object.keys(include).length > 0 ? include : undefined,
          orderBy: this._sortConfig ? parseSort(this._sortConfig) : { createdAt: 'desc' }
        })
        
        // Process results for backward compatibility
        const processed = results.map(presc => {
          const obj = {
            ...presc,
            _id: presc.id
          }
          // Map relations to match Mongoose populate pattern
          if (presc.patient) {
            obj.patientId = { ...presc.patient, _id: presc.patient.id }
          }
          if (presc.doctor) {
            obj.doctorId = { ...presc.doctor, _id: presc.doctor.id }
          }
          return obj
        })
        
        resolve(processed)
      }
    }
  },

  // Create a new prescription (for backward compatibility with new Prescription() pattern)
  create(data) {
    const prescriptionData = {
      patientId: data.patientId,
      doctorId: data.doctorId,
      appointmentId: data.appointmentId || null,
      medicines: data.medicines || [],
      diagnosis: data.diagnosis || null,
      advice: data.advice || null,
      followUp: data.followUp ? new Date(data.followUp) : null
    }
    
    return {
      ...prescriptionData,
      async save() {
        const prescription = await prisma.prescription.create({
          data: prescriptionData
        })
        
        prescription._id = prescription.id
        return prescription
      }
    }
  }
}

// Helper to build select object from string
function buildSelect(selectString) {
  if (!selectString) return undefined
  const fields = selectString.split(' ')
  const select = {}
  fields.forEach(field => {
    select[field] = true
  })
  select.id = true // Always include id
  return select
}

// Helper to parse sort config
function parseSort(sortConfig) {
  if (typeof sortConfig === 'object') {
    const orderBy = []
    Object.keys(sortConfig).forEach(key => {
      orderBy.push({ [key]: sortConfig[key] === -1 ? 'desc' : 'asc' })
    })
    return orderBy
  }
  return { createdAt: 'desc' }
}

// Helper function to create a new Prescription instance
export function createPrescription(data) {
  return Prescription.create(data)
}

export default Prescription

