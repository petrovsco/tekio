// The menu's sections and their order (user_section_config). Seeding the
// defaults still happens in the app's own load; the changes a person makes in
// Settings are written here, so the API writes them as the app does.
import type { Db } from './db'

export interface SectionConfig {
  sectionKey: string
  showInMenu: boolean
  sortOrder: number
}

/** The whole order at once: a reorder rewrites every row. */
export async function saveSections(db: Db, configs: SectionConfig[]): Promise<void> {
  const { error } = await db.client
    .from('user_section_config')
    .upsert(
      configs.map(c => ({
        user_id:      db.userId,
        section_key:  c.sectionKey,
        show_in_menu: c.showInMenu,
        sort_order:   c.sortOrder,
      })),
      { onConflict: 'user_id,section_key' },
    )
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
