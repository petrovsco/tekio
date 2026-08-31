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
  const tabs = [
    { key: 'Home', icon: '🏠', label: 'Home' },
    { key: 'Weights', icon: '🏋️', label: 'Weights' },
    { key: 'Cardio', icon: '❤️', label: 'Cardio' },
    { key: 'Program', icon: '📋', label: 'Program' },
  ]
  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] bg-surface border-t border-border flex safe-area-inset-bottom">
      {tabs.map(t => (
        <button
          key={t.key}
          onClick={() => setTab(t.key)}
          className={`flex-1 flex flex-col items-center py-2 gap-0.5 transition-colors ${tab === t.key ? 'text-accent' : 'text-muted'}`}
        >
          <span className="text-xl">{t.icon}</span>
          <span className="text-[10px] font-medium">{t.label}</span>
        </button>
      ))}
      <button
        onClick={onMore}
        className="flex-1 flex flex-col items-center py-2 gap-0.5 text-muted"
      >
        <span className="text-xl">☰</span>
        <span className="text-[10px] font-medium">More</span>
      </button>
    </div>
  )
}
