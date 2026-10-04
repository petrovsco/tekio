import { useEffect, useMemo, useRef, useState } from 'react'
import { useAppStore } from '../../../store/app'
import { usePrefs } from '../../../store/prefs'
import { READINESS_METHODS, systemicReadiness, type ReadinessMethod, type SystemicReadiness } from '../../../lib/fusedRead'
import { today } from '../../../lib/utils'
import { METHOD_LABEL, METHOD_NAME, METHOD_NEEDS, METHOD_COST, OVERNIGHT_SOURCES } from '../../../constants/readiness'
import { Card, SecTitle } from '../../ui/Card'

// How readiness is measured (RFC 0092): one choice of three, best first. The
// default is the best method the person has data for, which is not a taste
// switch (doctrine P4) — the choice is about which device they own. Home's
// readiness sheet links here, so the card can be opened directly.

const READINESS_CARD_ID = 'readiness-method'

function statusLine(sys: SystemicReadiness): string {
  if (!sys.chosen) return 'Nothing to read yet. Pick a method below; the first verdict comes after a few weeks of readings.'
  const label = METHOD_NAME[sys.chosen]
  if (sys.chosen === 'overnight_hrv' && !sys.connected) return `No verdict yet: ${label} has no watch or ring connected.`
  const how = sys.picked ? 'picked by you' : 'the best you have data for'
  const progress = sys.progress && sys.progress.have < sys.progress.need
    ? ` Baseline: ${sys.progress.have} of ${sys.progress.need} readings, no verdict until then.`
    : ''
  return `Reading ${label}, ${how}.${progress}`
}

function Pill({ tone, children }: { tone: 'ink' | 'signal' | 'plain'; children: string }) {
  const cls = tone === 'ink'
    ? 'bg-ink text-white border-ink'
    : tone === 'signal' ? 'text-signal border-signal' : 'text-ink-3 border-line'
  return (
    <span className={`text-[9px] font-bold tracking-[0.1em] uppercase px-[5px] py-[2px] rounded-[2px] border whitespace-nowrap ${cls}`}>
      {children}
    </span>
  )
}

export function ReadinessMethodCard({ focus }: { focus: boolean }) {
  const sleep = useAppStore(s => s.sleep)
  const inputs = useAppStore(s => s.readinessInputs)
  const { readinessMethod, setReadinessMethod } = usePrefs()
  const sys = useMemo(
    () => systemicReadiness(sleep, today(), inputs, readinessMethod),
    [sleep, inputs, readinessMethod],
  )
  const [howTo, setHowTo] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (focus) ref.current?.scrollIntoView({ block: 'start' })
  }, [focus])

  const pill = (m: ReadinessMethod) => {
    if (m !== 'overnight_hrv') return <Pill tone="plain">{METHOD_COST[m]}</Pill>
    return sys.connected ? <Pill tone="ink">Garmin</Pill> : <Pill tone={sys.chosen === m ? 'signal' : 'plain'}>Not connected</Pill>
  }

  return (
    <div ref={ref} id={READINESS_CARD_ID} className="scroll-mt-16">
      <Card>
        <SecTitle>Readiness</SecTitle>
        <p className="text-xs text-ink-2 mb-2.5 leading-[1.4]">{statusLine(sys)}</p>
        <div role="radiogroup" aria-label="Readiness method" className="flex flex-col gap-1.5">
          {READINESS_METHODS.map(m => {
            const on = sys.chosen === m
            return (
              <div key={m}>
                <button
                  role="radio"
                  aria-checked={on}
                  onClick={() => setReadinessMethod(m)}
                  className={`w-full text-left grid grid-cols-[14px_1fr_auto] gap-x-2 gap-y-0.5 items-start px-2.5 py-2 rounded-[3px] border cursor-pointer ${on ? 'border-ink' : 'border-line'}`}
                >
                  <span
                    aria-hidden
                    className={`w-3 h-3 mt-0.5 rounded-full border-[1.5px] flex items-center justify-center ${on ? 'border-ink' : 'border-ink-4'}`}
                  >
                    {on && <span className="w-1.5 h-1.5 rounded-full bg-ink" />}
                  </span>
                  <span className="text-xs font-semibold">{METHOD_LABEL[m]}</span>
                  {pill(m)}
                  <span className="col-start-2 col-span-2 text-[11px] leading-[1.4] text-ink-2">{METHOD_NEEDS[m]}</span>
                </button>
                {on && m === 'overnight_hrv' && !sys.connected && (
                  <div className="mt-1 border border-line rounded-[3px] px-2.5 py-2 bg-paper text-[11px] leading-[1.45]">
                    Connect a watch or ring and the first verdict comes after about three weeks of nights.
                    {OVERNIGHT_SOURCES.map(src => (
                      <div key={src.name} className="flex justify-between gap-2 border-t border-hairline pt-1 mt-1 text-ink-2">
                        <span>{src.name}</span><span className="shrink-0">{src.state}</span>
                      </div>
                    ))}
                    <button
                      onClick={() => setHowTo(v => !v)}
                      aria-expanded={howTo}
                      className="mt-1.5 text-[11px] font-semibold border border-ink rounded-[3px] px-2.5 py-1 bg-white cursor-pointer"
                    >
                      How to connect Garmin
                    </button>
                    {howTo && (
                      <p className="mt-1.5 text-ink-2">
                        Garmin reaches Tekiō through a daily sync that is set up outside the app, on the account
                        that runs it. Connecting from here is not built yet. Until a night arrives, Morning HRV or
                        Check-in gives you a verdict.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
        {sys.picked && (
          <button
            onClick={() => setReadinessMethod(null)}
            className="mt-2 text-[11px] text-ink-2 underline cursor-pointer"
          >
            Use the best method I have data for
          </button>
        )}
      </Card>
    </div>
  )
}
