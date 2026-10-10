import { create } from 'zustand'
import type {
  Adaptation,
  AppState,
  WeightEntry,
  BodyweightEntry,
  CardioEntry,
  MobilityEntry,
  SportEntry,
  NewSportFlags,
  DonationEntry,
  SleepEntry,
  SaunaEntry,
  ColdEntry,
  EditModalTarget,
  ExerciseAlias,
  ReadinessInput,
  CheckInAnswers,
  PlannedExercise,
} from '../types'
import { getOrCreateUser } from '../lib/db/user'
import { loadExerciseAliases } from '../lib/db/exercises'
import { loadMuscleGroups, loadExerciseMuscleLinks, loadExercises } from '../lib/db/muscles'
import { loadAdaptationTargets, type AdaptationTargetMap } from '../lib/db/adaptationTargets'
import {
  loadWeights,
  saveWeightEntry,
  deleteWeightEntry,
  updateWeightEntry,
} from '../lib/db/weights'
import { loadBodyweight, saveBodyweightEntry, deleteBodyweightEntry, updateBodyweightEntry } from '../lib/db/bodyweight'
import { loadCardio, saveCardioEntry, deleteCardioEntry, updateCardioEntry } from '../lib/db/cardio'
import { loadMobility, saveMobilityEntry, deleteMobilityEntry, updateMobilityEntry } from '../lib/db/mobility'
import { loadSports, loadSportTypes, saveSportEntry, deleteSportEntry, updateSportEntry } from '../lib/db/sport'
import { loadDonations, saveDonationEntry, deleteDonationEntry, updateDonationEntry } from '../lib/db/donations'
import {
  loadSleep, saveSleepEntry, updateSleepEntry, deleteSleepEntry,
  loadSauna, saveSaunaEntry, updateSaunaEntry, deleteSaunaEntry,
  loadCold, saveColdEntry, updateColdEntry, deleteColdEntry,
} from '../lib/db/recovery'
import { loadReadinessInputs, saveMorningHrv, saveCheckIn } from '../lib/db/readiness'
import { loadPlans, savePlan, updatePlan, markPlanLogged, deletePlan } from '../lib/db/plans'
import { usePrefs } from './prefs'
import { breadcrumb, reportError, type ErrorReport } from '../lib/errorReport'
import type { LiftSet } from '../types'
import type { PatternKey } from '../constants/movementPatterns'

interface AppStore extends AppState {
  loading: boolean
  toast: string
  /** Set when the toast is about a failure that was reported (RFC 0103), so it
   *  can offer a note against that report. */
  toastReport: ErrorReport | null

  // Edit modal
  editModal: EditModalTarget | null
  openEditModal: (target: EditModalTarget) => void
  closeEditModal: () => void

  replaceLists: (lists: Partial<Pick<AppState, ListKey>>) => void
  setToast: (msg: string, report?: ErrorReport | null) => void
  withToast: (fn: () => Promise<void>, ok: string, fail?: string) => Promise<boolean>

  bootstrap: () => Promise<void>

  // Weights
  /** Resolves to the saved entry, so a caller can offer Undo on its id.
   *  `pattern` answers the movement question for a name nothing knows yet
   *  (RFC 0074); it is ignored when the name resolves to a known lift. */
  addWeightEntry: (entry: Omit<WeightEntry, 'id'>, pattern?: PatternKey) => Promise<WeightEntry>
  removeWeightEntry: (id: string) => Promise<void>
  editWeightEntry: (id: string, patch: { sets: LiftSet[]; date?: string }) => Promise<void>

  // Planned exercises (RFC 0098). Held apart from `weights` and never handed to
  // a read: a plan counts for nothing until it is logged.
  plans: PlannedExercise[]
  addPlan: (plan: Omit<PlannedExercise, 'id' | 'plannedBy' | 'loggedAs'>) => Promise<void>
  removePlan: (id: string) => Promise<void>
  editPlan: (id: string, patch: Pick<PlannedExercise, 'date' | 'exercise' | 'targets'>) => Promise<void>
  /** The plan was logged as the weight entry `entryId`. */
  markPlanLogged: (id: string, entryId: string) => Promise<void>



  // Bodyweight
  addBodyweightEntry: (entry: Omit<BodyweightEntry, 'id'>) => Promise<BodyweightEntry>
  removeBodyweightEntry: (id: string) => Promise<void>
  editBodyweightEntry: (id: string, patch: Omit<BodyweightEntry, 'id'>) => Promise<void>

