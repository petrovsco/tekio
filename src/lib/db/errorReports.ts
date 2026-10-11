import { supabase } from '../supabase'
import type { ErrorReport } from '../errorReport'

// error_reports (RFC 0103). The table is closed to the browser; this function
// is the only way in, and it reads nothing back.

export async function sendErrorReport({ signature, payload }: ErrorReport): Promise<void> {
  const { error } = await supabase.rpc('report_error', { p_signature: signature, p_payload: payload })
  if (error) throw error
}
