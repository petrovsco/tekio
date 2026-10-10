import { useState } from 'react'
import { Modal } from './Modal'
import { Btn } from './Button'
import { FIELD } from './Input'
import { sendNote, type ErrorReport } from '../../lib/errorReport'

// RFC 0103: what was sent, in full, and a line of text the user may add. The
// report already went on its own; the note goes only on Send, because it is
// the one place a user might write something about their body.
// Lazy-loaded: nobody pays for it until an error offers it.

export default function ReportNoteSheet({ report, onClose }: { report: ErrorReport; onClose: () => void }) {
  const [note, setNote] = useState('')
  const [state, setState] = useState<'writing' | 'sending' | 'sent' | 'failed'>('writing')

  const send = async () => {
    setState('sending')
    try {
      await sendNote(report, note)
      setState('sent')
    } catch {
      setState('failed')
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Add a note"
      footer={state === 'sent'
        ? <Btn onClick={onClose} className="w-full">Close</Btn>
        : (
          <Btn onClick={send} disabled={!note.trim() || state === 'sending'} className="w-full">
            {state === 'sending' ? 'Sending…' : 'Send'}
          </Btn>
        )}
    >
      {state === 'sent' ? (
        <p className="text-sm text-ink">Note sent. Thank you.</p>
      ) : (
        <div className="flex flex-col gap-3">
          <textarea
            autoFocus
            value={note}
            onChange={e => setNote(e.target.value)}
            maxLength={2000}
            placeholder="What were you doing when it happened?"
            className={`${FIELD} h-20 resize-none`}
          />
          {state === 'failed' && <p className="text-xs text-ink">Couldn't send the note. Try again.</p>}
          <p className="text-xs text-ink-2 leading-[1.4]">
            This was already sent when the error happened. It holds nothing you logged.
          </p>
          <pre className="text-[10px] leading-[1.4] text-ink-3 bg-hairline rounded-[3px] p-2 whitespace-pre-wrap break-all max-h-60 overflow-y-auto">
            {JSON.stringify(report.payload, null, 2)}
          </pre>
        </div>
      )}
    </Modal>
  )
}
