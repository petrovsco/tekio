import { usePrefs } from '../../store/prefs'

const NAV_META: Record<string, { icon: string; label: string }> = {
  Weights:      { icon: '🏋️', label: 'Weights' },
  'Body Weight': { icon: '⚖️', label: 'Body Weight' },
  Cardio:       { icon: '❤️', label: 'Cardio' },
  Mobility:     { icon: '🧘', label: 'Mobility' },
  Donations:    { icon: '🩸', label: 'Donations' },
  Water:        { icon: '💧', label: 'Water' },
  Habits:       { icon: '✅', label: 'Habits' },
  Recovery:     { icon: '🔋', label: 'Recovery' },
}

interface DrawerProps {
  open: boolean
  onClose: () => void
  tab: string
  setTab: (tab: string) => void
}

function NavItem({ icon, label, active, onClick }: { icon: string; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-2.5 w-full text-left transition-colors ${active ? 'bg-accent-l text-accent' : 'text-primary hover:bg-bg'}`}
    >
      <span className="text-lg w-6 text-center">{icon}</span>
      <span className={`text-sm ${active ? 'font-semibold' : 'font-normal'}`}>{label}</span>
      {active && <span className="ml-auto w-0.5 h-5 bg-accent rounded-full" />}
    </button>
  )
}

export function Drawer({ open, onClose, tab, setTab }: DrawerProps) {
  const { sections } = usePrefs()

  // Build ordered nav from prefs; fall back to default order if prefs not loaded yet
  const visibleNav = sections.length > 0
    ? sections
        .filter(s => s.showInMenu)
        .map(s => ({ key: s.sectionKey, ...NAV_META[s.sectionKey] ?? { icon: '📌', label: s.sectionKey } }))
    : Object.entries(NAV_META).map(([key, meta]) => ({ key, ...meta }))

  return (
    <>
      {open && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/40 z-[200] backdrop-blur-sm"
        />
      )}
      <div
        className={`fixed top-0 left-0 h-full w-[280px] bg-surface z-[201] shadow-xl flex flex-col transition-transform duration-[250ms] ease-[cubic-bezier(.4,0,.2,1)] ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Header */}
        <div className="px-4 py-5 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-lg">💪</div>
            <div>
              <p className="text-sm font-bold text-primary leading-tight">Tekiō</p>
              <p className="text-[11px] text-muted">Fitness Tracker</p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted hover:text-primary text-xl leading-none">✕</button>
        </div>

        {/* Nav */}
        <div className="flex-1 overflow-y-auto py-2">
          <NavItem icon="🏠" label="Home" active={tab === 'Home'} onClick={() => { setTab('Home'); onClose() }} />
          <NavItem icon="🧬" label="Adaptations" active={tab === 'Adaptations'} onClick={() => { setTab('Adaptations'); onClose() }} />
          <NavItem icon="📋" label="Program" active={tab === 'Program'} onClick={() => { setTab('Program'); onClose() }} />
          <div className="px-4 pt-3 pb-1">
            <p className="text-[10px] font-bold text-muted uppercase tracking-widest">Log</p>
          </div>
          {visibleNav.map(n => (
            <NavItem key={n.key} icon={n.icon} label={n.label} active={tab === n.key} onClick={() => { setTab(n.key); onClose() }} />
          ))}
        </div>

        {/* Profile & Settings */}
        <div className="px-4 pt-3 pb-1">
          <p className="text-[10px] font-bold text-muted uppercase tracking-widest">Account</p>
        </div>
        <NavItem icon="👤" label="Profile & Settings" active={tab === 'Profile'} onClick={() => { setTab('Profile'); onClose() }} />
        <NavItem icon="🛠️" label="Admin" active={tab === 'Admin'} onClick={() => { setTab('Admin'); onClose() }} />
        <div className="h-4" />
      </div>
    </>
  )
}
