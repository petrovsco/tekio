import { useState } from 'react'
import { Card, SecTitle } from '../ui/Card'
import { Toggle } from '../ui/Fields'
import { CardioLogForm } from './cardio/CardioLogForm'
import { SportLogForm } from './cardio/SportLogForm'
import { Progress } from './cardio/Progress'
import { SessionList } from './cardio/SessionList'
import { LENSES, type Lens } from './cardio/lens'

/**
 * Cardio is the single destination for endurance stimulus. Sports folded in
 * here (doctrine ledger, 2026-08-26): a sport session is a cardio session with
 * a name and a quality rating, so it is a second capture mode — not a second
 * section. The DB merge is deliberately a separate brief; these are still two
 * tables underneath.
 *
 * The mode used to switch the log form alone, so a sport form sat above a
 * running chart. It is now a lens over the whole screen (roadmap 076): every
 * card below reads the same choice.
 */
type LogMode = Exclude<Lens, 'all'>

const LOG_MODES: { value: LogMode; label: string }[] = [
  { value: 'cardio', label: 'Cardio' },
  { value: 'sport', label: 'Sport' },
]

export function CardioTab() {
  const [lens, setLens] = useState<Lens>('cardio')
  // Only asked under All, where the lens does not say which form to show.
  const [logMode, setLogMode] = useState<LogMode>('cardio')
  const mode = lens === 'all' ? logMode : lens

  return (
    <div className="flex flex-col gap-4">
      <Toggle options={LENSES} value={lens} onPick={setLens} />

      <Card>
        <SecTitle>Log session</SecTitle>
        {lens === 'all' && (
          <div className="mb-3">
            <Toggle options={LOG_MODES} value={logMode} onPick={setLogMode} />
          </div>
        )}
        {mode === 'cardio' ? <CardioLogForm /> : <SportLogForm />}
      </Card>

      {/* Keyed by the lens: a chip or drill-down picked under Sport names
          nothing under Cardio, so each lens starts from its own All. */}
      <Progress key={`p-${lens}`} lens={lens} />

      <SessionList lens={lens} />
    </div>
  )
}
