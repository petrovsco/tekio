// Assistant settings: stores/reads the per-user LLM API key server-side.
// The api_key lives in `assistant_settings`, which has RLS enabled and NO
// policies, so the browser (anon key) can never read it. Only this function,
// using the service-role key, can touch it. The full key is never returned to
// the client — `status` only ever exposes the last 4 characters.
//
// The user id, the service-role client and the settings read live in
// `_shared/settings.ts`, which `assistant-chat` reads too. Deploying this
// function must upload the two `_shared` files with it.
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { json, preflight, readJson } from '../_shared/http.ts'
import {
  DEFAULT_MODEL,
  DEFAULT_PROVIDER,
  readSettings,
  serviceClient,
  USER_ID,
  type Settings,
} from '../_shared/settings.ts'

/** What the client is allowed to know about the stored key: whether there is
 *  one, and its last 4 characters. Never the key itself. */
function statusOf(s: Settings | null) {
  const key = s?.api_key ?? null
  return {
    hasKey: !!key,
    last4: key ? key.slice(-4) : null,
    provider: s?.provider ?? DEFAULT_PROVIDER,
    model: s?.model ?? DEFAULT_MODEL,
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return preflight()

  const supabase = serviceClient()

  const body = await readJson<{ action?: string; provider?: string; apiKey?: string; model?: string }>(req)
  if (!body) return json({ error: 'invalid_json' }, 400)

  const read = () => readSettings(supabase)

  // Every write ends the same way: report the failure, or answer with the
  // status as it now stands.
  const mutate = async (op: () => PromiseLike<{ error: { message: string } | null }>) => {
    const { error } = await op()
    if (error) return json({ error: error.message }, 500)
    return json(statusOf(await read()))
  }

  try {
    switch (body.action) {
      case 'status':
        return json(statusOf(await read()))

      case 'set': {
        const apiKey = (body.apiKey ?? '').trim()
        if (!apiKey) return json({ error: 'missing_key' }, 400)
        const current = await read()
        return await mutate(() => supabase.from('assistant_settings').upsert({
          user_id: USER_ID,
          provider: body.provider ?? current?.provider ?? DEFAULT_PROVIDER,
          model: body.model ?? current?.model ?? DEFAULT_MODEL,
          api_key: apiKey,
          updated_at: new Date().toISOString(),
        }))
      }

      case 'update_model':
        return await mutate(() => supabase
          .from('assistant_settings')
          .update({ model: body.model ?? DEFAULT_MODEL, provider: body.provider, updated_at: new Date().toISOString() })
          .eq('user_id', USER_ID))

      case 'clear':
        return await mutate(() => supabase
          .from('assistant_settings')
          .update({ api_key: null, updated_at: new Date().toISOString() })
          .eq('user_id', USER_ID))

      default:
        return json({ error: 'unknown_action' }, 400)
    }
  } catch (e) {
    return json({ error: String(e) }, 500)
  }
})
