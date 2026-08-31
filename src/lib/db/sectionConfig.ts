import { supabase } from '../supabase'
import { USER_ID } from '../../constants/app'

export interface SectionConfig {
  sectionKey: string
  showInMenu: boolean
  showInHome: boolean
  sortOrder: number
}

// Three menu sections, one slot of headroom — doctrine R1's cap of four, met
// for the first time (roadmap 014). Body Weight, Donations, Water and Recovery
// are gone from this list because they are no longer destinations: they read
// and capture on Home. Their live rows survive in the DB and are simply
// ignored — App.tsx falls back to Home for any key it cannot render.
//
// `showInHome` has no consumer since the fused Home replaced OverviewTab; it
// is carried here only because the column and the type still exist.
const DEFAULTS: SectionConfig[] = [
  { sectionKey: 'Weights',     showInMenu: true, showInHome: true, sortOrder: 0 },
  { sectionKey: 'Cardio',      showInMenu: true, showInHome: true, sortOrder: 2 },
  { sectionKey: 'Mobility',    showInMenu: true, showInHome: true, sortOrder: 3 },
  // Habits is shelved (doctrine R2, decided 2026-08-26; delete by 2026-10-07).
  // Shelved, not folded — the row keeps a Profile toggle that brings it back.
  { sectionKey: 'Habits',      showInMenu: false, showInHome: false, sortOrder: 7 },
]

export async function loadSectionConfig(): Promise<SectionConfig[]> {
  // Seed defaults (safe no-ops if rows already exist)
  await supabase
    .from('user_section_config')
    .upsert(
      DEFAULTS.map(d => ({
        user_id:      USER_ID,
        section_key:  d.sectionKey,
        show_in_menu: d.showInMenu,
        show_in_home: d.showInHome,
        sort_order:   d.sortOrder,
      })),
      { onConflict: 'user_id,section_key', ignoreDuplicates: true }
    )

  const { data, error } = await supabase
    .from('user_section_config')
    .select('section_key, show_in_menu, show_in_home, sort_order')
    .eq('user_id', USER_ID)
    .order('sort_order', { ascending: true })

  if (error) throw error

  return (data ?? []).map(row => ({
    sectionKey:  row.section_key,
    showInMenu:  row.show_in_menu,
    showInHome:  row.show_in_home,
    sortOrder:   row.sort_order,
  }))
}

export async function updateSectionField(
  sectionKey: string,
  patch: Partial<Pick<SectionConfig, 'showInMenu' | 'showInHome' | 'sortOrder'>>
): Promise<void> {
  const update: Record<string, unknown> = {}
  if (patch.showInMenu !== undefined) update.show_in_menu = patch.showInMenu
  if (patch.showInHome !== undefined) update.show_in_home = patch.showInHome
  if (patch.sortOrder  !== undefined) update.sort_order   = patch.sortOrder

  const { error } = await supabase
    .from('user_section_config')
    .update(update)
    .eq('user_id', USER_ID)
    .eq('section_key', sectionKey)

  if (error) throw error
}

export async function saveSectionConfig(configs: SectionConfig[]): Promise<void> {
  const { error } = await supabase
    .from('user_section_config')
    .upsert(
      configs.map(c => ({
        user_id:      USER_ID,
        section_key:  c.sectionKey,
        show_in_menu: c.showInMenu,
        show_in_home: c.showInHome,
        sort_order:   c.sortOrder,
      })),
      { onConflict: 'user_id,section_key' }
    )

  if (error) throw error
}
