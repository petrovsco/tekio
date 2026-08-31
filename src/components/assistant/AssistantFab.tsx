import { lazy, Suspense } from 'react'
import { useAssistant } from '../../store/assistant'

// T2 — on intent (roadmap 018 unit 5). The chat panel only exists once the FAB
// is tapped; the button itself is the whole at-rest cost. Prefetched on
// pointer-down so the chunk is in flight before the click lands.
const AssistantPanel = lazy(() => import('./AssistantPanel').then(m => ({ default: m.AssistantPanel })))

/** Floating assistant button (above the bottom nav) + the slide-up chat panel. */
export function AssistantFab({ hidden }: { hidden?: boolean }) {
  const { open, setOpen } = useAssistant()

  return (
    <>
      {!open && (
        <button
          onPointerDown={() => { void import('./AssistantPanel') }}
          onClick={() => setOpen(true)}
          aria-label="Open assistant"
          className={`fixed right-4 bottom-20 z-40 w-12 h-12 rounded-full bg-accent text-white shadow-lg flex items-center justify-center text-xl transition-transform hover:scale-105 active:scale-95 ${
            hidden ? 'translate-y-24 opacity-0 pointer-events-none' : ''
          }`}
        >
          🤖
        </button>
      )}
      {open && (
        <Suspense fallback={null}>
          <AssistantPanel />
        </Suspense>
      )}
    </>
  )
}
