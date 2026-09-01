import type { BlockType, TrainingTag } from '../types'
import type { IconName } from '../components/ui/Icon'

export const BLOCK_TYPES: BlockType[] = [
  'warmup', 'weight', 'mobility', 'conditioning', 'sport', 'recovery',
]

/** `iconName` is the SIGNAL icon for the block type (design-system §7). The
 *  emoji it replaced died with roadmap 030, the last page to render one. */
export const BLOCK_META: Record<BlockType, { iconName: IconName; label: string }> = {
  warmup: { iconName: 'warmup', label: 'Warm-up' },
  weight: { iconName: 'weights', label: 'Weights' },
  mobility: { iconName: 'mobility', label: 'Mobility' },
  conditioning: { iconName: 'cardio', label: 'Conditioning' },
  sport: { iconName: 'sport', label: 'Sport' },
  recovery: { iconName: 'recovery', label: 'Recovery' },
}

export const TRAINING_TAGS: TrainingTag[] = [
  'STRENGTH', 'POWER', 'PREHAB', 'CORE', 'CONDITIONING',
  'MOBILITY', 'WARMUP', 'RECOVERY', 'SKILL',
]

/** Default training tag for an exercise added to a block of the given type. */
export const DEFAULT_TAG: Record<BlockType, TrainingTag> = {
  warmup: 'WARMUP',
  weight: 'STRENGTH',
  mobility: 'MOBILITY',
  conditioning: 'CONDITIONING',
  sport: 'SKILL',
  recovery: 'RECOVERY',
}

export const DAYS_OF_WEEK: import('../types').DayOfWeek[] = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
]
