// What both assistant functions need to answer a browser: the CORS headers, and
// the two responses that carry them.
//
// A function importing this must be deployed *with* it — see "Edge functions"
// in supabase/README.md.

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

/** A JSON response with the CORS headers already on it. */
export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

/** The pre-flight answer. Every function starts with this. */
export const preflight = () => new Response('ok', { headers: cors })

/** The parsed request body, or null if it was not JSON. */
export async function readJson<T>(req: Request): Promise<T | null> {
  try {
    return await req.json() as T
  } catch {
    return null
  }
}
