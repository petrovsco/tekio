// The API (RFC 0094 step 2c): one door for every client. Routes follow the
// product, not the tables, and each is declared with its schema, so the
// OpenAPI description at /api/openapi.json comes from the same definitions the
// requests are checked against.
import { OpenAPIHono } from '@hono/zod-openapi'
import { PostgrestClient } from '@supabase/postgrest-js'
import {
  KnownError, homeRead, adaptationsRead, readinessRead, type ReadRows, type ExposureBout, type MobilityEntry,
} from '@tekio/core'
import * as rows from '@tekio/db'
import {
  loadReadRows, saveWeightEntry, updateWeightEntry, deleteWeightEntry, loadOwnWeightSets, ownsRow, ownsRows, type WriteDb,
} from '@tekio/db'
import { bearer, tokenUserId, tokenAccepted } from './auth'
import { homeRoute, adaptationsRoute, readinessRoute } from './reads'
import { startRoute } from './start'
import {
  profileRoute, sectionsRoute, sectionShownRoute, lastSyncRoute, requestSyncRoute, syncRunRoute, errorReportRoute,
} from './settings'
import { logWeightRoute, editWeightRoute, deleteWeightRoute } from './weights'
import {
  cardioRoutes, sportRoutes, sleepRoutes, saunaRoutes, coldRoutes, bodyweightRoutes, donationRoutes, mobilityRoutes,
  morningHrvRoute, checkInRoute, type CaptureRoutes,
} from './capture'
import { planLiftRoutes, planSessionRoutes, groupLiftsRoute, liftLoggedRoute, sessionLoggedRoute, pruneMissedRoute } from './plans'

export interface ApiConfig {
  supabaseUrl: string
  anonKey: string
  /** Written to `origin` on the rows a write creates: null in production,
   *  else the build that wrote them (tekio.rfcs/rfcs/done/0037-row-origin-tagging.md). */
  origin: string | null
  /** Where the API's own calls go; a test passes a fake. */
  fetch?: typeof fetch
}

