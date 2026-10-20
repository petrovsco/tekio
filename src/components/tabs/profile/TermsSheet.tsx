import { Modal } from '../../ui/Modal'
import { TERMS, TERMS_DRAFT, TERMS_UPDATED } from '../../../lib/terms'
import { fmtDate } from '../../../lib/utils'

// RFC 0111: the Terms of Service, read from Profile. The words are data in
// lib/terms; this only lays them out. A lazy chunk — nobody pays for the text
// until they open it (doctrine P1).
export function TermsSheet({ onClose }: { onClose: () => void }) {
  return (
    <Modal open onClose={onClose} title="Terms of Service">
      {TERMS_DRAFT && (
        <p className="text-xs text-ink-2 border border-line rounded-[3px] px-2.5 py-2 mb-3 leading-[1.4]">
          Draft for review. Not yet in force; bracketed details are still to be filled in.
        </p>
      )}
      <p className="text-[11px] text-ink-3 mb-3">Last updated {fmtDate(TERMS_UPDATED, { relative: false })}</p>
      <div className="flex flex-col gap-4">
        {TERMS.map(section => (
          <section key={section.heading}>
            <h3 className="text-sm font-bold text-ink mb-1.5">{section.heading}</h3>
            <div className="flex flex-col gap-1.5">
              {section.paragraphs.map((p, i) => (
                <p key={i} className="text-xs text-ink-2 leading-[1.5]">{p}</p>
              ))}
            </div>
          </section>
        ))}
      </div>
    </Modal>
  )
}
