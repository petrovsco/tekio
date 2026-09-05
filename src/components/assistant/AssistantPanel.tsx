import { useEffect, useRef, useState } from 'react'
import { useAssistant } from '../../store/assistant'
import { Modal } from '../ui/Modal'
import { FIELD } from '../ui/Input'
import { ProposalCard } from './ProposalCard'

const SUGGESTIONS = [
  'Add Farmer\'s Carry as an exercise and map it to the grip and forearm muscles',
  'Add Face Pulls to my Push day',
  'Replace Back Squat with Front Squat on Leg day',
]

export function AssistantPanel() {
  const { open, setOpen, messages, busy, status, statusLoaded, send, clearChat } = useAssistant()
  const [draft, setDraft] = useState('')
  const endRef = useRef<HTMLDivElement>(null)

  const noKey = statusLoaded && status !== null && !status.hasKey

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, busy])

  function submit() {
    const t = draft.trim()
    if (!t || busy) return
    setDraft('')
    void send(t)
  }

  const footer = (
    <div className="flex flex-col gap-2">
      {noKey && (
        <p className="text-[11px] font-semibold text-signal">
          No API key set. Add your Gemini key in Profile → Assistant first.
        </p>
      )}
      <div className="flex gap-2 items-end">
        <textarea
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() }
          }}
          rows={1}
          placeholder="Ask to add or change something…"
          className={`${FIELD} resize-none max-h-32`}
        />
        <button
          onClick={submit}
          disabled={busy || !draft.trim()}
          className="flex-shrink-0 px-3 py-2 rounded-[3px] text-xs font-semibold bg-ink text-white border border-ink cursor-pointer disabled:opacity-40 transition-opacity"
        >
          Send
        </button>
      </div>
    </div>
  )

  return (
    <Modal open={open} onClose={() => setOpen(false)} title="Assistant" footer={footer}>
      <div className="flex flex-col gap-3">
        {messages.length === 0 && (
          <div className="text-xs text-ink-2">
            <p className="mb-3">
              I can add or change exercise↔muscle mappings and your program. I'll always show you
              exactly what I'll do before anything is saved.
            </p>
            <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-ink-3 mb-1.5">Try</p>
            <div className="flex flex-col gap-1.5">
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => { setDraft(''); void send(s) }}
                  disabled={busy || noKey}
                  className="text-left text-xs px-2.5 py-2 rounded-[3px] border border-line bg-white text-ink hover:border-ink cursor-pointer disabled:opacity-40 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map(m => (
          <div key={m.id} className={m.role === 'user' ? 'self-end max-w-[85%]' : 'self-start w-full'}>
            {m.text && (
              <div
                className={
                  m.role === 'user'
                    ? 'px-2.5 py-2 rounded-[3px] bg-ink text-white text-xs whitespace-pre-wrap break-words'
                    : 'px-2.5 py-2 rounded-[3px] bg-hairline border border-line text-ink text-xs whitespace-pre-wrap break-words'
                }
              >
                {m.text}
              </div>
            )}
            {m.proposal && <ProposalCard message={m} />}
          </div>
        ))}

        {busy && (
          <div className="self-start px-2.5 py-2 rounded-[3px] bg-hairline border border-line text-ink-3 text-xs">
            <span className="inline-flex gap-1">
              <span className="animate-bounce">•</span>
              <span className="animate-bounce [animation-delay:0.15s]">•</span>
              <span className="animate-bounce [animation-delay:0.3s]">•</span>
            </span>
          </div>
        )}

        {messages.length > 0 && (
          <button
            onClick={clearChat}
            className="self-center text-[11px] text-ink-3 hover:text-ink underline underline-offset-2 cursor-pointer mt-1"
          >
            Clear conversation
          </button>
        )}
        <div ref={endRef} />
      </div>
    </Modal>
  )
}
