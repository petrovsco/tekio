// What an account may do through an assistant (RFC 0097). Reading through a
// connected assistant is free. An assistant writing plans and logs is on the
// paid side, and the first release is free: every account may, until billing
// exists. The check stands here so that turning it on is this one function.
import type { Db } from '@tekio/db'

export async function mayAgentWrite(_db: Db): Promise<boolean> {
  return true
}

/** Changes an assistant may make for one person in an hour: a runaway loop
 *  stops here, a person planning their week never meets it. */
export const AGENT_CHANGES_PER_HOUR = 60
