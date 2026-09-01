import { Icon, type IconName } from '../ui/Icon'

interface BottomNavProps {
  tab: string
  setTab: (t: string) => void
  onMore: () => void
  hidden?: boolean
}

export function BottomNav({ tab, setTab, onMore, hidden }: BottomNavProps) {
  if (hidden) return null
  // Home names the gap; Weights and Cardio are where it gets closed, so both
  // sit one tap away (roadmap 018 unit 4). Adaptations and Mobility moved
  // behind More — they are detail on a read Home already carries.
  const tabs: { key: string; icon: IconName; label: string }[] = [
    { key: 'Home', icon: 'home', label: 'Home' },
    { key: 'Weights', icon: 'weights', label: 'Weights' },
    { key: 'Cardio', icon: 'cardio', label: 'Cardio' },
    { key: 'Program', icon: 'program', label: 'Program' },
  ]
  // Where-you-are is not urgency, so the active tab is ink rather than the
  // accent (design-system §1 — the accent keeps its one meaning).
  const item = (active: boolean) =>
    `flex-1 flex flex-col items-center py-2 gap-[3px] cursor-pointer transition-colors ${
      active ? 'text-ink' : 'text-ink-3'
    }`
  const label = 'text-[9px] font-bold uppercase tracking-[0.10em]'

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] bg-white border-t border-chrome flex safe-area-inset-bottom">
      {tabs.map(t => (
        <button key={t.key} onClick={() => setTab(t.key)} className={item(tab === t.key)}>
          <Icon name={t.icon} />
          <span className={label}>{t.label}</span>
        </button>
      ))}
      <button onClick={onMore} className={item(false)} aria-label="More">
        <Icon name="menu" />
        <span className={label}>More</span>
      </button>
    </div>
  )
}
