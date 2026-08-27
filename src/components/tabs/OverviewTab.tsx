import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useAppStore } from '../../store/app'
import { usePrefs } from '../../store/prefs'
import { weekKey, today, currentStreak, habitProgress } from '../../lib/utils'
import type { HabitProgressContext } from '../../lib/utils'
import { WATER_GOAL_ML } from '../../constants/app'
import { Card } from '../ui/Card'
import { Chip } from '../ui/Chip'
import { MiniChart } from '../ui/MiniChart'
import { RecoveryCard } from './home/RecoveryCard'
import { useCountUp } from '../../hooks/useCountUp'

interface OverviewTabProps {
  setTab: (t: string) => void
}

function StatBox({
  emoji, label, value, decimals = 0, delay, onClick,
}: {
  emoji: string
  label: string
  value: number | null
  decimals?: number
  delay: number
  onClick: () => void
}) {
  const display = useCountUp(value ?? 0)
  return (
    <button
      onClick={onClick}
      style={{ animationDelay: `${delay}ms` }}
      className="bg-surface rounded-xl border border-border py-2.5 px-1.5 text-center active:scale-[0.95] transition-transform animate-fade-in-up"
    >
      <div className="text-xl mb-0.5">{emoji}</div>
      <div className="text-base font-bold text-primary">{value == null ? '–' : display.toFixed(decimals)}</div>
      <div className="text-[10px] text-muted font-medium">{label}</div>
    </button>
  )
}

/** Card header whose title doubles as an entrance to the corresponding section. */
function CardHeader({ title, onOpen, right }: { title: ReactNode; onOpen: () => void; right?: ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-2">
      <button
        onClick={onOpen}
        className="flex items-center gap-1 group active:scale-[0.97] transition-transform"
        aria-label="Open section"
      >
        <span className="text-xs font-semibold text-muted uppercase tracking-wide group-hover:text-accent transition-colors">{title}</span>
        <span aria-hidden className="text-muted group-hover:text-accent transition-colors text-sm leading-none">›</span>
      </button>
      {right}
    </div>
  )
}

const WATER_PILLS = [100, 200, 300, 400, 500]

