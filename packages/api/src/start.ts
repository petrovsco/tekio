// The web app's opening load (RFC 0094 step 4): every row its store starts
// with, and the profile and sections its settings start with, in one answer,
// so opening the app costs one round trip to the API rather than one per table
// to the database. Declared as a `z.ZodType` of the
// rows it carries, so the build fails when the two disagree.
import { createRoute, z } from '@hono/zod-openapi'
import type { StartRows, StartSettings } from '@tekio/db'
import { READINESS_METHODS } from '@tekio/core'
import { json, failures } from './schemas'
import { ADAPTATIONS } from './readShapes'
import {
  CardioEntry, SportEntry, SleepEntry, BoutEntry, BodyweightEntry, DonationEntry, MobilityEntry, ReadinessInput,
} from './capture'
import { WeightEntryBody } from './weights'
import { PlannedExercise, PlannedSession } from './plans'
import { Section } from './settings'

const Region = z.enum(['upper', 'lower', 'core', 'full_body'])
const Adaptation = z.enum(ADAPTATIONS)

const MuscleGroup = z.object({
  id: z.string(), name: z.string(), bodyRegion: Region,
  parentId: z.string().nullable().optional().openapi({ description: 'The group this one sits under; absent at the top.' }),
}).openapi('MuscleGroup')

const ExerciseMuscleLink = z.object({
  exercise: z.string(), group: z.string(), region: Region,
  // A whole number from 1 to 3, as the core's union spells it: a generated
  // Kotlin client cannot take an enum of numbers.
  level: z.number().int().min(1).max(3).openapi({ description: '1 to 3; 1 is the most direct.' }) as unknown as z.ZodType<1 | 2 | 3>,
  contribution: z.enum(['stimulus', 'recovery']),
}).openapi('ExerciseMuscleLink')

const SportType = z.object({ name: z.string(), hasCompetitor: z.boolean(), hasTeammate: z.boolean() }).openapi('SportType')

const AdaptationTarget = z.object({
  weeklyMuscleTarget: z.number(), weeklySessionTarget: z.number(), weeklyMinutesTarget: z.number(),
})

const ExerciseAlias = z.object({
  alias: z.string(), canonicalName: z.string(),
  isOwn: z.boolean().openapi({ description: "The person's own, rather than shipped with the app." }),
}).openapi('ExerciseAlias')

const UserProfile = z.object({
  weekStartDay: z.enum(['monday', 'sunday']),
  hrMaxStored: z.number().nullable().openapi({ description: 'The HRmax the person set, in bpm; null when there is none.' }),
  hrMaxSource: z.enum(['typed', 'tracker']).nullable(),
  birthDate: z.string().nullable(),
  readinessMethod: z.enum(READINESS_METHODS).nullable().openapi({ description: 'Null picks the best one with data.' }),
}).openapi('UserProfile')

export const StartBody: z.ZodType<StartRows & StartSettings> = z.object({
  weights: z.array(WeightEntryBody),
  bodyweight: z.array(BodyweightEntry),
  cardio: z.array(CardioEntry),
  mobility: z.array(MobilityEntry),
  muscleGroups: z.array(MuscleGroup),
  exerciseMuscles: z.array(ExerciseMuscleLink),
  exerciseAdaptations: z.record(z.string(), Adaptation)
    .openapi({ description: 'Lower-cased exercise name to the adaptation the catalogue tags it with.' }),
  // The core type says 1 to 5; an unrated session is mapped to 0 and cast,
  // which the description states rather than hides.
  sports: z.array(SportEntry) as unknown as z.ZodType<StartRows['sports']>,
  sportTypes: z.array(SportType),
  donations: z.array(DonationEntry),
  sleep: z.array(SleepEntry),
  sauna: z.array(BoutEntry),
  cold: z.array(BoutEntry),
  adaptationTargets: z.partialRecord(Adaptation, AdaptationTarget)
    .openapi({ description: 'Weekly targets the person set, overriding the built-in ones.' }),
  exerciseAliases: z.array(ExerciseAlias),
  readinessInputs: z.array(ReadinessInput),
  plans: z.array(PlannedExercise),
  sessionPlans: z.array(PlannedSession),
  profile: UserProfile,
  sections: z.array(Section),
}).openapi('StartRows')

export const startRoute = createRoute({
  method: 'get', path: '/start', security: [{ bearer: [] }], operationId: 'getStart',
  summary: 'Every row the web app opens with, in one answer; a first call writes the profile and the default sections.',
  responses: { 200: json("The person's rows.", StartBody), ...failures },
})
