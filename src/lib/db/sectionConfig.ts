import { supabase } from '../supabase'
import { USER_ID } from '../../constants/app'

export interface SectionConfig {
  sectionKey: string
  showInMenu: boolean
  showInHome: boolean
  sortOrder: number
}

const DEFAULTS: SectionConfig[] = [
  { sectionKey: 'Weights',     showInMenu: true, showInHome: true, sortOrder: 0 },
  { sectionKey: 'Body Weight', showInMenu: true, showInHome: true, sortOrder: 1 },
  { sectionKey: 'Cardio',      showInMenu: true, showInHome: true, sortOrder: 2 },
  { sectionKey: 'Mobility',    showInMenu: true, showInHome: true, sortOrder: 3 },
  { sectionKey: 'Donations',   showInMenu: true, showInHome: true, sortOrder: 5 },
  { sectionKey: 'Water',       showInMenu: true, showInHome: true, sortOrder: 6 },
  // Habits is shelved (doctrine R2, decided 2026-08-26; delete by 2026-10-07).
  // Kept as a row rather than dropped: `homeOn()` in OverviewTab treats a MISSING
  // section as visible, so removing the row would leave the Home card on screen.
  { sectionKey: 'Habits',      showInMenu: false, showInHome: false, sortOrder: 7 },
  // Recovery has no dedicated tab — it lives only as a Home card (quick-add inline),
  // so it is seeded Home-only. showInMenu stays false (no drawer/tab destination).
  { sectionKey: 'Recovery',    showInMenu: false, showInHome: true, sortOrder: 8 },
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
