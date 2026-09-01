import { useAssistant } from '../../store/assistant'
import { describeToolCall } from '../../lib/assistant/executor'
import { Btn } from '../ui/Button'
import { Icon } from '../ui/Icon'
import type { ChatMessage } from '../../lib/assistant/types'

export function ProposalCard({ message }: { message: ChatMessage }) {
  const proposal = message.proposal!
  const { confirmProposal, cancelProposal, busy } = useAssistant()
  const pending = proposal.status === 'pending'

  return (
    <div className="mt-2 border border-line rounded-[3px] overflow-hidden bg-white">
      <ul className="divide-y divide-hairline">
        {proposal.calls.map((call, i) => {
          const result = proposal.results?.[i]
          // A tick means it ran; an accent dot means it did not — the accent's
          // one meaning (§1) is "look here", which is exactly what a failed
          // call needs. A pending call has no mark yet.
          return (
            <li key={i} className="px-2.5 py-2 text-xs text-ink flex gap-2">
              <span className="flex-shrink-0 w-3.5 flex justify-center pt-0.5">
                {result
                  ? (result.ok ? <Icon name="check" size={11} /> : <span className="text-signal font-bold leading-none">!</span>)
                  : <span className="text-ink-4 leading-none">•</span>}
              </span>
              <span className="min-w-0">
                <span className="break-words">{describeToolCall(call)}</span>
                {result && !result.ok && (
                  <span className="block text-signal mt-0.5">{result.summary}</span>
                )}
              </span>
            </li>
          )
        })}
      </ul>

      {pending ? (
        <div className="flex gap-2 px-2.5 py-2 border-t border-hairline">
          <Btn small variant="primary" disabled={busy} onClick={() => confirmProposal(message.id)}>
            Confirm
          </Btn>
          <Btn small variant="secondary" disabled={busy} onClick={() => cancelProposal(message.id)}>
            Cancel
          </Btn>
        </div>
      ) : (
        <div className="px-2.5 py-1.5 border-t border-hairline text-[11px] font-semibold text-ink-2">
          {proposal.status === 'applied' && 'Applied'}
          {proposal.status === 'partial' && 'Partially applied'}
          {proposal.status === 'failed' && 'Failed — nothing changed'}
          {proposal.status === 'cancelled' && 'Cancelled'}
        </div>
      )}
    </div>
  )
}
