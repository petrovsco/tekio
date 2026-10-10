import { lazy, Suspense, useState } from 'react'
import { useAppStore } from '../../store/app'
import type { ErrorReport } from '../../lib/errorReport'

const ReportNoteSheet = lazy(() => import('./ReportNoteSheet'))

export function Toast() {
  const toast = useAppStore(s => s.toast)
  const report = useAppStore(s => s.toastReport)
  // Held here, not on the toast: the sheet outlives the toast that offered it.
  // The toast sits above every sheet (z-300), because a refused write is
  // usually reported from inside one and its link has to be tappable there.
  const [noting, setNoting] = useState<ErrorReport | null>(null)
  return (
    <>
      {toast && (
        <div
          key={toast}
          className="fixed top-4 left-1/2 z-[300] bg-ink text-white text-xs px-3 py-2 rounded-[3px] animate-toast-fade"
          style={report ? { animationDuration: '6s' } : undefined}
        >
          {toast}
          {report && (
            <>
              {' '}Reported ·{' '}
              <button onClick={() => setNoting(report)} className="underline cursor-pointer">
                Add a note
              </button>
            </>
          )}
        </div>
      )}
      {noting && (
        <Suspense fallback={null}>
          <ReportNoteSheet report={noting} onClose={() => setNoting(null)} />
        </Suspense>
      )}
    </>
  )
}
