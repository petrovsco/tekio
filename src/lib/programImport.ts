import type {
  Program, ProgramPhase, ProgramDay, ProgramDayBlock, ProgramDayExercisePrescription,
  BlockType, TrainingTag, DayOfWeek,
} from '../types'
import { BLOCK_TYPES, TRAINING_TAGS, DEFAULT_TAG } from '../constants/program'
import { DAYS_OF_WEEK } from '../constants/app'
import { today, deriveFlat } from './utils'
import { CYCLE } from '../constants/app'

export type ImportResult =
  | { ok: true; program: Program }
  | { ok: false; error: string }

const BLOCK_TYPE_SET = new Set<string>(BLOCK_TYPES)
const TAG_SET = new Set<string>(TRAINING_TAGS)
const DOW_SET = new Set<string>(DAYS_OF_WEEK)

/** Coerce a number | string | null into an optional trimmed string. */
function asText(v: unknown): string | undefined {
  if (v === null || v === undefined) return undefined
  if (typeof v === 'number') return String(v)
  if (typeof v === 'string') {
    const t = v.trim()
    return t === '' ? undefined : t
  }
  return undefined
}

function parseExercise(raw: unknown, blockType: BlockType, where: string): ProgramDayExercisePrescription | string {
  if (typeof raw !== 'object' || raw === null) return `${where}: exercise must be an object`
  const o = raw as Record<string, unknown>
  const name = asText(o.name ?? o.exercise)
  if (!name) return `${where}: exercise is missing a name`

  let tag: TrainingTag = DEFAULT_TAG[blockType]
  const rawTag = asText(o.tag ?? o.trainingTag)
  if (rawTag) {
    const upper = rawTag.toUpperCase()
    if (!TAG_SET.has(upper)) return `${where}: unknown tag "${rawTag}" for "${name}"`
    tag = upper as TrainingTag
  }

  return {
    exercise: name,
    trainingTag: tag,
    sortOrder: 0,
    notes: asText(o.notes),
    durationText: asText(o.duration ?? o.durationText),
    tempo: asText(o.tempo),
    setsText: asText(o.sets ?? o.setsText),
    repsText: asText(o.reps ?? o.repsText),
    weightText: asText(o.weight ?? o.weightText),
  }
}

function parseBlock(raw: unknown, where: string): ProgramDayBlock | string {
  if (typeof raw !== 'object' || raw === null) return `${where}: block must be an object`
  const o = raw as Record<string, unknown>

  const rawType = asText(o.type ?? o.blockType)
  if (!rawType) return `${where}: block is missing a "type"`
  const blockType = rawType.toLowerCase()
  if (!BLOCK_TYPE_SET.has(blockType)) {
    return `${where}: unknown block type "${rawType}" (expected one of ${BLOCK_TYPES.join(', ')})`
  }

  const name = asText(o.name) ?? rawType
  const durRaw = o.durationMinutes
  const durationMinutes = typeof durRaw === 'number' ? durRaw
    : typeof durRaw === 'string' && durRaw.trim() !== '' ? Number(durRaw) : undefined

  const exRaw = o.exercises
  const exercises: ProgramDayExercisePrescription[] = []
  if (exRaw !== undefined && exRaw !== null) {
    if (!Array.isArray(exRaw)) return `${where}: "exercises" must be an array`
    for (let i = 0; i < exRaw.length; i++) {
      const parsed = parseExercise(exRaw[i], blockType as BlockType, `${where} → exercise[${i}]`)
      if (typeof parsed === 'string') return parsed
      parsed.sortOrder = i
      exercises.push(parsed)
    }
  }

  const ssRaw = o.supersets
  const supersets: [string, string][] = []
  if (ssRaw !== undefined && ssRaw !== null) {
    if (!Array.isArray(ssRaw)) return `${where}: "supersets" must be an array`
    for (const pair of ssRaw) {
      if (!Array.isArray(pair) || pair.length !== 2) return `${where}: each superset must be a pair of names`
      const a = asText(pair[0]); const b = asText(pair[1])
      if (!a || !b) return `${where}: superset has an empty exercise name`
      supersets.push([a, b])
    }
  }

  return {
    blockType: blockType as BlockType,
    name,
    scheduledTime: asText(o.scheduledTime),
    durationMinutes: durationMinutes !== undefined && !Number.isNaN(durationMinutes) ? durationMinutes : undefined,
    notes: asText(o.notes),
    sortOrder: 0,
    exercises,
    supersets,
  }
}

