// Assistant chat: thin LLM proxy. Loads the user's API key server-side, forwards
// the conversation to the provider with our tool declarations, and returns the
// model's text + any function calls. It does NOT execute anything - the client
// renders proposed function calls as a confirm card and runs them itself, so the
// key stays server-side and all writes reuse the app's existing store actions.
//
// Provider is a switch; adding OpenAI/Anthropic later is one more branch.
// MVP: single hard-coded user + verify_jwt=false. Swap to JWT-derived user on auth.
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const USER_ID = 'a0000000-0000-0000-0000-000000000001'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

// Gemini part types (subset we care about)
interface GeminiPart {
  text?: string
  functionCall?: { name: string; args: Record<string, unknown> }
  functionResponse?: { name: string; response: Record<string, unknown> }
}
interface GeminiContent {
  role: 'user' | 'model'
  parts: GeminiPart[]
}

const SYSTEM_PROMPT = `You are the in-app assistant for Tekio, a personal fitness-tracking app.
You help the user manage their training data by proposing changes that the app will show them for confirmation before applying. Never claim a change is done - you only propose it; the app applies it after the user confirms.

Domain model:
- Exercises: named movements. Canonical names use hyphenation like Push-ups, Pull-ups, Pogo Hops.
- Muscle groups: a hierarchy (a group may have a parent, e.g. Lateral Deltoid under Shoulders). Each belongs to a body region: upper, lower, core, or full_body.
- Exercise-to-muscle mapping: each link has a level 1-3 (1 = most direct/primary, 2-3 = secondary) and a contribution of stimulus (default) or recovery.
- Programs: a training program has days; each day has a list of exercises (optionally with sets/reps text).

Rules:
- Use the Current app data snapshot below to resolve names to what already exists. Prefer existing exercises and muscle groups; only create a new one when nothing suitable exists.
- To add an exercise mapped to muscles: if the exercise does not exist, call create_exercise; then map it to each relevant muscle group with map_exercise_to_muscle (pick sensible levels).
- Emit all the function calls needed to fulfil the request in one turn, in dependency order (create an exercise before the mappings that reference it). Keep proposals minimal - do not invent extra changes.
- When a request is ambiguous (which program, which day, which muscles), ask a brief clarifying question in text instead of guessing.
- Be concise and friendly.`

// Tool declarations sent to the model. The client has a matching executor keyed
// by these exact tool names + arg names - keep the two in sync.
const FUNCTION_DECLARATIONS = [
  {
    name: 'create_exercise',
    description: 'Create a new exercise by name.',
    parameters: { type: 'object', properties: { name: { type: 'string' } }, required: ['name'] },
  },
  {
    name: 'map_exercise_to_muscle',
    description: 'Create or update the link between an exercise and a muscle group.',
    parameters: {
      type: 'object',
      properties: {
        exercise: { type: 'string' },
        muscleGroup: { type: 'string' },
        level: { type: 'integer', description: '1 = primary/most direct, 2-3 = secondary.' },
        contribution: { type: 'string', enum: ['stimulus', 'recovery'] },
      },
      required: ['exercise', 'muscleGroup'],
    },
  },
  {
    name: 'unmap_exercise_from_muscle',
    description: 'Remove the link between an exercise and a muscle group.',
    parameters: {
      type: 'object',
      properties: { exercise: { type: 'string' }, muscleGroup: { type: 'string' } },
      required: ['exercise', 'muscleGroup'],
    },
  },
  {
    name: 'create_muscle_group',
    description: 'Create a new muscle group.',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        bodyRegion: { type: 'string', enum: ['upper', 'lower', 'core', 'full_body'] },
        parent: { type: 'string', description: 'Name of the parent muscle group (optional).' },
      },
      required: ['name', 'bodyRegion'],
    },
  },
  {
    name: 'add_program_exercise',
    description: 'Add an exercise to a program day. If there is only one active program, `program` may be omitted.',
    parameters: {
      type: 'object',
      properties: {
        program: { type: 'string' },
        day: { type: 'string', description: 'Name of the day within the program.' },
        exercise: { type: 'string' },
        position: { type: 'integer', description: '0-based insert index; appended if omitted.' },
        setsText: { type: 'string' },
        repsText: { type: 'string' },
        weightText: { type: 'string' },
        notes: { type: 'string' },
      },
      required: ['day', 'exercise'],
    },
  },
  {
    name: 'replace_program_exercise',
    description: 'Replace one exercise with another in a program day.',
    parameters: {
      type: 'object',
      properties: {
        program: { type: 'string' },
        day: { type: 'string' },
        oldExercise: { type: 'string' },
        newExercise: { type: 'string' },
      },
      required: ['day', 'oldExercise', 'newExercise'],
    },
  },
  {
    name: 'remove_program_exercise',
    description: 'Remove an exercise from a program day.',
    parameters: {
      type: 'object',
      properties: {
        program: { type: 'string' },
        day: { type: 'string' },
        exercise: { type: 'string' },
      },
      required: ['day', 'exercise'],
    },
  },
]

async function callGemini(
  apiKey: string,
  model: string,
  systemText: string,
  contents: GeminiContent[],
): Promise<{ text: string; toolCalls: { name: string; args: Record<string, unknown> }[] }> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemText }] },
      contents,
      tools: [{ function_declarations: FUNCTION_DECLARATIONS }],
      tool_config: { function_calling_config: { mode: 'AUTO' } },
    }),
  })
  if (!res.ok) {
    const detail = await res.text()
    throw new Error(`Gemini ${res.status}: ${detail.slice(0, 500)}`)
  }
  const data = await res.json()
  const parts: GeminiPart[] = data?.candidates?.[0]?.content?.parts ?? []
  let text = ''
  const toolCalls: { name: string; args: Record<string, unknown> }[] = []
  for (const p of parts) {
    if (p.text) text += p.text
    if (p.functionCall) toolCalls.push({ name: p.functionCall.name, args: p.functionCall.args ?? {} })
  }
  return { text: text.trim(), toolCalls }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  let body: { contents?: GeminiContent[]; context?: string; model?: string }
  try {
    body = await req.json()
  } catch {
    return json({ error: 'invalid_json' }, 400)
  }
  const contents = body.contents ?? []
  if (contents.length === 0) return json({ error: 'empty_conversation' }, 400)

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )
  const { data: settings } = await supabase
    .from('assistant_settings')
    .select('provider, model, api_key')
    .eq('user_id', USER_ID)
    .maybeSingle()

  if (!settings?.api_key) return json({ error: 'no_key' }, 400)

  const provider = settings.provider ?? 'gemini'
  const model = body.model ?? settings.model ?? 'gemini-2.5-flash'
  const contextBlock = body.context ? `

# Current app data
${body.context}` : ''
  const systemText = SYSTEM_PROMPT + contextBlock

  try {
    switch (provider) {
      case 'gemini': {
        const result = await callGemini(settings.api_key, model, systemText, contents)
        return json(result)
      }
      default:
        return json({ error: `unsupported_provider:${provider}` }, 400)
    }
  } catch (e) {
    return json({ error: String(e) }, 500)
  }
})
