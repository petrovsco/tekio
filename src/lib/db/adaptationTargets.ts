// Read in `@tekio/db` (RFC 0094 step 2a); the app calls it with its own client.
import { loadAdaptationTargets as dbLoadAdaptationTargets } from '@tekio/db'
import { appDb } from './_rows'

export type { AdaptationTargetMap } from '@tekio/db'
export const loadAdaptationTargets = () => dbLoadAdaptationTargets(appDb())
