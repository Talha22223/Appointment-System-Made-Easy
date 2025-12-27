import prisma from '../prisma'

// LabTechnique helper functions that replicate Mongoose model behavior
const LabTechnique = {
  // Find one lab technique by query
  async findOne(query) {
    const where = {}
    if (query.id) where.id = query.id
    if (query.name) where.name = query.name
    if (query.category) where.category = query.category
    
    const labTechnique = await prisma.labTechnique.findFirst({ where })
    if (labTechnique) {
      labTechnique._id = labTechnique.id // Backward compatibility
      labTechnique.toObject = () => ({ ...labTechnique })
    }
    return labTechnique
  },

  // Find lab technique by ID
  async findById(id) {
    if (!id) return null
    const labTechnique = await prisma.labTechnique.findUnique({ where: { id } })
    if (labTechnique) {
      labTechnique._id = labTechnique.id // Backward compatibility
      labTechnique.toObject = () => ({ ...labTechnique })
    }
    return labTechnique
  },

  // Find all lab techniques with optional query
  async find(query = {}) {
    const where = {}
    if (query.available !== undefined) where.available = query.available
    if (query.category) where.category = query.category
    
    const labTechniques = await prisma.labTechnique.findMany({ where })
    return {
      select: (fields) => {
        const exclude = fields.startsWith('-')
        const fieldList = fields.replace('-', '').split(' ')
        
        return labTechniques.map(labTechnique => {
          const doc = { ...labTechnique, _id: labTechnique.id }
          if (exclude) {
            fieldList.forEach(field => delete doc[field])
          }
          return doc
        })
      },
      then: (resolve) => resolve(labTechniques.map(lt => ({ ...lt, _id: lt.id })))
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
    
    const labTechnique = await prisma.labTechnique.update({
      where: { id },
      data
    })
    
    if (labTechnique) {
      labTechnique._id = labTechnique.id
      if (options.select) {
        const exclude = options.select.startsWith('-')
        const fieldList = options.select.replace('-', '').split(' ')
        if (exclude) {
          fieldList.forEach(field => delete labTechnique[field])
        }
      }
    }
    return labTechnique
  },

  // Find by ID and delete
  async findByIdAndDelete(id) {
    if (!id) return null
    try {
      const labTechnique = await prisma.labTechnique.delete({ where: { id } })
      if (labTechnique) labTechnique._id = labTechnique.id
      return labTechnique
    } catch (error) {
      return null
    }
  },

  // Create a new lab technique (for backward compatibility with new LabTechnique() pattern)
  create(data) {
    return {
      ...data,
      toObject() {
        return { ...this }
      },
      async save() {
        const labTechnique = await prisma.labTechnique.create({
          data: {
            name: data.name,
            description: data.description || '',
            category: data.category,
            duration: data.duration || '30 mins',
            price: Number(data.price),
            image: data.image || '',
            requirements: data.requirements || '',
            preparation: data.preparation || '',
            available: data.available !== undefined ? data.available : true,
            slotsBooked: data.slotsBooked || {}
          }
        })
        
        labTechnique._id = labTechnique.id
        labTechnique.toObject = () => ({ ...labTechnique })
        return labTechnique
      }
    }
  }
}

// Helper function to create a new LabTechnique instance
export function createLabTechnique(data) {
  return LabTechnique.create(data)
}

export default LabTechnique
