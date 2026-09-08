// The assistant's stored settings — one row in `assistant_settings` holding the
// provider, the model and the API key.
//
// Both assistant functions read that row, so the user id, the service-role
// client, the column list and the fallbacks live here rather than in each of
// them. The table has RLS enabled and NO policies, so only a service-role
// client can touch it; the browser (anon key) never can.
//
// MVP: single hard-coded user. When auth lands, derive the id from the request
// JWT instead of USER_ID and set verify_jwt=true on deploy.
import { createClient, type SupabaseClient } from 'jsr:@supabase/supabase-js@2'

export const USER_ID = 'a0000000-0000-0000-0000-000000000001'

/** What a row falls back to when it has no provider or model of its own. */
export const DEFAULT_PROVIDER = 'gemini'
export const DEFAULT_MODEL = 'gemini-2.5-flash'

export interface Settings {
  provider: string
  model: string
  api_key: string | null
}

/** A service-role client. The only key that can read `assistant_settings`. */
export const serviceClient = (): SupabaseClient =>
  createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

/** The user's settings row, or null if they have never saved one. */
export async function readSettings(supabase: SupabaseClient): Promise<Settings | null> {
  const { data } = await supabase
    .from('assistant_settings')
    .select('provider, model, api_key')
    .eq('user_id', USER_ID)
    .maybeSingle()
  return (data as Settings | null) ?? null
}
