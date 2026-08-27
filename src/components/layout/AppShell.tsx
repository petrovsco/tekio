import { useState, useEffect, type ReactNode } from 'react'
import { useAppStore } from '../../store/app'
import { cycleInfo } from '../../lib/utils'
import { DeloadBadge } from '../ui/Badges'
import { Toast } from '../ui/Toast'
import { EditModal } from '../ui/EditModal'
import { Drawer } from './Drawer'
import { BottomNav } from './BottomNav'
import { AssistantFab } from '../assistant/AssistantFab'

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
  const { isDeload, week } = cycleInfo(programs[0] ?? null)

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

  const headerClass = isDeload
    ? 'bg-dl-bg border-b border-dl-bd sticky top-0 z-50'
    : 'bg-surface border-b border-border sticky top-0 z-50'

  return (
    <div className="min-h-screen bg-bg">
      <Toast />
      <EditModal />

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        tab={tab}
        setTab={setTab}
      />

      {/* Header */}
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

      {/* Main content */}
      <main className="max-w-[600px] mx-auto px-4 py-4 pb-24">
        {children}
      </main>

      <AssistantFab hidden={inputFocused} />

      <BottomNav tab={tab} setTab={setTab} onMore={() => setDrawerOpen(true)} hidden={inputFocused} />
    </div>
  )
}