  // Cardio
  addCardioEntry: (entry: Omit<CardioEntry, 'id'>) => Promise<CardioEntry>
  removeCardioEntry: (id: string) => Promise<void>
  editCardioEntry: (id: string, patch: Omit<CardioEntry, 'id'>) => Promise<void>

  // Mobility
  addMobilityEntry: (entry: Omit<MobilityEntry, 'id'>) => Promise<void>
  removeMobilityEntry: (id: string) => Promise<void>
  editMobilityEntry: (id: string, patch: Omit<MobilityEntry, 'id'>) => Promise<void>

  // Sports
  addSportEntry: (entry: Omit<SportEntry, 'id'>, newSportFlags?: NewSportFlags) => Promise<void>
  removeSportEntry: (id: string) => Promise<void>
  editSportEntry: (id: string, patch: Omit<SportEntry, 'id'>, newSportFlags?: NewSportFlags) => Promise<void>

  // Donations
  addDonationEntry: (entry: Omit<DonationEntry, 'id'>) => Promise<DonationEntry>
  removeDonationEntry: (id: string) => Promise<void>
  editDonationEntry: (id: string, patch: Omit<DonationEntry, 'id'>) => Promise<void>

  // Readiness — the typed inputs (RFC 0092), one row per morning
  readinessInputs: ReadinessInput[]
  logMorningHrv: (date: string, ms: number) => Promise<void>
  logCheckIn: (date: string, answers: CheckInAnswers) => Promise<void>

  // Recovery — Sleep
  addSleepEntry: (entry: Omit<SleepEntry, 'id'>) => Promise<SleepEntry>
  removeSleepEntry: (id: string) => Promise<void>
  editSleepEntry: (id: string, patch: Omit<SleepEntry, 'id'>) => Promise<void>

  // Recovery — Sauna
  /** Resolves to the saved entry, so a caller can offer Undo on its id. */
  addSaunaEntry: (entry: Omit<SaunaEntry, 'id'>) => Promise<SaunaEntry>
  removeSaunaEntry: (id: string) => Promise<void>
  editSaunaEntry: (id: string, patch: Omit<SaunaEntry, 'id'>) => Promise<void>

  // Recovery — Cold
  addColdEntry: (entry: Omit<ColdEntry, 'id'>) => Promise<ColdEntry>
  removeColdEntry: (id: string) => Promise<void>
  editColdEntry: (id: string, patch: Omit<ColdEntry, 'id'>) => Promise<void>

  // Exercise catalogue
  /** exercise name (lowercased) → adaptation override, for the adaptation dashboard. */
  exerciseAdaptations: Record<string, Adaptation>

  /** Server-side per-adaptation weekly targets (override built-in defaults). */
  adaptationTargets: AdaptationTargetMap

  /** Other spellings of an exercise name, so one search finds one movement (roadmap 044). */
  exerciseAliases: ExerciseAlias[]
}

/** Build the lowercased exercise-name → adaptation override map from loaded exercises. */
function adaptationMap(exercises: { name: string; adaptation: Adaptation | null }[]): Record<string, Adaptation> {
  const out: Record<string, Adaptation> = {}
  for (const e of exercises) if (e.adaptation) out[e.name.toLowerCase()] = e.adaptation
  return out
}

/** Muscle-group tags are canonical per exercise name, so propagate freshly-saved
 *  tags to every other mobility entry that uses the same exercise. */
function applyMuscleTags(entries: MobilityEntry[], tagged: MobilityEntry['exercises']): MobilityEntry[] {
  const byName = new Map<string, string[]>()
  for (const e of tagged) {
    if (e.muscleGroups && e.muscleGroups.length > 0) byName.set(e.name.toLowerCase(), e.muscleGroups)
  }
  if (byName.size === 0) return entries
  return entries.map(m => ({
    ...m,
    exercises: m.exercises.map(e => {
      const tags = byName.get(e.name.toLowerCase())
      return tags ? { ...e, muscleGroups: tags } : e
    }),
  }))
}

// ── Logged lists ──────────────────────────────────────────────────────────────
// Ten of the store's lists are the same thing: entries the user logs, each with
// an `id` and a `date`, held newest first. Their add / remove / edit actions were
// written out ten times, and they had drifted — sleep, sauna, cold and bodyweight
// re-sorted after a write, cardio, donations, sports and mobility did not,
// so a back-dated cardio session jumped to the top of its history instead of
// landing on its own date. These four helpers are the one definition of what a
// logged list does, and every action below is built from them (roadmap 048
// candidate A7).

