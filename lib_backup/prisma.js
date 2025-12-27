import { PrismaClient } from '@prisma/client'

// allow global `prisma` to be reused in dev
// eslint-disable-next-line no-var
var prisma

const client =
  process.env.NODE_ENV === 'production'
    ? new PrismaClient()
    : global.prisma ?? (global.prisma = new PrismaClient())

export default client