function parseDay(raw: unknown, where: string): { base: ProgramDay; variant?: ProgramDay } | string {
  if (typeof raw !== 'object' || raw === null) return `${where}: day must be an object`
  const o = raw as Record<string, unknown>

  const name = asText(o.name)
  if (!name) return `${where}: day is missing a name`

  let dayOfWeek: DayOfWeek | null = null
  const rawDow = asText(o.dayOfWeek)
  if (rawDow) {
    const cap = rawDow.charAt(0).toUpperCase() + rawDow.slice(1).toLowerCase()
    if (!DOW_SET.has(cap)) return `${where}: unknown dayOfWeek "${rawDow}"`
    dayOfWeek = cap as DayOfWeek
  }

  const blocksRaw = o.blocks
  const blocks: ProgramDayBlock[] = []
  if (blocksRaw !== undefined && blocksRaw !== null) {
    if (!Array.isArray(blocksRaw)) return `${where}: "blocks" must be an array`
    for (let i = 0; i < blocksRaw.length; i++) {
      const parsed = parseBlock(blocksRaw[i], `${where} → block[${i}]`)
      if (typeof parsed === 'string') return parsed
      parsed.sortOrder = i
      blocks.push(parsed)
    }
  }

  const flat = deriveFlat(blocks)
  const groupKey = dayOfWeek ?? name
  const base: ProgramDay = {
    name,
    dayOfWeek,
    queueOrder: null,
    isVariant: false,
    variantGroupKey: o.variant ? groupKey : null,
    blocks,
    ...flat,
  }

  // Variant → a duplicate day (stored for the Stage-4 per-week toggle).
  let variant: ProgramDay | undefined
  if (o.variant && typeof o.variant === 'object') {
    const v = o.variant as Record<string, unknown>
    const label = asText(v.label) ?? `${name} (variant)`
    const replacesBlock = asText(v.replacesBlock)

    const altRaw: unknown[] = Array.isArray(v.alternateBlocks)
      ? v.alternateBlocks
      : v.alternateBlock ? [v.alternateBlock] : []
    const altBlocks: ProgramDayBlock[] = []
    for (let i = 0; i < altRaw.length; i++) {
      const parsed = parseBlock(altRaw[i], `${where} → variant.alternateBlock[${i}]`)
      if (typeof parsed === 'string') return parsed
      altBlocks.push(parsed)
    }

    const kept = replacesBlock
      ? blocks.filter(b => b.name !== replacesBlock)
      : [...blocks]
    const variantBlocks = [...kept, ...altBlocks].map((b, i) => ({ ...b, sortOrder: i }))
    const variantFlat = deriveFlat(variantBlocks)
    variant = {
      name: label,
      dayOfWeek,
      queueOrder: null,
      isVariant: true,
      variantGroupKey: groupKey,
      blocks: variantBlocks,
      ...variantFlat,
    }
  }

  return { base, variant }
}

/** Parses pasted program JSON (the sports-physician doc schema) into a Program. */
export function parseProgramJson(raw: string): ImportResult {
  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch (e) {
    return { ok: false, error: `Invalid JSON: ${(e as Error).message}` }
  }

  if (typeof data !== 'object' || data === null) {
    return { ok: false, error: 'Top-level JSON must be an object with "name" and "days".' }
  }
  const o = data as Record<string, unknown>

  const name = asText(o.name)
  if (!name) return { ok: false, error: 'Program is missing a "name".' }

  const daysRaw = o.days
  if (!Array.isArray(daysRaw) || daysRaw.length === 0) {
    return { ok: false, error: 'Program must have a non-empty "days" array.' }
  }

  const days: ProgramDay[] = []
  for (let i = 0; i < daysRaw.length; i++) {
    const parsed = parseDay(daysRaw[i], `day[${i}]`)
    if (typeof parsed === 'string') return { ok: false, error: parsed }
    days.push(parsed.base)
    if (parsed.variant) days.push(parsed.variant)
  }

  let weeklyPrinciples: Record<string, string | number> | undefined
  if (o.weeklyPrinciples && typeof o.weeklyPrinciples === 'object') {
    weeklyPrinciples = {}
    for (const [k, val] of Object.entries(o.weeklyPrinciples as Record<string, unknown>)) {
      if (typeof val === 'string' || typeof val === 'number') weeklyPrinciples[k] = val
      else weeklyPrinciples[k] = String(val)
    }
  }

  const startDate = asText(o.startDate) ?? today()

  const phase: ProgramPhase = {
    name: 'Main',
    sortOrder: 0,
    durationWeeks: CYCLE,
    goal: 'general',
    days,
  }

  const program: Program = {
    name,
    startDate,
    currentDayIndex: 0,
    lastAdvancedDate: startDate,
    days,
    phases: [phase],
    weeklyPrinciples,
  }

  return { ok: true, program }
}
