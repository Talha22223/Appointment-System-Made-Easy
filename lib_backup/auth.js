import jwt from 'jsonwebtoken'

const getTokenFromHeader = (req) => {
  const authHeader = req.headers.authorization
  return authHeader?.startsWith('Bearer ')
    ? authHeader.split(' ')[1]
    : null
}

export const withAuth = (handler) => async (req, res) => {
  const token = getTokenFromHeader(req)

  if (!token) {
    return res
      .status(401)
      .json({ message: 'No authentication token, access denied' })
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET)
    return handler(req, res)
  } catch {
    return res
      .status(401)
      .json({ message: 'Token verification failed' })
  }
}

const roleGuard = (allowedRoles) => (handler) =>
  withAuth(async (req, res) => {
    if (allowedRoles.includes(req.user.role)) {
      return handler(req, res)
    }
    return res
      .status(403)
      .json({ message: 'Access denied.' })
  })

export const withDoctor = roleGuard(['doctor', 'admin'])

export const withAdmin = roleGuard(['admin'])
