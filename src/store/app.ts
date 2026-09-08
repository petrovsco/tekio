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
  WaterEntry,
  SleepEntry,
  SaunaEntry,
  ColdEntry,
  Program,
  EditModalTarget,
  ExerciseAlias,
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
import {
  loadProgramData,
  saveProgram,
  advanceProgram,
  pauseProgram,
  hardDeleteProgram,
  restartProgram,
  resumeProgram,
  setWeekOverride,
} from '../lib/db/program'
import { activeVariantWeekdays, startOfWeek, today } from '../lib/utils'
import { loadBodyweight, saveBodyweightEntry, deleteBodyweightEntry, updateBodyweightEntry } from '../lib/db/bodyweight'
import { loadCardio, saveCardioEntry, deleteCardioEntry, updateCardioEntry } from '../lib/db/cardio'
import { loadMobility, saveMobilityEntry, deleteMobilityEntry, updateMobilityEntry } from '../lib/db/mobility'
import { loadSports, loadSportTypes, saveSportEntry, deleteSportEntry, updateSportEntry } from '../lib/db/sport'
import { loadDonations, saveDonationEntry, deleteDonationEntry, updateDonationEntry } from '../lib/db/donations'
import { loadWater, saveWaterEntry, deleteWaterEntry, updateWaterEntry } from '../lib/db/water'
import {
  loadSleep, saveSleepEntry, updateSleepEntry, deleteSleepEntry,
  loadSauna, saveSaunaEntry, updateSaunaEntry, deleteSaunaEntry,
  loadCold, saveColdEntry, updateColdEntry, deleteColdEntry,
} from '../lib/db/recovery'
import { usePrefs } from './prefs'
import type { LiftSet, DayOfWeek } from '../types'

interface AppStore extends AppState {
  loading: boolean
  toast: string

  // Edit modal
  editModal: EditModalTarget | null
  openEditModal: (target: EditModalTarget) => void
  closeEditModal: () => void

  replaceLists: (lists: Partial<Pick<AppState, ListKey>>) => void
  setToast: (msg: string) => void
  withToast: (fn: () => Promise<void>, ok: string, fail?: string) => Promise<boolean>

  bootstrap: () => Promise<void>

  // Weights
  addWeightEntry: (entry: Omit<WeightEntry, 'id'>) => Promise<void>
  removeWeightEntry: (id: string) => Promise<void>
  editWeightEntry: (id: string, patch: { sets: LiftSet[]; date?: string }) => Promise<void>

  // Programs
  saveActiveProgram: (program: Program, programId?: string, userProgramId?: string) => Promise<void>
  advanceActiveProgram: (userProgramId: string, newIndex: number, date: string) => Promise<void>
  restartActiveProgram: (userProgramId: string, startDate: string) => Promise<void>
  pauseActiveProgram: (userProgramId: string) => Promise<void>
  resumeActiveProgram: (userProgramId: string) => Promise<void>
  removeProgram: (programId: string, userProgramId: string) => Promise<void>
  toggleWeekVariant: (userProgramId: string, dayOfWeek: DayOfWeek, variantActive: boolean) => Promise<void>

  // Bodyweight
  addBodyweightEntry: (entry: Omit<BodyweightEntry, 'id'>) => Promise<void>
  removeBodyweightEntry: (id: string) => Promise<void>
  editBodyweightEntry: (id: string, patch: Omit<BodyweightEntry, 'id'>) => Promise<void>

  // Cardio
  addCardioEntry: (entry: Omit<CardioEntry, 'id'>) => Promise<void>
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
  addDonationEntry: (entry: Omit<DonationEntry, 'id'>) => Promise<void>
  removeDonationEntry: (id: string) => Promise<void>
  editDonationEntry: (id: string, patch: Omit<DonationEntry, 'id'>) => Promise<void>

  // Water
  addWaterEntry: (entry: Omit<WaterEntry, 'id'>) => Promise<void>
  removeWaterEntry: (id: string) => Promise<void>
  editWaterEntry: (id: string, patch: Omit<WaterEntry, 'id'>) => Promise<void>

  // Recovery — Sleep
  addSleepEntry: (entry: Omit<SleepEntry, 'id'>) => Promise<void>
  removeSleepEntry: (id: string) => Promise<void>
  editSleepEntry: (id: string, patch: Omit<SleepEntry, 'id'>) => Promise<void>

  // Recovery — Sauna
  addSaunaEntry: (entry: Omit<SaunaEntry, 'id'>) => Promise<void>
  removeSaunaEntry: (id: string) => Promise<void>
  editSaunaEntry: (id: string, patch: Omit<SaunaEntry, 'id'>) => Promise<void>

  // Recovery — Cold
  addColdEntry: (entry: Omit<ColdEntry, 'id'>) => Promise<void>
  removeColdEntry: (id: string) => Promise<void>
  editColdEntry: (id: string, patch: Omit<ColdEntry, 'id'>) => Promise<void>

