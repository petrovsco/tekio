import { useEffect, useState, lazy, Suspense } from 'react'
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
const ProgramTab = lazy(() => import('./components/tabs/ProgramTab').then(m => ({ default: m.ProgramTab })))
const ProfileTab = lazy(() => import('./components/tabs/ProfileTab').then(m => ({ default: m.ProfileTab })))
const AdminTab = lazy(() => import('./components/tabs/AdminTab').then(m => ({ default: m.AdminTab })))

// Body Weight, Donations and Water folded onto Home 2026-08-31 (doctrine §5,
// roadmap 014): capture and correction moved into the T2 sheets, the
// destinations went. Habits, shelved by the same ledger, was deleted 2026-09-05
// (roadmap 035) — three sections, one slot of R1 headroom.
type DrawerTab = 'Weights' | 'Cardio' | 'Mobility'
type Tab = 'Home' | 'Adaptations' | 'Program' | 'Profile' | 'Admin' | DrawerTab

function TabContent(
  { tab, setTab, focusMuscle }: { tab: Tab; setTab: (t: string, muscle?: string) => void; focusMuscle: string | null },
) {
  switch (tab) {
    case 'Home': return <HomeTab setTab={setTab} />
    case 'Adaptations': return <AdaptationsTab setTab={setTab} initialMuscle={focusMuscle} />
    case 'Program': return <ProgramTab />
    case 'Weights': return <WeightsTab />
    case 'Cardio': return <CardioTab />
    case 'Mobility': return <MobilityTab />
    case 'Profile': return <ProfileTab />
    case 'Admin': return <AdminTab />
    // Recovery, Water, Donations and Body Weight have no tab — they are reads
    // and captures on Home — and Habits has none because it is deleted. Fall
    // back to Home so a stray section-config row left over in the DB can never
    // render a blank screen.
    default: return <HomeTab setTab={setTab} />
  }
}

export default function App() {
  const [tab, setTab] = useState<Tab>('Home')
  // What a destination change carries with it. Today that is one muscle, so a
  // gap tapped on Home opens Adaptations already on that muscle (roadmap 064)
  // instead of on the tab's default. Cleared by any navigation that omits it,
  // so the drawer and the bottom nav always land on the plain tab.
  const [focusMuscle, setFocusMuscle] = useState<string | null>(null)
  const { loading, bootstrap } = useAppStore()

  useEffect(() => { bootstrap() }, [])

  const go = (t: string, muscle?: string) => {
    setFocusMuscle(muscle ?? null)
    setTab(t as Tab)
  }

  return (
    <AppShell tab={tab} setTab={go}>
      {loading ? (
        <HomeSkeleton />
      ) : (
        // No router (roadmap 023). Navigation is `tab` state and always has
        // been: the single `path="*"` route this replaced rendered the same
        // thing for every address, and nothing ever called a navigation API.
        // React Router was 37 kB on first paint doing nothing. Real web
        // addresses — a link that opens on Adaptations, back between tabs —
        // would bring it back; that is ten lines here, not a rewrite.
        <Suspense fallback={<HomeSkeleton />}>
          <TabContent tab={tab} setTab={go} focusMuscle={focusMuscle} />
        </Suspense>
      )}
    </AppShell>
  )
}
