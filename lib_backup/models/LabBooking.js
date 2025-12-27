import prisma from '../prisma'

// LabBooking helper functions that replicate Mongoose model behavior
const LabBooking = {
  // Find one lab booking by query
  async findOne(query) {
    const where = {}
    if (query.id) where.id = query.id
    if (query.userId) where.userId = query.userId
    if (query.labTechniqueId) where.labTechniqueId = query.labTechniqueId
    
    const labBooking = await prisma.labBooking.findFirst({ where })
    if (labBooking) {
      labBooking._id = labBooking.id
      labBooking.toObject = () => ({ ...labBooking, _id: labBooking.id })
    }
    return labBooking
  },

  // Find lab booking by ID
  async findById(id) {
    if (!id) return null
    const labBooking = await prisma.labBooking.findUnique({ where: { id } })
    if (labBooking) {
      labBooking._id = labBooking.id
      labBooking.user = labBooking.userId
      labBooking.labTechnique = labBooking.labTechniqueId
      labBooking.save = async () => {
        const updated = await prisma.labBooking.update({
          where: { id: labBooking.id },
          data: {
            status: labBooking.status,
            notes: labBooking.notes
          }
        })
        return { ...updated, _id: updated.id }
      }
      labBooking.toObject = () => ({ ...labBooking, _id: labBooking.id })
    }
    return labBooking
  },

  // Find all lab bookings with optional query
  async find(query = {}) {
    const where = {}
    if (query.user) where.userId = query.user
    if (query.userId) where.userId = query.userId
    if (query.labTechnique) where.labTechniqueId = query.labTechnique
    if (query.labTechniqueId) where.labTechniqueId = query.labTechniqueId
    if (query.status) where.status = query.status
    
    const labBookings = await prisma.labBooking.findMany({ where })
    
    // Return chainable object that supports .populate() and .sort()
    return {
      _labBookings: labBookings,
      
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
            if (config.field === 'labTechnique') {
              include.labTechnique = { select: buildSelect(config.selectFields) }
            }
            if (config.field === 'user') {
              include.user = { select: buildSelect(config.selectFields) }
            }
          }
        }
        
        // Re-fetch with includes
        const results = await prisma.labBooking.findMany({
          where,
          include: Object.keys(include).length > 0 ? include : undefined,
          orderBy: this._sortConfig ? parseSort(this._sortConfig) : { bookingDate: 'desc' }
        })
        
        // Process results for backward compatibility
        const processed = results.map(booking => {
          const obj = {
            ...booking,
            _id: booking.id,
            toObject: () => ({ ...booking, _id: booking.id })
          }
          if (booking.labTechnique) {
            obj.labTechnique = { ...booking.labTechnique, _id: booking.labTechnique.id }
          }
          if (booking.user) {
            obj.user = { ...booking.user, _id: booking.user.id }
          }
          return obj
        })
        
        resolve(processed)
      }
    }
  },

  // Create a new lab booking (for backward compatibility with new LabBooking() pattern)
  create(data) {
    const bookingData = {
      labTechniqueId: data.labTechnique || data.labTechniqueId || null,
      labTechniqueDetails: data.labTechniqueDetails || {},
      userId: data.user || data.userId,
      bookingDate: new Date(data.bookingDate),
      notes: data.notes || null,
      status: data.status || 'pending'
    }
    
    return {
      ...bookingData,
      async save() {
        const labBooking = await prisma.labBooking.create({
          data: bookingData
        })
        
        labBooking._id = labBooking.id
        return labBooking
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
  return { bookingDate: 'desc' }
}

// Helper function to create a new LabBooking instance
export function createLabBooking(data) {
  return LabBooking.create(data)
}

export default LabBooking
