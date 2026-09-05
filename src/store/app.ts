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
} from '../types'
import { getOrCreateUser } from '../lib/db/user'
import { loadMuscleGroups, loadExerciseMuscleLinks, loadExercises } from '../lib/db/muscles'
import { loadAdaptationTargets, type AdaptationTargetMap } from '../lib/db/adaptationTargets'
import {
  loadWeights,
  saveWeightEntry,
  deleteWeightEntry,
  updateWeightEntry,
} from '../lib/db/weights'
import {
  loadActivePrograms,
  loadProgramCycles,
  saveProgram,
  advanceProgram,
  pauseProgram,
  hardDeleteProgram,
  restartProgram,
  resumeProgram,
  loadWeekOverrides,
  setWeekOverride,
} from '../lib/db/program'
import { startOfWeek, today } from '../lib/utils'
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

  setWeights: (weights: AppState['weights']) => void
  setBodyweight: (bodyweight: AppState['bodyweight']) => void
  setCardio: (cardio: AppState['cardio']) => void
  setMobility: (mobility: AppState['mobility']) => void
  setSports: (sports: AppState['sports']) => void
  setSportTypes: (sportTypes: AppState['sportTypes']) => void
  setDonations: (donations: AppState['donations']) => void
  setWater: (water: AppState['water']) => void
  setSleep: (sleep: AppState['sleep']) => void
  setSauna: (sauna: AppState['sauna']) => void
  setCold: (cold: AppState['cold']) => void
  setToast: (msg: string) => void

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
  loading: true,
  toast: '',
  editModal: null,

  // ── Edit modal ──────────────────────────────────────────────────────────────
  openEditModal: (target) => set({ editModal: target }),
  closeEditModal: () => set({ editModal: null }),

  // ── Setters ─────────────────────────────────────────────────────────────────
  setWeights: (weights) => set({ weights }),
  setBodyweight: (bodyweight) => set({ bodyweight }),
  setCardio: (cardio) => set({ cardio }),
  setMobility: (mobility) => set({ mobility }),
  setSports: (sports) => set({ sports }),
  setSportTypes: (sportTypes) => set({ sportTypes }),
  setDonations: (donations) => set({ donations }),
  setWater: (water) => set({ water }),
  setSleep: (sleep) => set({ sleep }),
  setSauna: (sauna) => set({ sauna }),
  setCold: (cold) => set({ cold }),
  setToast: (toast) => {
    set({ toast })
    if (toast) setTimeout(() => set({ toast: '' }), 3000)
  },

  // ── Bootstrap ────────────────────────────────────────────────────────────────
  bootstrap: async () => {
    set({ loading: true })
    try {
      await getOrCreateUser()
      const [weights, activePrograms, programHistory, weekOverrides, bodyweight, cardio, mobility, muscleGroups, exerciseMuscles, exercises, sports, sportTypes, donations, water, sleep, sauna, cold, adaptationTargets] = await Promise.all([
        loadWeights(),
        loadActivePrograms(),
        loadProgramCycles(),
        loadWeekOverrides(),
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
        programs: activePrograms,
        programHistory,
        weekOverrides,
        adaptationTargets,
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
  addWeightEntry: async (entry) => {
    const saved = await saveWeightEntry(entry)
    set(s => ({ weights: [saved, ...s.weights] }))
  },
  removeWeightEntry: async (id) => {
    await deleteWeightEntry(id)
    set(s => ({ weights: s.weights.filter(w => w.id !== id) }))
  },
  editWeightEntry: async (id, patch) => {
    await updateWeightEntry(id, patch)
    set(s => ({
      weights: s.weights.map(w =>
        w.id === id
          ? { ...w, sets: patch.sets, ...(patch.date ? { date: patch.date } : {}) }
          : w
      ),
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
    const programHistory = await loadProgramCycles()
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
    const programHistory = await loadProgramCycles()
    set(s => ({ programs: s.programs.filter(p => p.userProgramId !== userProgramId), programHistory }))
  },
  resumeActiveProgram: async (userProgramId) => {
    await resumeProgram(userProgramId)
    const [programs, programHistory] = await Promise.all([loadActivePrograms(), loadProgramCycles()])
    set({ programs, programHistory })
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
  addBodyweightEntry: async (entry) => {
    const saved = await saveBodyweightEntry(entry)
    set(s => ({
      bodyweight: [saved, ...s.bodyweight.filter(b => b.date !== saved.date)].sort(
        (a, b) => b.date.localeCompare(a.date)
      ),
    }))
  },
  removeBodyweightEntry: async (id) => {
    await deleteBodyweightEntry(id)
    set(s => ({ bodyweight: s.bodyweight.filter(b => b.id !== id) }))
  },
  editBodyweightEntry: async (id, patch) => {
    await updateBodyweightEntry(id, patch)
    set(s => ({
      bodyweight: s.bodyweight
        .map(b => (b.id === id ? { ...b, ...patch } : b))
        .sort((a, b) => b.date.localeCompare(a.date)),
    }))
  },

  // ── Cardio ───────────────────────────────────────────────────────────────────
  addCardioEntry: async (entry) => {
    const saved = await saveCardioEntry(entry)
    set(s => ({ cardio: [saved, ...s.cardio] }))
  },
  removeCardioEntry: async (id) => {
    await deleteCardioEntry(id)
    set(s => ({ cardio: s.cardio.filter(c => c.id !== id) }))
  },
  editCardioEntry: async (id, patch) => {
    await updateCardioEntry(id, patch)
    set(s => ({ cardio: s.cardio.map(c => (c.id === id ? { ...c, ...patch } : c)) }))
  },

  // ── Mobility ─────────────────────────────────────────────────────────────────
  addMobilityEntry: async (entry) => {
    const saved = await saveMobilityEntry(entry)
    set(s => ({ mobility: applyMuscleTags([saved, ...s.mobility], saved.exercises) }))
  },
  removeMobilityEntry: async (id) => {
    await deleteMobilityEntry(id)
    set(s => ({ mobility: s.mobility.filter(m => m.id !== id) }))
  },
  editMobilityEntry: async (id, patch) => {
    await updateMobilityEntry(id, patch)
    set(s => ({
      mobility: applyMuscleTags(
        s.mobility.map(m => (m.id === id ? { ...m, ...patch } : m)),
        patch.exercises,
      ),
    }))
  },

  // ── Sports ───────────────────────────────────────────────────────────────────
  addSportEntry: async (entry, newSportFlags) => {
    const saved = await saveSportEntry(entry, newSportFlags)
    set(s => ({
      sports: [saved, ...s.sports],
      sportTypes: newSportFlags
        ? [...s.sportTypes.filter(t => t.name.toLowerCase() !== saved.sport.toLowerCase()), { name: saved.sport, ...newSportFlags }]
        : s.sportTypes,
    }))
  },
  removeSportEntry: async (id) => {
    await deleteSportEntry(id)
    set(s => ({ sports: s.sports.filter(sk => sk.id !== id) }))
  },
  editSportEntry: async (id, patch, newSportFlags) => {
    await updateSportEntry(id, patch, newSportFlags)
    set(s => ({
      sports: s.sports.map(sk => (sk.id === id ? { ...sk, ...patch } : sk)),
      sportTypes: newSportFlags
        ? [...s.sportTypes.filter(t => t.name.toLowerCase() !== patch.sport.toLowerCase()), { name: patch.sport, ...newSportFlags }]
        : s.sportTypes,
    }))
  },

  // ── Donations ────────────────────────────────────────────────────────────────
  addDonationEntry: async (entry) => {
    const saved = await saveDonationEntry(entry)
    set(s => ({ donations: [saved, ...s.donations] }))
  },
  removeDonationEntry: async (id) => {
    await deleteDonationEntry(id)
    set(s => ({ donations: s.donations.filter(d => d.id !== id) }))
  },
  editDonationEntry: async (id, patch) => {
    await updateDonationEntry(id, patch)
    set(s => ({ donations: s.donations.map(d => (d.id === id ? { ...d, ...patch } : d)) }))
  },

  // ── Water ────────────────────────────────────────────────────────────────────
  addWaterEntry: async (entry) => {
    const existing = get().water.find(w => w.date === entry.date)
    if (existing) {
      const patch = { date: existing.date, amountMl: existing.amountMl + entry.amountMl }
      await updateWaterEntry(existing.id, patch)
      set(s => ({ water: s.water.map(w => (w.id === existing.id ? { ...w, ...patch } : w)) }))
      return
    }
    const saved = await saveWaterEntry(entry)
    set(s => ({ water: [saved, ...s.water] }))
  },
  removeWaterEntry: async (id) => {
    await deleteWaterEntry(id)
    set(s => ({ water: s.water.filter(w => w.id !== id) }))
  },
  editWaterEntry: async (id, patch) => {
    await updateWaterEntry(id, patch)
    set(s => ({ water: s.water.map(w => (w.id === id ? { ...w, ...patch } : w)) }))
  },

  // ── Recovery: Sleep ──────────────────────────────────────────────────────────
  addSleepEntry: async (entry) => {
    const saved = await saveSleepEntry(entry)
    set(s => ({ sleep: [saved, ...s.sleep].sort((a, b) => b.date.localeCompare(a.date)) }))
  },
  removeSleepEntry: async (id) => {
    await deleteSleepEntry(id)
    set(s => ({ sleep: s.sleep.filter(e => e.id !== id) }))
  },
  editSleepEntry: async (id, patch) => {
    await updateSleepEntry(id, patch)
    set(s => ({
      sleep: s.sleep
        .map(e => (e.id === id ? { ...e, ...patch } : e))
        .sort((a, b) => b.date.localeCompare(a.date)),
    }))
  },

  // ── Recovery: Sauna ──────────────────────────────────────────────────────────
  addSaunaEntry: async (entry) => {
    const saved = await saveSaunaEntry(entry)
    set(s => ({ sauna: [saved, ...s.sauna].sort((a, b) => b.date.localeCompare(a.date)) }))
  },
  removeSaunaEntry: async (id) => {
    await deleteSaunaEntry(id)
    set(s => ({ sauna: s.sauna.filter(e => e.id !== id) }))
  },
  editSaunaEntry: async (id, patch) => {
    await updateSaunaEntry(id, patch)
    set(s => ({
      sauna: s.sauna
        .map(e => (e.id === id ? { ...e, ...patch } : e))
        .sort((a, b) => b.date.localeCompare(a.date)),
    }))
  },

  // ── Recovery: Cold ───────────────────────────────────────────────────────────
  addColdEntry: async (entry) => {
    const saved = await saveColdEntry(entry)
    set(s => ({ cold: [saved, ...s.cold].sort((a, b) => b.date.localeCompare(a.date)) }))
  },
  removeColdEntry: async (id) => {
    await deleteColdEntry(id)
    set(s => ({ cold: s.cold.filter(e => e.id !== id) }))
  },
  editColdEntry: async (id, patch) => {
    await updateColdEntry(id, patch)
    set(s => ({
      cold: s.cold
        .map(e => (e.id === id ? { ...e, ...patch } : e))
        .sort((a, b) => b.date.localeCompare(a.date)),
    }))
  },

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
