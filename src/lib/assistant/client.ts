// Thin client for the assistant edge functions. All LLM traffic and the API key
// live server-side; the browser only ever sees masked status + model output.
import { functionsUrl, supabaseHeaders } from '../supabase'
import type { AssistantStatus, GeminiContent, ToolCall } from './types'

/** Invoke an edge function, surfacing the function's own `{ error }` body when it
 *  returns a non-2xx status. A plain `fetch` since roadmap 023 dropped the full
 *  supabase-js client: `functions.invoke` buried that body behind a
 *  FunctionsHttpError the code below had to unwrap by hand anyway. */
async function invokeFn<T>(name: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(functionsUrl + name, {
    method: 'POST',
    headers: { ...supabaseHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => null)
  if (!res.ok) throw new Error(data?.error ?? `${name} failed (${res.status})`)
  if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error)
  return data as T
}

export function getAssistantStatus(): Promise<AssistantStatus> {
  return invokeFn('assistant-settings', { action: 'status' })
}

export function setAssistantKey(apiKey: string, provider = 'gemini', model?: string): Promise<AssistantStatus> {
  return invokeFn('assistant-settings', { action: 'set', apiKey, provider, model })
}

export function updateAssistantModel(model: string, provider?: string): Promise<AssistantStatus> {
  return invokeFn('assistant-settings', { action: 'update_model', model, provider })
}

export function clearAssistantKey(): Promise<AssistantStatus> {
  return invokeFn('assistant-settings', { action: 'clear' })
}

export interface ChatResponse {
  text: string
  toolCalls: ToolCall[]
}

export function assistantChat(contents: GeminiContent[], context: string): Promise<ChatResponse> {
  return invokeFn('assistant-chat', { contents, context })
}
