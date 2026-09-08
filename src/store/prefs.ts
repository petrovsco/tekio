import { create } from 'zustand'
import type { SectionConfig } from '../lib/db/sectionConfig'
import { loadSectionConfig, updateSectionField, saveSectionConfig } from '../lib/db/sectionConfig'
import {
  loadProfile, updateWeekStartDay, updateTrackedMuscleGroupIds, updateHrMax, updateBirthDate,
} from '../lib/db/user'
import type { WeekStartDay } from '../lib/utils'
import type { HrMaxSource } from '../lib/hrMax'

interface PrefsStore {
  sections: SectionConfig[]
  weekStartDay: WeekStartDay
  /** Muscle-group ids counted toward adaptation completion. Empty = count all. */
  trackedMuscleGroupIds: string[]
  /** The HRmax the user set (bpm) — typed, or the tracker peak they accepted; null = the age estimate, or nothing (roadmap 060). */
  hrMaxStored: number | null
  hrMaxSource: HrMaxSource | null
  /** ISO date; the age estimate of HRmax needs it. */
  birthDate: string | null
  loadPrefs: () => Promise<void>
  setSection: (key: string, patch: Partial<Pick<SectionConfig, 'showInMenu'>>) => Promise<void>
  reorderSections: (newOrder: string[]) => Promise<void>
  setWeekStartDay: (value: WeekStartDay) => Promise<void>
  setTrackedMuscleGroupIds: (ids: string[]) => Promise<void>
  setHrMaxStored: (value: number | null, source: HrMaxSource) => Promise<void>
  setBirthDate: (value: string | null) => Promise<void>
}

export const usePrefs = create<PrefsStore>((set, get) => ({
  sections: [],
  weekStartDay: 'monday',
  trackedMuscleGroupIds: [],
  hrMaxStored: null,
  hrMaxSource: null,
  birthDate: null,

  loadPrefs: async () => {
    const [sections, profile] = await Promise.all([loadSectionConfig(), loadProfile()])
    set({ sections, ...profile })
  },

  setSection: async (key, patch) => {
    // Optimistic update
    set(s => ({
      sections: s.sections.map(sc =>
        sc.sectionKey === key ? { ...sc, ...patch } : sc
      ),
    }))
    await updateSectionField(key, patch)
  },

  reorderSections: async (newOrder) => {
    const { sections } = get()
    const reordered = newOrder.map((key, i) => {
      const existing = sections.find(s => s.sectionKey === key)!
      return { ...existing, sortOrder: i }
    })
    // Optimistic update
    set({ sections: reordered })
    await saveSectionConfig(reordered)
  },

  setWeekStartDay: async (value) => {
    set({ weekStartDay: value })
    await updateWeekStartDay(value)
  },

  setTrackedMuscleGroupIds: async (ids) => {
    set({ trackedMuscleGroupIds: ids })
    await updateTrackedMuscleGroupIds(ids)
  },

  setHrMaxStored: async (value, source) => {
    set({ hrMaxStored: value, hrMaxSource: value == null ? null : source })
    await updateHrMax(value, source)
  },

  setBirthDate: async (value) => {
    set({ birthDate: value })
    await updateBirthDate(value)
  },
}))
