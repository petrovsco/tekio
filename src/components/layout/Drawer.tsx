import { usePrefs } from '../../store/prefs'
import { Icon, type IconName } from '../ui/Icon'

// Only sections that still have a destination. Body Weight, Donations, Water
// and Recovery folded onto Home (doctrine §5) and Habits was deleted (roadmap
// 035) — a leftover config row for one of them must not put its entry back in
// the menu.
const NAV_META: Record<string, { icon: IconName; label: string }> = {
  Weights:      { icon: 'weights', label: 'Weights' },
  Cardio:       { icon: 'cardio', label: 'Cardio' },
  Mobility:     { icon: 'mobility', label: 'Mobility' },
}

interface DrawerProps {
  open: boolean
  onClose: () => void
  tab: string
  setTab: (tab: string) => void
}

function GroupLabel({ children }: { children: string }) {
  return (
    <p className="px-4 pt-4 pb-1.5 text-[9px] font-bold uppercase tracking-[0.14em] text-ink-3">
      {children}
    </p>
  )
}

function NavItem({ icon, label, active, onClick }: { icon: IconName; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center gap-3 px-4 py-2.5 w-full text-left cursor-pointer transition-colors ${
        active ? 'text-ink' : 'text-ink-2 hover:text-ink'
      }`}
    >
      {/* 2px is reserved for true emphasis (§6) — here, the current surface. */}
      {active && <span className="absolute left-0 top-1.5 bottom-1.5 w-[2px] bg-ink" />}
      <Icon name={icon} />
      <span className={`text-xs ${active ? 'font-bold' : 'font-normal'}`}>{label}</span>
    </button>
  )
}

export function Drawer({ open, onClose, tab, setTab }: DrawerProps) {
  const { sections } = usePrefs()

  // Build ordered nav from prefs; fall back to default order if prefs not loaded yet
  const visibleNav = sections.length > 0
    ? sections
        .filter(s => s.showInMenu && s.sectionKey in NAV_META)
        .map(s => ({ key: s.sectionKey, ...NAV_META[s.sectionKey] }))
    : Object.entries(NAV_META).map(([key, meta]) => ({ key, ...meta }))

  const go = (t: string) => () => { setTab(t); onClose() }

  return (
    <>
      {open && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-[rgba(26,26,26,0.34)] z-[200]"
        />
      )}
      <div
        className={`fixed top-0 left-0 h-full w-[280px] bg-white text-ink border-r border-chrome z-[201] flex flex-col transition-transform duration-[250ms] ease-[cubic-bezier(.4,0,.2,1)] ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Header — the wordmark carries the identity; no logo tile, no tagline */}
        <div className="px-4 py-5 border-b border-line flex items-center justify-between">
          <span className="text-[15px] font-bold tracking-[0.14em]">TEKIŌ</span>
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="w-11 h-11 -my-2 -mr-3 flex items-center justify-end text-ink-2 hover:text-ink cursor-pointer"
          >
            <Icon name="close" />
          </button>
        </div>

        {/* Nav */}
        <div className="flex-1 overflow-y-auto pt-2">
          <NavItem icon="home" label="Home" active={tab === 'Home'} onClick={go('Home')} />
          <NavItem icon="adaptations" label="Adaptations" active={tab === 'Adaptations'} onClick={go('Adaptations')} />
          <NavItem icon="program" label="Program" active={tab === 'Program'} onClick={go('Program')} />
          <GroupLabel>Log</GroupLabel>
          {visibleNav.map(n => (
            <NavItem key={n.key} icon={n.icon} label={n.label} active={tab === n.key} onClick={go(n.key)} />
          ))}
        </div>

        {/* Profile & Settings */}
        <GroupLabel>Account</GroupLabel>
        <NavItem icon="profile" label="Profile & Settings" active={tab === 'Profile'} onClick={go('Profile')} />
        <NavItem icon="admin" label="Admin" active={tab === 'Admin'} onClick={go('Admin')} />
        <div className="h-4" />
      </div>
    </>
  )
}
