import { useEffect, useState, lazy, Suspense } from 'react'
import { useAppStore } from './store/app'
import { AppShell } from './components/layout/AppShell'
import { HomeTab } from './components/tabs/home/HomeTab'
import { HomeSkeleton } from './components/tabs/HomeSkeleton'
import { dismissSplash } from './lib/splash'
import { setScreen } from './lib/errorReport'
import { whileReloading } from './lib/staleChunk'
import { startSession, onSignedOut } from './lib/session'

// T3 — on demand (design-system tier table, roadmap 018 unit 5). Everything
// reached by an explicit destination change is a lazy chunk with no prefetch;
// Home is the only tab in the initial chunk, because it is the whole
// five-second answer. This is what keeps Recharts and dnd-kit out of T1.
const AdaptationsTab = lazy(() => import('./components/tabs/AdaptationsTab').then(whileReloading).then(m => ({ default: m.AdaptationsTab })))
const WeightsTab = lazy(() => import('./components/tabs/weights/WeightsTab').then(whileReloading).then(m => ({ default: m.WeightsTab })))
const CardioTab = lazy(() => import('./components/tabs/CardioTab').then(whileReloading).then(m => ({ default: m.CardioTab })))
const MobilityTab = lazy(() => import('./components/tabs/MobilityTab').then(whileReloading).then(m => ({ default: m.MobilityTab })))
const ProfileTab = lazy(() => import('./components/tabs/ProfileTab').then(whileReloading).then(m => ({ default: m.ProfileTab })))
const SettingsTab = lazy(() => import('./components/tabs/SettingsTab').then(whileReloading).then(m => ({ default: m.SettingsTab })))
// Only a signed-out start ever draws it (RFC 0003).
const SignIn = lazy(() => import('./components/layout/SignIn').then(whileReloading).then(m => ({ default: m.SignIn })))
// Only an assistant asking to connect sends anyone to it (RFC 0099).
const Consent = lazy(() => import('./components/layout/Consent').then(whileReloading).then(m => ({ default: m.Consent })))

/** The one address that is not the app: where Supabase's OAuth server sends
 *  the person to answer an assistant (RFC 0099). */
const consent = location.pathname === '/oauth/consent'
  ? { id: new URLSearchParams(location.search).get('authorization_id') }
  : null

// Body Weight and Donations folded onto Home 2026-08-31 (doctrine §5,
// roadmap 014): capture and correction moved into the T2 sheets, the
// destinations went. Habits, shelved by the same ledger, was deleted 2026-09-05
// (roadmap 035), and Water, folded with them, was deleted 2026-10-04 (RFC 0089)
// — three sections, one slot of R1 headroom.
type DrawerTab = 'Weights' | 'Cardio' | 'Mobility'
type Tab = 'Home' | 'Adaptations' | 'Profile' | 'Settings' | DrawerTab

function TabContent(
  { tab, setTab, focusMuscle }: { tab: Tab; setTab: (t: string, muscle?: string) => void; focusMuscle: string | null },
) {
  switch (tab) {
    case 'Home': return <HomeTab setTab={setTab} />
    case 'Adaptations': return <AdaptationsTab setTab={setTab} initialMuscle={focusMuscle} />
    case 'Weights': return <WeightsTab />
    case 'Cardio': return <CardioTab />
    case 'Mobility': return <MobilityTab />
    case 'Profile': return <ProfileTab focus={focusMuscle} />
    case 'Settings': return <SettingsTab />
    // Recovery, Donations and Body Weight have no tab — they are reads and
    // captures on Home — and Habits and Water have none because they are
    // deleted. Fall
    // back to Home so a stray section-config row left over in the DB can never
    // render a blank screen.
    default: return <HomeTab setTab={setTab} />
  }
}

export default function App() {
  const [tab, setTab] = useState<Tab>('Home')
  // What a destination change carries with it: one muscle, so a gap tapped on
  // Home opens Adaptations already on that muscle (roadmap 064) instead of on
  // the tab's default; or a Profile card, so the readiness sheet's link opens
  // Profile on its method card (RFC 0092). Cleared by any navigation that omits it,
  // so the drawer and the bottom nav always land on the plain tab.
  const [focusMuscle, setFocusMuscle] = useState<string | null>(null)
  const loading = useAppStore(s => s.loading)
  const bootstrap = useAppStore(s => s.bootstrap)
  // RFC 0003: nothing loads before someone is signed in. Undefined while the
  // session is being read, which for a returning visitor is one storage read.
  const [session, setSession] = useState<{ signedIn: boolean; linkError?: string }>()

  useEffect(() => {
    startSession().then(s => {
      setSession(s)
      if (s.signedIn && !consent) bootstrap()
    })
    // Signed out here or in another tab: start again from a clean page, so no
    // one's rows stay in memory behind the sign-in screen.
    return onSignedOut(() => window.location.reload())
  }, [])
  useEffect(() => { if (!loading) dismissSplash() }, [loading])

  if (consent && session?.signedIn) {
    return (
      <Suspense fallback={null}>
        <SignedOutSplash />
        <Consent id={consent.id} />
      </Suspense>
    )
  }

  if (session && !session.signedIn) {
    return (
      <Suspense fallback={null}>
        <SignedOutSplash />
        <SignIn linkError={session.linkError} />
      </Suspense>
    )
  }

  const go = (t: string, muscle?: string) => {
    setScreen(t)
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

/** The splash waits for bootstrap; a signed-out start and the consent page
 *  (RFC 0099) have none, so it goes the moment their screen is drawn. */
function SignedOutSplash() {
  useEffect(() => { dismissSplash() }, [])
  return null
}