export function OverviewTab({ setTab }: OverviewTabProps) {
  const { weights, bodyweight, cardio, mobility, sports, donations, water, addWaterEntry, setToast,
    habits, habitCompletions, exerciseMuscles, muscleGroups, exerciseNames } = useAppStore()
  const { sections, weekStartDay } = usePrefs()

  const homeOn = (key: string) => {
    if (sections.length === 0) return true
    return sections.find(s => s.sectionKey === key)?.showInHome ?? true
  }

  const sectionOrder = sections.length > 0
    ? Object.fromEntries(sections.map(s => [s.sectionKey, s.sortOrder]))
    : {} as Record<string, number>

  // Charts
  const bwChart = [...bodyweight]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-20)
    .map(d => ({ x: d.date.slice(5), y: d.weight }))

  const exMap: Record<string, number> = {}
  weights.forEach(e => { exMap[e.exercise] = (exMap[e.exercise] || 0) + 1 })
  const topExercises = Object.entries(exMap).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([ex]) => ex)
  const topEx = topExercises[0]
  const [selectedExercise, setSelectedExercise] = useState<string | undefined>(undefined)
  const activeExercise = selectedExercise && topExercises.includes(selectedExercise) ? selectedExercise : topEx

  const activeExerciseEntries = weights
    .filter(d => d.exercise === activeExercise)
    .sort((a, b) => a.date.localeCompare(b.date))
  const liftMaxes = activeExerciseEntries.map(d => Math.max(...d.sets.map(s => s.weight)))
  const liftChart = activeExerciseEntries.map((d, i) => ({ x: d.date.slice(5), y: liftMaxes[i] }))
  const latestLiftMax = liftMaxes[liftMaxes.length - 1]
  const prevLiftMax = liftMaxes[liftMaxes.length - 2]
  const liftDiff = latestLiftMax != null && prevLiftMax != null ? +(latestLiftMax - prevLiftMax).toFixed(1) : null
  const isLiftPR = latestLiftMax != null && liftMaxes.length > 0 && latestLiftMax >= Math.max(...liftMaxes)
  const latestLiftMaxDisplay = useCountUp(latestLiftMax ?? 0)

  const cardioChart = [...cardio]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-8)
    .map(d => ({ x: d.date.slice(5), y: d.duration }))

  const thisWeek = weekKey(today(), weekStartDay)
  const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7)
  const weekStr = weekAgo.toISOString().slice(0, 10)
  const liftWeek = [...new Set(weights.filter(d => d.date >= weekStr).map(d => d.date))].length
  const cardioWeek = cardio.filter(d => d.date >= weekStr).length
  const mobWeek = mobility.filter(d => d.date >= weekStr).length
  const sortedBw = [...bodyweight].sort((a, b) => b.date.localeCompare(a.date))
  const latestBw = sortedBw[0]
  const prevBw = sortedBw[1]
  const bwDiff = latestBw && prevBw ? +(latestBw.weight - prevBw.weight).toFixed(1) : null
  const latestBwDisplay = useCountUp(latestBw?.weight ?? 0)

  const sportWeekMap: Record<string, number> = {}
  sports.forEach(s => { if (weekKey(s.date, weekStartDay) === thisWeek) sportWeekMap[s.sport] = (sportWeekMap[s.sport] || 0) + 1 })

  // Streak
  const activeDates = new Set<string>([
    ...weights.map(w => w.date),
    ...cardio.map(c => c.date),
    ...mobility.map(m => m.date),
  ])
  const streak = currentStreak(activeDates)
  const streakDisplay = Math.round(useCountUp(streak))

  // Water
  const todayWaterMl = water.filter(w => w.date === today()).reduce((s, w) => s + w.amountMl, 0)
  const todayWaterDisplay = Math.round(useCountUp(todayWaterMl))
  const waterPct = Math.min(100, Math.round((todayWaterMl / WATER_GOAL_ML) * 100))
  const goalReached = todayWaterMl >= WATER_GOAL_ML
  const [showGoalPulse, setShowGoalPulse] = useState(false)
  const prevGoalReached = useRef(false)
  useEffect(() => {
    if (goalReached && !prevGoalReached.current) {
      setShowGoalPulse(true)
      const t = setTimeout(() => setShowGoalPulse(false), 600)
      prevGoalReached.current = true
      return () => clearTimeout(t)
    }
    prevGoalReached.current = goalReached
  }, [goalReached])
  const addWater = (ml: number) => {
    addWaterEntry({ date: today(), amountMl: ml })
    setToast(`✅ +${ml} ml water`)
  }

  const lastFull = [...donations].filter(d => d.type === 'Full Blood').sort((a, b) => b.date.localeCompare(a.date))[0]
  const nextDonDate = lastFull
    ? new Date(new Date(lastFull.date).getTime() + 56 * 86400000).toISOString().slice(0, 10)
    : null
  const donDaysLeft = nextDonDate
    ? Math.ceil((new Date(nextDonDate).getTime() - new Date(today()).getTime()) / 86400000)
    : null
  const donDaysLeftDisplay = Math.round(useCountUp(donDaysLeft ?? 0))

  // Habit trackers, summarised per cadence (done / total active habits)
  const habitCtx: HabitProgressContext = {
    weights, mobility, water, cardio, habitCompletions, exerciseMuscles, muscleGroups, exerciseNames,
  }
  const habitSummary = (['daily', 'weekly', 'monthly'] as const).map(cadence => {
    const list = habits.filter(h => h.active && h.cadence === cadence)
    const done = list.filter(h => habitProgress(h, habitCtx, today(), weekStartDay).done).length
    return { cadence, label: cadence[0].toUpperCase() + cadence.slice(1), total: list.length, done }
  })
  const totalHabits = habitSummary.reduce((s, c) => s + c.total, 0)

  const statsGridAll = [
    { label: 'Lifts',    value: liftWeek,                          decimals: 0, emoji: '🏋️', tab: 'Weights',     sectionKey: 'Weights' },
    { label: 'Cardio',   value: cardioWeek,                        decimals: 0, emoji: '❤️', tab: 'Cardio',      sectionKey: 'Cardio' },
    { label: 'Mobility', value: mobWeek,                           decimals: 0, emoji: '🧘', tab: 'Mobility',    sectionKey: 'Mobility' },
    { label: 'Weight',   value: latestBw ? latestBw.weight : null, decimals: 1, emoji: '⚖️', tab: 'Body Weight', sectionKey: 'Body Weight' },
  ]
  const statsGrid = statsGridAll.filter(s => homeOn(s.sectionKey))

  return (
    <div className="flex flex-col gap-4">
      {/* Streak */}
      {streak > 0 && (
        <div className="flex items-center gap-2 bg-gradient-to-r from-orange-50 to-amber-50 border border-amber-200 rounded-xl px-3 py-2 animate-fade-in-up">
          <span key={streak} className="text-lg animate-pop">🔥</span>
          <p className="text-sm font-bold text-amber-700">{streakDisplay} day streak</p>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-4 gap-2">
        {statsGrid.map((s, i) => (
          <StatBox
            key={s.label}
            emoji={s.emoji}
            label={s.label}
            value={s.value}
            decimals={s.decimals}
            delay={i * 50}
            onClick={() => setTab(s.tab)}
          />
        ))}
      </div>

      {/* Optional home cards — sorted & gated by prefs */}
      {[
        {
          key: 'Habits',
          order: sectionOrder['Habits'] ?? 7,
          show: homeOn('Habits') && totalHabits > 0,
          node: (
            <Card>
              <CardHeader title="✅ Habits" onOpen={() => setTab('Habits')} />
              <div className="grid grid-cols-3 gap-2">
                {habitSummary.map(c => {
                  const allDone = c.total > 0 && c.done === c.total
                  return (
                    <button
                      key={c.cadence}
                      onClick={() => setTab('Habits')}
                      className="bg-bg rounded-xl py-2.5 px-1 text-center active:scale-[0.95] transition-transform"
                    >
                      <div className="text-[10px] text-muted font-medium uppercase tracking-wide mb-0.5">{c.label}</div>
                      <div className={`text-base font-bold tabular-nums ${allDone ? 'text-success' : 'text-primary'}`}>
                        {c.total === 0 ? '–' : `${c.done}/${c.total}`}
                      </div>
                    </button>
                  )
                })}
              </div>
            </Card>
          ),
        },
        {
          // Sports folded into Cardio (doctrine ledger): no Sports section of its
          // own any more, so this card rides Cardio's visibility and sort order.
          key: 'Sports',
          order: sectionOrder['Cardio'] ?? 2,
          show: homeOn('Cardio') && Object.entries(sportWeekMap).length > 0,
          node: (
            <Card>
              <CardHeader title="⚽ Sports This Week" onOpen={() => setTab('Cardio')} />
              <div className="flex flex-wrap gap-2">
                {Object.entries(sportWeekMap).map(([sk, count]) => (
                  <button
                    key={sk}
                    onClick={() => setTab('Cardio')}
                    className="px-3 py-1.5 rounded-full bg-accent-l text-accent text-sm font-semibold active:scale-[0.95] transition-transform"
                  >
                    {sk} <span className="opacity-70">{count}×</span>
                  </button>
                ))}
              </div>
            </Card>
          ),
        },
        {
          key: 'Donations',
          order: sectionOrder['Donations'] ?? 5,
          show: homeOn('Donations') && donDaysLeft !== null,
          node: (
            <Card
              onClick={() => setTab('Donations')}
              role="button"
              className={`cursor-pointer active:scale-[0.98] transition-transform ${donDaysLeft !== null && donDaysLeft <= 0 ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted mb-0.5">🩸 Next Full Blood Donation</p>
                  <p className={`text-base font-bold ${donDaysLeft !== null && donDaysLeft <= 0 ? 'text-success' : 'text-warning'}`}>
                    {donDaysLeft !== null && donDaysLeft <= 0 ? '✅ Eligible now' : `In ${donDaysLeftDisplay} days (${nextDonDate})`}
                  </p>
                </div>
                <span aria-hidden className="text-muted text-sm leading-none shrink-0">›</span>
              </div>
            </Card>
          ),
        },
        {
          key: 'Body Weight',
          order: sectionOrder['Body Weight'] ?? 1,
          show: homeOn('Body Weight'),
          node: (
            <Card>
              <CardHeader
                title="⚖️ Body Weight"
                onOpen={() => setTab('Body Weight')}
                right={bwDiff != null && (
                  <span className={`text-xs font-bold ${bwDiff === 0 ? 'text-muted' : bwDiff > 0 ? 'text-danger' : 'text-success'}`}>
                    {bwDiff > 0 ? `+${bwDiff}` : bwDiff} kg
                  </span>
                )}
              />
              {latestBw && (
                <p className="text-xl font-bold text-primary mb-2">
                  {latestBwDisplay.toFixed(1)} <span className="text-sm text-muted font-normal">kg</span>
                </p>
              )}
              {bwChart.length >= 2 ? (
                <MiniChart data={bwChart} color="#6366f1" />
              ) : (
                <button onClick={() => setTab('Body Weight')} className="text-sm text-accent active:scale-[0.97] transition-transform inline-block">+ Log first weigh-in</button>
              )}
            </Card>
          ),
        },
        {
          key: 'Weights',
          order: sectionOrder['Weights'] ?? 0,
          show: homeOn('Weights'),
          node: (
            <Card>
              <CardHeader
                title="🏋️ Lifting"
                onOpen={() => setTab('Weights')}
                right={liftDiff != null && (
                  <span className={`text-xs font-bold ${liftDiff === 0 ? 'text-muted' : liftDiff > 0 ? 'text-success' : 'text-danger'}`}>
                    {liftDiff > 0 ? `+${liftDiff}` : liftDiff} kg
                  </span>
                )}
              />
              {topExercises.length > 1 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {topExercises.map(ex => (
                    <Chip key={ex} small active={ex === activeExercise} onClick={() => setSelectedExercise(ex)}>
                      {ex}
                    </Chip>
                  ))}
                </div>
              )}
              {activeExercise ? (
                <>
                  {topExercises.length <= 1 && (
                    <p className="text-[11px] text-muted font-medium mb-0.5">{activeExercise}</p>
                  )}
                  <p className="text-xl font-bold text-primary mb-2 flex items-center gap-1.5">
                    {latestLiftMax != null ? latestLiftMaxDisplay.toFixed(1) : '–'} <span className="text-sm text-muted font-normal">kg</span>
                    {isLiftPR && liftMaxes.length > 1 && <span className="text-xs font-bold text-accent animate-pop">🏆 PR</span>}
                  </p>
                  {liftChart.length >= 2 ? (
                    <MiniChart data={liftChart} color="#1e293b" />
                  ) : (
                    <button onClick={() => setTab('Weights')} className="text-sm text-accent active:scale-[0.97] transition-transform inline-block">+ Log another session</button>
                  )}
                </>
              ) : (
                <button onClick={() => setTab('Weights')} className="text-sm text-accent active:scale-[0.97] transition-transform inline-block">+ Log first session</button>
              )}
            </Card>
          ),
        },
        {
          key: 'Cardio',
          order: sectionOrder['Cardio'] ?? 2,
          show: homeOn('Cardio') && cardioChart.length >= 2,
          node: (
            <Card>
              <CardHeader title="❤️ Cardio" onOpen={() => setTab('Cardio')} />
              <MiniChart data={cardioChart} color="#10b981" />
            </Card>
          ),
        },
        {
          key: 'Recovery',
          order: sectionOrder['Recovery'] ?? 8,
          show: homeOn('Recovery'),
          node: <RecoveryCard setTab={setTab} />,
        },
        {
          key: 'Water',
          order: sectionOrder['Water'] ?? 6,
          show: homeOn('Water'),
          node: (
            <Card className={showGoalPulse ? 'animate-pop' : ''}>
              <CardHeader
                title="💧 Water"
                onOpen={() => setTab('Water')}
                right={<span className="text-xs font-semibold text-muted">{waterPct}% of goal</span>}
              />
              <p className="text-xl font-bold text-primary mb-2 flex items-center gap-1.5">
                <span className="text-lg">🥤</span>
                {todayWaterDisplay} <span className="text-sm text-muted font-normal">/ {WATER_GOAL_ML} ml</span>
              </p>
              <div className="h-2 bg-bg rounded-full overflow-hidden mb-3">
                <div
                  className={`h-full rounded-full transition-[width] duration-700 ease-out ${goalReached ? 'bg-success' : 'bg-[#0ea5e9]'}`}
                  style={{ width: `${waterPct}%` }}
                />
              </div>
              <div className="flex gap-1.5">
                {WATER_PILLS.map(ml => (
                  <button
                    key={ml}
                    onClick={() => addWater(ml)}
                    className="flex-1 py-2 rounded-lg text-xs font-semibold border border-border bg-bg text-primary hover:bg-accent-l hover:text-accent hover:border-accent active:scale-[0.92] transition flex flex-col items-center gap-0.5"
                  >
                    <span className="text-sm leading-none">💧</span>
                    +{ml}
                  </button>
                ))}
              </div>
            </Card>
          ),
        },
      ]
        .filter(item => item.show)
        .sort((a, b) => a.order - b.order)
        .map((item, i) => (
          <div key={item.key} className="animate-fade-in-up" style={{ animationDelay: `${i * 70}ms` }}>
            {item.node}
          </div>
        ))}
    </div>
  )
}
