// The API as a Vercel function: vercel.json sends every /api/* address here,
// keeping the address it was asked for, and Hono routes it (packages/api). The
// staging gate in middleware.ts does not run on /api/, because the bearer
// token is these routes' door and a phone app has no cookie.
//
// It imports the bundle `npm run build` writes (scripts/build-api.mjs), not
// `@tekio/api` itself, which Node cannot load as TypeScript source.
import { vercelHandler } from './_bundle.mjs'

export const GET = vercelHandler()
