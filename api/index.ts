// The API as a Vercel function: vercel.json sends every /api/* address here,
// keeping the address it was asked for, and Hono routes it (packages/api). The
// staging gate in middleware.ts does not run on /api/, because the bearer
// token is these routes' door and a phone app has no cookie.
//
// It imports the bundle `npm run build` writes (scripts/build-api.mjs), not
// `@tekio/api` itself, which Node cannot load as TypeScript source.
//
// Vercel answers 405 for any method not exported here, before Hono sees it, so
// every method a route uses is exported (src/test/apiFunction.test.ts checks),
// and OPTIONS, which a browser-based assistant asks /api/mcp first.
import { vercelHandler } from './_bundle.mjs'

const handler = vercelHandler()
export const GET = handler
export const POST = handler
export const PUT = handler
export const PATCH = handler
export const DELETE = handler
export const OPTIONS = handler
