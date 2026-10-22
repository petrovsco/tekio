import { supabase } from '../supabase'
import { userId } from '../session'
import type { SectionConfig } from '@tekio/db'
import { api, done } from '../api'

export type { SectionConfig }

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

export async function loadSectionConfig(): Promise<SectionConfig[]> {
  // Seed defaults (safe no-ops if rows already exist)
  await supabase
    .from('user_section_config')
    .upsert(
      DEFAULTS.map(d => ({
        user_id:      userId(),
        section_key:  d.sectionKey,
        show_in_menu: d.showInMenu,
        sort_order:   d.sortOrder,
      })),
      { onConflict: 'user_id,section_key', ignoreDuplicates: true }
    )

  const { data, error } = await supabase
    .from('user_section_config')
    .select('section_key, show_in_menu, sort_order')
    .eq('user_id', userId())
    .order('sort_order', { ascending: true })

  if (error) throw error

  return (data ?? []).map(row => ({
    sectionKey:  row.section_key,
    showInMenu:  row.show_in_menu,
    sortOrder:   row.sort_order,
  }))
}

/** Only `showInMenu` is ever patched one field at a time — reordering writes the
 *  whole list through `saveSectionConfig`. Both write through the API (RFC 0094
 *  step 4); the load above stays on the start path until it is timed. */
export const updateSectionField = (sectionKey: string, patch: Partial<Pick<SectionConfig, 'showInMenu'>>): Promise<void> =>
  patch.showInMenu === undefined
    ? Promise.resolve()
    : done(api.PATCH('/api/sections/{key}', { params: { path: { key: sectionKey } }, body: { showInMenu: patch.showInMenu } }))

export const saveSectionConfig = (configs: SectionConfig[]): Promise<void> =>
  done(api.PUT('/api/sections', { body: configs }))
