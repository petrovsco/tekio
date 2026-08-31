import { useEffect, useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import { useAppStore } from './store/app'
import { AppShell } from './components/layout/AppShell'
import { AdaptationsTab } from './components/tabs/AdaptationsTab'
import { HomeTab } from './components/tabs/home/HomeTab'
import { WeightsTab } from './components/tabs/weights/WeightsTab'
import { CardioTab } from './components/tabs/CardioTab'
import { MobilityTab } from './components/tabs/MobilityTab'
import { HabitsTab } from './components/tabs/HabitsTab'
import { ProgramTab } from './components/tabs/ProgramTab'
import { ProfileTab } from './components/tabs/ProfileTab'
import { AdminTab } from './components/tabs/AdminTab'
import { HomeSkeleton } from './components/tabs/HomeSkeleton'

// Body Weight, Donations and Water folded onto Home 2026-08-31 (doctrine §5,
// roadmap 014): capture and correction moved into the T2 sheets, the
// destinations went. Habits stays only because it is shelved, not folded.
const DRAWER_TABS = ['Weights', 'Cardio', 'Mobility', 'Habits'] as const
type DrawerTab = typeof DRAWER_TABS[number]
type Tab = 'Home' | 'Adaptations' | 'Program' | 'Profile' | 'Admin' | DrawerTab

function TabContent({ tab, setTab }: { tab: Tab; setTab: (t: string) => void }) {
  switch (tab) {
    case 'Home': return <HomeTab setTab={setTab} />
    case 'Adaptations': return <AdaptationsTab setTab={setTab} />
    case 'Program': return <ProgramTab />
    case 'Weights': return <WeightsTab />
    case 'Cardio': return <CardioTab />
    case 'Mobility': return <MobilityTab />
    case 'Habits': return <HabitsTab />
    case 'Profile': return <ProfileTab />
    case 'Admin': return <AdminTab />
    // Recovery, Water, Donations and Body Weight have no tab — they are reads
    // and captures on Home. Fall back to Home so a stray section-config row
    // left over in the DB can never render a blank screen.
    default: return <HomeTab setTab={setTab} />
  }
}

export default function App() {
  const [tab, setTab] = useState<Tab>('Home')
  const { loading, bootstrap } = useAppStore()

  useEffect(() => { bootstrap() }, [])

  return (
    <AppShell tab={tab} setTab={(t) => setTab(t as Tab)}>
      {loading ? (
        <HomeSkeleton />
      ) : (
        <Routes>
          <Route path="*" element={<TabContent tab={tab} setTab={(t) => setTab(t as Tab)} />} />
        </Routes>
      )}
    </AppShell>
  )
}
