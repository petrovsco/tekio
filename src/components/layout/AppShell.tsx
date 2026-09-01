import { useState, useEffect, useRef, lazy, Suspense, type ReactNode } from 'react'
import { useAppStore } from '../../store/app'
import { cycleInfo } from '../../lib/utils'
import { DeloadBadge } from '../ui/Badges'
import { Toast } from '../ui/Toast'
import { Drawer } from './Drawer'
import { BottomNav } from './BottomNav'
import { EnvBanner } from './EnvBanner'
import { IS_PRODUCTION } from '../../lib/env'
import { AssistantFab } from '../assistant/AssistantFab'

// T2 — on intent (roadmap 018 unit 5). The edit form is reached from every
// surface but only ever after a tap, so it is a lazy chunk prefetched on the
// first pointer-down anywhere in the shell and mounted only while an edit is
// open. Modal has no open/close transition, so conditional mounting is
// equivalent to the old always-rendered form.
const EditModal = lazy(() => import('../ui/EditModal').then(m => ({ default: m.EditModal })))

const TAB_TITLES: Record<string, string> = {
  Home: 'Home',
  Adaptations: 'Adaptations',
  Program: 'Program',
  Weights: 'Weights',
  'Body Weight': 'Body Weight',
  Cardio: 'Cardio',
  Mobility: 'Mobility',
  Donations: 'Blood Donations',
  Profile: 'Profile & Settings',
  Admin: 'Admin',
}

interface AppShellProps {
  tab: string
  setTab: (t: string) => void
  children: ReactNode
}

export function AppShell({ tab, setTab, children }: AppShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [inputFocused, setInputFocused] = useState(false)
  const programs = useAppStore(s => s.programs)
  const editing = useAppStore(s => s.editModal)
  const { isDeload, week } = cycleInfo(programs[0] ?? null)
  const prefetched = useRef(false)

  useEffect(() => {
    const INPUTS = ['INPUT', 'TEXTAREA', 'SELECT']
    const onIn = (e: FocusEvent) => { if (INPUTS.includes((e.target as HTMLElement)?.tagName)) setInputFocused(true) }
    const onOut = (e: FocusEvent) => { if (INPUTS.includes((e.target as HTMLElement)?.tagName)) setInputFocused(false) }
    document.addEventListener('focusin', onIn)
    document.addEventListener('focusout', onOut)
    return () => {
      document.removeEventListener('focusin', onIn)
      document.removeEventListener('focusout', onOut)
    }
  }, [])

  // The env banner (roadmap 037) is sticky at top-0 too, so the header parks
  // under it rather than sharing the slot and being covered.
  const stickyTop = IS_PRODUCTION ? 'top-0' : 'top-6'
  const headerClass = isDeload
    ? `bg-dl-bg border-b border-dl-bd sticky ${stickyTop} z-50`
    : `bg-surface border-b border-border sticky ${stickyTop} z-50`

  // The SIGNAL Home surface carries its own header (TEKIŌ + cycle label) and
  // paper ground; the shell chrome would double it. Drawer and Profile stay
  // reachable via the bottom nav's More on Home.
  const isHome = tab === 'Home'

  return (
    <div
      className={`min-h-screen ${isHome ? 'bg-paper' : 'bg-bg'}`}
      onPointerDown={() => {
        if (prefetched.current) return
        prefetched.current = true
        void import('../ui/EditModal')
      }}
    >
      <EnvBanner />

      <Toast />
      {editing && (
        <Suspense fallback={null}>
          <EditModal />
        </Suspense>
      )}

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        tab={tab}
        setTab={setTab}
      />

      {/* Header */}
      {!isHome && (
      <header className={headerClass}>
        <div className="flex items-center justify-between px-4 py-3 max-w-[600px] mx-auto">
          <button
            onClick={() => setDrawerOpen(true)}
            className="w-8 h-8 flex items-center justify-center text-muted hover:text-primary rounded-lg hover:bg-bg transition-colors"
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h12M3 10h12M3 14h12" />
            </svg>
          </button>
          <h1 className={`text-base font-bold ${isDeload ? 'text-dl-tx' : 'text-primary'}`}>
            {TAB_TITLES[tab] ?? tab}
          </h1>
          <div className="flex items-center gap-2 justify-end">
            {isDeload && <DeloadBadge week={week} />}
            {tab !== 'Profile' && (
              <button
                onClick={() => setTab('Profile')}
                className="w-8 h-8 flex items-center justify-center text-muted hover:text-primary rounded-lg hover:bg-bg transition-colors"
                aria-label="Profile & Settings"
              >
                👤
              </button>
            )}
          </div>
        </div>
      </header>
      )}

      {/* Main content */}
      <main className="max-w-[600px] mx-auto px-4 py-4 pb-24">
        {children}
      </main>

      <AssistantFab hidden={inputFocused} />

      <BottomNav tab={tab} setTab={setTab} onMore={() => setDrawerOpen(true)} hidden={inputFocused} />
    </div>
  )
}
