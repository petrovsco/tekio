import type { BlockType, TrainingTag } from '../types'
import type { IconName } from '../components/ui/Icon'

export const BLOCK_TYPES: BlockType[] = [
  'warmup', 'weight', 'mobility', 'conditioning', 'sport', 'recovery',
]

/**
 * `iconName` is the SIGNAL icon (design-system §7); `icon` is the emoji it
 * replaces, still consumed by ProgramTab until roadmap 030 sweeps that page.
 */
export const BLOCK_META: Record<BlockType, { icon: string; iconName: IconName; label: string }> = {
  warmup: { icon: '🔥', iconName: 'warmup', label: 'Warm-up' },
  weight: { icon: '🏋️', iconName: 'weights', label: 'Weights' },
  mobility: { icon: '🧘', iconName: 'mobility', label: 'Mobility' },
  conditioning: { icon: '🫀', iconName: 'cardio', label: 'Conditioning' },
  sport: { icon: '⚽', iconName: 'sport', label: 'Sport' },
  recovery: { icon: '🛌', iconName: 'recovery', label: 'Recovery' },
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
