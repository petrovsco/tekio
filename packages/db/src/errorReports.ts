// error_reports (RFC 0103). The table is closed to every client; this function
// is the only way in, and it reads nothing back. It takes a bare client, since a
// report may come from someone not signed in.
import type { PostgrestClient } from '@supabase/postgrest-js'

export async function sendErrorReport(client: PostgrestClient, signature: string, payload: object): Promise<void> {
  const { error } = await client.rpc('report_error', { p_signature: signature, p_payload: payload })
  if (error) throw error
}
