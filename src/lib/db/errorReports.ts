import { supabase } from '../supabase'
import type { ErrorReport } from '../errorReport'

// error_reports (RFC 0103). The table is closed to the browser; these two
// functions are the only way in, and neither reads anything back.

export async function sendErrorReport({ signature, payload }: ErrorReport): Promise<void> {
  const { error } = await supabase.rpc('report_error', { p_signature: signature, p_payload: payload })
  if (error) throw error
}

export async function sendErrorReportNote({ signature, payload }: ErrorReport, note: string): Promise<void> {
  const { error } = await supabase.rpc('add_error_report_note', {
    p_signature: signature,
    p_payload: payload,
    p_note: note,
  })
  if (error) throw error
}
