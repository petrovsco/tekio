// The menu's sections and their order (user_section_config): seeded with the
// defaults when the app opens and finds one missing, and the changes a person makes in Settings.
import type { Db } from './db'

export interface SectionConfig {
  sectionKey: string
  showInMenu: boolean
  sortOrder: number
}

// Three menu sections, one slot of headroom — doctrine R1's cap of four, met
// for the first time (roadmap 014). Body Weight, Donations and Recovery are
// gone from this list because they are no longer destinations: they read and
// capture on Home. Habits and Water are gone because they were deleted (roadmap
// 035, 2026-09-05; RFC 0089, 2026-10-04). Their live rows survive in the DB and
// are simply ignored — App.tsx falls back to Home for any key it cannot render.
//
// `show_in_home` died with OverviewTab: the fused Home is not a list of section
// cards, so nothing reads it. The app stopped writing and selecting it (roadmap
// 018 unit 6), and the column itself was dropped on 2026-09-05, once 2.0.0
// reached master — the drop had to wait because both branches share one
// database (tekio.rfcs/rfcs/done/0025-release-blocked-schema-drops.md).
const DEFAULTS: SectionConfig[] = [
  { sectionKey: 'Weights',     showInMenu: true, sortOrder: 0 },
  { sectionKey: 'Cardio',      showInMenu: true, sortOrder: 2 },
  { sectionKey: 'Mobility',    showInMenu: true, sortOrder: 3 },
]

const sectionRows = (db: Db, configs: SectionConfig[]) => configs.map(c => ({
  user_id:      db.userId,
  section_key:  c.sectionKey,
  show_in_menu: c.showInMenu,
  sort_order:   c.sortOrder,
}))

/** Whether a default section has no row yet, so the defaults need seeding. */
export const sectionsMissing = (sections: SectionConfig[]) =>
  DEFAULTS.some(d => !sections.some(s => s.sectionKey === d.sectionKey))

/** The defaults, written only where a row is missing. */
export async function seedSections(db: Db): Promise<void> {
  const { error } = await db.client
    .from('user_section_config')
    .upsert(sectionRows(db, DEFAULTS), { onConflict: 'user_id,section_key', ignoreDuplicates: true })
  if (error) throw error
}

export async function loadSections(db: Db): Promise<SectionConfig[]> {
  const { data, error } = await db.client
    .from('user_section_config')
    .select('section_key, show_in_menu, sort_order')
    .eq('user_id', db.userId)
    .order('sort_order', { ascending: true })
  if (error) throw error
  return (data ?? []).map(row => ({
    sectionKey:  row.section_key,
    showInMenu:  row.show_in_menu,
    sortOrder:   row.sort_order,
  }))
}

/** The whole order at once: a reorder rewrites every row. */
export async function saveSections(db: Db, configs: SectionConfig[]): Promise<void> {
  const { error } = await db.client
    .from('user_section_config')
    .upsert(sectionRows(db, configs), { onConflict: 'user_id,section_key' })
  if (error) throw error
}

export async function setSectionShown(db: Db, sectionKey: string, showInMenu: boolean): Promise<void> {
  const { error } = await db.client
    .from('user_section_config')
    .update({ show_in_menu: showInMenu })
    .eq('user_id', db.userId)
    .eq('section_key', sectionKey)
  if (error) throw error
}
