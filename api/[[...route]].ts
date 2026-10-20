// The API as a Vercel function: every /api/* address lands here and Hono routes
// it (packages/api). The staging gate in middleware.ts does not run on /api/,
// because the bearer token is these routes' door and a phone app has no cookie.
import { vercelHandler } from '@tekio/api'

export const GET = vercelHandler()