/** A user-logged entry: identified by `id`, ordered by `date`. */
type Dated = { id: string; date: string }

/** Newest first — the order every `HistoryList` and every "last N" read assumes. */
const byDate = <T extends Dated>(xs: T[]): T[] => [...xs].sort((a, b) => b.date.localeCompare(a.date))

/** A freshly saved entry, in its place. It replaces any row already carrying its
 *  id, which is what makes an upsert — `saveBodyweightEntry` is one — update the
 *  day it wrote rather than appear beside it. */
const insert = <T extends Dated>(xs: T[], saved: T): T[] => byDate([saved, ...xs.filter(x => x.id !== saved.id)])

const dropId = <T extends Dated>(xs: T[], id: string): T[] => xs.filter(x => x.id !== id)

/** The patch merged into one entry. Re-sorted because a patch may move the date. */
const patchId = <T extends Dated>(xs: T[], id: string, patch: Partial<T>): T[] =>
  byDate(xs.map(x => (x.id === id ? { ...x, ...patch } : x)))

/** The state keys holding a logged list. */
type ListKey = { [K in keyof AppState]: AppState[K] extends Dated[] ? K : never }[keyof AppState]

/** The three writes a logged list's domain file exposes. */
interface ListDb<T extends Dated> {
  save: (entry: Omit<T, 'id'>) => Promise<T>
  del: (id: string) => Promise<void>
  update: (id: string, patch: Omit<T, 'id'>) => Promise<void>
}

type ListActions<N extends string, T extends Dated> =
  Record<`add${N}Entry`, (entry: Omit<T, 'id'>) => Promise<T>> &
  Record<`remove${N}Entry`, (id: string) => Promise<void>> &
  Record<`edit${N}Entry`, (id: string, patch: Omit<T, 'id'>) => Promise<void>>

/** The `add<Name>Entry` / `remove<Name>Entry` / `edit<Name>Entry` triplet for one
 *  logged list: write to the database, then put the result in its place. Spread
 *  into the store; a domain with an extra rule (mobility's tag propagation)
 *  writes that action out after the spread instead. */
function listActions<K extends ListKey, N extends string>(
  set: (fn: (s: AppStore) => Partial<AppStore>) => void,
  key: K,
  name: N,
  db: ListDb<AppState[K][number]>,
): ListActions<N, AppState[K][number]> {
  type T = AppState[K][number]
  // A computed key widens an object literal to `{ [x: string]: … }`, and a
  // template-literal key cannot be inferred from a value at all — so both ends of
  // this helper are asserted. The call sites are still checked: `AppStore` names
  // all three actions, so a wrong shape fails where the spread lands.
  const write = (fn: (xs: T[]) => T[]) =>
    set(s => ({ [key]: fn(s[key] as T[]) }) as Partial<AppStore>)

  return {
    [`add${name}Entry`]: async (entry: Omit<T, 'id'>) => {
      const saved = await db.save(entry)
      write(xs => insert(xs, saved))
      return saved
    },
    [`remove${name}Entry`]: async (id: string) => {
      await db.del(id)
      write(xs => dropId(xs, id))
    },
    [`edit${name}Entry`]: async (id: string, patch: Omit<T, 'id'>) => {
      await db.update(id, patch)
      write(xs => patchId(xs, id, patch as Partial<T>))
    },
  } as ListActions<N, T>
}

// Every action leaves its name, and only its name, on the error report's trail
// (RFC 0103), so a report says what was done before it without saying with
// what. The toast setters are left out: they follow an action, they are not one.
const UNTRAILED = new Set(['setToast', 'withToast'])
function trailed(store: AppStore): AppStore {
  return Object.fromEntries(Object.entries(store).map(([key, value]) =>
    typeof value === 'function' && !UNTRAILED.has(key)
      ? [key, (...args: unknown[]) => { breadcrumb(key); return value(...args) }]
      : [key, value],
  )) as AppStore
}

