// Shared types for the in-app assistant.

/** A tool call proposed by the model (Gemini functionCall), mirrored by the executor. */
export interface ToolCall {
  name: string
  args: Record<string, unknown>
}

/** Result of executing a single confirmed tool call. */
export interface ToolResult {
  name: string
  ok: boolean
  /** Human-readable summary shown in the chat + fed back to the model. */
  summary: string
}

/** Gemini content parts we produce/consume for multi-turn function calling. */
export interface GeminiPart {
  text?: string
  functionCall?: { name: string; args: Record<string, unknown> }
  functionResponse?: { name: string; response: Record<string, unknown> }
}

export interface GeminiContent {
  role: 'user' | 'model'
  parts: GeminiPart[]
}

type ProposalStatus = 'pending' | 'applied' | 'partial' | 'failed' | 'cancelled'

interface Proposal {
  calls: ToolCall[]
  status: ProposalStatus
  results?: ToolResult[]
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
  /** Present on assistant messages that propose changes awaiting confirmation. */
  proposal?: Proposal
}

export interface AssistantStatus {
  hasKey: boolean
  last4: string | null
  provider: string
  model: string
}
