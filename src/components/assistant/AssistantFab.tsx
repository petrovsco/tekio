import { lazy, Suspense } from 'react'
import { useAssistant } from '../../store/assistant'
import { Icon } from '../ui/Icon'

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
          // Solid ink, not the accent: the accent's one meaning is the gap
          // this app is pointing at (§1), and a chat button is not that.
          className={`fixed right-4 bottom-20 z-40 w-11 h-11 rounded-[3px] bg-ink text-white flex items-center justify-center cursor-pointer transition-transform active:scale-95 ${
            hidden ? 'translate-y-24 opacity-0 pointer-events-none' : ''
          }`}
        >
          <Icon name="assistant" size={20} />
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