export const useAppStore = create<AppStore>((set, get) => trailed({
  weights: [],
  bodyweight: [],
  cardio: [],
  mobility: [],
  sports: [],
  sportTypes: [],
  donations: [],
  sleep: [],
  readinessInputs: [],
  plans: [],
  sauna: [],
  cold: [],
  muscleGroups: [],
  exerciseMuscles: [],
  exerciseAdaptations: {},
  adaptationTargets: {},
  exerciseAliases: [],
  loading: true,
  toast: '',
  toastReport: null,
  editModal: null,

  // ── Edit modal ──────────────────────────────────────────────────────────────
  openEditModal: (target) => set({ editModal: target }),
  closeEditModal: () => set({ editModal: null }),

  // ── Setters ─────────────────────────────────────────────────────────────────
  // Whole logged lists, replaced in one write. Ten per-domain setters did this
  // and had one caller between them, the JSON importer — ten store writes, so
  // ten rounds of waking whatever reads each list (roadmap 048 B14). The sort is
  // not decoration: `mergeById` appends, so imported entries used to arrive after
  // the existing ones however old they were.
  replaceLists: (lists) => set(
    Object.fromEntries(
      Object.entries(lists).map(([key, xs]) => [key, byDate(xs as Dated[])]),
    ) as Partial<AppStore>,
  ),
  setToast: (toast, toastReport = null) => {
    set({ toast, toastReport })
    // Twice as long when it offers a note: three seconds is too short to tap.
    if (toast) setTimeout(() => {
      if (get().toast === toast) set({ toast: '', toastReport: null })
    }, toastReport ? 6000 : 3000)
  },
  // The store's actions throw; every caller answered with the same try/catch and
  // two toasts. Put the whole success path — the write and the form reset that
  // follows it — inside `fn`, so a failed write leaves the form untouched.
  // A failure the app did not expect is reported (RFC 0103) and its toast
  // offers a note. Never throws: returns true when `fn` completed.
  withToast: async (fn, ok, fail = 'Failed to save.') => {
    try {
      await fn()
      get().setToast(ok)
      return true
    } catch (e) {
      get().setToast(fail, reportError(e, 'write'))
      return false
    }
  },

  // ── Bootstrap ────────────────────────────────────────────────────────────────
  bootstrap: async () => {
    set({ loading: true })
    try {
      await getOrCreateUser()
      const [weights, bodyweight, cardio, mobility, muscleGroups, exerciseMuscles, exercises, sports, sportTypes, donations, sleep, sauna, cold, adaptationTargets, exerciseAliases, readinessInputs, plans] = await Promise.all([
        loadWeights(),
        loadBodyweight(),
        loadCardio(),
        loadMobility(),
        loadMuscleGroups(),
        loadExerciseMuscleLinks(),
        loadExercises(),
        loadSports(),
        loadSportTypes(),
        loadDonations(),
        loadSleep(),
        loadSauna(),
        loadCold(),
        loadAdaptationTargets(),
        loadExerciseAliases(),
        loadReadinessInputs(),
        loadPlans(),
        usePrefs.getState().loadPrefs(),
      ])
      set({
        weights,
        bodyweight,
        cardio,
        mobility,
        muscleGroups,
        exerciseMuscles,
        exerciseAdaptations: adaptationMap(exercises),
        sports,
        sportTypes,
        donations,
        sleep,
        sauna,
        cold,
        adaptationTargets,
        exerciseAliases,
        readinessInputs,
        plans,
      })
    } finally {
      set({ loading: false })
    }
  },

  // ── Readiness inputs ───────────────────────────────────────────────────────
  logMorningHrv: async (date, ms) => {
    const saved = await saveMorningHrv(date, ms)
    set(s => ({ readinessInputs: insert(s.readinessInputs, saved) }))
  },
  logCheckIn: async (date, answers) => {
    const saved = await saveCheckIn(date, answers)
    set(s => ({ readinessInputs: insert(s.readinessInputs, saved) }))
  },

  // ── Weights ──────────────────────────────────────────────────────────────────
  // Written out rather than spread: `editWeightEntry` takes sets plus an optional
  // date, not a whole entry.
  addWeightEntry: async (entry, pattern) => {
    const { entry: saved, linked } = await saveWeightEntry(entry, pattern)
    // A first log of a catalogue lift writes its links; without the reload the
    // set would count for nothing on the muscle read until the next start.
    const exerciseMuscles = linked ? await loadExerciseMuscleLinks() : undefined
    set(s => ({ weights: insert(s.weights, saved), ...(exerciseMuscles ? { exerciseMuscles } : {}) }))
    return saved
  },
  removeWeightEntry: async (id) => {
    await deleteWeightEntry(id)
    // The database sets a plan's link to null when its entry goes (on delete
    // set null); the plan is a plan again, here as there.
    set(s => ({
      weights: dropId(s.weights, id),
      plans: s.plans.map(p => p.loggedAs === id ? { ...p, loggedAs: undefined } : p),
    }))
  },
  editWeightEntry: async (id, patch) => {
    await updateWeightEntry(id, patch)
    set(s => ({
      weights: patchId(s.weights, id, { sets: patch.sets, ...(patch.date ? { date: patch.date } : {}) }),
    }))
  },

  // ── Planned exercises ────────────────────────────────────────────────────────
  addPlan: async (plan) => {
    const saved = await savePlan(plan)
    set(s => ({ plans: [...s.plans, saved] }))
  },
  removePlan: async (id) => {
    await deletePlan(id)
    set(s => ({ plans: dropId(s.plans, id) }))
  },
  editPlan: async (id, patch) => {
    await updatePlan(id, patch)
    set(s => ({ plans: patchId(s.plans, id, patch) }))
  },
  markPlanLogged: async (id, entryId) => {
    await markPlanLogged(id, entryId)
    set(s => ({ plans: patchId(s.plans, id, { loggedAs: entryId }) }))
  },

  // ── Bodyweight ───────────────────────────────────────────────────────────────
  ...listActions(set, 'bodyweight', 'Bodyweight', {
    save: saveBodyweightEntry, del: deleteBodyweightEntry, update: updateBodyweightEntry,
  }),

  // ── Cardio ───────────────────────────────────────────────────────────────────
  ...listActions(set, 'cardio', 'Cardio', {
    save: saveCardioEntry, del: deleteCardioEntry, update: updateCardioEntry,
  }),

  // ── Mobility ─────────────────────────────────────────────────────────────────
  // Written out rather than spread: a write propagates the saved muscle tags
  // across every entry naming the same exercise.
  addMobilityEntry: async (entry) => {
    const saved = await saveMobilityEntry(entry)
    set(s => ({ mobility: applyMuscleTags(insert(s.mobility, saved), saved.exercises) }))
  },
  removeMobilityEntry: async (id) => {
    await deleteMobilityEntry(id)
    set(s => ({ mobility: dropId(s.mobility, id) }))
  },
  editMobilityEntry: async (id, patch) => {
    await updateMobilityEntry(id, patch)
    set(s => ({ mobility: applyMuscleTags(patchId(s.mobility, id, patch), patch.exercises) }))
  },

  // ── Sports ───────────────────────────────────────────────────────────────────
  // Written out rather than spread: a write can also introduce a sport type.
  addSportEntry: async (entry, newSportFlags) => {
    const saved = await saveSportEntry(entry, newSportFlags)
    set(s => ({
      sports: insert(s.sports, saved),
      sportTypes: newSportFlags
        ? [...s.sportTypes.filter(t => t.name.toLowerCase() !== saved.sport.toLowerCase()), { name: saved.sport, ...newSportFlags }]
        : s.sportTypes,
    }))
  },
  removeSportEntry: async (id) => {
    await deleteSportEntry(id)
    set(s => ({ sports: dropId(s.sports, id) }))
  },
  editSportEntry: async (id, patch, newSportFlags) => {
    await updateSportEntry(id, patch, newSportFlags)
    set(s => ({
      sports: patchId(s.sports, id, patch),
      sportTypes: newSportFlags
        ? [...s.sportTypes.filter(t => t.name.toLowerCase() !== patch.sport.toLowerCase()), { name: patch.sport, ...newSportFlags }]
        : s.sportTypes,
    }))
  },

  // ── Donations ────────────────────────────────────────────────────────────────
  ...listActions(set, 'donations', 'Donation', {
    save: saveDonationEntry, del: deleteDonationEntry, update: updateDonationEntry,
  }),

  // ── Recovery: Sleep ──────────────────────────────────────────────────────────
  ...listActions(set, 'sleep', 'Sleep', {
    save: saveSleepEntry, del: deleteSleepEntry, update: updateSleepEntry,
  }),

  // ── Recovery: Sauna ──────────────────────────────────────────────────────────
  ...listActions(set, 'sauna', 'Sauna', {
    save: saveSaunaEntry, del: deleteSaunaEntry, update: updateSaunaEntry,
  }),

  // ── Recovery: Cold ───────────────────────────────────────────────────────────
  ...listActions(set, 'cold', 'Cold', {
    save: saveColdEntry, del: deleteColdEntry, update: updateColdEntry,
  }),
}))
