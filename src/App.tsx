import { useEffect, useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import { useAppStore } from './store/app'
import { AppShell } from './components/layout/AppShell'
import { AdaptationsTab } from './components/tabs/AdaptationsTab'
import { HomeTab } from './components/tabs/home/HomeTab'
import { WeightsTab } from './components/tabs/weights/WeightsTab'
import { BodyWeightTab } from './components/tabs/BodyWeightTab'
import { CardioTab } from './components/tabs/CardioTab'
import { MobilityTab } from './components/tabs/MobilityTab'
import { DonationsTab } from './components/tabs/DonationsTab'
import { WaterTab } from './components/tabs/WaterTab'
import { HabitsTab } from './components/tabs/HabitsTab'
import { ProgramTab } from './components/tabs/ProgramTab'
import { ProfileTab } from './components/tabs/ProfileTab'
import { AdminTab } from './components/tabs/AdminTab'
import { HomeSkeleton } from './components/tabs/HomeSkeleton'

const DRAWER_TABS = ['Weights', 'Body Weight', 'Cardio', 'Mobility', 'Donations', 'Water', 'Habits'] as const
type DrawerTab = typeof DRAWER_TABS[number]
type Tab = 'Home' | 'Adaptations' | 'Program' | 'Profile' | 'Admin' | DrawerTab

function TabContent({ tab, setTab }: { tab: Tab; setTab: (t: string) => void }) {
  switch (tab) {
    case 'Home': return <HomeTab />
    case 'Adaptations': return <AdaptationsTab setTab={setTab} />
    case 'Program': return <ProgramTab />
    case 'Weights': return <WeightsTab />
    case 'Body Weight': return <BodyWeightTab />
    case 'Cardio': return <CardioTab />
    case 'Mobility': return <MobilityTab />
    case 'Donations': return <DonationsTab />
    case 'Water': return <WaterTab />
    case 'Habits': return <HabitsTab />
    case 'Profile': return <ProfileTab />
    case 'Admin': return <AdminTab />
    // Recovery has no dedicated tab (Home-only card); fall back to Home so a stray
    // section key can never render a blank screen.
    default: return <HomeTab />
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
