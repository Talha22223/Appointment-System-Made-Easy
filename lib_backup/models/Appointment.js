import prisma from '../prisma'

// Map method string to enum value
function mapMethodToEnum(method) {
  const methodMap = {
    'In Person': 'InPerson',
    'Video Call': 'VideoCall',
    'Phone Call': 'PhoneCall'
  }
  return methodMap[method] || 'InPerson'
}

// Map enum value back to display string
function mapEnumToMethod(enumValue) {
  const methodMap = {
    'InPerson': 'In Person',
    'VideoCall': 'Video Call',
    'PhoneCall': 'Phone Call'
  }
  return methodMap[enumValue] || 'In Person'
}

// Appointment helper functions that replicate Mongoose model behavior
const Appointment = {
  // Find one appointment by query
  async findOne(query) {
    const where = {}
    if (query.id) where.id = query.id
    if (query.userId) where.userId = query.userId
    if (query.doctorId) where.doctorId = query.doctorId
    
    const appointment = await prisma.appointment.findFirst({ where })
    if (appointment) {
      appointment._id = appointment.id
      appointment.method = mapEnumToMethod(appointment.method)
      appointment.toObject = () => ({ ...appointment, _id: appointment.id })
    }
    return appointment
  },

  // Find appointment by ID
  async findById(id) {
    if (!id) return null
    const appointment = await prisma.appointment.findUnique({ where: { id } })
    if (appointment) {
      appointment._id = appointment.id
      appointment.method = mapEnumToMethod(appointment.method)
      appointment.user = appointment.userId
      appointment.doctor = appointment.doctorId
      appointment.save = async () => {
        const updated = await prisma.appointment.update({
          where: { id: appointment.id },
          data: {
            status: appointment.status,
            notes: appointment.notes,
            purpose: appointment.purpose
          }
        })
        return { ...updated, _id: updated.id }
      }
      appointment.toObject = () => ({ ...appointment, _id: appointment.id })
    }
    return appointment
  },

  // Find all appointments with optional query
  async find(query = {}) {
    const where = {}
    if (query.user) where.userId = query.user
    if (query.userId) where.userId = query.userId
    if (query.doctor) where.doctorId = query.doctor
    if (query.doctorId) where.doctorId = query.doctorId
    if (query.status) where.status = query.status
    
    const appointments = await prisma.appointment.findMany({ where })
    
    // Return chainable object that supports .populate() and .sort()
    return {
      _appointments: appointments,
      
      populate(field, selectFields) {
        this._populateConfig = this._populateConfig || []
        this._populateConfig.push({ field, selectFields })
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
            if (config.field === 'doctor') {
              include.doctor = { select: buildSelect(config.selectFields) }
            }
            if (config.field === 'user') {
              include.user = { select: buildSelect(config.selectFields) }
            }
          }
        }
        
        // Re-fetch with includes
        const results = await prisma.appointment.findMany({
          where,
          include: Object.keys(include).length > 0 ? include : undefined,
          orderBy: this._sortConfig ? parseSort(this._sortConfig) : { appointmentDate: 'desc' }
        })
        
        // Process results for backward compatibility
        const processed = results.map(appt => {
          const obj = {
            ...appt,
            _id: appt.id,
            method: mapEnumToMethod(appt.method),
            toObject: () => ({ ...appt, _id: appt.id, method: mapEnumToMethod(appt.method) })
          }
          if (appt.doctor) {
            obj.doctor = { ...appt.doctor, _id: appt.doctor.id }
          }
          if (appt.user) {
            obj.user = { ...appt.user, _id: appt.user.id }
          }
          return obj
        })
        
        resolve(processed)
      }
    }
  },

  // Create a new appointment (for backward compatibility with new Appointment() pattern)
  create(data) {
    const appointmentData = {
      doctorId: data.doctor || data.doctorId || null,
      doctorDetails: data.doctorDetails || {},
      userId: data.user || data.userId,
      appointmentDate: new Date(data.appointmentDate),
      purpose: data.purpose || 'General Checkup',
      method: mapMethodToEnum(data.method || 'In Person'),
      notes: data.notes || null,
      status: data.status || 'pending'
    }
    
    return {
      ...appointmentData,
      async save() {
        const appointment = await prisma.appointment.create({
          data: appointmentData
        })
        
        appointment._id = appointment.id
        appointment.method = mapEnumToMethod(appointment.method)
        return appointment
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
  return { appointmentDate: 'desc' }
}

// Helper function to create a new Appointment instance
export function createAppointment(data) {
  return Appointment.create(data)
}

export default Appointment

