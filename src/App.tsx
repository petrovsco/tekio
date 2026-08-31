import { useEffect, useState, lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import { useAppStore } from './store/app'
import { AppShell } from './components/layout/AppShell'
import { HomeTab } from './components/tabs/home/HomeTab'
import { HomeSkeleton } from './components/tabs/HomeSkeleton'

// T3 — on demand (design-system tier table, roadmap 018 unit 5). Everything
// reached by an explicit destination change is a lazy chunk with no prefetch;
// Home is the only tab in the initial chunk, because it is the whole
// five-second answer. This is what keeps Recharts and dnd-kit out of T1.
const AdaptationsTab = lazy(() => import('./components/tabs/AdaptationsTab').then(m => ({ default: m.AdaptationsTab })))
const WeightsTab = lazy(() => import('./components/tabs/weights/WeightsTab').then(m => ({ default: m.WeightsTab })))
const CardioTab = lazy(() => import('./components/tabs/CardioTab').then(m => ({ default: m.CardioTab })))
const MobilityTab = lazy(() => import('./components/tabs/MobilityTab').then(m => ({ default: m.MobilityTab })))
const HabitsTab = lazy(() => import('./components/tabs/HabitsTab').then(m => ({ default: m.HabitsTab })))
const ProgramTab = lazy(() => import('./components/tabs/ProgramTab').then(m => ({ default: m.ProgramTab })))
const ProfileTab = lazy(() => import('./components/tabs/ProfileTab').then(m => ({ default: m.ProfileTab })))
const AdminTab = lazy(() => import('./components/tabs/AdminTab').then(m => ({ default: m.AdminTab })))

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
          <Route path="*" element={
            <Suspense fallback={<HomeSkeleton />}>
              <TabContent tab={tab} setTab={(t) => setTab(t as Tab)} />
            </Suspense>
          } />
        </Routes>
      )}
    </AppShell>
  )
}
