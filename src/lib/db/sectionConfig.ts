import type { SectionConfig } from '@tekio/db'
import { api, done } from '../api'

export type { SectionConfig }

// The sections arrive with the start (./start.ts), which seeds the defaults
// on a first sign-in (@tekio/db's sections.ts holds them).

/** Only `showInMenu` is ever patched one field at a time — reordering writes the
 *  whole list through `saveSectionConfig`. Both write through the API (RFC 0094
 *  step 4). */
export const updateSectionField = (sectionKey: string, patch: Partial<Pick<SectionConfig, 'showInMenu'>>): Promise<void> =>
  patch.showInMenu === undefined
    ? Promise.resolve()
    : done(api.PATCH('/api/sections/{key}', { params: { path: { key: sectionKey } }, body: { showInMenu: patch.showInMenu } }))

export const saveSectionConfig = (configs: SectionConfig[]): Promise<void> =>
  done(api.PUT('/api/sections', { body: configs }))