  // Exercise catalogue
  /** exercise id → name, for the Admin mapping editor and the assistant's name resolution. */
  exerciseNames: Record<string, string>
  /** exercise name (lowercased) → adaptation override, for the adaptation dashboard. */
  exerciseAdaptations: Record<string, Adaptation>

  /** Refresh muscle groups, exercise→muscle links and exercise names (after mapping edits). */
  reloadMuscleData: () => Promise<void>

  /** Server-side per-adaptation weekly targets (override built-in defaults). */
  adaptationTargets: AdaptationTargetMap
  /** Refresh adaptation targets after an admin edit. */
  reloadAdaptationTargets: () => Promise<void>

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
// re-sorted after a write, cardio, donations, water, sports and mobility did not,
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
  Record<`add${N}Entry`, (entry: Omit<T, 'id'>) => Promise<void>> &
  Record<`remove${N}Entry`, (id: string) => Promise<void>> &
  Record<`edit${N}Entry`, (id: string, patch: Omit<T, 'id'>) => Promise<void>>

/** The `add<Name>Entry` / `remove<Name>Entry` / `edit<Name>Entry` triplet for one
 *  logged list: write to the database, then put the result in its place. Spread
 *  into the store; a domain with an extra rule (mobility's tag propagation,
 *  water's same-day merge) writes that action out after the spread instead. */
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

export const useAppStore = create<AppStore>((set, get) => ({
  weights: [],
  bodyweight: [],
  cardio: [],
  mobility: [],
  sports: [],
  sportTypes: [],
  donations: [],
  water: [],
  sleep: [],
  sauna: [],
  cold: [],
  programs: [],
  programHistory: [],
  weekOverrides: [],
  muscleGroups: [],
  exerciseMuscles: [],
  exerciseNames: {},
  exerciseAdaptations: {},
  adaptationTargets: {},
  exerciseAliases: [],
  loading: true,
  toast: '',
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
  setToast: (toast) => {
    set({ toast })
    if (toast) setTimeout(() => set({ toast: '' }), 3000)
  },
  // The store's actions throw; every caller answered with the same try/catch and
  // two toasts. Put the whole success path — the write and the form reset that
  // follows it — inside `fn`, so a failed write leaves the form untouched.
  // Never throws: returns true when `fn` completed.
  withToast: async (fn, ok, fail = 'Failed to save.') => {
    try {
      await fn()
      get().setToast(ok)
      return true
    } catch {
      get().setToast(fail)
      return false
    }
  },

  // ── Bootstrap ────────────────────────────────────────────────────────────────
  bootstrap: async () => {
    set({ loading: true })
    try {
      await getOrCreateUser()
      const [weights, programData, bodyweight, cardio, mobility, muscleGroups, exerciseMuscles, exercises, sports, sportTypes, donations, water, sleep, sauna, cold, adaptationTargets, exerciseAliases] = await Promise.all([
        loadWeights(),
        loadProgramData(),
        loadBodyweight(),
        loadCardio(),
        loadMobility(),
        loadMuscleGroups(),
        loadExerciseMuscleLinks(),
        loadExercises(),
        loadSports(),
        loadSportTypes(),
        loadDonations(),
        loadWater(),
        loadSleep(),
        loadSauna(),
        loadCold(),
        loadAdaptationTargets(),
        loadExerciseAliases(),
        usePrefs.getState().loadPrefs(),
      ])
      set({
        weights,
        bodyweight,
        cardio,
        mobility,
        muscleGroups,
        exerciseMuscles,
        exerciseNames: Object.fromEntries(exercises.map(e => [e.id, e.name])),
        exerciseAdaptations: adaptationMap(exercises),
        sports,
        sportTypes,
        donations,
        water,
        sleep,
        sauna,
        cold,
        programs: programData.active,
        programHistory: programData.cycles,
        weekOverrides: programData.overrides,
        adaptationTargets,
        exerciseAliases,
      })
    } finally {
      set({ loading: false })
    }
  },

  reloadAdaptationTargets: async () => {
    const adaptationTargets = await loadAdaptationTargets()
    set({ adaptationTargets })
  },

  // ── Weights ──────────────────────────────────────────────────────────────────
  // Written out rather than spread: `editWeightEntry` takes sets plus an optional
  // date, not a whole entry.
  addWeightEntry: async (entry) => {
    const saved = await saveWeightEntry(entry)
    set(s => ({ weights: insert(s.weights, saved) }))
  },
  removeWeightEntry: async (id) => {
    await deleteWeightEntry(id)
    set(s => ({ weights: dropId(s.weights, id) }))
  },
  editWeightEntry: async (id, patch) => {
    await updateWeightEntry(id, patch)
    set(s => ({
      weights: patchId(s.weights, id, { sets: patch.sets, ...(patch.date ? { date: patch.date } : {}) }),
    }))
  },

  // ── Programs ─────────────────────────────────────────────────────────────────
  saveActiveProgram: async (program, programId, userProgramId) => {
    const result = await saveProgram(program, programId, userProgramId)
    set(s => {
      const others = s.programs.filter(p => p.userProgramId !== result.userProgramId)
      return { programs: [...others, result] }
    })
  },
  advanceActiveProgram: async (userProgramId, newIndex, date) => {
    await advanceProgram(userProgramId, newIndex, date)
    set(s => ({
      programs: s.programs.map(p =>
        p.userProgramId === userProgramId
          ? { ...p, currentDayIndex: newIndex, lastAdvancedDate: date }
          : p
      ),
    }))
  },
  restartActiveProgram: async (userProgramId, startDate) => {
    await restartProgram(userProgramId, startDate)
    const { cycles: programHistory } = await loadProgramData()
    set(s => ({
      programs: s.programs.map(p =>
        p.userProgramId === userProgramId
          ? { ...p, startDate, currentDayIndex: 0, lastAdvancedDate: startDate }
          : p
      ),
      programHistory,
    }))
  },
  pauseActiveProgram: async (userProgramId) => {
    await pauseProgram(userProgramId)
    const { cycles: programHistory } = await loadProgramData()
    set(s => ({ programs: s.programs.filter(p => p.userProgramId !== userProgramId), programHistory }))
  },
  resumeActiveProgram: async (userProgramId) => {
    await resumeProgram(userProgramId)
    const { active, cycles } = await loadProgramData()
    set({ programs: active, programHistory: cycles })
  },
  removeProgram: async (programId, userProgramId) => {
    await hardDeleteProgram(programId, userProgramId)
    set(s => ({
      programs: s.programs.filter(p => p.userProgramId !== userProgramId),
      programHistory: s.programHistory.filter(c => c.userProgramId !== userProgramId),
      weekOverrides: s.weekOverrides.filter(o => o.userProgramId !== userProgramId),
    }))
  },
  toggleWeekVariant: async (userProgramId, dayOfWeek, variantActive) => {
    const weekStartDate = startOfWeek(today())
    await setWeekOverride(userProgramId, weekStartDate, dayOfWeek, variantActive)
    set(s => {
      const others = s.weekOverrides.filter(
        o => !(o.userProgramId === userProgramId && o.weekStartDate === weekStartDate && o.dayOfWeek === dayOfWeek),
      )
      return { weekOverrides: [...others, { userProgramId, weekStartDate, dayOfWeek, variantActive }] }
    })
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

  // ── Water ────────────────────────────────────────────────────────────────────
  ...listActions(set, 'water', 'Water', {
    save: saveWaterEntry, del: deleteWaterEntry, update: updateWaterEntry,
  }),
  // Replaces the spread's `addWaterEntry`: a second glass on a day already logged
  // tops that day up rather than starting a second row.
  addWaterEntry: async (entry) => {
    const existing = get().water.find(w => w.date === entry.date)
    if (existing) {
      await get().editWaterEntry(existing.id, {
        date: existing.date,
        amountMl: existing.amountMl + entry.amountMl,
      })
      return
    }
    const saved = await saveWaterEntry(entry)
    set(s => ({ water: insert(s.water, saved) }))
  },

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

  reloadMuscleData: async () => {
    const [muscleGroups, exerciseMuscles, exercises] = await Promise.all([
      loadMuscleGroups(),
      loadExerciseMuscleLinks(),
      loadExercises(),
    ])
    set({
      muscleGroups,
      exerciseMuscles,
      exerciseNames: Object.fromEntries(exercises.map(e => [e.id, e.name])),
      exerciseAdaptations: adaptationMap(exercises),
    })
  },
}))


// ── Derived store hooks ───────────────────────────────────────────────────────

/**
 * This week's base ⇄ variant choice for one enrolment.
 *
 * WeightsTab and ProgramTab each used to wire this by hand — read
 * `weekOverrides`, filter it for the programme, close a `toggleWeekVariant`
 * over the same id — and then thread the pair down as props (roadmap 048 B8).
 *
 * Both selectors return a *stored* reference. The derived `Set` is built in the
 * caller's render, never inside a selector: a selector that returns a fresh
 * object on every call has a new identity every time Zustand compares it, which
 * is an endless re-render.
 */
export function useVariantWeek(userProgramId: string) {
  const weekOverrides = useAppStore(s => s.weekOverrides)
  const toggleWeekVariant = useAppStore(s => s.toggleWeekVariant)
  return {
    variantWeekdays: activeVariantWeekdays(weekOverrides, userProgramId),
    setVariant: (dayOfWeek: DayOfWeek, variantActive: boolean) =>
      toggleWeekVariant(userProgramId, dayOfWeek, variantActive),
  }
}
