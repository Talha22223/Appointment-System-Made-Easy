// CORS helper for API routes
export function applyCors(req, res) {
  const allowedOrigins = new Set([
    'http://localhost:5174',
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5174',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3001',
    process.env.FRONTEND_URL, // Add production frontend URL
  ].filter(Boolean)) // Filter out undefined

  const origin = req.headers.origin

  res.setHeader(
    'Access-Control-Allow-Origin',
    allowedOrigins.has(origin) ? origin : (process.env.NODE_ENV === 'production' ? origin : '*')
  )

  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, OPTIONS'
  )

  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization'
  )

  res.setHeader(
    'Access-Control-Allow-Credentials',
    'true'
  )

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return true
  }

  return false
}