export function createApi(config: ApiConfig) {
  const fetchFn = config.fetch ?? fetch
  const app = new OpenAPIHono({
    defaultHook: (result, c) => {
      if (!result.success) return c.json({ error: 'Invalid request.' }, 400)
    },
  }).basePath('/api')

  app.openAPIRegistry.registerComponent('securitySchemes', 'bearer', {
    type: 'http', scheme: 'bearer', description: 'The Supabase access token of a signed-in session.',
  })

  /** The caller as the database sees them: a client sending their own token,
   *  and the id their rows are filed under. Null for a missing or malformed
   *  token; `accepted` is Supabase Auth's word on a well-formed one. */
  function caller(authorization: string | undefined): { db: WriteDb; accepted: Promise<boolean> } | null {
    const token = bearer(authorization)
    const userId = token && tokenUserId(token)
    if (!token || !userId) return null
    const client = new PostgrestClient(`${config.supabaseUrl}/rest/v1`, {
      headers: { apikey: config.anonKey, Authorization: `Bearer ${token}` },
      fetch: fetchFn,
    })
    return {
      db: { client, userId, origin: config.origin, catalogue: () => import('@tekio/core/catalogue') },
      accepted: tokenAccepted(config.supabaseUrl, config.anonKey, token, fetchFn),
    }
  }

  /** The caller's rows, or null when the token is refused. The rows load while
   *  Auth checks the token, so the check costs no extra round trip. */
  async function loadedFor<T>(authorization: string | undefined, load: (db: WriteDb) => Promise<T>): Promise<T | null> {
    const who = caller(authorization)
    if (!who) return null
    const loaded = load(who.db)
    if (!(await who.accepted)) {
      loaded.catch(() => {})
      return null
    }
    return loaded
  }

  const rowsFor = (authorization: string | undefined, date: string): Promise<ReadRows | null> =>
    loadedFor(authorization, db => loadReadRows(db, date))

  /** The caller, for a write: nothing is written before Auth accepts the token. */
  async function writerFor(authorization: string | undefined): Promise<WriteDb | null> {
    const who = caller(authorization)
    return who && (await who.accepted) ? who.db : null
  }

  /** The caller, for an edit or a delete, with the read that says the target
   *  is theirs made while Auth checks the token, so the check costs no round
   *  trip of its own. Nothing is written before both have answered. */
  async function writerChecking<T>(
    authorization: string | undefined,
    check: (db: WriteDb) => Promise<T>,
  ): Promise<{ db: WriteDb; found: T } | null> {
    const who = caller(authorization)
    if (!who) return null
    const found = check(who.db)
    if (!(await who.accepted)) {
      found.catch(() => {})
      return null
    }
    return { db: who.db, found: await found }
  }

  const refused = { error: 'Sign in again: no valid access token.' }
  const missing = { error: 'No such lift of yours.' }

  app.openapi(homeRoute, async c => {
    const { date } = c.req.valid('query')
    const rows = await rowsFor(c.req.header('authorization'), date)
    return rows ? c.json(homeRead(rows, date), 200) : c.json(refused, 401)
  })

  app.openapi(adaptationsRoute, async c => {
    const { date, quality } = c.req.valid('query')
    const rows = await rowsFor(c.req.header('authorization'), date)
    return rows ? c.json(adaptationsRead(rows, quality, date), 200) : c.json(refused, 401)
  })

  app.openapi(readinessRoute, async c => {
    const { date } = c.req.valid('query')
    const rows = await rowsFor(c.req.header('authorization'), date)
    return rows ? c.json(readinessRead(rows, date), 200) : c.json(refused, 401)
  })

  app.openapi(startRoute, async c => {
    const start = await loadedFor(c.req.header('authorization'), rows.loadStartRows)
    return start ? c.json(start, 200) : c.json(refused, 401)
  })

  app.openapi(logWeightRoute, async c => {
    const db = await writerFor(c.req.header('authorization'))
    if (!db) return c.json(refused, 401)
    const { pattern, ...entry } = c.req.valid('json')
    return c.json(await saveWeightEntry(db, entry, pattern), 201)
  })

  // An edit or a delete first checks the lift is the caller's own: the
  // policies still allow more than that until the lock (RFC 0003), and the
  // check costs the edit nothing, because it reads the sets the edit compares.
  app.openapi(editWeightRoute, async c => {
    const { id } = c.req.valid('param')
    const w = await writerChecking(c.req.header('authorization'), db => loadOwnWeightSets(db, id))
    if (!w) return c.json(refused, 401)
    if (!w.found) return c.json(missing, 404)
    await updateWeightEntry(w.db, id, c.req.valid('json'), w.found)
    return c.body(null, 204)
  })

  app.openapi(deleteWeightRoute, async c => {
    const { id } = c.req.valid('param')
    const w = await writerChecking(c.req.header('authorization'), db => loadOwnWeightSets(db, id))
    if (!w) return c.json(refused, 401)
    if (!w.found) return c.json(missing, 404)
    await deleteWeightEntry(w.db, id)
    return c.body(null, 204)
  })

  /** The three routes of a log that is one row each. Edits and deletes ask
   *  first whether the row is the caller's, as the weights routes do. */
  function capture<B>(
    r: CaptureRoutes,
    table: string,
    ops: {
      save(db: WriteDb, body: B): Promise<unknown>
      replace(db: WriteDb, id: string, body: B): Promise<void>
      remove(db: WriteDb, id: string): Promise<void>
    },
  ) {
    const gone = { error: `No such ${r.what} of yours.` }
    app.openapi(r.log, async c => {
      const db = await writerFor(c.req.header('authorization'))
      if (!db) return c.json(refused, 401)
      return c.json(await ops.save(db, c.req.valid('json') as B) as never, 201)
    })
    app.openapi(r.replace, async c => {
      const { id } = c.req.valid('param')
      const w = await writerChecking(c.req.header('authorization'), db => ownsRow(db, table, id))
      if (!w) return c.json(refused, 401)
      if (!w.found) return c.json(gone, 404)
      await ops.replace(w.db, id, c.req.valid('json') as B)
      return c.body(null, 204)
    })
    app.openapi(r.remove, async c => {
      const { id } = c.req.valid('param')
      const w = await writerChecking(c.req.header('authorization'), db => ownsRow(db, table, id))
      if (!w) return c.json(refused, 401)
      if (!w.found) return c.json(gone, 404)
      await ops.remove(w.db, id)
      return c.body(null, 204)
    })
  }

  const plain = <B>(save: (db: WriteDb, b: B) => Promise<unknown>, replace: (db: WriteDb, id: string, b: B) => Promise<void>, remove: (db: WriteDb, id: string) => Promise<void>) =>
    ({ save, replace, remove })

  capture(cardioRoutes, 'cardio_sessions', plain(rows.saveCardioEntry, rows.updateCardioEntry, rows.deleteCardioEntry))
  capture(sleepRoutes, 'sleep_logs', plain(rows.saveSleepEntry, rows.updateSleepEntry, rows.deleteSleepEntry))
  capture(bodyweightRoutes, 'bodyweight_logs', plain(rows.saveBodyweightEntry, rows.updateBodyweightEntry, rows.deleteBodyweightEntry))
  capture(donationRoutes, 'blood_donations', plain(rows.saveDonationEntry, rows.updateDonationEntry, rows.deleteDonationEntry))
  for (const [r, table] of [[saunaRoutes, 'sauna_sessions'], [coldRoutes, 'cold_sessions']] as const) {
    capture<Omit<ExposureBout, 'id'>>(r, table, {
      save: (db, b) => rows.saveExposure(db, table, b),
      replace: (db, id, b) => rows.updateExposure(db, table, id, b),
      remove: (db, id) => rows.deleteExposure(db, table, id),
    })
  }
  // A sport arrives by name; one typed for the first time is created with the
  // flags sent beside it. An unrated session is stored unrated, as the app does.
  type SportBody = Omit<rows.SportEntryInput, 'quality'> & { quality?: rows.SportEntryInput['quality']; newSport?: rows.NewSportFlags }
  const sport = ({ newSport, ...b }: SportBody) => [{ ...b, quality: b.quality ?? 0 } as rows.SportEntryInput, newSport] as const
  capture<SportBody>(sportRoutes, 'sport_sessions', {
    save: (db, b) => rows.saveSportEntry(db, ...sport(b)),
    replace: (db, id, b) => rows.updateSportEntry(db, id, ...sport(b)),
    remove: rows.deleteSportEntry,
  })

  // A session's minutes are the sum of its stretches, as the app counts them.
  const withMinutes = (b: Omit<MobilityEntry, 'id' | 'duration'>) => ({ ...b, duration: b.exercises.reduce((s, e) => s + e.duration, 0) })
  capture<Omit<MobilityEntry, 'id' | 'duration'>>(mobilityRoutes, 'mobility_sessions', {
    save: (db, b) => rows.saveMobilityEntry(db, withMinutes(b)),
    replace: (db, id, b) => rows.updateMobilityEntry(db, id, withMinutes(b)),
    remove: rows.deleteMobilityEntry,
  })

  // One row a day, filed under the caller: nothing to own-check, the upsert
  // can only touch the caller's own day.
  app.openapi(morningHrvRoute, async c => {
    const db = await writerFor(c.req.header('authorization'))
    if (!db) return c.json(refused, 401)
    return c.json(await rows.saveMorningHrv(db, c.req.valid('param').date, c.req.valid('json').ms), 200)
  })
  app.openapi(checkInRoute, async c => {
    const db = await writerFor(c.req.header('authorization'))
    if (!db) return c.json(refused, 401)
    return c.json(await rows.saveCheckIn(db, c.req.valid('param').date, c.req.valid('json')), 200)
  })

  // Plans: written as the app writes them, with who planned them.
  type LiftPlan = Parameters<typeof rows.savePlan>[1] & { plannedBy: 'user' | 'agent'; supersetId?: string | null }
  capture<LiftPlan>(planLiftRoutes, 'planned_exercises', {
    save: (db, { plannedBy, supersetId, ...plan }) => rows.savePlan(db, { ...plan, supersetId: supersetId ?? undefined }, plannedBy),
    replace: (db, id, { plannedBy: _, ...plan }) => rows.updatePlan(db, id, plan),
    remove: rows.deletePlan,
  })
  type SessionPlan = rows.SessionPlanPatch & { plannedBy: 'user' | 'agent' }
  capture<SessionPlan>(planSessionRoutes, 'planned_sessions', {
    save: (db, { plannedBy, ...plan }) => rows.saveSessionPlan(db, plan, plannedBy),
    replace: (db, id, { plannedBy: _, ...plan }) => rows.updateSessionPlan(db, id, plan),
    remove: rows.deleteSessionPlan,
  })

  const noPlan = { error: 'No such planned item of yours.' }
  app.openapi(groupLiftsRoute, async c => {
    const { ids, ...patch } = c.req.valid('json')
    const w = await writerChecking(c.req.header('authorization'), db => ownsRows(db, 'planned_exercises', ids))
    if (!w) return c.json(refused, 401)
    if (!w.found) return c.json(noPlan, 404)
    await rows.patchPlans(w.db, ids, patch)
    return c.body(null, 204)
  })
  app.openapi(liftLoggedRoute, async c => {
    const { id } = c.req.valid('param')
    const w = await writerChecking(c.req.header('authorization'), db => ownsRow(db, 'planned_exercises', id))
    if (!w) return c.json(refused, 401)
    if (!w.found) return c.json(noPlan, 404)
    await rows.markPlanLogged(w.db, id, c.req.valid('json').entryId)
    return c.body(null, 204)
  })
  app.openapi(sessionLoggedRoute, async c => {
    const { id } = c.req.valid('param')
    const w = await writerChecking(c.req.header('authorization'), db => rows.ownSessionPlanKind(db, id))
    if (!w) return c.json(refused, 401)
    if (!w.found) return c.json(noPlan, 404)
    await rows.markSessionPlanLogged(w.db, id, w.found, c.req.valid('json').entryId)
    return c.body(null, 204)
  })

  // Missed plans of both kinds, filed under the caller: nothing to own-check.
  app.openapi(pruneMissedRoute, async c => {
    const db = await writerFor(c.req.header('authorization'))
    if (!db) return c.json(refused, 401)
    const { before } = c.req.valid('query')
    await Promise.all([rows.pruneMissedPlans(db, before), rows.pruneMissedSessionPlans(db, before)])
    return c.body(null, 204)
  })

  // Settings, filed under the caller: nothing to own-check.
  app.openapi(profileRoute, async c => {
    const db = await writerFor(c.req.header('authorization'))
    if (!db) return c.json(refused, 401)
    await rows.updateProfile(db, c.req.valid('json'))
    return c.body(null, 204)
  })
  app.openapi(sectionsRoute, async c => {
    const db = await writerFor(c.req.header('authorization'))
    if (!db) return c.json(refused, 401)
    await rows.saveSections(db, c.req.valid('json'))
    return c.body(null, 204)
  })
  app.openapi(sectionShownRoute, async c => {
    const db = await writerFor(c.req.header('authorization'))
    if (!db) return c.json(refused, 401)
    await rows.setSectionShown(db, c.req.valid('param').key, c.req.valid('json').showInMenu)
    return c.body(null, 204)
  })

  app.openapi(lastSyncRoute, async c => {
    // Wrapped: a run of null is an answer, not a refusal.
    const run = await loadedFor(c.req.header('authorization'), async db => ({ run: await rows.loadLastGarminSync(db) }))
    return run === null ? c.json(refused, 401) : c.json(run.run, 200)
  })
  app.openapi(requestSyncRoute, async c => {
    const db = await writerFor(c.req.header('authorization'))
    if (!db) return c.json(refused, 401)
    return c.json(await rows.requestGarminSync(db), 200)
  })
  app.openapi(syncRunRoute, async c => {
    const { id } = c.req.valid('param')
    const run = await loadedFor(c.req.header('authorization'), async db => ({ run: await rows.loadSyncRun(db, id) }))
    if (run === null) return c.json(refused, 401)
    return run.run ? c.json(run.run, 200) : c.json({ error: 'No such run of yours.' }, 404)
  })

  // A report goes through with whatever token came with it, or none: the
  // database function is the only way into the table and reads nothing back,
  // and a forged token is refused by the database itself.
  app.openapi(errorReportRoute, async c => {
    const token = bearer(c.req.header('authorization')) ?? config.anonKey
    const client = new PostgrestClient(`${config.supabaseUrl}/rest/v1`, {
      headers: { apikey: config.anonKey, Authorization: `Bearer ${token}` },
      fetch: fetchFn,
    })
    const { signature, payload } = c.req.valid('json')
    await rows.sendErrorReport(client, signature, payload)
    return c.body(null, 204)
  })

  app.doc31('/openapi.json', {
    openapi: '3.1.0',
    info: { title: 'Tekiō API', version: '0' },
  })

  // An entry refused for what it holds says why, as the app's own screens do.
  // Any other failure says nothing about the rows behind it.
  app.onError((err, c) => err instanceof KnownError
    ? c.json({ error: err.message }, 400)
    : c.json({ error: 'Something went wrong.' }, 500))
  app.notFound(c => c.json({ error: 'No such route.' }, 404))

  return app
}
