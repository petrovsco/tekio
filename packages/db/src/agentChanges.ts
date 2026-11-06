// What each assistant call wrote (RFC 0099), so the call can be undone as a
// whole. One row per call that wrote anything; undoing it deletes those
// entries through the API's own delete routes and stamps `undone_at`, so the
// row stays behind as the record.
import { withOrigin, type Db, type WriteDb } from './db'

/** The kinds of entry an assistant can write, each with its delete route. */
export type AgentEntryKind = 'lift' | 'cardio' | 'sport' | 'mobility' | 'planned_lift' | 'planned_session'

export interface AgentEntry { kind: AgentEntryKind; id: string }

export interface AgentChange {
  id: string
  tool: string
  entries: AgentEntry[]
  createdAt: string
}

export async function recordAgentChange(
  db: WriteDb, change: { clientId: string | null; tool: string; entries: AgentEntry[] },
): Promise<void> {
  const { error } = await db.client.from('agent_changes').insert(withOrigin(db, {
    user_id: db.userId, client_id: change.clientId, tool: change.tool, entries: change.entries,
  }))
  if (error) throw error
}

/** The newest change not yet undone, or null. */
export async function lastAgentChange(db: Db): Promise<AgentChange | null> {
  const { data, error } = await db.client
    .from('agent_changes')
    .select('id, tool, entries, created_at')
    .eq('user_id', db.userId)
    .is('undone_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
  if (error) throw error
  const r = data?.[0] as { id: string; tool: string; entries: AgentEntry[]; created_at: string } | undefined
  return r ? { id: r.id, tool: r.tool, entries: r.entries, createdAt: r.created_at } : null
}

export async function markAgentChangeUndone(db: Db, id: string): Promise<void> {
  const { error } = await db.client
    .from('agent_changes')
    .update({ undone_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', db.userId)
  if (error) throw error
}

/** How many changes assistants made for this person since `since` (an ISO
 *  time): what the write limit counts. */
export async function agentChangesSince(db: Db, since: string): Promise<number> {
  const { count, error } = await db.client
    .from('agent_changes')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', db.userId)
    .gte('created_at', since)
  if (error) throw error
  return count ?? 0
}
